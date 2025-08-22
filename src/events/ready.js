import { getClient } from '../core/registry.js';
import { log } from '../utils/logger.js';
import { Events } from 'discord.js';

const client = await getClient();

// ✅ FIXED: Use Events.ClientReady enum instead of string to avoid deprecation warning
client.once(Events.ClientReady, () => {
  log.ready(`Logged in as ${client.user.tag}`);
});
