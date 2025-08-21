import { getClient } from '../core/registry.js';
import { log } from '../utils/logger.js';

const client = await getClient();

client.once('ready', () => {
  log.ready(`Logged in as ${client.user.tag}`);
});
