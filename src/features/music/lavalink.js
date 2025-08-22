// src/features/music/lavalink.js
import { Shoukaku, Connectors } from 'shoukaku';
import { cfg } from '../../config/index.js';
import { log } from '../../utils/logger.js';

export function initLavalink(client) {
  const nodes = [
    { 
      name: cfg.lavalink.name, 
      url: cfg.lavalink.url, 
      auth: cfg.lavalink.auth, 
      secure: cfg.lavalink.secure 
    }
  ];

  log.info(`Connecting to Lavalink: ${cfg.lavalink.url} (secure: ${cfg.lavalink.secure})`);

  // FIXED: Increased timeouts to handle slow searches
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    reconnectTries: 5,
    restTimeout: 60000,        // ✅ INCREASED: 60 seconds instead of 10
    reconnectInterval: 5000,
    userAgent: 'UTA-DJ-BOT/1.0.0' // ✅ ADDED: Custom user agent
  });

  // Handle all possible events to prevent unhandled errors
  shoukaku.on('ready', (name) => {
    log.ready(`Lavalink node "${name}" ready`);
  });

  shoukaku.on('error', (name, error) => {
    log.error(`Lavalink node "${name}" error:`, error.message || error);
  });

  shoukaku.on('disconnect', (name, reason) => {
    log.warn(`Lavalink node "${name}" disconnected:`, reason);
  });

  shoukaku.on('reconnecting', (name, delay) => {
    log.info(`Lavalink node "${name}" reconnecting in ${delay}ms`);
  });

  shoukaku.on('debug', (name, info) => {
    log.info(`Lavalink node "${name}" debug:`, info);
  });

  return shoukaku;
}
