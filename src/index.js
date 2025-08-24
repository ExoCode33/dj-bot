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
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log('📁 Created images directory:', IMAGES_DIR);
}

// Image URL helper function
function getImageUrl(filename) {
  return `${BASE_URL}/images/${filename}`;
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
      availableImages: fs.existsSync(IMAGES_DIR) ? fs.readdirSync(IMAGES_DIR) : []
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
      const bannerPath = path.join(IMAGES_DIR, 'radio-banner.png');
      const profilePath = path.join(IMAGES_DIR, 'uta-profile.png');
      const iconPath = path.join(IMAGES_DIR, 'uta-icon.png');

      if (fs.existsSync(bannerPath)) {
        embed.setImage(getImageUrl('radio-banner.png'));
        console.log('✅ Using local radio banner image');
      }
      if (fs.existsSync(profilePath)) {
        embed.setThumbnail(getImageUrl('uta-profile.png'));
        console.log('✅ Using local profile image');
      }
      if (fs.existsSync(iconPath)) {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: getImageUrl('uta-icon.png')
        });
        console.log('✅ Using local icon image');
      } else {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: client.user?.displayAvatarURL() 
        });
      }

      return embed;
    }

    // Rest of your bot code continues here...
    // (The rest would be the same as the previous version but using the getImageUrl() helper function)
    
    // Initialize the rest of the bot functionality
    console.log('🎵 Bot initialization complete - images served locally');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}

// Start the bot
setTimeout(() => {
  startDiscordBot();
}, 2000);

console.log('🎤 Uta DJ Bot with local images initialization started');
