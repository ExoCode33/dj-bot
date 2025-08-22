import { Shoukaku, Connectors } from 'shoukaku';
import { cfg } from '../../config/index.js';
import { log } from '../../utils/logger.js';

export function initLavalink(client) {
  // Build nodes array with primary + backups
  const nodes = [
    {
      name: cfg.lavalink.primary.name,
      url: cfg.lavalink.primary.url,
      auth: cfg.lavalink.primary.auth,
      secure: cfg.lavalink.primary.secure
    }
  ];

  // Add backup nodes if primary fails
  if (cfg.lavalink.backup) {
    nodes.push(...cfg.lavalink.backup.map(backup => ({
      name: backup.name,
      url: backup.url,
      auth: backup.auth,
      secure: backup.secure
    })));
  }

  log.info(`Connecting to ${nodes.length} Lavalink nodes:`);
  nodes.forEach(node => {
    log.info(`- ${node.name}: ${node.url} (secure: ${node.secure})`);
  });

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    reconnectTries: 5,
    restTimeout: 10000,
    reconnectInterval: 5000,
    moveOnDisconnect: true, // Auto-switch to backup nodes
    nodeResolver: (nodes) => {
      // Prefer nodes that are connected and have low load
      const connectedNodes = [...nodes.values()].filter(node => node.connected);
      if (connectedNodes.length === 0) return null;
      
      // Sort by stats (prefer lower load)
      return connectedNodes.sort((a, b) => {
        const aLoad = a.stats?.cpu?.systemLoad || 0;
        const bLoad = b.stats?.cpu?.systemLoad || 0;
        return aLoad - bLoad;
      })[0];
    }
  });

  // Handle all possible events to prevent unhandled errors
  shoukaku.on('ready', (name) => {
    log.ready(`Lavalink node "${name}" ready`);
  });

  shoukaku.on('error', (name, error) => {
    log.error(`Lavalink node "${name}" error:`, error.message || error);
    // Don't crash the bot, just log the error
  });

  shoukaku.on('disconnect', (name, reason) => {
    log.warn(`Lavalink node "${name}" disconnected:`, reason);
    
    // Try to reconnect to backup if primary fails
    if (name === cfg.lavalink.primary.name) {
      log.info('Primary node down, backup nodes will handle requests');
    }
  });

  shoukaku.on('reconnecting', (name, delay) => {
    log.info(`Lavalink node "${name}" reconnecting in ${delay}ms`);
  });

  shoukaku.on('debug', (name, info) => {
    log.info(`Lavalink node "${name}" debug:`, info);
  });

  // Catch any unhandled Shoukaku errors
  shoukaku.on('raw', () => {}); // Prevent raw event errors
  
  // Handle node-specific errors
  shoukaku.nodes.forEach(node => {
    if (node) {
      node.on('error', (error) => {
        log.error(`Node error:`, error.message || error);
      });
    }
  });

  return shoukaku;
}
