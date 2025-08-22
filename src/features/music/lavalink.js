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

  // ✅ ENHANCED: Better connection settings for Railway stability
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    resumeKey: 'uta-dj-bot',  // ✅ ADDED: Custom resume key
    resumeTimeout: 30,         // ✅ ADDED: Resume timeout in seconds
    reconnectTries: 10,        // ✅ INCREASED: More reconnect attempts
    reconnectInterval: 2000,   // ✅ DECREASED: Faster reconnection
    restTimeout: 120000,       // ✅ INCREASED: 2 minutes for slow operations
    moveOnDisconnect: false,   // ✅ ADDED: Don't move players on disconnect
    userAgent: 'UTA-DJ-BOT/1.0.0 (Railway)'  // ✅ ENHANCED: Better user agent
  });

  // ✅ ENHANCED: Better error handling and reconnection logic
  shoukaku.on('ready', (name) => {
    log.ready(`✅ Lavalink node "${name}" ready and stable`);
    
    // ✅ ADDED: Test connection with a simple request
    setTimeout(async () => {
      try {
        const node = shoukaku.nodes.get(name);
        if (node) {
          const info = await node.rest.getInfo();
          log.info(`🎵 Node info: Lavalink v${info.version.semver}, Build: ${info.buildTime}`);
        }
      } catch (error) {
        log.warn(`⚠️ Could not fetch node info: ${error.message}`);
      }
    }, 1000);
  });

  shoukaku.on('error', (name, error) => {
    log.error(`❌ Lavalink node "${name}" error:`, error.message || error);
    
    // ✅ ADDED: Specific error handling
    if (error.code === 'ECONNREFUSED') {
      log.error(`🚫 Connection refused to ${name} - check if Lavalink service is running`);
    } else if (error.code === 'ENOTFOUND') {
      log.error(`🌐 DNS lookup failed for ${name} - check your LAVALINK_URL`);
    } else if (error.code === 1006) {
      log.warn(`🔄 WebSocket closed abnormally for ${name} - will auto-reconnect`);
    }
  });

  shoukaku.on('disconnect', (name, reason) => {
    log.warn(`⚠️ Lavalink node "${name}" disconnected:`, reason);
    
    // ✅ ADDED: More detailed disconnect reasons
    if (reason === 1006) {
      log.info(`🔄 Node "${name}" disconnected abnormally - this is normal on Railway/Heroku`);
      log.info(`🕐 Automatic reconnection will begin shortly...`);
    } else if (reason === 1000) {
      log.info(`✅ Node "${name}" disconnected cleanly`);
    } else {
      log.warn(`❓ Node "${name}" disconnected with code ${reason}`);
    }
  });

  shoukaku.on('reconnecting', (name, delay) => {
    log.info(`🔄 Lavalink node "${name}" reconnecting in ${delay}ms`);
    
    // ✅ ADDED: Countdown for longer delays
    if (delay > 5000) {
      const seconds = Math.round(delay / 1000);
      log.info(`⏳ Reconnection scheduled in ${seconds} seconds...`);
    }
  });

  // ✅ ADDED: Connection established event
  shoukaku.on('debug', (name, info) => {
    // Only log important debug messages to reduce noise
    if (info.includes('Handshake') || info.includes('ready') || info.includes('Resuming')) {
      log.info(`🔧 Lavalink node "${name}":`, info);
    }
  });

  // ✅ ADDED: Raw event handler for detailed monitoring
  shoukaku.on('raw', (name, json) => {
    try {
      const data = JSON.parse(json);
      
      // Log important events
      if (data.op === 'ready') {
        log.ready(`🎵 Node "${name}" is fully operational!`);
      } else if (data.op === 'playerUpdate' && data.state?.connected === false) {
        log.warn(`⚠️ Player disconnected on node "${name}" for guild ${data.guildId}`);
      }
    } catch (error) {
      // Ignore JSON parse errors for raw events
    }
  });

  // ✅ ADDED: Periodic health check
  setInterval(() => {
    const nodes = Array.from(shoukaku.nodes.values());
    const connectedNodes = nodes.filter(node => node.state === 2); // CONNECTED state
    
    if (connectedNodes.length === 0 && nodes.length > 0) {
      log.warn(`⚠️ No Lavalink nodes are currently connected (${nodes.length} total)`);
      nodes.forEach(node => {
        log.warn(`   - ${node.name}: State ${node.state} (0=Connecting, 1=Open, 2=Connected, 3=Reconnecting, 4=Disconnected)`);
      });
    } else if (connectedNodes.length > 0) {
      // Only log this occasionally to avoid spam
      const now = Date.now();
      if (!shoukaku._lastHealthLog || now - shoukaku._lastHealthLog > 300000) { // Every 5 minutes
        log.info(`💚 Health check: ${connectedNodes.length}/${nodes.length} nodes connected`);
        shoukaku._lastHealthLog = now;
      }
    }
  }, 30000); // Check every 30 seconds

  return shoukaku;
}
