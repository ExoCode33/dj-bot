import 'dotenv/config';
import { createClient } from './core/client.js';
import { registerSlash } from './core/registry.js';
import { log } from './utils/logger.js';
import { cfg } from './config/index.js';

console.log('🚀 Starting Uta DJ Bot...');

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

console.log('🤖 Creating Discord client...');
const client = createClient();

console.log('📝 Loading events...');
// Register events
import('./events/ready.js');
import('./events/interactionCreate.js');

console.log('⚡ Registering slash commands...');

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

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});
