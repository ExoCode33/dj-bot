import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS, MUSIC_CATEGORIES } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - PERSISTENT RADIO PANEL');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || '';

// Health server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta DJ Bot is running!');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// Simple Radio Manager
class SimpleRadioManager {
  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) {
      throw new Error('Station not found');
    }

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    const urlsToTry = [station.url];
    if (station.fallback) {
      urlsToTry.push(station.fallback);
    }
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔄 Trying URL: ${url}`);
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({
            track: { encoded: result.data.encoded }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name}`);
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }
}

// Start Discord bot
setTimeout(async () => {
  try {
    console.log('🤖 Starting Discord bot...');
    
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
      return;
    }

    const discord = await import('discord.js');
    const shoukaku = await import('shoukaku');
    console.log('✅ Libraries loaded');

    const { 
      Client, 
      GatewayIntentBits, 
      Collection, 
      Events, 
      SlashCommandBuilder, 
      EmbedBuilder, 
      ActionRowBuilder,
      ButtonBuilder,
      ButtonStyle,
      StringSelectMenuBuilder,
      REST, 
      Routes 
    } = discord;
    
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });

    client.commands = new Collection();

    // Setup Lavalink
    if (process.env.LAVALINK_URL) {
      const nodes = [{
        name: process.env.LAVALINK_NAME || 'railway-node',
        url: process.env.LAVALINK_URL,
        auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
        secure: process.env.LAVALINK_SECURE === 'true'
      }];

      client.shoukaku = new shoukaku.Shoukaku(new shoukaku.Connectors.DiscordJS(client), nodes, {
        resume: true,
        resumeKey: 'uta-bot-persistent',
        resumeTimeout: 60,
        reconnectTries: 5,
        reconnectInterval: 3000,
        restTimeout: 60000
      });

      client.shoukaku.on('ready', (name) => {
        console.log(`✅ Lavalink "${name}" ready`);
        global.lavalinkReady = true;
      });

      client.shoukaku.on('error', (name, error) => {
        console.error(`❌ Lavalink "${name}" error:`, error.message);
        global.lavalinkReady = false;
      });

      console.log('✅ Lavalink configured');
    }

    const radioManager = new SimpleRadioManager();
    let permanentRadioMessage = null;

    // Create persistent radio panel
    async function createRadioPanel() {
      if (!RADIO_CHANNEL_ID) {
        console.log('⚠️ No RADIO_CHANNEL_ID set');
        return null;
      }

      try {
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
        if (!channel) {
          console.error(`❌ Channel not found: ${RADIO_CHANNEL_ID}`);
          return null;
        }

        const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.emoji
        }));

        const categorySelectMenu = new StringSelectMenuBuilder()
          .setCustomId('category_select')
          .setPlaceholder('🎵 Choose a music category...')
          .addOptions(categoryOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Stop Music')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎵 UTA\'S PERSISTENT MUSIC PANEL')
          .setDescription('🎤 **Always-on music selection!**\n\n**Step 1:** Choose category\n**Step 2:** Select station\n**Step 3:** Enjoy! 🎵')
          .addFields(
            { name: '🎌 K-Pop & Asian', value: 'BLACKPINK, BTS, TWICE, anime', inline: true },
            { name: '🔊 Electronic & Bass', value: 'Hardstyle, dubstep, house drops', inline: true },
            { name: '🎵 Pop & Mainstream', value: 'Chart toppers, dance hits', inline: true },
            { name: '🎧 Chill & Lo-Fi', value: 'Study music, ambient beats', inline: true },
            { name: '🎤 Hip-Hop & Rap', value: 'Latest urban hits', inline: true },
            { name: '🎸 Rock & Metal', value: 'Heavy guitars, alternative', inline: true }
          )
          .setFooter({ text: 'Persistent Panel • Always Available! 🎵✨' })
          .setTimestamp();

        if (permanentRadioMessage) {
          try {
            await permanentRadioMessage.delete();
          } catch (error) {
            console.log('⚠️ Could not delete old message');
          }
        }

        permanentRadioMessage = await channel.send({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(categorySelectMenu),
            new ActionRowBuilder().addComponents(stopButton)
          ]
        });

        console.log(`✅ Persistent panel created in ${channel.name}`);
        setupCollector();
        return permanentRadioMessage;

      } catch (error) {
        console.error('❌ Failed to create panel:', error.message);
        return null;
      }
    }

    // Setup permanent collector
    function setupCollector() {
      if (!permanentRadioMessage) return;

      const collector = permanentRadioMessage.createMessageComponentCollector({ 
        time: 0 // Never expires
      });

      collector.on('collect', async (interaction) => {
        try {
          console.log(`🎛️ Panel interaction: ${interaction.customId}`);

          if (interaction.customId === 'category_select') {
            await handleCategorySelect(interaction);
          } else if (interaction.customId === 'station_select') {
            await handleStationSelect(interaction);
          } else if (interaction.customId === 'back_to_categories') {
            await handleBackButton(interaction);
          } else if (interaction.customId === 'radio_stop') {
            await handleStopButton(interaction);
          }

        } catch (error) {
          console.error('❌ Interaction error:', error.message);
        }
      });

      collector.on('end', (collected, reason) => {
        if (reason !== 'messageDelete') {
          console.log('⚠️ Collector ended, recreating...');
          setTimeout(setupCollector, 5000);
        }
      });

      console.log('✅ Permanent collector active');
    }

    // Handle category selection
    async function handleCategorySelect(interaction) {
      const selectedCategory = interaction.values[0];
      const categoryInfo = MUSIC_CATEGORIES[selectedCategory];
      
      const categoryStations = Object.entries(RADIO_STATIONS)
        .filter(([key, station]) => station.category === selectedCategory)
        .map(([key, station]) => ({
          label: station.name,
          description: `${station.description} (${station.genre})`,
          value: key
        }));

      if (categoryStations.length === 0) return;

      const stationSelectMenu = new StringSelectMenuBuilder()
        .setCustomId('station_select')
        .setPlaceholder(`${categoryInfo.emoji} Choose station...`)
        .addOptions(categoryStations);

      const backButton = new ButtonBuilder()
        .setCustomId('back_to_categories')
        .setLabel('← Back')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🔙');

      const stopButton = new ButtonBuilder()
        .setCustomId('radio_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑');

      const embed = new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle(`${categoryInfo.emoji} ${categoryInfo.name.toUpperCase()}`)
        .setDescription(`🎵 **${categoryInfo.description}**\n\nChoose from ${categoryStations.length} stations:`)
        .addFields(
          categoryStations.slice(0, 8).map(station => ({
            name: `🎵 ${station.label}`,
            value: station.description,
            inline: false
          }))
        )
        .setFooter({ text: `${categoryInfo.name} Collection ${categoryInfo.emoji}` })
        .setTimestamp();

      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(stationSelectMenu),
          new ActionRowBuilder().addComponents(backButton, stopButton)
        ]
      });
    }

    // Handle station selection
    async function handleStationSelect(interaction) {
      const selectedStation = interaction.values[0];
      const stationInfo = RADIO_STATIONS[selectedStation];
      
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) return;

      let player = client.shoukaku.players.get(interaction.guildId);
      
      if (!player) {
        const permissions = voiceChannel.permissionsFor(client.user);
        if (!permissions.has(['Connect', 'Speak'])) return;
        
        player = await client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await player.setGlobalVolume(85);
      } else {
        await player.setGlobalVolume(85);
      }

      try {
        await radioManager.connectToStream(player, selectedStation);
        
        const reply = await interaction.reply({
          content: `🎵 **${stationInfo.name}** started!`,
          ephemeral: false
        });
        
        setTimeout(async () => {
          try {
            await reply.delete();
          } catch (e) {
            // Ignore
          }
        }, 2000);
        
      } catch (error) {
        console.error('❌ Stream failed:', error.message);
      }
    }

    // Handle back button
    async function handleBackButton(interaction) {
      const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
        label: category.name,
        description: category.description,
        value: key,
        emoji: category.emoji
      }));

      const categorySelectMenu = new StringSelectMenuBuilder()
        .setCustomId('category_select')
        .setPlaceholder('🎵 Choose a music category...')
        .addOptions(categoryOptions);

      const stopButton = new ButtonBuilder()
        .setCustomId('radio_stop')
        .setLabel('Stop Music')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑');

      const embed = new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('🎵 UTA\'S PERSISTENT MUSIC PANEL')
        .setDescription('🎤 **Always-on music selection!**\n\n**Step 1:** Choose category\n**Step 2:** Select station\n**Step 3:** Enjoy! 🎵')
        .addFields(
          { name: '🎌 K-Pop & Asian', value: 'BLACKPINK, BTS, TWICE, anime', inline: true },
          { name: '🔊 Electronic & Bass', value: 'Hardstyle, dubstep, house drops', inline: true },
          { name: '🎵 Pop & Mainstream', value: 'Chart toppers, dance hits', inline: true },
          { name: '🎧 Chill & Lo-Fi', value: 'Study music, ambient beats', inline: true },
          { name: '🎤 Hip-Hop & Rap', value: 'Latest urban hits', inline: true },
          { name: '🎸 Rock & Metal', value: 'Heavy guitars, alternative', inline: true }
        )
        .setFooter({ text: 'Persistent Panel • Always Available! 🎵✨' })
        .setTimestamp();

      await interaction.update({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(categorySelectMenu),
          new ActionRowBuilder().addComponents(stopButton)
        ]
      });
    }

    // Handle stop button
    async function handleStopButton(interaction) {
      const player = client.shoukaku.players.get(interaction.guildId);
      if (player) {
        await player.stopTrack();
        await player.destroy();
        client.shoukaku.players.delete(interaction.guildId);
      }

      const reply = await interaction.reply({
        content: '🛑 **Music stopped!**',
        ephemeral: false
      });
      
      setTimeout(async () => {
        try {
          await reply.delete();
        } catch (e) {
          // Ignore
        }
      }, 2000);
    }

    // Simple radio command
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎵 Create/update radio panel'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        if (RADIO_CHANNEL_ID) {
          await createRadioPanel();
          const reply = await interaction.reply({
            content: '✅ **Radio panel updated!**',
            ephemeral: false
          });
          
          setTimeout(async () => {
            try {
              await reply.delete();
            } catch (e) {
              // Ignore
            }
          }, 2000);
        } else {
          const reply = await interaction.reply({
            content: '❌ **No RADIO_CHANNEL_ID set!**',
            ephemeral: false
          });
          
          setTimeout(async () => {
            try {
              await reply.delete();
            } catch (e) {
              // Ignore
            }
          }, 3000);
        }
      }
    };

    // Simple uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 About Uta\'s music system'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 UTA\'S PERSISTENT MUSIC SYSTEM')
          .setDescription('*"Always ready to play your favorite music!"* 🎵')
          .addFields(
            { name: '🎌 K-Pop Collection', value: 'BLACKPINK, BTS, TWICE, LISTEN.moe', inline: false },
            { name: '🔊 Electronic Arsenal', value: 'Hardstyle, dubstep, SomaFM, ILoveRadio', inline: false },
            { name: '🎵 All Genres Available', value: 'Pop, Hip-Hop, Rock, Chill, Lo-Fi', inline: false }
          )
          .setFooter({ text: 'Persistent music panel always available! 🎵✨' })
          .setTimestamp();

        const reply = await interaction.reply({ embeds: [embed] });
        
        setTimeout(async () => {
          try {
            await reply.delete();
          } catch (e) {
            // Ignore
          }
        }, 10000);
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded');

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('✅ Guild commands registered');
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
      
      if (RADIO_CHANNEL_ID) {
        console.log('🎵 Creating persistent radio panel...');
        setTimeout(() => {
          createRadioPanel();
        }, 2000);
      }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
        console.log(`✅ Command executed: ${interaction.commandName}`);
      } catch (error) {
        console.error(`❌ Command error:`, error.message);
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}, 1000);

console.log('🎵 Persistent radio bot starting...');
