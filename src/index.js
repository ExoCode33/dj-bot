import 'dotenv/config';
import { createClient } from './core/client.js';
import { registerSlash } from './core/registry.js';
import { log } from './utils/logger.js';
import { cfg } from './config/index.js';

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

  console.log('📝 Loading events...');
  // Register events
  await import('./events/ready.js');
  await import('./events/interactionCreate.js');

  // Wait for command loading to complete
  console.log('⏳ Waiting for commands to load...');
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log('⚡ Registering slash commands...');
  // Enhanced error handling for slash command registration
  registerSlash(client)
    .then(() => console.log('✅ Slash commands registered successfully'))
    .catch((error) => {
      console.error('❌ Slash registration failed:', error.message);
      if (error.code === 50001) {
        console.error('Missing Access - Check your bot permissions');
      }
    });

  console.log('🔑 Logging in to Discord...');
  // Enhanced error handling for login
  client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('✅ Login successful'))
    .catch((error) => {
      console.error('❌ Login failed:', error.message);
      if (error.code === 'TokenInvalid') {
        console.error('Invalid bot token - check your DISCORD_TOKEN');
      }
      process.exit(1);
    });
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit for Lavalink connection errors
  if (reason && reason.code !== 'ERR_UNHANDLED_ERROR') {
    process.exit(1);
  }
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
