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

  log.info(`🎵 Connecting to Lavalink: ${cfg.lavalink.url} (secure: ${cfg.lavalink.secure})`);

  // Enhanced connection settings for Railway stability and HTTP stream support
  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    resumeKey: process.env.LAVALINK_RESUME_KEY || 'uta-dj-bot-railway',
    resumeTimeout: parseInt(process.env.LAVALINK_RESUME_TIMEOUT) || 60,
    reconnectTries: 15,           // Increased for Railway reliability
    reconnectInterval: 2000,      // 2 seconds between attempts
    restTimeout: 180000,          // 3 minutes for slow HTTP streams
    moveOnDisconnect: false,      // Keep players on disconnect
    userAgent: 'UTA-DJ-BOT/1.0.0 (Railway; +https://github.com/lavalink-devs/Lavalink)',
    // Additional options for HTTP stream compatibility
    structures: {
      // Custom player structure for better HTTP stream handling
      player: class extends shoukaku.Player {
        constructor(...args) {
          super(...args);
          this.httpStreamRetries = 0;
          this.maxHttpRetries = 3;
        }
        
        async playTrack(options, noReplace) {
          try {
            return await super.playTrack(options, noReplace);
          } catch (error) {
            // Retry logic for HTTP streams
            if (error.message.includes('Unable to connect') && this.httpStreamRetries < this.maxHttpRetries) {
              this.httpStreamRetries++;
              log.warn(`🔄 HTTP stream retry ${this.httpStreamRetries}/${this.maxHttpRetries} for track`);
              await new Promise(resolve => setTimeout(resolve, 1000 * this.httpStreamRetries));
              return this.playTrack(options, noReplace);
            }
            throw error;
          }
        }
      }
    }
  });

  // Enhanced event handlers with better HTTP stream support
  shoukaku.on('ready', (name) => {
    log.ready(`✅ Lavalink node "${name}" ready and stable`);
    global.lavalinkConnected = true;
    global.lavalinkNodes = shoukaku.nodes.size;
    
    // Test HTTP stream capability
    setTimeout(async () => {
      try {
        const node = shoukaku.nodes.get(name);
        if (node && node.rest) {
          // Test node info endpoint (updated method)
          try {
            const stats = await node.rest.getStats();
            log.info(`📊 Node stats: Players: ${stats.playingPlayers}/${stats.players}, Memory: ${Math.round(stats.memory.used / 1024 / 1024)}MB`);
          } catch (statsError) {
            log.warn(`⚠️ Could not fetch node stats: ${statsError.message}`);
          }
          
          // Test HTTP stream capability with a simple HTTP URL
          try {
            const testResult = await node.rest.resolve('http://ice1.somafm.com/groovesalad-256-mp3');
            if (testResult.loadType !== 'error') {
              log.info(`✅ HTTP stream support confirmed`);
            } else {
              log.warn(`⚠️ HTTP stream test failed: ${testResult.exception?.message || 'Unknown error'}`);
            }
          } catch (httpTestError) {
            log.warn(`⚠️ HTTP stream test error: ${httpTestError.message}`);
          }
        }
      } catch (error) {
        log.warn(`⚠️ Node initialization test failed: ${error.message}`);
      }
    }, 2000);
  });

  shoukaku.on('error', (name, error) => {
    log.error(`❌ Lavalink node "${name}" error:`, error.message || error);
    global.lavalinkConnected = false;
    
    // Enhanced error handling
    if (error.code === 'ECONNREFUSED') {
      log.error(`🚫 Connection refused to ${name} - check if Lavalink service is running`);
      log.error(`🔧 Lavalink URL: ${cfg.lavalink.url}`);
    } else if (error.code === 'ENOTFOUND') {
      log.error(`🌐 DNS lookup failed for ${name} - check your LAVALINK_URL`);
      log.error(`🔧 Current URL: ${cfg.lavalink.url}`);
    } else if (error.code === 1006) {
      log.warn(`🔄 WebSocket closed abnormally for ${name} - will auto-reconnect`);
    } else if (error.code === 4004) {
      log.error(`🔑 Authentication failed for ${name} - check LAVALINK_AUTH`);
    } else if (error.code === 1011) {
      log.error(`🔧 Lavalink server error - check Lavalink service logs`);
    }
  });

  shoukaku.on('disconnect', (name, reason) => {
    log.warn(`⚠️ Lavalink node "${name}" disconnected:`, reason);
    global.lavalinkConnected = false;
    
    // More detailed disconnect reasons
    const reasonMap = {
      1000: 'Normal closure',
      1001: 'Going away',
      1006: 'Abnormal closure (common on Railway/Heroku)',
      1011: 'Server error',
      4004: 'Authentication failed',
      4009: 'Session timeout'
    };
    
    const reasonText = reasonMap[reason] || `Unknown (${reason})`;
    log.info(`📋 Disconnect reason: ${reasonText}`);
    
    if (reason === 1006) {
      log.info(`🔄 Abnormal disconnect is normal on Railway - automatic reconnection will begin`);
    } else if (reason === 4004) {
      log.error(`🔑 Check your LAVALINK_AUTH environment variable`);
    }
  });

  shoukaku.on('reconnecting', (name, delay, tries) => {
    log.info(`🔄 Lavalink node "${name}" reconnecting in ${delay}ms (attempt ${tries})`);
    global.lavalinkConnected = false;
    
    // Log progress for longer delays
    if (delay > 5000) {
      const seconds = Math.round(delay / 1000);
      log.info(`⏳ Reconnection attempt ${tries} scheduled in ${seconds} seconds...`);
    }
  });

  // Enhanced debug logging for troubleshooting
  shoukaku.on('debug', (name, info) => {
    // Log important debug messages for connection issues
    if (info.includes('Handshake') || 
        info.includes('ready') || 
        info.includes('Resuming') ||
        info.includes('WebSocket') ||
        info.includes('HTTP')) {
      log.info(`🔧 Lavalink "${name}": ${info}`);
    }
  });

  // Enhanced raw event handler for HTTP stream monitoring
  shoukaku.on('raw', (name, json) => {
    try {
      const data = JSON.parse(json);
      
      // Log important events
      if (data.op === 'ready') {
        log.ready(`🎵 Node "${name}" is fully operational!`);
        log.info(`🔧 Session ID: ${data.sessionId || 'Unknown'}`);
        log.info(`🔧 Resume key: ${data.resumed ? 'Resumed' : 'New session'}`);
      } else if (data.op === 'stats') {
        // Periodically log performance stats
        const stats = data;
        if (stats.players > 0) {
          log.info(`📊 Node "${name}": ${stats.playingPlayers}/${stats.players} players, ${Math.round(stats.memory.used / 1024 / 1024)}MB RAM`);
        }
      } else if (data.op === 'playerUpdate') {
        const state = data.state;
        if (!state.connected) {
          log.warn(`⚠️ Player disconnected on node "${name}" for guild ${data.guildId}`);
        }
        // Log HTTP stream issues
        if (state.time === 0 && state.position === 0) {
          log.warn(`⚠️ Potential HTTP stream issue detected for guild ${data.guildId}`);
        }
      } else if (data.op === 'event') {
        // Enhanced event logging for HTTP streams
        if (data.type === 'TrackStartEvent') {
          const track = data.track;
          if (track && track.info && track.info.uri && track.info.uri.startsWith('http://')) {
            log.info(`📻 HTTP stream started: ${track.info.title || 'Unknown'} from ${track.info.uri}`);
          }
        } else if (data.type === 'TrackEndEvent') {
          if (data.reason === 'loadFailed') {
            log.error(`❌ Track load failed for guild ${data.guildId}: ${data.reason}`);
          }
        } else if (data.type === 'TrackExceptionEvent') {
          log.error(`❌ Track exception for guild ${data.guildId}: ${data.exception?.message || 'Unknown error'}`);
          
          // Special handling for HTTP stream errors
          if (data.exception?.message?.includes('Unable to connect') ||
              data.exception?.message?.includes('Connection reset') ||
              data.exception?.message?.includes('Read timed out')) {
            log.warn(`🔄 HTTP stream connection issue detected - this is common with internet radio`);
          }
        } else if (data.type === 'WebSocketClosedEvent') {
          log.warn(`🔌 Voice connection closed for guild ${data.guildId}: ${data.reason} (code: ${data.code})`);
        }
      }
    } catch (error) {
      // Ignore JSON parse errors for raw events
    }
  });

  // Enhanced periodic health check with HTTP stream monitoring
  setInterval(() => {
    const nodes = Array.from(shoukaku.nodes.values());
    const connectedNodes = nodes.filter(node => node.state === 2); // CONNECTED state
    const players = Array.from(shoukaku.players.values());
    const httpStreamPlayers = players.filter(player => 
      player.track?.info?.uri?.startsWith('http://') || 
      player.track?.info?.uri?.startsWith('https://')
    );
    
    if (connectedNodes.length === 0 && nodes.length > 0) {
      log.warn(`⚠️ No Lavalink nodes are currently connected (${nodes.length} total)`);
      nodes.forEach(node => {
        const stateNames = ['Connecting', 'Open', 'Connected', 'Reconnecting', 'Disconnected'];
        const stateName = stateNames[node.state] || `Unknown(${node.state})`;
        log.warn(`   - ${node.name}: ${stateName}`);
      });
    } else if (connectedNodes.length > 0) {
      // Update global status
      global.lavalinkConnected = true;
      global.lavalinkNodes = connectedNodes.length;
      
      // Only log detailed status occasionally to avoid spam
      const now = Date.now();
      if (!shoukaku._lastHealthLog || now - shoukaku._lastHealthLog > 300000) { // Every 5 minutes
        log.info(`💚 Health check: ${connectedNodes.length}/${nodes.length} nodes connected`);
        if (players.length > 0) {
          log.info(`🎵 Active players: ${players.length} (${httpStreamPlayers.length} HTTP streams)`);
        }
        shoukaku._lastHealthLog = now;
      }
    }
  }, 30000); // Check every 30 seconds

  return shoukaku;
}
