import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PRIORITY: Start health server immediately with image serving
console.log('🚀 STARTING UTA DJ BOT - World\'s Greatest Diva Edition');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

console.log(`🔊 Default volume set to: ${DEFAULT_VOLUME}%`);

// Image paths configuration
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : process.env.BASE_URL || `http://localhost:${port}`;

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('📁 Created images directory:', IMAGES_DIR);
}

// Image URL helper function
function getImageUrl(filename) {
  const imagePath = path.join(IMAGES_DIR, filename);
  return fs.existsSync(imagePath) ? `${BASE_URL}/images/${filename}` : null;
}

// MIME type helper
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

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

// Enhanced health server with image serving
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  console.log(`📡 Request: ${req.method} ${url.pathname}`);
  
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      defaultVolume: DEFAULT_VOLUME,
      version: '2.0.3',
      imagesDirectory: IMAGES_DIR,
      availableImages: fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [],
      baseUrl: BASE_URL
    }));
  } 
  // Serve images from /images/ path
  else if (url.pathname.startsWith('/images/')) {
    const filename = url.pathname.replace('/images/', '');
    const imagePath = path.join(IMAGES_DIR, filename);
    
    console.log(`🖼️ Image request: ${filename}`);
    console.log(`📁 Looking for: ${imagePath}`);
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden: Invalid filename');
      return;
    }
    
    // Check if file exists
    if (fs.existsSync(imagePath)) {
      try {
        const imageData = fs.readFileSync(imagePath);
        const mimeType = getMimeType(filename);
        
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Content-Length': imageData.length,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*' // Allow CORS
        });
        res.end(imageData);
        
        console.log(`✅ Served image: ${filename} (${imageData.length} bytes, ${mimeType})`);
      } catch (error) {
        console.error(`❌ Error reading image ${filename}:`, error.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading image');
      }
    } else {
      console.warn(`⚠️ Image not found: ${imagePath}`);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image not found');
    }
  } 
  // List available images
  else if (url.pathname === '/images') {
    try {
      const images = fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : [];
      const imageList = images
        .filter(file => /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file))
        .map(file => ({
          filename: file,
          url: getImageUrl(file),
          size: fs.statSync(path.join(IMAGES_DIR, file)).size
        }));
        
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        imagesDirectory: IMAGES_DIR,
        baseUrl: BASE_URL,
        availableImages: imageList,
        totalImages: imageList.length
      }, null, 2));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  } 
  // Default response
  else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Uta's Music Studio</title></head>
        <body style="font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #FF6B9D, #FF6B35);">
          <h1 style="color: white;">🎤 Uta's Music Studio is Online! ✨</h1>
          <h2 style="color: white;">📁 Image Management</h2>
          <p style="color: white;">
            <strong>Upload your images to:</strong><br>
            <code style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 3px;">${IMAGES_DIR}</code>
          </p>
          <p style="color: white;">
            <strong>Base URL:</strong><br>
            <code style="background: rgba(0,0,0,0.2); padding: 5px; border-radius: 3px;">${BASE_URL}</code>
          </p>
          <p style="color: white;">
            <a href="/images" style="color: #FFE066; text-decoration: none; font-weight: bold;">📋 View Available Images</a><br>
            <a href="/health" style="color: #FFE066; text-decoration: none; font-weight: bold;">📊 Health Check</a>
          </p>
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h3 style="color: white;">🖼️ Image Requirements:</h3>
            <ul style="color: white;">
              <li><strong>uta-banner.png</strong> - Main radio studio banner (1200x300px)</li>
              <li><strong>uta-profile.png</strong> - Profile picture (256x256px)</li>
              <li><strong>uta-icon.png</strong> - Small icon (64x64px)</li>
              <li><strong>radio-banner.png</strong> - Radio interface banner (1200x300px)</li>
              <li><strong>difm-banner.png</strong> - DI.FM specific banner (1200x300px)</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
  console.log(`📁 Images directory: ${IMAGES_DIR}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
  console.log(`🖼️ Image URLs will be: ${BASE_URL}/images/filename.png`);
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
    description: 'Top hits perfect for great performances',
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

// Enhanced Radio Manager with better connection handling
class EnhancedRadioManager {
  constructor(client) {
    this.client = client;
    this.currentConnections = new Map(); // Track active connections per guild
  }

  async switchStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching station for guild ${guildId} to ${stationKey}`);
    
    try {
      // Clean up existing connection properly
      await this.cleanupConnection(guildId);
      
      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create new connection and play station
      const result = await this.connectToStream(guildId, stationKey, voiceChannelId);
      
      // Track the new connection
      this.currentConnections.set(guildId, {
        stationKey,
        voiceChannelId,
        connectedAt: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Failed to switch station: ${error.message}`);
      throw error;
    }
  }

  async cleanupConnection(guildId) {
    console.log(`🧹 Cleaning up connection for guild ${guildId}`);
    
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      try {
        console.log('⏹️ Stopping current track...');
        await existingPlayer.stopTrack();
        
        console.log('🔌 Destroying player...');
        await existingPlayer.destroy();
        
        console.log('🗑️ Removing from players map...');
        this.client.shoukaku.players.delete(guildId);
      } catch (error) {
        console.warn(`⚠️ Error during cleanup: ${error.message}`);
        // Force remove even if cleanup fails
        this.client.shoukaku.players.delete(guildId);
      }
    }
    
    // Remove from our tracking
    this.currentConnections.delete(guildId);
    console.log('✅ Cleanup completed');
  }

  async connectToStream(guildId, stationKey, voiceChannelId) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    // Get the guild and voice channel
    const guild = this.client.guilds.cache.get(guildId);
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Create new player
    console.log('🔊 Creating new voice connection...');
    const player = await this.client.shoukaku.joinVoiceChannel({
      guildId: guildId,
      channelId: voiceChannelId,
      shardId: guild.shardId
    });

    // Set volume
    await player.setGlobalVolume(DEFAULT_VOLUME);
    console.log(`🔊 Volume set to ${DEFAULT_VOLUME}%`);
    
    // Try different URLs
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔄 Trying stream URL: ${url}`);
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          console.log(`✅ Successfully started stream: ${url}`);
          return { success: true, station, url, player };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          console.log(`✅ Successfully started stream: ${url}`);
          return { success: true, station, url, player };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
        continue;
      }
    }
    
    // If we get here, all URLs failed - cleanup the player
    try {
      await player.destroy();
      this.client.shoukaku.players.delete(guildId);
    } catch (cleanupError) {
      console.warn('⚠️ Error cleaning up failed player:', cleanupError.message);
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  getCurrentConnection(guildId) {
    return this.currentConnections.get(guildId);
  }

  async stopConnection(guildId) {
    console.log(`⏹️ Stopping connection for guild ${guildId}`);
    await this.cleanupConnection(guildId);
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
      console.error('❌ Missing required environment variables: DISCORD_TOKEN or CLIENT_ID');
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

      console.log('🎵 Lavalink config:', {
        name: nodes[0].name,
        url: nodes[0].url,
        secure: nodes[0].secure,
        auth: nodes[0].auth ? '***' : 'missing'
      });

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

      client.shoukaku.on('disconnect', (name, reason) => {
        console.warn(`⚠️ Lavalink "${name}" disconnected:`, reason);
        global.lavalinkReady = false;
      });

      console.log('✅ Lavalink configured');
    }

    const radioManager = new EnhancedRadioManager(client);
    let persistentMessage = null;
    let currentlyPlaying = new Map(); // Track what's playing per guild

    // Enhanced embed creation with LOCAL banner images
    async function createPersistentRadioEmbed() {
      const currentStatus = Array.from(currentlyPlaying.entries())
        .map(([guildId, info]) => `🎵 ${info.stationName}`)
        .join('\n') || '✨ Ready to play!';

      const embed = new EmbedBuilder()
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
        .setTimestamp();

      // Add LOCAL images if they exist
      const bannerUrl = getImageUrl('radio-banner.png');
      const profileUrl = getImageUrl('uta-profile.png');  
      const iconUrl = getImageUrl('uta-icon.png');

      if (bannerUrl) {
        embed.setImage(bannerUrl);
        console.log('✅ Using local radio banner image:', bannerUrl);
      } else {
        console.log('⚠️ No radio-banner.png found, skipping image');
      }
      
      if (profileUrl) {
        embed.setThumbnail(profileUrl);
        console.log('✅ Using local profile image:', profileUrl);
      } else {
        console.log('⚠️ No uta-profile.png found, skipping thumbnail');
      }
      
      if (iconUrl) {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: iconUrl
        });
        console.log('✅ Using local icon image:', iconUrl);
      } else {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: client.user?.displayAvatarURL() 
        });
        console.log('⚠️ No uta-icon.png found, using bot avatar');
      }

      return embed;
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
          console.log('✅ Updated persistent message');
        } catch (error) {
          console.warn('⚠️ Failed to update persistent message:', error.message);
        }
      }
    }

    async function initializePersistentRadio() {
      try {
        console.log(`🎵 Attempting to initialize radio in channel: ${RADIO_CHANNEL_ID}`);
        
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID).catch(error => {
          console.error(`❌ Failed to fetch channel ${RADIO_CHANNEL_ID}:`, error.message);
          return null;
        });
        
        if (!channel) {
          console.error(`❌ Radio channel not found: ${RADIO_CHANNEL_ID}`);
          console.log('💡 Make sure RADIO_CHANNEL_ID is set correctly in your environment variables');
          return;
        }

        console.log(`🎵 Initializing radio in #${channel.name} (${channel.id})`);

        // Clear messages (be more careful with permissions)
        try {
          const messages = await channel.messages.fetch({ limit: 50 });
          const botMessages = messages.filter(msg => msg.author.id === client.user.id);
          
          if (botMessages.size > 0) {
            console.log(`🧹 Cleaning up ${botMessages.size} old bot messages...`);
            // Delete bot messages one by one to avoid bulk delete issues
            for (const message of botMessages.values()) {
              try {
                await message.delete();
              } catch (deleteError) {
                console.warn('⚠️ Could not delete message:', deleteError.message);
              }
            }
          }
        } catch (error) {
          console.warn(`⚠️ Could not clear channel (this is normal): ${error.message}`);
        }

        // Create embed and components
        console.log('✨ Creating persistent radio interface...');
        const embed = await createPersistentRadioEmbed();
        const components = await createPersistentRadioComponents(channel.guildId);

        persistentMessage = await channel.send({
          embeds: [embed],
          components: components
        });

        console.log(`✅ Persistent radio created successfully!`);
        console.log(`📋 Message ID: ${persistentMessage.id}`);
        console.log(`📍 Channel: #${channel.name} in ${channel.guild.name}`);

      } catch (error) {
        console.error(`❌ Failed to initialize radio:`, error.message);
        console.error('Full error:', error);
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

        // Add profile image if available
        const profileUrl = getImageUrl('uta-profile.png');
        if (profileUrl) {
          embed.setImage(profileUrl);
        }

        await interaction.reply({ embeds: [embed] });
      }
    };

    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    // Enhanced interaction handler
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
            
            // Use the enhanced radio manager to switch stations
            const result = await radioManager.switchStation(
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
            console.error('❌ Auto-play failed:', error);
            
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

          try {
            await radioManager.stopConnection(interaction.guildId);
            currentlyPlaying.delete(interaction.guildId);
            await updatePersistentMessage();
            
            console.log(`⏹️ Stopped radio for guild ${interaction.guildId}`);
          } catch (error) {
            console.error('❌ Stop failed:', error);
          }

          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {}
          }, 3000);

        } else if (interaction.customId === 'persistent_status') {
          const playingInfo = currentlyPlaying.get(interaction.guildId);
          const player = client.shoukaku.players.get(interaction.guildId);

          const embed = new EmbedBuilder()
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
            .setFooter({ text: 'Select a station above to start playing instantly!' })
            .setTimestamp();

          // Add profile thumbnail if available
          const profileUrl = getImageUrl('uta-profile.png');
          if (profileUrl) {
            embed.setThumbnail(profileUrl);
          } else {
            embed.setThumbnail(client.user.displayAvatarURL());
          }

          await interaction.reply({
            embeds: [embed],
            ephemeral: true
          });
        }

      } catch (error) {
        console.error('❌ Interaction error:', error);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: '*"Something went wrong... please try again!"*',
              ephemeral: true
            });
          }
        } catch (replyError) {
          console.error('❌ Failed to send error reply:', replyError);
        }
      }
    }

    // Register commands
    console.log('📋 Registering slash commands...');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    try {
      if (process.env.GUILD_ID) {
        console.log(`🎯 Registering guild commands for: ${process.env.GUILD_ID}`);
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Guild commands registered successfully');
      } else {
        console.log('🌍 Registering global commands...');
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Global commands registered successfully');
      }
    } catch (error) {
      console.error('❌ Command registration failed:', error.message);
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready: ${client.user.tag}`);
      console.log(`🏰 Connected to ${client.guilds.cache.size} guilds`);
      console.log(`👥 Serving ${client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)} users`);
      
      global.discordReady = true;
      
      // Initialize persistent radio after a short delay
      setTimeout(() => {
        console.log('🎵 Initializing persistent radio interface...');
        initializePersistentRadio();
      }, 3000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (command) {
            console.log(`🎯 Executing command: /${interaction.commandName} by ${interaction.user.tag}`);
            await command.execute(interaction);
          }
        } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
          console.log(`🎛️ Handling interaction: ${interaction.customId} by ${interaction.user.tag}`);
          await handlePersistentInteraction(interaction);
        }
      } catch (error) {
        console.error('❌ Interaction error:', error.message);
        console.error('Full error:', error);
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
          radioManager.currentConnections.delete(oldState.guild.id);
          
          // Update persistent message
          await updatePersistentMessage();
        }
      } catch (error) {
        console.error('❌ Voice state update error:', error.message);
      }
    });

    // Additional error handling
    client.on(Events.Error, error => {
      console.error('❌ Discord client error:', error.message);
    });

    client.on(Events.Warn, warning => {
      console.warn('⚠️ Discord client warning:', warning);
    });

    // Login to Discord
    console.log('🔑 Logging into Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Start the bot with a small delay to ensure health server is ready
setTimeout(() => {
  console.log('🎤 Starting Discord bot initialization...');
  startDiscordBot();
}, 2000);

console.log('🎤 Uta DJ Bot with local images initialization started');
