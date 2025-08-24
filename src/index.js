import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - World\'s Greatest Diva Edition');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

console.log(`🔊 Default volume set to: ${DEFAULT_VOLUME}%`);

// RADIO_STATIONS defined inline to avoid import issues
const RADIO_STATIONS = {
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'Anime',
    quality: 'High'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop music with trendy K-Pop hits',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'somafm_groovesalad': {
    name: 'SomaFM Groove Salad',
    description: 'Ambient downtempo with electronic elements',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    fallback: 'http://ice2.somafm.com/groovesalad-256-mp3',
    genre: 'Ambient Electronic',
    quality: 'High'
  },
  'somafm_dronezone': {
    name: 'SomaFM Drone Zone',
    description: 'Deep ambient electronic soundscapes',
    url: 'http://ice1.somafm.com/dronezone-256-mp3',
    fallback: 'http://ice2.somafm.com/dronezone-256-mp3',
    genre: 'Ambient',
    quality: 'High'
  },
  'somafm_beatblender': {
    name: 'SomaFM Beat Blender',
    description: 'Downtempo, trip-hop, and electronic beats',
    url: 'http://ice1.somafm.com/beatblender-128-mp3',
    fallback: 'http://ice2.somafm.com/beatblender-128-mp3',
    genre: 'Electronic Beats',
    quality: 'High'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'Dance hits and electronic music',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'Dance',
    quality: 'High'
  },
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with powerful beats',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with powerful guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  }
};

console.log(`📻 Loaded ${Object.keys(RADIO_STATIONS).length} radio stations`);

// Health server - MUST start first and stay simple
const server = http.createServer((req, res) => {
  console.log(`📡 Health check: ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      defaultVolume: DEFAULT_VOLUME,
      version: '2.0.3'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta\'s Music Studio is online! 🎤✨');
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

// Radio Categories - Updated wording
const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Top hits perfect for Uta\'s performances',
    stations: ['z100_nyc', 'iloveradio_dance', 'hiphop_nation']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for energetic shows',
    stations: ['somafm_beatblender', 'somafm_groovesalad', 'iloveradio_dance']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for quieter moments',
    stations: ['somafm_dronezone', 'lofi_girl']
  },
  'anime_jpop': {
    name: '🎌 Anime & J-Pop',
    description: 'Japanese music collection',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for powerful performances',
    stations: ['rock_antenne']
  }
};

// MINIMAL FIX: Only change the switchToStation method
class SimpleRadioManager {
  constructor(client) {
    this.client = client;
  }

  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  // ONLY CHANGE: Improved connection switching with proper cleanup
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Step 1: Clean up existing connection PROPERLY - FIXED VERSION
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      console.log('🧹 Cleaning up existing connection...');
      
      try {
        // Stop track and disconnect properly
        if (existingPlayer.track) {
          await existingPlayer.stopTrack();
        }
        // Use disconnect instead of destroy to properly clean up voice connection
        await existingPlayer.disconnect();
        console.log('🔌 Player disconnected');
        
        // Small wait for disconnect to process
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Now destroy the player
        await existingPlayer.destroy();
        console.log('💀 Player destroyed');
        
      } catch (cleanupError) {
        console.warn('⚠️ Error during cleanup:', cleanupError.message);
      }
      
      // Always remove from map
      this.client.shoukaku.players.delete(guildId);
      console.log('🗑️ Player removed from map');
      
      // Wait for cleanup to fully complete
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Step 2: Get guild and voice channel
    const guild = this.client.guilds.cache.get(guildId);
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Step 3: Create NEW connection
    console.log('🔊 Creating new voice connection...');
    
    let newPlayer;
    try {
      newPlayer = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });
      console.log('✅ New voice connection created');
    } catch (connectionError) {
      console.error('❌ Connection error:', connectionError.message);
      throw connectionError;
    }
    
    // Step 4: Set volume and connect to stream
    await newPlayer.setGlobalVolume(DEFAULT_VOLUME);
    console.log(`🔊 Volume set to ${DEFAULT_VOLUME}%`);
    
    const result = await this.connectToStream(newPlayer, stationKey);
    console.log('✅ Successfully switched to new station');
    
    return result;
  }
}

// Global variables
global.discordReady = false;
global.lavalinkReady = false;

// Start Discord bot
async function startDiscordBot() {
  try {
    console.log('🤖 Starting Discord bot...');
    
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing required environment variables');
      return;
    }

    // Dynamic imports
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
      intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages
      ]
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
        resumeKey: 'uta-bot-persistent-radio',
        resumeTimeout: 60,
        reconnectTries: 10,
        reconnectInterval: 5000,
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

    const radioManager = new SimpleRadioManager(client);
    let persistentMessage = null;
    let currentlyPlaying = new Map(); // Track what's playing per guild

    // Enhanced embed creation with banner image
    async function createPersistentRadioEmbed() {
      const currentStatus = Array.from(currentlyPlaying.entries())
        .map(([guildId, info]) => `🎵 ${info.stationName}`)
        .join('\n') || '✨ Ready to play!';

      return new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('🎤 Uta\'s Radio Studio')
        .setDescription('*"Welcome to my radio studio! Pick any station and I\'ll start playing it immediately!"*\n\n🎵 Choose a music style and station below!')
        .addFields(
          {
            name: '🎶 Music Styles Available',
            value: Object.values(RADIO_CATEGORIES).map(cat => 
              `${cat.name} - ${cat.description}`
            ).join('\n'),
            inline: false
          },
          {
            name: '📻 Current Status',
            value: currentStatus,
            inline: false
          },
          {
            name: '✨ How It Works',
            value: '1️⃣ Pick a **music style**\n2️⃣ Choose your **station** → **Auto-plays immediately!**\n3️⃣ Switch stations anytime\n4️⃣ Use **⏸️ Stop** when done',
            inline: false
          }
        )
        .setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: client.user?.displayAvatarURL() 
        })
        .setTimestamp();
    }

    async function createPersistentRadioComponents(guildId) {
      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_category_select')
        .setPlaceholder('🎵 What music style would you like?')
        .addOptions(
          Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
            label: category.name,
            description: category.description,
            value: key
          }))
        );

      const stationSelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_station_select')
        .setPlaceholder('🎤 Choose a music style first...')
        .addOptions([{
          label: 'Select music style above',
          description: 'Pick from the menu above',
          value: 'placeholder'
        }])
        .setDisabled(true);

      const isPlaying = currentlyPlaying.has(guildId);

      const stopButton = new ButtonBuilder()
        .setCustomId('persistent_stop')
        .setLabel('⏸️ Stop Radio')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑')
        .setDisabled(!isPlaying);

      const statusButton = new ButtonBuilder()
        .setCustomId('persistent_status')
        .setLabel('📊 Status')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎭');

      return [
        new ActionRowBuilder().addComponents(categorySelect),
        new ActionRowBuilder().addComponents(stationSelect),
        new ActionRowBuilder().addComponents(stopButton, statusButton)
      ];
    }

    async function updatePersistentMessage() {
      if (persistentMessage) {
        try {
          const embed = await createPersistentRadioEmbed();
          const components = await createPersistentRadioComponents(persistentMessage.guildId);
          await persistentMessage.edit({
            embeds: [embed],
            components: components
          });
        } catch (error) {
          console.warn('⚠️ Failed to update persistent message:', error.message);
        }
      }
    }

    async function initializePersistentRadio() {
      try {
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
        if (!channel) {
          console.error(`❌ Radio channel not found: ${RADIO_CHANNEL_ID}`);
          return;
        }

        console.log(`🎵 Initializing radio in #${channel.name}`);

        // Clear messages
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          if (messages.size > 0) {
            await channel.bulkDelete(messages);
          }
        } catch (error) {
          console.warn(`⚠️ Could not clear channel: ${error.message}`);
        }

        // Create embed
        const embed = await createPersistentRadioEmbed();
        const components = await createPersistentRadioComponents(channel.guildId);

        persistentMessage = await channel.send({
          embeds: [embed],
          components: components
        });

        console.log(`✅ Persistent radio created: ${persistentMessage.id}`);

      } catch (error) {
        console.error(`❌ Failed to initialize radio: ${error.message}`);
      }
    }

    // Commands
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎤 Visit Uta\'s Radio Studio'),
      
      async execute(interaction) {
        await interaction.reply({
          content: `🎤 *"Come visit my radio studio!"*\n\nI'm waiting for you at <#${RADIO_CHANNEL_ID}> to play amazing music together! ✨`,
          ephemeral: true
        });
      }
    };

    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('💕 About Uta, the world\'s greatest diva'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Hi! I\'m Uta!')
          .setDescription(`*"I want to make everyone happy through music!"*\n\n**Visit my radio studio: <#${RADIO_CHANNEL_ID}>**`)
          .addFields(
            {
              name: '✨ About Me',
              value: `🌟 World's beloved diva\n🎭 Daughter of Red-Haired Shanks\n🎵 Music lover extraordinaire\n💕 Voice that brings joy to everyone`,
              inline: false
            },
            {
              name: '🎵 My Radio Studio Features',
              value: `• ${Object.keys(RADIO_CATEGORIES).length} music styles\n• ${Object.keys(RADIO_STATIONS).length} radio stations\n• Instant auto-play when you select a station!\n• Easy station switching anytime`,
              inline: false
            }
          )
          .setFooter({ text: 'With love, Uta ♪ Let\'s enjoy music together! 💕' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    // Enhanced interaction handler - MINIMAL CHANGE
    async function handlePersistentInteraction(interaction) {
      try {
        if (!persistentMessage || interaction.message?.id !== persistentMessage.id) return;
        
        if (interaction.customId === 'persistent_category_select') {
          const selectedCategory = interaction.values[0];
          const category = RADIO_CATEGORIES[selectedCategory];
          
          const stationOptions = category.stations
            .filter(stationKey => RADIO_STATIONS[stationKey])
            .map(stationKey => {
              const station = RADIO_STATIONS[stationKey];
              return {
                label: station.name,
                description: `${station.description} (${station.genre})`,
                value: stationKey
              };
            });

          const newStationSelect = new StringSelectMenuBuilder()
            .setCustomId('persistent_station_select')
            .setPlaceholder(`🎵 Choose from ${category.name}... (Auto-plays!)`)
            .addOptions(stationOptions)
            .setDisabled(false);

          const components = interaction.message.components.map((row, index) => {
            if (index === 1) {
              return new ActionRowBuilder().addComponents(newStationSelect);
            }
            return ActionRowBuilder.from(row);
          });

          await interaction.update({ components });
          interaction.message._selectedCategory = selectedCategory;

        } else if (interaction.customId === 'persistent_station_select') {
          const selectedStation = interaction.values[0];
          const station = RADIO_STATIONS[selectedStation];
          
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) {
            return interaction.reply({
              content: '*"Please join a voice channel first so I can play music for you!"* 🎤',
              ephemeral: true
            });
          }

          if (!client.shoukaku || !global.lavalinkReady) {
            return interaction.reply({
              content: '*"My audio system isn\'t ready yet... please try again in a moment!"* ✨',
              ephemeral: true
            });
          }

          await interaction.reply({
            content: `🎵 *"Switching to ${station.name}..."*`,
            ephemeral: true
          });

          try {
            console.log(`🎵 Auto-playing ${selectedStation} for guild ${interaction.guildId}`);
            
            // FIXED: Use the improved switchToStation method
            const result = await radioManager.switchToStation(
              interaction.guildId, 
              selectedStation, 
              voiceChannel.id
            );

            // Update our tracking
            currentlyPlaying.set(interaction.guildId, {
              stationKey: selectedStation,
              stationName: station.name,
              voiceChannelId: voiceChannel.id,
              startedAt: Date.now()
            });

            await interaction.editReply({
              content: `🎵 *"Now playing ${station.name}!"* (Volume: ${DEFAULT_VOLUME}%)\n🎧 Playing in **${voiceChannel.name}**`
            });

            // Update the main message to show current status
            await updatePersistentMessage();

            // Auto-delete success message after 4 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 4000);

          } catch (error) {
            console.error('❌ Voice state update error:', error.message);
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}

// Start the bot
setTimeout(() => {
  startDiscordBot();
}, 2000);

console.log('🎤 Uta DJ Bot initialization started'); Auto-play failed:', error);
            
            // Remove from tracking if failed
            currentlyPlaying.delete(interaction.guildId);
            
            await interaction.editReply({
              content: `*"Sorry, I couldn't play ${station.name}. ${error.message}"*`
            });
            
            // Auto-delete error after 6 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 6000);
          }

        } else if (interaction.customId === 'persistent_stop') {
          await interaction.reply({
            content: '*"Stopping the music... Thank you for listening!"* 🎭',
            ephemeral: true
          });

          const player = client.shoukaku.players.get(interaction.guildId);
          
          if (player) {
            try {
              await player.stopTrack();
              await player.destroy();
              client.shoukaku.players.delete(interaction.guildId);
            } catch (error) {
              client.shoukaku.players.delete(interaction.guildId);
            }
          }

          currentlyPlaying.delete(interaction.guildId);
          await updatePersistentMessage();

          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {}
          }, 3000);

        } else if (interaction.customId === 'persistent_status') {
          const playingInfo = currentlyPlaying.get(interaction.guildId);
          const player = client.shoukaku.players.get(interaction.guildId);

          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF6B9D')
              .setTitle('🌟 Radio Status')
              .addFields(
                {
                  name: '🎵 Currently Playing',
                  value: playingInfo ? 
                    `🎧 **${playingInfo.stationName}**\n📍 ${interaction.guild.channels.cache.get(playingInfo.voiceChannelId)?.name}\n🔊 Volume: ${DEFAULT_VOLUME}%\n⏰ Started: <t:${Math.floor(playingInfo.startedAt / 1000)}:R>` : 
                    '✨ Ready to play music!',
                  inline: false
                },
                {
                  name: '💖 System Status',
                  value: `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}\nPlayer: ${player ? '✅ Connected' : '❌ Disconnected'}`,
                  inline: false
                },
                {
                  name: '🎪 Available Stations',
                  value: `${Object.keys(RADIO_STATIONS).length} stations across ${Object.keys(RADIO_CATEGORIES).length} categories`,
                  inline: false
                }
              )
              .setTimestamp()
            ],
            ephemeral: true
          });
        }

      } catch (error) {
        console.error('❌ Interaction error:', error);
      }
    }

    // Register commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    try {
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Commands registered');
      }
    } catch (error) {
      console.error('❌ Command registration failed:', error.message);
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready: ${client.user.tag}`);
      global.discordReady = true;
      
      setTimeout(() => {
        initializePersistentRadio();
      }, 3000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (command) {
            await command.execute(interaction);
          }
        } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
          await handlePersistentInteraction(interaction);
        }
      } catch (error) {
        console.error('❌ Interaction error:', error.message);
      }
    });

    // Enhanced voice state update handler to clean up disconnected players
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      try {
        // Check if the bot was disconnected from a voice channel
        if (oldState.member?.id === client.user.id && oldState.channelId && !newState.channelId) {
          console.log(`🔌 Bot disconnected from voice channel in guild ${oldState.guild.id}`);
          
          // Clean up player and tracking
          const player = client.shoukaku.players.get(oldState.guild.id);
          if (player) {
            try {
              await player.destroy();
              client.shoukaku.players.delete(oldState.guild.id);
            } catch (error) {
              console.warn('⚠️ Error cleaning up disconnected player:', error.message);
              client.shoukaku.players.delete(oldState.guild.id);
            }
          }
          
          // Remove from tracking
          currentlyPlaying.delete(oldState.guild.id);
          
          // Update persistent message
          await updatePersistentMessage();
        }
      } catch (error) {
        console.error('❌
