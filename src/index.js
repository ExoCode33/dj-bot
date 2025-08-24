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
      version: '2.0.4',
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
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(imageData);
        
        console.log(`✅ Served image: ${filename} (${imageData.length} bytes)`);
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
          <p style="color: white;"><strong>Base URL:</strong> ${BASE_URL}</p>
          <p style="color: white;">
            <a href="/images" style="color: #FFE066;">📋 View Images</a> | 
            <a href="/health" style="color: #FFE066;">📊 Health Check</a>
          </p>
        </body>
      </html>
    `);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
  console.log(`🌐 Base URL: ${BASE_URL}`);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// Radio Categories
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

// AGGRESSIVE Radio Manager - FIXES CONNECTION SWITCHING ISSUES
class AggressiveRadioManager {
  constructor(client) {
    this.client = client;
    this.currentConnections = new Map();
    this.cleanupInProgress = new Set(); // Track guilds currently being cleaned up
  }

  async switchStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 [${guildId}] Switching to station: ${stationKey}`);
    
    // Prevent concurrent cleanup/connection attempts
    if (this.cleanupInProgress.has(guildId)) {
      console.log(`⏳ [${guildId}] Cleanup already in progress, waiting...`);
      
      // Wait for cleanup to finish
      let attempts = 0;
      while (this.cleanupInProgress.has(guildId) && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (this.cleanupInProgress.has(guildId)) {
        throw new Error('Cleanup took too long, please try again');
      }
    }
    
    try {
      this.cleanupInProgress.add(guildId);
      
      // STEP 1: Nuclear cleanup of existing connection
      await this.nuclearCleanup(guildId);
      
      // STEP 2: Wait for Discord to process the cleanup
      console.log(`⏳ [${guildId}] Waiting for cleanup to settle...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // STEP 3: Final verification - ensure no lingering connections
      await this.verifyCleanState(guildId);
      
      // STEP 4: Create new connection
      const result = await this.connectToStream(guildId, stationKey, voiceChannelId);
      
      // STEP 5: Track the new connection
      this.currentConnections.set(guildId, {
        stationKey,
        voiceChannelId,
        connectedAt: Date.now()
      });
      
      console.log(`✅ [${guildId}] Successfully switched to ${stationKey}`);
      return result;
      
    } catch (error) {
      console.error(`❌ [${guildId}] Failed to switch station: ${error.message}`);
      throw error;
    } finally {
      this.cleanupInProgress.delete(guildId);
    }
  }

  async nuclearCleanup(guildId) {
    console.log(`💥 [${guildId}] Starting NUCLEAR cleanup...`);
    
    try {
      // Phase 1: Shoukaku player cleanup
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log(`🎵 [${guildId}] Found existing player, destroying...`);
        
        try {
          // Stop track immediately
          await Promise.race([
            existingPlayer.stopTrack(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Stop timeout')), 2000))
          ]);
          console.log(`⏹️ [${guildId}] Track stopped`);
        } catch (error) {
          console.warn(`⚠️ [${guildId}] Error stopping track: ${error.message}`);
        }
        
        try {
          // Destroy player with timeout
          await Promise.race([
            existingPlayer.destroy(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Destroy timeout')), 3000))
          ]);
          console.log(`💀 [${guildId}] Player destroyed`);
        } catch (error) {
          console.warn(`⚠️ [${guildId}] Error destroying player: ${error.message}`);
        }
      }
      
      // Phase 2: Force remove from all Shoukaku maps
      this.client.shoukaku.players.delete(guildId);
      console.log(`🗑️ [${guildId}] Removed from shoukaku players`);
      
      // Phase 3: Clean all nodes
      const nodes = Array.from(this.client.shoukaku.nodes.values());
      for (const node of nodes) {
        try {
          if (node.players && node.players.has(guildId)) {
            console.log(`🌐 [${guildId}] Cleaning node: ${node.name}`);
            node.players.delete(guildId);
          }
          
          // Try REST cleanup if available
          if (node.rest && node.state === 2) { // Connected state
            try {
              await Promise.race([
                node.rest.destroyPlayer(guildId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('REST timeout')), 2000))
              ]);
              console.log(`🔗 [${guildId}] REST cleanup on ${node.name}`);
            } catch (restError) {
              // REST cleanup is optional, don't log errors unless debug mode
              if (process.env.DEBUG) {
                console.log(`🔗 [${guildId}] REST cleanup failed: ${restError.message}`);
              }
            }
          }
        } catch (nodeError) {
          console.warn(`⚠️ [${guildId}] Node cleanup error: ${nodeError.message}`);
        }
      }
      
      // Phase 4: Discord.js voice cleanup
      const guild = this.client.guilds.cache.get(guildId);
      if (guild && guild.members.me.voice.channelId) {
        console.log(`🔊 [${guildId}] Discord.js voice cleanup...`);
        try {
          await Promise.race([
            guild.members.me.voice.disconnect(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Voice disconnect timeout')), 2000))
          ]);
          console.log(`🔇 [${guildId}] Discord voice disconnected`);
        } catch (voiceError) {
          console.warn(`⚠️ [${guildId}] Voice disconnect error: ${voiceError.message}`);
        }
      }
      
      // Phase 5: Clear our tracking
      this.currentConnections.delete(guildId);
      
      console.log(`✅ [${guildId}] Nuclear cleanup completed`);
      
    } catch (error) {
      console.error(`💥 [${guildId}] Nuclear cleanup error: ${error.message}`);
      
      // Emergency cleanup - remove everything we can
      this.client.shoukaku.players.delete(guildId);
      this.currentConnections.delete(guildId);
      
      const nodes = Array.from(this.client.shoukaku.nodes.values());
      for (const node of nodes) {
        if (node.players) {
          node.players.delete(guildId);
        }
      }
    }
  }

  async verifyCleanState(guildId) {
    console.log(`🔍 [${guildId}] Verifying clean state...`);
    
    // Check if any players still exist
    if (this.client.shoukaku.players.has(guildId)) {
      console.warn(`⚠️ [${guildId}] Player still exists after cleanup! Force removing...`);
      this.client.shoukaku.players.delete(guildId);
    }
    
    // Check nodes
    const nodes = Array.from(this.client.shoukaku.nodes.values());
    for (const node of nodes) {
      if (node.players && node.players.has(guildId)) {
        console.warn(`⚠️ [${guildId}] Node ${node.name} still has player! Force removing...`);
        node.players.delete(guildId);
      }
    }
    
    console.log(`✅ [${guildId}] State verification complete`);
  }

  async connectToStream(guildId, stationKey, voiceChannelId) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');

    console.log(`🎵 [${guildId}] Connecting to ${station.name}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Final check before creating connection
    if (this.client.shoukaku.players.has(guildId)) {
      throw new Error('Player still exists! This should not happen after cleanup');
    }

    console.log(`🔊 [${guildId}] Creating fresh voice connection...`);
    let player;
    
    try {
      // Create connection with retry logic
      let connectionAttempts = 0;
      const maxAttempts = 3;
      
      while (connectionAttempts < maxAttempts) {
        try {
          player = await this.client.shoukaku.joinVoiceChannel({
            guildId: guildId,
            channelId: voiceChannelId,
            shardId: guild.shardId
          });
          console.log(`✅ [${guildId}] Voice connection created (attempt ${connectionAttempts + 1})`);
          break;
        } catch (connectionError) {
          connectionAttempts++;
          
          if (connectionError.message.includes('existing connection') && connectionAttempts < maxAttempts) {
            console.warn(`⚠️ [${guildId}] Connection attempt ${connectionAttempts} failed, retrying after cleanup...`);
            
            // Emergency micro-cleanup
            this.client.shoukaku.players.delete(guildId);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          } else {
            throw connectionError;
          }
        }
      }
      
      if (!player) {
        throw new Error('Failed to create voice connection after multiple attempts');
      }

    } catch (error) {
      console.error(`❌ [${guildId}] Voice connection failed: ${error.message}`);
      throw new Error(`Cannot create voice connection: ${error.message}`);
    }

    // Set volume
    await player.setGlobalVolume(DEFAULT_VOLUME);
    console.log(`🔊 [${guildId}] Volume set to ${DEFAULT_VOLUME}%`);
    
    // Try to play the stream
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔄 [${guildId}] Trying: ${url}`);
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          console.log(`✅ [${guildId}] Stream started successfully`);
          return { success: true, station, url, player };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          console.log(`✅ [${guildId}] Stream started successfully`);
          return { success: true, station, url, player };
        }
      } catch (error) {
        console.error(`❌ [${guildId}] URL ${url} failed: ${error.message}`);
        continue;
      }
    }
    
    // If we get here, all URLs failed
    try {
      await player.destroy();
      this.client.shoukaku.players.delete(guildId);
    } catch (cleanupError) {
      console.warn(`⚠️ [${guildId}] Cleanup after stream failure: ${cleanupError.message}`);
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  async stopConnection(guildId) {
    console.log(`⏹️ [${guildId}] Stopping connection...`);
    await this.nuclearCleanup(guildId);
  }

  getCurrentConnection(guildId) {
    return this.currentConnections.get(guildId);
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

    const radioManager = new AggressiveRadioManager(client);
    let persistentMessage = null;
    let currentlyPlaying = new Map();

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
      }
      if (profileUrl) {
        embed.setThumbnail(profileUrl);
      }
      if (iconUrl) {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: iconUrl
        });
      } else {
        embed.setFooter({ 
          text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
          iconURL: client.user?.displayAvatarURL()
