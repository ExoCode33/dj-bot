import { Shoukaku, Connectors } from 'shoukaku';
import { cfg } from '../../config/index.js';
import { log } from '../../utils/logger.js';

export function initLavalink(client) {
  // Primary node (your Railway instance) + public backup nodes
  const nodes = [
    // Your Railway instance (primary)
    { 
      name: cfg.lavalink.name, 
      url: cfg.lavalink.url, 
      auth: cfg.lavalink.auth, 
      secure: cfg.lavalink.secure 
    },
    // Public backup nodes with better YouTube access
    {
      name: 'lavalink-public-1',
      url: 'lava-v3.ajieblogs.eu.org:443',
      auth: 'https://dsc.gg/ajidevserver',
      secure: true
    },
    {
      name: 'lavalink-public-2',
      url: 'node-lavalink.ddns.net:2333',
      auth: 'mela-kotak',
      secure: false
    }
  ];

  log.info(`Connecting to ${nodes.length} Lavalink nodes:`);
  nodes.forEach(node => {
    log.info(`- ${node.name}: ${node.url} (secure: ${node.secure})`);
  });

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    reconnectTries: 5,
    restTimeout: 10000,
    reconnectInterval: 5000,
    moveOnDisconnect: true, // Auto-switch to backup when primary fails
    nodeResolver: (nodes) => {
      // Smart node selection: prefer nodes that are connected and working
      const connectedNodes = [...nodes.values()].filter(node => node.connected);
      if (connectedNodes.length === 0) return null;
      
      // Prefer nodes with lower load, but prioritize public nodes for YouTube
      return connectedNodes.sort((a, b) => {
        // Prioritize public nodes that might have better YouTube access
        const aIsPublic = a.name.includes('public');
        const bIsPublic = b.name.includes('public');
        
        if (aIsPublic && !bIsPublic) return -1;
        if (!aIsPublic && bIsPublic) return 1;
        
        // If both are same type, prefer lower load
        const aLoad = a.stats?.cpu?.systemLoad || 0;
        const bLoad = b.stats?.cpu?.systemLoad || 0;
        return aLoad - bLoad;
      })[0];
    }
  });

  // Handle all possible events to prevent unhandled errors
  shoukaku.on('ready', (name) => {
    log.ready(`Lavalink node "${name}" ready`);
    if (name.includes('public')) {
      log.info(`✨ Public node connected - better YouTube access available!`);
    }
  });

  shoukaku.on('error', (name, error) => {
    log.error(`Lavalink node "${name}" error:`, error.message || error);
    // Don't crash the bot, just log the error
  });

  shoukaku.on('disconnect', (name, reason) => {
    log.warn(`Lavalink node "${name}" disconnected:`, reason);
    
    if (name === cfg.lavalink.name) {
      log.info('Primary Railway node down - switching to public backup nodes');
    }
  });

  shoukaku.on('reconnecting', (name, delay) => {
    log.info(`Lavalink node "${name}" reconnecting in ${delay}ms`);
  });

  shoukaku.on('debug', (name, info) => {
    // Only log important debug info to reduce spam
    if (info.includes('ready') || info.includes('connected') || info.includes('error')) {
      log.info(`Lavalink node "${name}" debug:`, info);
    }
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
