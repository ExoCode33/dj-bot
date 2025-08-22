import 'dotenv/config';
import http from 'node:http';

// Immediate logging to see if the script even starts
console.log('🚀 STARTING UTA DJ BOT - DEBUG MODE');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Node Version:', process.version);
console.log('📍 Working Directory:', process.cwd());
console.log('🎯 PORT:', process.env.PORT || 3000);

// Create health server FIRST to respond to Railway health checks
function createHealthServer() {
  const port = process.env.PORT || 3000;
  
  console.log(`🏥 Creating health server on port ${port}...`);
  
  const server = http.createServer((req, res) => {
    console.log(`📡 Health check request: ${req.method} ${req.url}`);
    
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'uta-dj-bot',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        discord: {
          connected: global.discordConnected || false
        },
        lavalink: {
          connected: global.lavalinkConnected || false,
          nodes: global.lavalinkNodes || 0
        }
      };
      console.log('✅ Health check response sent:', healthData);
      res.end(JSON.stringify(healthData));
    } else if (req.url === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <head><title>Uta DJ Bot</title></head>
          <body>
            <h1>🎤 Uta DJ Bot</h1>
            <p>Status: Running</p>
            <p>Time: ${new Date().toISOString()}</p>
            <p>Uptime: ${process.uptime()} seconds</p>
            <p><a href="/health">Health Check</a></p>
          </body>
        </html>
      `);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Health server listening on 0.0.0.0:${port}`);
    console.log(`🔗 Health endpoint: http://localhost:${port}/health`);
  });

  server.on('error', (error) => {
    console.error('❌ Health server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`💥 Port ${port} is already in use!`);
    }
  });

  return server;
}

// Start health server immediately
const healthServer = createHealthServer();

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [UNHANDLED REJECTION]');
  console.error('📍 Promise:', promise);
  console.error('📋 Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 [UNCAUGHT EXCEPTION]:', error.message);
  console.error('📋 Stack trace:', error.stack);
  
  // Don't exit immediately, let health server continue running
  console.error('⚠️ Continuing to run health server despite exception...');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM signal');
  console.log('🛑 Gracefully shutting down...');
  if (healthServer) {
    healthServer.close(() => {
      console.log('🏥 Health server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT signal (Ctrl+C)');
  console.log('🛑 Gracefully shutting down...');
  if (healthServer) {
    healthServer.close(() => {
      console.log('🏥 Health server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Now try to start the actual bot
async function startBot() {
  try {
    console.log('🔍 Phase 1: Environment Validation');

    // Check critical environment variables
    const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
      console.error('⚠️ Bot will not start, but health server will continue running');
      return; // Don't exit, keep health server running
    }

    console.log('✅ Required environment variables found');
    console.log('🔑 Discord Token:', process.env.DISCORD_TOKEN ? 'SET' : 'MISSING');
    console.log('🆔 Client ID:', process.env.CLIENT_ID || 'MISSING');
    console.log('🏠 Guild ID:', process.env.GUILD_ID || 'Global commands');
    console.log('🎵 Lavalink URL:', process.env.LAVALINK_URL || 'MISSING');

    // Dynamic import to avoid issues if modules fail to load
    console.log('📦 Loading Discord.js...');
    const { Client, GatewayIntentBits, Collection, Events } = await import('discord.js');
    console.log('✅ Discord.js loaded successfully');

    console.log('🎵 Loading Shoukaku...');
    const { Shoukaku, Connectors } = await import('shoukaku');
    console.log('✅ Shoukaku loaded successfully');

    // Create Discord client
    console.log('🤖 Creating Discord client...');
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });
    
    client.commands = new Collection();
    console.log('✅ Discord client created');

    // Setup Lavalink if URL is provided
    if (process.env.LAVALINK_URL) {
      try {
        console.log('🎵 Setting up Lavalink connection...');
        const nodes = [{
          name: process.env.LAVALINK_NAME || 'railway-node',
          url: process.env.LAVALINK_URL,
          auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
          secure: process.env.LAVALINK_SECURE === 'true'
        }];

        client.shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
          resume: true,
          resumeKey: 'uta-dj-bot-debug',
          resumeTimeout: 30,
          reconnectTries: 5,
          reconnectInterval: 3000,
          restTimeout: 60000
        });

        client.shoukaku.on('ready', (name) => {
          console.log(`✅ Lavalink node "${name}" ready!`);
          global.lavalinkConnected = true;
        });

        client.shoukaku.on('error', (name, error) => {
          console.error(`❌ Lavalink error on ${name}:`, error.message);
          global.lavalinkConnected = false;
        });

        console.log('✅ Lavalink setup complete');
      } catch (lavalinkError) {
        console.error('❌ Lavalink setup failed:', lavalinkError.message);
        console.log('⚠️ Continuing without Lavalink...');
      }
    } else {
      console.log('⚠️ No LAVALINK_URL provided, skipping Lavalink setup');
    }

    // Basic ready event
    client.once(Events.ClientReady, () => {
      console.log(`🎉 Discord bot ready! Logged in as ${client.user.tag}`);
      console.log(`🏢 Connected to ${client.guilds.cache.size} guild(s)`);
      global.discordConnected = true;
    });

    // Basic error handling
    client.on('error', (error) => {
      console.error('❌ Discord client error:', error.message);
      global.discordConnected = false;
    });

    // Attempt Discord login
    console.log('🔑 Attempting Discord login...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login successful');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
    console.error('📋 Full error:', error);
    console.log('⚠️ Health server will continue running...');
  }
}

// Start bot after a small delay to let health server stabilize
console.log('⏳ Starting bot in 2 seconds...');
setTimeout(() => {
  startBot().catch(error => {
    console.error('💥 Failed to start bot:', error.message);
    console.log('⚠️ Health server continues running for debugging');
  });
}, 2000);

console.log('🎬 Health server is running, bot startup initiated');
console.log('🔗 Try accessing: http://localhost:' + (process.env.PORT || 3000) + '/health');
