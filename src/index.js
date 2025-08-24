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
      version: '2.0.4'
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

// COMPLETELY REWRITTEN Radio Manager with proper connection handling
class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.switchingConnections = new Set(); // Track guilds currently switching
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

  // COMPLETELY REWRITTEN: Proper connection management with extensive safeguards
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Starting station switch: ${stationKey} for guild ${guildId}`);
    
    // Prevent concurrent switches for the same guild
    if (this.switchingConnections.has(guildId)) {
      console.log(`⚠️ Already switching connection for guild ${guildId}, waiting...`);
      
      // Wait for existing switch to complete
      let waitAttempts = 0;
      while (this.switchingConnections.has(guildId) && waitAttempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        waitAttempts++;
      }
      
      if (this.switchingConnections.has(guildId)) {
        throw new Error('Another connection switch is already in progress for this server');
      }
    }
    
    // Mark this guild as switching
    this.switchingConnections.add(guildId);
    
    try {
      // Step 1: Get guild and voice channel info first
      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild?.channels.cache.get(voiceChannelId);
      
      if (!guild || !voiceChannel) {
        throw new Error('Guild or voice channel not found');
      }

      console.log(`🔧 Guild: ${guild.name}, Voice Channel: ${voiceChannel.name}`);

      // Step 2: THOROUGH connection cleanup with multiple fallback methods
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('🧹 Found existing connection, performing thorough cleanup...');
        
        try {
          // Method 1: Standard cleanup sequence
          console.log('🔄 Method 1: Standard cleanup...');
          
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            console.log('⏹️ Track stopped');
          }
          
          // Wait for track stop to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Disconnect from voice channel
          if (existingPlayer.voiceId) {
            console.log('🔌 Disconnecting from voice...');
            await existingPlayer.disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // Destroy the player
          await existingPlayer.destroy();
          console.log('💀 Player destroyed via standard method');
          
        } catch (standardError) {
          console.warn('⚠️ Standard cleanup failed, trying alternative methods:', standardError.message);
          
          try {
            // Method 2: Force destroy
            console.log('🔄 Method 2: Force destroy...');
            await existingPlayer.destroy();
            console.log('💀 Player force destroyed');
            
          } catch (forceError) {
            console.warn('⚠️ Force destroy failed, using manual cleanup:', forceError.message);
            
            // Method 3: Manual cleanup
            console.log('🔄 Method 3: Manual cleanup...');
            
            // Manually trigger disconnect event if needed
            if (existingPlayer.voiceId) {
              try {
                // Send voice state update to disconnect
                guild.shard.send({
                  op: 4,
                  d: {
                    guild_id: guildId,
                    channel_id: null,
                    self_mute: false,
                    self_deaf: false
                  }
                });
                console.log('🔌 Manual voice disconnect sent');
                await new Promise(resolve => setTimeout(resolve, 1000));
              } catch (manualError) {
                console.warn('⚠️ Manual voice disconnect failed:', manualError.message);
              }
            }
          }
        }
        
        // Always remove from player map regardless of cleanup success
        this.client.shoukaku.players.delete(guildId);
        console.log('🗑️ Player removed from map');
        
        // Extended wait for cleanup to fully process
        console.log('⏳ Waiting for cleanup to fully process...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify cleanup worked
        const stillExists = this.client.shoukaku.players.get(guildId);
        if (stillExists) {
          console.warn('⚠️ Player still exists after cleanup, force removing...');
          this.client.shoukaku.players.delete(guildId);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('✅ Cleanup verification completed');
      }

      // Step 3: Additional safeguards before creating new connection
      console.log('🔧 Running pre-connection checks...');
      
      // Check if Lavalink nodes are healthy
      const nodes = Array.from(this.client.shoukaku.nodes.values()).filter(n => n.state === 2);
      if (nodes.length === 0) {
        throw new Error('No healthy Lavalink nodes available');
      }
      
      // Double-check no player exists for this guild
      if (this.client.shoukaku.players.has(guildId)) {
        console.warn('⚠️ Player still detected, performing emergency cleanup...');
        this.client.shoukaku.players.delete(guildId);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 4: Create new connection with retry logic
      console.log('🔊 Creating new voice connection...');
      
      let newPlayer;
      let connectionAttempts = 0;
      const maxConnectionAttempts = 3;
      
      while (connectionAttempts < maxConnectionAttempts) {
        try {
          console.log(`🔄 Connection attempt ${connectionAttempts + 1}/${maxConnectionAttempts}`);
          
          newPlayer = await this.client.shoukaku.joinVoiceChannel({
            guildId: guildId,
            channelId: voiceChannelId,
            shardId: guild.shardId
          });
          
          console.log('✅ New voice connection established successfully');
          break;
          
        } catch (connectionError) {
          connectionAttempts++;
          console.error(`❌ Connection attempt ${connectionAttempts} failed:`, connectionError.message);
          
          if (connectionError.message.includes('existing connection')) {
            console.log('🧹 "Existing connection" error detected, performing emergency cleanup...');
            
            // Emergency cleanup - force remove any traces
            this.client.shoukaku.players.delete(guildId);
            
            // Send manual disconnect
            try {
              guild.shard.send({
                op: 4,
                d: {
                  guild_id: guildId,
                  channel_id: null,
                  self_mute: false,
                  self_deaf: false
                }
              });
              console.log('🔌 Emergency manual disconnect sent');
            } catch (emergencyError) {
              console.warn('⚠️ Emergency disconnect failed:', emergencyError.message);
            }
            
            // Wait longer before retry
            const waitTime = 2000 * connectionAttempts;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
          } else if (connectionAttempts >= maxConnectionAttempts) {
            throw new Error(`Failed to create voice connection after ${maxConnectionAttempts} attempts: ${connectionError.message}`);
          } else {
            // Wait before retry for other errors
            await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
          }
        }
      }
      
      if (!newPlayer) {
        throw new Error('Failed to create voice connection after all attempts');
      }

      // Step 5: Configure new player
      console.log('🔧 Configuring new player...');
      await newPlayer.setGlobalVolume(DEFAULT_VOLUME);
      console.log(`🔊 Volume set to ${DEFAULT_VOLUME}%`);
      
      // Wait a moment for player to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 6: Connect to radio stream
      console.log('🎵 Connecting to radio stream...');
      const result = await this.connectToStream(newPlayer, stationKey);
      
      console.log('✅ Successfully switched to new station:', result.station.name);
      return result;

    } catch (error) {
      console.error('❌ Station switch failed:', error.message);
      
      // Emergency cleanup on failure
      try {
        this.client.shoukaku.players.delete(guildId);
        const guild = this.client.guilds.cache.get(guildId);
        if (guild) {
          guild.shard.send({
            op: 4,
            d: {
              guild_id: guildId,
              channel_id: null,
              self_mute: false,
              self_deaf: false
            }
          });
        }
      } catch (cleanupError) {
        console.warn('⚠️ Emergency cleanup failed:', cleanupError.message);
      }
      
      throw error;
      
    } finally {
      // Always remove the switching lock
      this.switchingConnections.delete(guildId);
      console.log(`🔓 Released switching lock for guild ${guildId}`);
    }
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

    // Setup Lavalink with enhanced connection handling
    if (process.env.LAVALINK_URL) {
      const nodes = [{
        name: process.env.LAVALINK_NAME || 'railway-node',
        url: process.env.LAVALINK_URL,
        auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
        secure: process.env.LAVALINK_SECURE === 'true'
      }];

      client.shoukaku = new shoukaku.Shoukaku(new shoukaku.Connectors.DiscordJS(client), nodes, {
        resume: true,
        resumeKey: 'uta-bot-persistent-radio-v2',
        resumeTimeout: 60,
        reconnectTries: 10,
        reconnectInterval: 5000,
        restTimeout: 60000,
        moveOnDisconnect: false, // Important: Don't auto-move on disconnect
        userAgent: 'UTA-DJ-BOT/2.0.4 (Enhanced Connection Handling)'
      });

      client.shoukaku.on('ready', (name) => {
        console.log(`✅ Lavalink "${name}" ready`);
        global.lavalinkReady = true;
      });

      client.shoukaku.on('error', (name, error) => {
        console.error(`❌ Lavalink "${name}" error:`, error.message);
        global.lavalinkReady = false;
      });

      client.shoukaku.on('disconnect', (name, reason) => {
        console.warn(`⚠️ Lavalink "${name}" disconnected:`, reason);
        global.lavalinkReady = false;
      });

      // Enhanced player cleanup on node disconnect
      client.shoukaku.on('raw', (name, json) => {
        try {
          const data = JSON.parse(json);
          
          if (data.op === 'event' && data.type === 'WebSocketClosedEvent') {
            console.log(`🔌 Voice connection closed for guild ${data.guildId}: ${data.reason} (code: ${data.code})`);
            
            // Clean up player on unexpected voice disconnection
            if (data.code === 4014 || data.code === 4009) { // Disconnected/Session timeout
              console.log(`🧹 Auto-cleaning player for guild ${data.guildId} due to voice disconnect`);
              const player = client.shoukaku.players.get(data.guildId);
              if (player) {
                try {
                  client.shoukaku.players.delete(data.guildId);
                  console.log(`✅ Auto-cleaned player for guild ${data.guildId}`);
                } catch (cleanupError) {
                  console.warn(`⚠️ Auto-cleanup failed for guild ${data.guildId}:`, cleanupError.message);
                }
              }
            }
          }
        } catch (parseError) {
          // Ignore JSON parse errors
        }
      });

      console.log('✅ Lavalink configured with enhanced connection handling');
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
          text: 'Uta\'s Radio Studio • Enhanced Connection Handling ✨',
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
      const isSwitching = radioManager.switchingConnections.has(guildId);

      const stopButton = new ButtonBuilder()
        .setCustomId('persistent_stop')
        .setLabel('⏸️ Stop Radio')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑')
        .setDisabled(!isPlaying || isSwitching);

      const statusButton = new ButtonBuilder()
        .setCustomId('persistent_status')
        .setLabel(isSwitching ? '🔄 Switching...' : '📊 Status')
        .setStyle(isSwitching ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setEmoji(isSwitching ? '🔄' : '🎭')
        .setDisabled(isSwitching);

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
              value: `• ${Object.keys(RADIO_CATEGORIES).length} music styles\n• ${Object.keys(RADIO_STATIONS).length} radio stations\n• Instant auto-play when you select a station!\n• Easy station switching with enhanced connection handling`,
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

    // Enhanced interaction handler with improved error handling and status updates
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

          // Check if already switching
          if (radioManager.switchingConnections.has(interaction.guildId)) {
            return interaction.reply({
              content: '*"I\'m already switching stations! Please wait a moment..."* 🔄',
              ephemeral: true
            });
          }

          await interaction.reply({
            content: `🔄 *"Switching to ${station.name}... This might take a few seconds!"*`,
            ephemeral: true
          });

          // Update UI to show switching state
          await updatePersistentMessage();

          try {
            console.log(`🎵 Auto-playing ${selectedStation} for guild ${interaction.guildId}`);
            
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
              content: `🎵 *"Now playing ${station.name}!"* (Volume: ${DEFAULT_VOLUME}%)\n🎧 Playing in **${voiceChannel.name}**\n✨ *"Enjoy the music!"*`
            });

            // Update the main message to show current status
            await updatePersistentMessage();

            // Auto-delete success message after 5 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 5000);

          } catch (error) {
            console.error('❌ Auto-play failed:', error);
            
            // Remove from tracking if failed
            currentlyPlaying.delete(interaction.guildId);
            
            let errorMessage = `*"Sorry, I couldn't play ${station.name}."*`;
            
            if (error.message.includes('existing connection')) {
              errorMessage += '\n🔧 *"There was a connection conflict. Please try again!"*';
            } else if (error.message.includes('in progress')) {
              errorMessage += '\n⏳ *"Another switch is happening. Please wait!"*';
            } else if (error.message.includes('nodes')) {
              errorMessage += '\n🎧 *"Audio system is having issues. Try again soon!"*';
            } else {
              errorMessage += `\n🔍 *"Technical issue: ${error.message.substring(0, 100)}..."*`;
            }
            
            await interaction.editReply({
              content: errorMessage
            });
            
            // Update UI to remove switching state
            await updatePersistentMessage();
            
            // Auto-delete error after 8 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 8000);
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
              console.log(`✅ Successfully stopped radio for guild ${interaction.guildId}`);
            } catch (error) {
              console.warn(`⚠️ Error stopping radio for guild ${interaction.guildId}:`, error.message);
              // Force cleanup even if stop fails
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
          const isSwitching = radioManager.switchingConnections.has(interaction.guildId);

          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor(isSwitching ? '#FFA500' : '#FF6B9D')
              .setTitle(isSwitching ? '🔄 Station Switching in Progress' : '🌟 Radio Status')
              .addFields(
                {
                  name: '🎵 Currently Playing',
                  value: isSwitching ? 
                    '🔄 *Switching to new station...*' :
                    playingInfo ? 
                      `🎧 **${playingInfo.stationName}**\n📍 ${interaction.guild.channels.cache.get(playingInfo.voiceChannelId)?.name}\n🔊 Volume: ${DEFAULT_VOLUME}%\n⏰ Started: <t:${Math.floor(playingInfo.startedAt / 1000)}:R>` : 
                      '✨ Ready to play music!',
                  inline: false
                },
                {
                  name: '💖 System Status',
                  value: `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}\nPlayer: ${player ? '✅ Connected' : '❌ Disconnected'}\nConnection Handler: ✅ Enhanced`,
                  inline: false
                },
                {
                  name: '🎪 Available Content',
                  value: `${Object.keys(RADIO_STATIONS).length} stations across ${Object.keys(RADIO_CATEGORIES).length} categories\nConnection switching: ${isSwitching ? '🔄 Active' : '✅ Ready'}`,
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
        
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: '*"Something went wrong! Please try again."* 😅',
              ephemeral: true
            });
          } catch (replyError) {
            console.error('❌ Failed to send error reply:', replyError.message);
          }
        }
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
              console.log(`✅ Cleaned up player for guild ${oldState.guild.id}`);
            } catch (error) {
              console.warn(`⚠️ Error cleaning up disconnected player for guild ${oldState.guild.id}:`, error.message);
              client.shoukaku.players.delete(oldState.guild.id);
            }
          }
          
          // Remove from tracking and switching connections
          currentlyPlaying.delete(oldState.guild.id);
          radioManager.switchingConnections.delete(oldState.guild.id);
          
          // Update persistent message
          await updatePersistentMessage();
        }
      } catch (error) {
        console.error('❌ Voice state update error:', error.message);
      }
    });

    // Periodic cleanup to handle orphaned connections
    setInterval(async () => {
      try {
        // Clean up any stuck switching states that might have failed
        for (const guildId of radioManager.switchingConnections) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            console.log(`🧹 Removing switching lock for non-existent guild: ${guildId}`);
            radioManager.switchingConnections.delete(guildId);
            continue;
          }
          
          // Check if there's actually a voice connection
          const voiceConnection = guild.members.me?.voice?.channelId;
          if (!voiceConnection) {
            console.log(`🧹 Removing switching lock for guild with no voice connection: ${guildId}`);
            radioManager.switchingConnections.delete(guildId);
            currentlyPlaying.delete(guildId);
          }
        }
        
        // Clean up players that don't have voice connections
        for (const [guildId, player] of client.shoukaku.players) {
          const guild = client.guilds.cache.get(guildId);
          if (!guild) {
            console.log(`🧹 Removing player for non-existent guild: ${guildId}`);
            try {
              await player.destroy();
            } catch (error) {}
            client.shoukaku.players.delete(guildId);
            currentlyPlaying.delete(guildId);
            continue;
          }
          
          const voiceConnection = guild.members.me?.voice?.channelId;
          if (!voiceConnection && !radioManager.switchingConnections.has(guildId)) {
            console.log(`🧹 Removing orphaned player for guild: ${guildId}`);
            try {
              await player.destroy();
            } catch (error) {}
            client.shoukaku.players.delete(guildId);
            currentlyPlaying.delete(guildId);
          }
        }
        
      } catch (error) {
        console.error('❌ Cleanup interval error:', error.message);
      }
    }, 60000); // Run every minute

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

console.log('🎤 Uta DJ Bot initialization started');
