// src/features/radio/manager.js - COMPLETELY RETHOUGHT CONNECTION STRATEGY
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    
    // Volume handling
    const rawVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.defaultVolume = Math.max(1, Math.min(200, rawVolume));
    console.log(`🔊 Volume configured: ${this.defaultVolume}% (from DEFAULT_VOLUME=${process.env.DEFAULT_VOLUME})`);
    
    // Connection tracking - NEW APPROACH
    this.persistentConnections = new Map(); // Guild -> { player, voiceChannelId, lastUsed }
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.streamHealthChecks = new Map(); // Guild -> interval
    this.reconnectCooldowns = new Map();
    
    // Stream monitoring for 24/7 reliability
    this.monitoringInterval = null;
    this.startGlobalMonitoring();
    
    console.log('🎵 Enhanced Radio Manager initialized with persistent connection strategy');
  }

  // ================================
  // NEW STRATEGY: PERSISTENT CONNECTIONS
  // Keep players alive even when leaving voice channels
  // ================================

  /**
   * Creates or reuses a persistent player connection
   */
  async getOrCreatePersistentPlayer(guildId, voiceChannelId) {
    console.log(`🔄 Getting/creating persistent player for guild ${guildId}`);
    
    const existing = this.persistentConnections.get(guildId);
    
    // Check if we can reuse existing player
    if (existing && existing.player && !existing.player.destroyed) {
      console.log('♻️ Reusing existing persistent player');
      
      // Update last used time
      existing.lastUsed = Date.now();
      existing.voiceChannelId = voiceChannelId;
      
      // Ensure player is in correct voice channel
      await this.ensurePlayerInVoiceChannel(existing.player, guildId, voiceChannelId);
      
      return existing.player;
    }
    
    // Create new persistent player
    console.log('🆕 Creating new persistent player');
    return await this.createNewPersistentPlayer(guildId, voiceChannelId);
  }

  /**
   * Creates a new persistent player with enhanced error handling
   */
  async createNewPersistentPlayer(guildId, voiceChannelId) {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error('Guild not found');
    
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) throw new Error('Voice channel not found');
    
    // Get best available node
    const node = await this.getBestAvailableNode();
    if (!node) throw new Error('No Lavalink nodes available');
    
    console.log(`🎵 Creating persistent connection via node: ${node.name}`);
    
    let attempts = 0;
    const maxAttempts = 3; // Reduced attempts since we're being smarter
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Persistent connection attempt ${attempts}/${maxAttempts}`);
      
      try {
        // CRITICAL: Always clean up any existing connections first
        await this.forceCleanupGuild(guildId);
        
        // Wait for Discord state to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create the connection using Shoukaku's standard method
        const player = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId,
          deaf: true,
          mute: false
        });
        
        if (!player) {
          throw new Error('Player creation returned null');
        }
        
        // Enhanced verification
        await this.verifyPlayerConnection(player, guild, voiceChannelId);
        
        // Store as persistent connection
        this.persistentConnections.set(guildId, {
          player: player,
          voiceChannelId: voiceChannelId,
          lastUsed: Date.now(),
          created: Date.now(),
          guildId: guildId
        });
        
        // Setup player event handlers for persistence
        this.setupPlayerEventHandlers(player, guildId);
        
        console.log('✅ Persistent player created and stored');
        return player;
        
      } catch (error) {
        console.warn(`❌ Persistent connection attempt ${attempts} failed: ${error.message}`);
        
        if (attempts < maxAttempts) {
          const waitTime = 5000 * attempts;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Set cooldown to prevent rapid retry loops
          this.reconnectCooldowns.set(guildId, Date.now() + 60000); // 1 minute
          throw new Error(`Failed to create persistent connection after ${maxAttempts} attempts: ${error.message}`);
        }
      }
    }
  }

  /**
   * COMPLETE cleanup - removes all traces of guild connections
   */
  async forceCleanupGuild(guildId) {
    console.log(`🧹 FORCE cleaning up ALL connections for guild ${guildId}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    
    try {
      // 1. Clean up our persistent tracking
      const existing = this.persistentConnections.get(guildId);
      if (existing?.player) {
        try {
          if (!existing.player.destroyed) {
            if (existing.player.track) await existing.player.stopTrack();
            await existing.player.destroy();
          }
        } catch (e) {
          console.log('ℹ️ Player cleanup warning (expected):', e.message);
        }
      }
      this.persistentConnections.delete(guildId);
      
      // 2. Clean up Shoukaku's internal player registry
      const shoukakuPlayer = this.client.shoukaku.players.get(guildId);
      if (shoukakuPlayer) {
        try {
          if (!shoukakuPlayer.destroyed) {
            if (shoukakuPlayer.track) await shoukakuPlayer.stopTrack();
            await shoukakuPlayer.destroy();
          }
        } catch (e) {
          console.log('ℹ️ Shoukaku cleanup warning (expected):', e.message);
        }
        this.client.shoukaku.players.delete(guildId);
      }
      
      // 3. Clean up Discord voice connection
      if (guild) {
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          console.log('🔌 Force disconnecting from Discord voice');
          try {
            await botMember.voice.disconnect();
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.log('ℹ️ Discord disconnect warning (expected):', e.message);
          }
        }
      }
      
      console.log('✅ Force cleanup completed');
      
    } catch (error) {
      console.warn('⚠️ Force cleanup had errors (some expected):', error.message);
    }
    
    // Always wait for state to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  /**
   * Verify player connection is actually working
   */
  async verifyPlayerConnection(player, guild, voiceChannelId) {
    console.log('⏳ Verifying player connection...');
    
    let verified = false;
    
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (player.destroyed) {
        throw new Error('Player was destroyed during verification');
      }
      
      if (player.voiceConnection && player.node && player.node.state === 2) {
        const botMember = guild.members.me;
        const inCorrectChannel = botMember?.voice?.channelId === voiceChannelId;
        
        if (inCorrectChannel) {
          verified = true;
          console.log(`✅ Connection verified after ${i + 1} checks`);
          break;
        }
      }
      
      console.log(`⏳ Verification check ${i + 1}/10...`);
    }
    
    if (!verified) {
      throw new Error('Connection verification failed - bot may not be properly connected');
    }
  }

  /**
   * Ensures player is connected to the correct voice channel
   */
  async ensurePlayerInVoiceChannel(player, guildId, targetVoiceChannelId) {
    if (player.destroyed) {
      throw new Error('Cannot move destroyed player');
    }
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) throw new Error('Guild not found');
    
    const botMember = guild.members.me;
    const currentChannelId = botMember?.voice?.channelId;
    
    if (currentChannelId === targetVoiceChannelId) {
      console.log('✅ Player already in correct voice channel');
      return;
    }
    
    console.log(`🚶 Moving player from ${currentChannelId} to ${targetVoiceChannelId}`);
    
    try {
      await botMember.voice.setChannel(targetVoiceChannelId);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newChannelId = guild.members.me?.voice?.channelId;
      if (newChannelId !== targetVoiceChannelId) {
        console.warn(`⚠️ Channel move incomplete: expected ${targetVoiceChannelId}, got ${newChannelId}`);
      } else {
        console.log('✅ Successfully moved to target voice channel');
      }
    } catch (error) {
      throw new Error(`Failed to move to voice channel: ${error.message}`);
    }
  }

  /**
   * Setup event handlers for persistent players
   */
  setupPlayerEventHandlers(player, guildId) {
    console.log(`🔧 Setting up event handlers for guild ${guildId}`);
    
    player.on('end', async (track, reason) => {
      console.log(`🎵 Track ended for guild ${guildId}: ${reason}`);
      
      // For radio streams, we want to restart immediately unless manually stopped
      if (reason !== 'stopped' && reason !== 'cleanup') {
        console.log('🔄 Radio stream ended unexpectedly, attempting restart...');
        await this.handleStreamInterruption(guildId, player);
      }
    });
    
    player.on('stuck', async (track, thresholdMs) => {
      console.warn(`⚠️ Track stuck for guild ${guildId} after ${thresholdMs}ms`);
      await this.handleStreamInterruption(guildId, player);
    });
    
    player.on('exception', async (track, exception) => {
      console.error(`❌ Player exception for guild ${guildId}:`, exception.message);
      await this.handleStreamInterruption(guildId, player);
    });
    
    console.log('✅ Event handlers configured');
  }

  /**
   * Handles stream interruptions with automatic restart
   */
  async handleStreamInterruption(guildId, player) {
    console.log(`🔄 Handling stream interruption for guild ${guildId}`);
    
    const persistent = this.persistentConnections.get(guildId);
    if (!persistent) {
      console.log('ℹ️ No persistent connection found, skipping restart');
      return;
    }
    
    // Find what station was playing by checking our tracking
    // This is better than trying to parse the track info
    const stationKey = persistent.currentStation;
    if (!stationKey) {
      console.log('ℹ️ No station info available, cannot restart');
      return;
    }
    
    // Try to restart the same station
    try {
      console.log(`🎵 Attempting to restart station: ${RADIO_STATIONS[stationKey].name}`);
      
      // Stop current track cleanly
      try {
        await player.stopTrack();
      } catch (e) {
        // Expected
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Restart the station
      await this.playStationOnPlayer(player, stationKey);
      console.log('✅ Stream restart successful');
      
    } catch (restartError) {
      console.error('❌ Stream restart failed:', restartError.message);
      
      // Mark connection as potentially problematic
      persistent.lastError = Date.now();
    }
  }

  /**
   * ================================
   * MAIN STATION SWITCHING METHOD - REDESIGNED
   * ================================
   */
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Station switch: ${stationKey} for guild ${guildId}`);
    
    // Check cooldown
    const cooldownEnd = this.reconnectCooldowns.get(guildId);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      const remainingTime = Math.ceil((cooldownEnd - Date.now()) / 1000);
      throw new Error(`Connection cooling down. Please wait ${remainingTime} more seconds.`);
    }
    
    // Prevent concurrent switches
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    
    try {
      // Get or create persistent player
      const player = await this.getOrCreatePersistentPlayer(guildId, voiceChannelId);
      
      // Set volume
      const actualVolume = await this.setPlayerVolume(player);
      
      // Play the station
      const result = await this.playStationOnPlayer(player, stationKey);
      
      // Update persistent connection with current station
      const connection = this.persistentConnections.get(guildId);
      if (connection) {
        connection.currentStation = stationKey;
        connection.lastUsed = Date.now();
      }
      
      // Setup health monitoring for this stream
      this.setupStreamHealthMonitoring(guildId, stationKey);
      
      result.volume = actualVolume;
      return result;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  /**
   * Play a station on an existing player
   */
  async playStationOnPlayer(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');
    
    console.log(`🎵 Playing ${station.name} on existing player`);
    
    // Stop current track if playing
    if (player.track) {
      await player.stopTrack();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔗 Trying URL: ${url}`);
        
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          console.log(`✅ Successfully started playing ${station.name}`);
          return { success: true, station, url };
        }
      } catch (error) {
        console.warn(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  /**
   * ================================
   * STREAM HEALTH MONITORING - 24/7 RELIABILITY
   * ================================
   */
  
  startGlobalMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('🩺 Starting global stream health monitoring');
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }
  
  async performHealthChecks() {
    if (this.persistentConnections.size === 0) return;
    
    console.log(`🩺 Performing health checks on ${this.persistentConnections.size} connections`);
    
    for (const [guildId, connection] of this.persistentConnections.entries()) {
      try {
        await this.checkConnectionHealth(guildId, connection);
      } catch (error) {
        console.warn(`⚠️ Health check failed for guild ${guildId}: ${error.message}`);
      }
    }
  }
  
  async checkConnectionHealth(guildId, connection) {
    const { player } = connection;
    
    if (!player || player.destroyed) {
      console.warn(`💀 Dead player detected for guild ${guildId}, removing`);
      this.persistentConnections.delete(guildId);
      return;
    }
    
    // Check if player is actually playing
    if (!player.track && connection.currentStation) {
      console.warn(`⚠️ Player not playing expected station for guild ${guildId}`);
      
      // Try to restart the station
      try {
        await this.playStationOnPlayer(player, connection.currentStation);
        console.log(`✅ Restarted station for guild ${guildId}`);
      } catch (error) {
        console.error(`❌ Failed to restart station for guild ${guildId}: ${error.message}`);
      }
    }
    
    // Check node health
    if (!player.node || player.node.state !== 2) {
      console.warn(`⚠️ Player node unhealthy for guild ${guildId}`);
      // The node reconnection will be handled by Shoukaku
      return;
    }
    
    console.log(`✅ Health check passed for guild ${guildId}`);
  }
  
  setupStreamHealthMonitoring(guildId, stationKey) {
    // Clear any existing monitoring
    if (this.streamHealthChecks.has(guildId)) {
      clearInterval(this.streamHealthChecks.get(guildId));
    }
    
    console.log(`🩺 Setting up stream monitoring for ${stationKey} in guild ${guildId}`);
    
    const monitoringInterval = setInterval(async () => {
      try {
        const connection = this.persistentConnections.get(guildId);
        if (!connection || !connection.player || connection.player.destroyed) {
          console.log(`🛑 Stopping monitoring for guild ${guildId} - connection gone`);
          clearInterval(monitoringInterval);
          this.streamHealthChecks.delete(guildId);
          return;
        }
        
        const player = connection.player;
        
        // Check if stream is still playing
        if (!player.track) {
          console.warn(`🔄 Stream stopped for guild ${guildId}, attempting restart`);
          await this.playStationOnPlayer(player, stationKey);
        }
        
      } catch (error) {
        console.error(`❌ Stream monitoring error for guild ${guildId}: ${error.message}`);
      }
    }, 60000); // Check every minute
    
    this.streamHealthChecks.set(guildId, monitoringInterval);
  }

  /**
   * ================================
   * UTILITY METHODS
   * ================================
   */
  
  async setPlayerVolume(player, volume = null) {
    const targetVolume = volume || this.defaultVolume;
    
    try {
      console.log(`🔊 Setting volume to ${targetVolume}%`);
      
      if (targetVolume < 1 || targetVolume > 200) {
        console.error(`❌ Invalid volume: ${targetVolume}%. Using safe default of 35%`);
        await player.setGlobalVolume(35);
        return 35;
      }
      
      await player.setGlobalVolume(targetVolume);
      console.log(`✅ Volume set successfully: ${targetVolume}%`);
      return targetVolume;
      
    } catch (error) {
      console.error(`❌ Failed to set volume:`, error.message);
      return targetVolume;
    }
  }

  async getBestAvailableNode(maxWaitTime = 15000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const nodes = this.client.shoukaku?.nodes;
      
      if (!nodes || nodes.size === 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const connectedNodes = Array.from(nodes.values()).filter(node => node.state === 2);
      
      if (connectedNodes.length > 0) {
        const chosenNode = connectedNodes[0];
        console.log(`✅ Using connected node: ${chosenNode.name}`);
        return chosenNode;
      }
      
      console.log('⏳ Waiting for stable nodes...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.error('❌ No usable nodes available');
    return null;
  }

  async cleanupPersistentConnection(guildId) {
    console.log(`🧹 Cleaning up persistent connection for guild ${guildId}`);
    
    const connection = this.persistentConnections.get(guildId);
    if (connection?.player) {
      try {
        if (!connection.player.destroyed) {
          if (connection.player.track) await connection.player.stopTrack();
          await connection.player.destroy();
        }
      } catch (error) {
        console.warn('⚠️ Cleanup error:', error.message);
      }
    }
    
    this.persistentConnections.delete(guildId);
    
    if (this.streamHealthChecks.has(guildId)) {
      clearInterval(this.streamHealthChecks.get(guildId));
      this.streamHealthChecks.delete(guildId);
    }
    
    console.log(`✅ Persistent connection cleaned up for guild ${guildId}`);
  }

  // Testing method
  async testVolume(guildId, testVolume = 1) {
    const connection = this.persistentConnections.get(guildId);
    const player = connection?.player || this.client.shoukaku.players.get(guildId);
    
    if (!player) {
      throw new Error('No active player found for volume test');
    }
    
    console.log(`🧪 Testing volume: ${testVolume}%`);
    const actualVolume = await this.setPlayerVolume(player, testVolume);
    
    return {
      requested: testVolume,
      actual: actualVolume,
      timestamp: Date.now()
    };
  }

  async getConnectionStatus(guildId) {
    const connection = this.persistentConnections.get(guildId);
    const player = connection?.player;
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    const nodes = this.client.shoukaku?.nodes;
    const nodeStates = nodes ? Array.from(nodes.values()).map(node => ({
      name: node.name,
      state: node.state,
      stateText: ['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'][node.state] || 'UNKNOWN',
      healthy: node.state === 2
    })) : [];
    
    return {
      hasPlayer: !!player,
      hasPersistentConnection: !!connection,
      playerDestroyed: player?.destroyed,
      playerPlaying: !!player?.track,
      currentStation: connection?.currentStation,
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelId: botMember?.voice.channel?.id,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId),
      persistentConnections: this.persistentConnections.size,
      activeHealthChecks: this.streamHealthChecks.size,
      nodes: nodeStates,
      connectedNodes: nodeStates.filter(n => n.healthy).length,
      totalNodes: nodeStates.length,
      defaultVolume: this.defaultVolume,
      lastUsed: connection?.lastUsed,
      connectionAge: connection ? Date.now() - connection.created : null
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down radio manager...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    for (const [guildId, intervalId] of this.streamHealthChecks.entries()) {
      clearInterval(intervalId);
    }
    this.streamHealthChecks.clear();
    
    for (const [guildId] of this.persistentConnections.entries()) {
      await this.cleanupPersistentConnection(guildId);
    }
    
    console.log('✅ Radio manager shutdown complete');
  }
}
