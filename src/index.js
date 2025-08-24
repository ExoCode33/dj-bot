import 'dotenv/config';
import http from 'node:http';

console.log('🚀 STARTING UTA DJ BOT - Fast Deploy Version');
console.log('📅 Time:', new Date().toISOString());

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

// Simple health server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'uta-dj-bot-simple',
      version: '2.0.5-fast'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta Bot is running! 🎤');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on port ${port}`);
});

// Radio stations - simplified list
const RADIO_STATIONS = {
  'lofi_girl': {
    name: 'Lofi Girl',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi'
  },
  'listen_moe': {
    name: 'LISTEN.moe Anime',
    url: 'https://listen.moe/stream',
    genre: 'Anime'
  },
  'somafm_groove': {
    name: 'SomaFM Groove',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    genre: 'Electronic'
  },
  'ilove_dance': {
    name: 'ILove Dance',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Dance'
  }
};

// Simple categories
const CATEGORIES = {
  'chill': { name: '🌸 Chill Music', stations: ['lofi_girl', 'somafm_groove'] },
  'energetic': { name: '🎵 Energetic Music', stations: ['ilove_dance', 'listen_moe'] }
};

// SIMPLIFIED Radio Manager - Focus on working connection switching
class RadioManager {
  constructor(client) {
    this.client = client;
    this.switching = new Set();
  }

  async switchStation(guildId, stationKey, voiceChannelId) {
    if (this.switching.has(guildId)) {
      throw new Error('Already switching for this server');
    }

    this.switching.add(guildId);
    console.log(`🔄 Switching to ${stationKey} for guild ${guildId}`);

    try {
      // SIMPLE but effective cleanup
      const existing = this.client.shoukaku.players.get(guildId);
      if (existing) {
        console.log('🧹 Cleaning up existing connection...');
        
        try {
          await existing.stopTrack();
          await existing.destroy();
        } catch (e) {
          console.warn('Cleanup warning:', e.message);
        }
        
        this.client.shoukaku.players.delete(guildId);
        
        // Simple wait - more reliable than complex cleanup
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Get guild info
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) throw new Error('Guild not found');

      // Create new connection
      console.log('🔊 Creating new connection...');
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });

      await player.setGlobalVolume(DEFAULT_VOLUME);
      
      // Connect to stream
      const station = RADIO_STATIONS[stationKey];
      console.log(`🎵 Loading stream: ${station.url}`);
      
      const result = await player.node.rest.resolve(station.url);
      if (result.tracks && result.tracks.length > 0) {
        await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
        console.log('✅ Stream started successfully');
        return { success: true, station };
      } else {
        throw new Error('No tracks found');
      }

    } catch (error) {
      console.error('❌ Switch failed:', error.message);
      
      // Emergency cleanup
      this.client.shoukaku.players.delete(guildId);
      throw error;
      
    } finally {
      this.switching.delete(guildId);
    }
  }
}

// Start Discord bot
async function startBot() {
  try {
    console.log('🤖 Starting Discord bot...');

    // Import Discord.js
    const { 
      Client, 
      GatewayIntentBits, 
      Events, 
      SlashCommandBuilder, 
      EmbedBuilder, 
      ActionRowBuilder,
      ButtonBuilder,
      ButtonStyle,
      StringSelectMenuBuilder,
      REST, 
      Routes 
    } = await import('discord.js');

    // Import Shoukaku
    const { Shoukaku, Connectors } = await import('shoukaku');

    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });

    // Setup Lavalink - SIMPLIFIED
    if (process.env.LAVALINK_URL) {
      const nodes = [{
        name: 'main-node',
        url: process.env.LAVALINK_URL,
        auth: process.env.LAVALINK_AUTH,
        secure: process.env.LAVALINK_SECURE === 'true'
      }];

      client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
        resume: false, // Disabled for simplicity
        reconnectTries: 5,
        reconnectInterval: 5000,
        restTimeout: 30000
      });

      client.shoukaku.on('ready', name => console.log(`✅ Lavalink ${name} ready`));
      client.shoukaku.on('error', (name, err) => console.error(`❌ Lavalink ${name}:`, err.message));
    }

    const radioManager = new RadioManager(client);
    let controlMessage = null;
    let currentPlaying = new Map();

    // Create radio interface
    async function createRadioInterface() {
      const embed = new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('🎤 Uta\'s Simple Radio')
        .setDescription('*Choose a music style and station below!*')
        .addFields({
          name: '📻 Available Stations',
          value: Object.values(RADIO_STATIONS).map(s => `🎵 **${s.name}** - ${s.genre}`).join('\n'),
          inline: false
        });

      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('🎵 Pick a music style...')
        .addOptions(
          Object.entries(CATEGORIES).map(([key, cat]) => ({
            label: cat.name,
            value: key
          }))
        );

      const stationSelect = new StringSelectMenuBuilder()
        .setCustomId('station_select')
        .setPlaceholder('First pick a category above')
        .addOptions([{ label: 'Pick category first', value: 'none' }])
        .setDisabled(true);

      const stopButton = new ButtonBuilder()
        .setCustomId('stop_radio')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('⏹️');

      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(categorySelect),
          new ActionRowBuilder().addComponents(stationSelect),
          new ActionRowBuilder().addComponents(stopButton)
        ]
      };
    }

    // Handle interactions
    async function handleInteraction(interaction) {
      if (interaction.customId === 'category_select') {
        const category = CATEGORIES[interaction.values[0]];
        
        const stationOptions = category.stations.map(key => {
          const station = RADIO_STATIONS[key];
          return {
            label: station.name,
            value: key,
            description: `${station.genre} music`
          };
        });

        const newStationSelect = new StringSelectMenuBuilder()
          .setCustomId('station_select')
          .setPlaceholder('🎵 Choose a station (auto-plays!)')
          .addOptions(stationOptions)
          .setDisabled(false);

        const components = interaction.message.components.map((row, index) => {
          if (index === 1) {
            return new ActionRowBuilder().addComponents(newStationSelect);
          }
          return ActionRowBuilder.from(row);
        });

        await interaction.update({ components });

      } else if (interaction.customId === 'station_select') {
        const stationKey = interaction.values[0];
        const station = RADIO_STATIONS[stationKey];
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            content: '❌ Join a voice channel first!',
            ephemeral: true
          });
        }

        await interaction.reply({
          content: `🔄 Switching to ${station.name}...`,
          ephemeral: true
        });

        try {
          await radioManager.switchStation(interaction.guildId, stationKey, voiceChannel.id);
          
          currentPlaying.set(interaction.guildId, {
            station: station.name,
            channel: voiceChannel.name
          });

          await interaction.editReply({
            content: `✅ Now playing **${station.name}** in **${voiceChannel.name}**!`
          });

          setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);

        } catch (error) {
          await interaction.editReply({
            content: `❌ Failed to switch: ${error.message}`
          });
        }

      } else if (interaction.customId === 'stop_radio') {
        const player = client.shoukaku.players.get(interaction.guildId);
        if (player) {
          try {
            await player.stopTrack();
            await player.destroy();
            client.shoukaku.players.delete(interaction.guildId);
          } catch (e) {
            client.shoukaku.players.delete(interaction.guildId);
          }
        }

        currentPlaying.delete(interaction.guildId);

        await interaction.reply({
          content: '⏹️ Radio stopped!',
          ephemeral: true
        });

        setTimeout(() => interaction.deleteReply().catch(() => {}), 3000);
      }
    }

    // Initialize radio interface
    async function initRadio() {
      const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
      if (!channel) return;

      try {
        const messages = await channel.messages.fetch({ limit: 10 });
        await channel.bulkDelete(messages);
      } catch (e) {}

      const interfaceData = await createRadioInterface();
      controlMessage = await channel.send(interfaceData);
    }

    // Events
    client.once(Events.ClientReady, () => {
      console.log(`✅ Bot ready: ${client.user.tag}`);
      setTimeout(initRadio, 2000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isStringSelectMenu() || interaction.isButton()) {
        await handleInteraction(interaction);
      }
    });

    // Cleanup on voice disconnect
    client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      if (oldState.member?.id === client.user.id && oldState.channelId && !newState.channelId) {
        const player = client.shoukaku.players.get(oldState.guild.id);
        if (player) {
          client.shoukaku.players.delete(oldState.guild.id);
          currentPlaying.delete(oldState.guild.id);
        }
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Login successful');

  } catch (error) {
    console.error('💥 Bot failed:', error);
  }
}

// Error handlers
process.on('uncaughtException', err => console.error('💥 Uncaught:', err.message));
process.on('unhandledRejection', err => console.error('💥 Rejection:', err));

// Start bot
setTimeout(startBot, 1000);

console.log('🎤 Simple Uta Bot starting...');
