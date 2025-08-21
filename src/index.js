import 'dotenv/config';
import { createClient } from './core/client.js';
import { log } from './utils/logger.js';
import { cfg } from './config/index.js';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startBot() {
  console.log('🚀 Starting Uta DJ Bot...');

  // Validate required environment variables
  const requiredEnvVars = [
    'DISCORD_TOKEN',
    'CLIENT_ID',
    'LAVALINK_URL',
    'LAVALINK_AUTH'
  ];

  console.log('🔍 Checking environment variables...');
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ All required environment variables found');

  // Log configuration (without sensitive data)
  console.log('📋 Bot configuration:');
  console.log(`- Client ID: ${cfg.discord.clientId}`);
  console.log(`- Guild ID: ${cfg.discord.guildId || 'Global commands'}`);
  console.log(`- Lavalink URL: ${cfg.lavalink.url}`);
  console.log(`- Lavalink Secure: ${cfg.lavalink.secure}`);
  console.log(`- Default Volume: ${cfg.uta.defaultVolume}`);

  console.log('🤖 Creating Discord client...');
  const client = createClient();

  // Load commands directly here
  console.log('📂 Loading commands...');
  const commandsDir = path.join(__dirname, 'commands');
  console.log(`📁 Commands directory: ${commandsDir}`);
  
  if (!fs.existsSync(commandsDir)) {
    console.error('❌ Commands directory does not exist!');
    process.exit(1);
  }

  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
  console.log(`📄 Found ${files.length} command files:`, files);

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
      console.error(`❌ Error loading command file ${f}:`, error);
    }
  }

  console.log(`📋 Total commands loaded: ${slashDefs.length}`);
  console.log(`🎯 Command names: ${slashDefs.map(cmd => cmd.name).join(', ')}`);

  // Register commands directly
  console.log('⚡ Registering slash commands...');
  try {
    const rest = new REST({ version: '10' }).setToken(cfg.discord.token);

    if (cfg.discord.guildId) {
      console.log(`🎯 Registering to guild: ${cfg.discord.guildId}`);
      await rest.put(Routes.applicationGuildCommands(cfg.discord.clientId, cfg.discord.guildId), { body: slashDefs });
      console.log('✅ Registered GUILD commands.');
    } else {
      console.log('🌍 Registering global commands...');
      await rest.put(Routes.applicationCommands(cfg.discord.clientId), { body: slashDefs });
      console.log('✅ Registered GLOBAL commands.');
    }
    console.log('✅ Slash commands registered successfully');
  } catch (error) {
    console.error('❌ Slash registration failed:', error.message);
    if (error.code === 50001) {
      console.error('Missing Access - Check your bot permissions');
    }
  }

  console.log('📝 Loading events...');
  // Register events
  await import('./events/ready.js');
  await import('./events/interactionCreate.js');

  console.log('🔑 Logging in to Discord...');
  // Enhanced error handling for login
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Login successful');
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (error.code === 'TokenInvalid') {
      console.error('Invalid bot token - check your DISCORD_TOKEN');
    }
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit for Shoukaku/Lavalink errors, just log them
  if (error.code === 'ERR_UNHANDLED_ERROR' && error.context) {
    console.error(`Lavalink connection error for node: ${error.context}`);
    console.error('Bot will continue running without music functionality until Lavalink connects.');
    return; // Don't exit
  }
  process.exit(1);
});

// Start the bot
startBot().catch((error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});
