import 'dotenv/config';
import { createClient } from './core/client.js';
import { registerSlash } from './core/registry.js';
import { log } from './utils/logger.js';

const client = createClient();

// Register events
import './events/ready.js';
import './events/interactionCreate.js';

registerSlash(client).catch((e) => log.error('Slash registration failed:', e));

client.login(process.env.DISCORD_TOKEN);
