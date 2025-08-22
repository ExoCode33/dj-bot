import 'dotenv/config';
import { createClient } from './core/client.js';
import { log } from './utils/logger.js';
import { cfg } from './config/index.js';
import { REST, Routes, Events } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced logging for Railway deployment debugging
console.log('🚀 UTA DJ BOT - STARTING UP');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔧 Node Version:', process.version);
console.log('📍 Working Directory:', process.cwd());
console.log('📂 Script Directory:', __dirname);

// Simple health check server for Railway
function createHealthServer() {
  const port = process.env.PORT || 3000;
  
  const server = http.createServer((req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        service: 'uta-dj-bot'
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    }
  });

  server.listen(port, () => {
    console.log(`🏥 Health check server running on port ${port}`);
  });

  server.on('error', (error) => {
    console.error('❌ Health server error:', error.message);
  });

  return server;
}

async function startBot() {
  try {
    console.log('🔍 Phase 1: Environment Validation');

    // Validate required environment variables
    const requiredEnvVars = [
      'DISCORD_TOKEN',
      'CLIENT_ID'
    ];

    console.log('🔍 Checking environment variables...');
    const missing = requiredEnvVars.filter(key => {
      const hasVar = !!process.env[key];
      console.log(`  ${hasVar ? '✅' : '❌'} ${key}: ${hasVar ? 'SET' : 'MISSING'}`);
      return !hasVar;
    });

    if (missing.length > 0) {
      console.error(`❌ FATAL: Missing required environment variables: ${missing.join(', ')}`);
      console.error('💡 Please check your Railway environment variables configuration');
      process.exit(1);
    }
    console.log('✅ All required environment variables found');

    // Log configuration (without sensitive data)
    console.log('📋 Bot Configuration:');
    console.log(`  - Client ID: ${cfg.discord.clientId}`);
    console.log(`  - Guild ID: ${cfg.discord.guildId || 'Global commands'}`);
    console.log(`  - Default Volume: ${cfg.uta.defaultVolume}`);
    console.log(`  - Authorized Role: ${cfg.uta.authorizedRoleId || 'Not set'}`);

    // Start health check server (for Railway monitoring)
    if (process.env.NODE_ENV === 'production') {
      console.log('🏥 Starting health check server...');
      createHealthServer();
    }

    console.log('🔍 Phase 2: Discord Client Creation');
    const client = createClient();
    console.log('✅ Discord client created successfully');

    console.log('🔍 Phase 3: Command Loading');
    const commandsDir = path.join(__dirname, 'commands');
    console.log(`📁 Commands directory: ${commandsDir}`);
    
    if (!fs.existsSync(commandsDir)) {
      console.error('❌ FATAL: Commands directory does not exist!');
      console.error(`Expected path: ${commandsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
    console.log(`📄 Found ${files.length} command files:`, files);

    if (files.length === 0) {
      console.error('❌ FATAL: No command files found!');
      process.exit(1);
    }

    const slashDefs = [];
    for (const f of files) {
      try {
        console.log(`⚡ Loading command file: ${f}`);
        const filePath = path.join(commandsDir, f);
        const mod = await import(filePath);
        
        if (!mod?.data || !mod?.execute) {
          console.error(`❌ Invalid command file ${f}: missing data or execute`);
          continue;
        }
        
        const commandName = mod.data.name;
        console.log(`✅ Loaded command: ${commandName}`);
        
        client.commands.set(commandName, mod);
        slashDefs.push(mod.data.toJSON());
      } catch (error) {
        console.error(`❌ Error loading command file ${f}:`, error.message);
        console.error(error.stack);
      }
    }

    console.log(`📋 Total commands loaded: ${slashDefs.length}`);
    console.log(`🎯 Command names: ${slashDefs.map(cmd => cmd.name).join(', ')}`);

    if (slashDefs.length === 0) {
      console.error('❌ FATAL: No commands loaded successfully!');
      process.exit(1);
    }

    console.log('🔍 Phase 4: Slash Command Registration');
    try {
      const rest = new REST({ version: '10' }).setToken(cfg.discord.token);

      if (cfg.discord.guildId) {
        console.log(`🎯 Registering to guild: ${cfg.discord.guildId}`);
        await rest.put(Routes.applicationGuildCommands(cfg.discord.clientId, cfg.discord.guildId), { body: slashDefs });
        console.log('✅ Registered GUILD commands successfully');
      } else {
        console.log('🌍 Registering global commands...');
        await rest.put(Routes.applicationCommands(cfg.discord.clientId), { body: slashDefs });
        console.log('✅ Registered GLOBAL commands successfully');
      }
    } catch (error) {
      console.error('❌ Slash command registration failed:', error.message);
      if (error.code === 50001) {
        console.error('💡 Error 50001: Missing Access - Check your bot permissions');
        console.error('   - Make sure the bot is added to your server');
        console.error('   - Ensure the bot has "applications.commands" scope');
      }
      if (error.code === 50035) {
        console.error('💡 Error 50035: Invalid Form Body - Check your command definitions');
      }
      // Don't exit here, the bot can still work with existing commands
      console.warn('⚠️  Continuing without registering new commands...');
    }

    console.log('🔍 Phase 5: Event Registration');
    
    // Ready event
    client.once(Events.ClientReady, () => {
      console.log(`🎉 [READY] Successfully logged in as ${client.user.tag}`);
      console.log(`🏢 Connected to ${client.guilds.cache.size} guild(s)`);
      console.log(`👥 Total users: ${client.users.cache.size}`);
      
      // List connected guilds
      client.guilds.cache.forEach(guild => {
        console.log(`  📍 Guild: ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
      });
      
      console.log('🚀 UTA DJ BOT IS FULLY OPERATIONAL!');
    });

    // Interaction handler
    client.on(Events.InteractionCreate, async (i) => {
      if (!i.isChatInputCommand()) return;
      
      console.log(`🎯 Command received: /${i.commandName} from ${i.user.tag} in ${i.guild?.name || 'DM'}`);
      
      const cmd = client.commands.get(i.commandName);
      if (!cmd) {
        console.error(`❌ Unknown command: ${i.commandName}`);
        return;
      }
      
      try {
        await cmd.execute(i);
        console.log(`✅ Command /${i.commandName} executed successfully`);
      } catch (error) {
        console.error(`❌ Command /${i.commandName} execution failed:`, error.message);
        console.error(error.stack);
        
        try {
          if (i.deferred || i.replied) {
            await i.editReply('Something went wrong while executing this command.');
          } else {
            await i.reply({ content: 'Something went wrong while executing this command.', ephemeral: true });
          }
        } catch (replyError) {
          console.error('❌ Failed to send error reply:', replyError.message);
        }
      }
    });

    console.log('🔍 Phase 6: Discord Login');
    console.log('🔑 Attempting to log in to Discord...');
    
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Login request sent successfully');

  } catch (error) {
    console.error('💥 FATAL ERROR during bot startup:', error.message);
    console.error('📋 Full error details:', error);
    
    if (error.code === 'TokenInvalid') {
      console.error('🔑 Invalid bot token - check your DISCORD_TOKEN environment variable');
    } else if (error.code === 'DisallowedIntents') {
      console.error('🔒 Missing intents - check your bot configuration in Discord Developer Portal');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Network error - check your internet connection');
    }
    
    process.exit(1);
  }
}

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 [UNHANDLED REJECTION]');
  console.error('📍 Promise:', promise);
  console.error('📋 Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 [UNCAUGHT EXCEPTION]:', error.message);
  console.error('📋 Stack trace:', error.stack);
  console.error('💀 Process will exit due to uncaught exception');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('📡 Received SIGTERM signal');
  console.log('🛑 Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📡 Received SIGINT signal (Ctrl+C)');
  console.log('🛑 Gracefully shutting down...');
  process.exit(0);
});

// Start the bot
console.log('🎬 Starting bot initialization...');
startBot().catch((error) => {
  console.error('💥 Failed to start bot:', error.message);
  console.error('📋 Error details:', error);
  process.exit(1);
});
