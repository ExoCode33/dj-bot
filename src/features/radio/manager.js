// src/features/radio/manager.js - ENHANCED WITH DORMANT CONNECTION SUPPORT
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    
    // Volume handling
    const rawVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.defaultVolume = Math.max(1, Math.min(200, rawVolume));
    console.log(`🔊 Volume configured: ${this.defaultVolume}% (from DEFAULT_VOLUME=${process.env.DEFAULT_VOLUME})`);
    
    // Connection tracking - ENHANCED FOR DORMANT STATE
    this.persistentConnections = new Map(); // Guild -> { player, voiceChannelId, lastUsed, dormant, currentStation }
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.streamHealthChecks = new Map(); // Guild -> interval
    this.reconnectCooldowns = new Map();
    
    // Recovery system for connection conflicts
    this.recoveryAttempts = new Map(); // Guild -> count
    this.lastRecoveryTime = new Map(); // Guild -> timestamp
    
    // Stream monitoring for 24/7 reliability (paused for dormant connections)
    this.monitoringInterval = null;
    this.startGlobalMonitoring();
    
    // Setup automatic recovery system
    this.setupAutoRecovery();
    
    console.log('🎵 Enhanced Radio Manager initialized with dormant connection support');
    
    // Make manager accessible to client for UI
    this.client.radioManager = this;
  }

  /**
   * Setup automatic recovery system for connection conflicts
   */
  setupAutoRecovery() {
    console.log('🔧 Setting up automatic connection recovery system');
    
    // Recovery interval - runs every 2 minutes
    this.recoveryInterval = setInterval(async () => {
      try {
        await this.performRecoveryCheck();
      } catch (error) {
        console.error('❌ Recovery system error:', error.message);
      }
    }, 120000); // 2 minutes
  }

  /**
   * Perform recovery check for problematic connections
   */
  async performRecoveryCheck() {
    const now = Date.now();
    
    // Check for guilds that have been in cooldown too long
    for (const [guildId, cooldownTime] of this.reconnectCooldowns.entries()) {
      const timeSinceCooldown = now - cooldownTime;
      
      // If cooldown has been active for more than 5 minutes, try recovery
      if (timeSinceCooldown > 300000) {
        console.log(`🔧 Attempting recovery for guild ${guildId} after extended cooldown`);
        await this.attemptConnectionRecovery(guildId);
      }
    }
    
    // Clean up old recovery attempts
    for (const [guildId, lastTime] of this.lastRecoveryTime.entries()) {
      if (now - lastTime > 600000) { // 10 minutes
        this.recoveryAttempts.delete(guildId);
        this.lastRecoveryTime.delete(guildId);
      }
    }
  }

  /**
   * Attempt to recover a problematic connection
   */
  async attemptConnectionRecovery(guildId) {
    const attempts = this.recoveryAttempts.get(guildId) || 0;
    
    if (attempts >= 3) {
      console.log(`⚠️ Max recovery attempts reached for guild ${guildId}`);
      return;
    }
    
    this.recoveryAttempts.set(guildId, attempts + 1);
    this.lastRecoveryTime.set(guildId, Date.now());
    
    console.log(`🔧 Recovery attempt ${attempts + 1}/3 for guild ${guildId}`);
    
    try {
      // Nuclear cleanup with extra steps
      await this.forceCleanupGuild(guildId);
      
      // Wait longer for recovery
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Try to restart the bot's Discord connection for this guild if needed
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        console.log(`🔄 Attempting guild connection refresh for ${guild.name}`);
        
        // Force refresh bot member cache
        try {
          await guild.members.fetch(this.client.user.id, { force: true });
        } catch (e) {
          console.log('ℹ️ Member fetch failed (expected):', e.message);
        }
      }
      
      // Clear cooldown if recovery seems successful
      this.reconnectCooldowns.delete(guildId);
      
      console.log(`✅ Recovery completed for guild ${guildId}`);
      
    } catch (error) {
      console.error(`❌ Recovery failed for guild ${guildId}: ${error.message}`);
      
      // If recovery fails, extend cooldown
      this.reconnectCooldowns.set(guildId, Date.now() + 300000); // 5 more minutes
    }
  }

  // ================================
  // ENHANCED STRATEGY: DORMANT CONNECTIONS
  // Keep Lavalink alive even when Discord voice disconnects
  // ================================

  /**
   * Creates or reuses a persistent player connection
   */
  async getOrCreatePersistentPlayer(guildId, voiceChannelId) {
    console.log(`🔄 Getting/creating persistent player for guild ${guildId}`);
    
    const existing = this.persistentConnections.get(guildId);
    
    // Check if we can reuse existing player (even if dormant)
    if (existing && existing.player && !existing.player.destroyed) {
      console.log(`♻️ Reusing existing persistent player (dormant: ${existing.dormant || false})`);
      
      // Update last used time
      existing.lastUsed = Date.now();
      existing.voiceChannelId = voiceChannelId;
      
      // If it was dormant, reactivate it
      if (existing.dormant) {
        console.log('🚀 Reactivating dormant connection');
        existing.dormant = false;
        
        // Ensure player is in correct voice channel
        await this.ensurePlayerInVoiceChannel(existing.player, guildId, voiceChannelId);
      }
      
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
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔄 Persistent connection attempt ${attempts}/${maxAttempts}`);
      
      try {
        // CRITICAL: Nuclear cleanup before each attempt
        await this.forceCleanupGuild(guildId);
        
        // Standard Shoukaku connection method
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
        
        console.log(`✅ Player created, starting verification...`);
        
        // Enhanced verification with more lenient checks
        await this.verifyPlayerConnection(player, guild, voiceChannelId);
        
        // Store as persistent connection
        this.persistentConnections.set(guildId, {
          player: player,
          voiceChannelId: voiceChannelId,
          lastUsed: Date.now(),
          created: Date.now(),
          guildId: guildId,
          dormant: false, // Initially active
          currentStation: null, // Will be set when playing
          trackInfo: null // For preserving state during dormancy
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
   * NUCLEAR cleanup - removes all traces including deep Shoukaku state
   */
  async forceCleanupGuild(guildId) {
    console.log(`🧹 NUCLEAR cleanup for guild ${guildId}`);
    
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
      
      // 2. Clean up ALL Shoukaku players for this guild
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
      }
      
      // CRITICAL: Force clear from Shoukaku's internal maps
      this.client.shoukaku.players.delete(guildId);
      
      // 3. Deep node cleanup - access internal Shoukaku structures
      const nodes = this.client.shoukaku.nodes;
      if (nodes && nodes.size > 0) {
        for (const [nodeName, node] of nodes) {
          try {
            console.log(`🔧 Deep cleaning node ${nodeName} for guild ${guildId}`);
            
            if (node.players && typeof node.players.delete === 'function') {
              node.players.delete(guildId);
              console.log(`✅ Cleared ${nodeName} players map`);
            }
            
            // Try to send destroy message to node if possible
            if (node.send && typeof node.send === 'function') {
              try {
                await node.send({
                  op: 'destroy',
                  guildId: guildId
                });
                console.log(`✅ Sent destroy command to ${nodeName}`);
              } catch (sendError) {
                console.log(`ℹ️ Could not send destroy to ${nodeName}: ${sendError.message}`);
              }
            }
            
          } catch (nodeError) {
            console.log(`ℹ️ Node ${nodeName} cleanup partial: ${nodeError.message}`);
          }
        }
      }
      
      // 4. Discord voice state nuclear cleanup
      if (guild) {
        const botMember = guild.members.me;
        
        // Multiple disconnect attempts with different methods
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`🔌 Disconnect attempt ${attempt}/2`);
            
            if (botMember?.voice?.channel) {
              if (attempt === 1) {
                await botMember.voice.disconnect();
              } else {
                await botMember.voice.setChannel(null);
              }
              
              console.log(`✅ Disconnect method ${attempt} completed`);
              await new Promise(resolve => setTimeout(resolve, 1500));
            } else {
              console.log(`ℹ️ No voice connection found on attempt ${attempt}`);
              break; // No connection to break
            }
            
          } catch (e) {
            console.log(`ℹ️ Disconnect attempt ${attempt} failed: ${e.message}`);
          }
        }
      }
      
      console.log('✅ Nuclear cleanup completed');
      
    } catch (error) {
      console.warn('⚠️ Nuclear cleanup had errors (some expected):', error.message);
    }
    
    // Extended wait for all systems to settle
    console.log('⏳ Waiting for all systems to settle...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Verify player connection with more lenient checks
   */
  async verifyPlayerConnection(player, guild, voiceChannelId) {
    console.log('⏳ Verifying player connection with lenient checks...');
    
    // Basic checks first
    if (player.destroyed) {
      throw new Error('Player was destroyed during verification');
    }
    
    if (!player.node || player.node.state !== 2) {
      throw new Error('Player node is not in connected state');
    }
    
    let voiceVerified = false;
    let connectionVerified = false;
    
    // Give it more time and be more lenient
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (player.destroyed) {
        throw new Error('Player was destroyed during verification');
      }
      
      // Check if player has a voice connection object
      if (player.voiceConnection) {
        connectionVerified = true;
        console.log(`✅ Voice connection object found on check ${i + 1}`);
      }
      
      // Check if bot is actually in the voice channel
      const botMember = guild.members.me;
      const inCorrectChannel = botMember?.voice?.channelId === voiceChannelId;
      
      if (inCorrectChannel) {
        voiceVerified = true;
        console.log(`✅ Bot in correct voice channel on check ${i + 1}`);
      }
      
      // If we have both, we're good to go
      if (connectionVerified && voiceVerified) {
        console.log(`✅ Full verification passed after ${i + 1} checks`);
        return;
      }
      
      // If we have connection but not voice, that might be OK for some cases
      if (connectionVerified && i >= 5) {
        console.log(`✅ Connection verified but voice state unclear - proceeding anyway`);
        return;
      }
      
      console.log(`⏳ Verification check ${i + 1}/10 (connection: ${connectionVerified}, voice: ${voiceVerified})`);
    }
    
    // Be more lenient - if we have any sign of connection, proceed
    if (connectionVerified) {
      console.log('✅ Connection verified with lenient checks - proceeding');
      return;
    }
    
    // Only fail if we have absolutely no connection signs
    throw new Error('No connection verification possible - player may not be functional');
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
   * Setup event handlers for persistent players with dormant support
   */
  setupPlayerEventHandlers(player, guildId) {
    console.log(`🔧 Setting up event handlers for guild ${guildId}`);
    
    player.on('end', async (track, reason) => {
      console.log(`🎵 Track ended for guild ${guildId}: ${reason}`);
      
      const persistent = this.persistentConnections.get(guildId);
      
      // Skip restart if connection is dormant or manually stopped
      if (persistent?.dormant || reason === 'stopped' || reason === 'cleanup') {
        console.log('ℹ️ Skipping restart - connection dormant or manually stopped');
        return;
      }
      
      // For radio streams, we want to restart immediately
      console.log('🔄 Radio stream ended unexpectedly, attempting restart...');
      await this.handleStreamInterruption(guildId, player);
    });
    
    player.on('stuck', async (track, thresholdMs) => {
      console.warn(`⚠️ Track stuck for guild ${guildId} after ${thresholdMs}ms`);
      
      const persistent = this.persistentConnections.get(guildId);
      if (!persistent?.dormant) {
        await this.handleStreamInterruption(guildId, player);
      }
    });
    
    player.on('exception', async (track, exception) => {
      console.error(`❌ Player exception for guild ${guildId}:`, exception.message);
      
      const persistent = this.persistentConnections.get(guildId);
      if (!persistent?.dormant) {
        await this.handleStreamInterruption(guildId, player);
      }
    });
    
    console.log('✅ Event handlers configured with dormant support');
  }

  /**
   * Handles stream interruptions with automatic restart (unless dormant)
   */
  async handleStreamInterruption(guildId, player) {
    console.log(`🔄 Handling stream interruption for guild ${guildId}`);
    
    const persistent = this.persistentConnections.get(guildId);
    if (!persistent) {
      console.log('ℹ️ No persistent connection found, skipping restart');
      return;
    }
    
    // Don't restart if dormant
    if (persistent.dormant) {
      console.log('ℹ️ Connection is dormant, skipping restart');
      return;
    }
    
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
   * MAIN STATION SWITCHING METHOD - ENHANCED FOR DORMANT STATE
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
      // Get or create persistent player (handles dormant reactivation)
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
        connection.dormant = false; // Ensure it's not dormant when playing
      }
      
      // Setup health monitoring for this stream (unless dormant)
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
   * STREAM HEALTH MONITORING - ENHANCED FOR DORMANT STATE
   * ================================
   */
  
  startGlobalMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    console.log('🩺 Starting global stream health monitoring with dormant support');
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Check every 30 seconds
  }
  
  async performHealthChecks() {
    if (this.persistentConnections.size === 0) return;
    
    const activeConnections = Array.from(this.persistentConnections.entries()).filter(([_, conn]) => !conn.dormant);
    const dormantConnections = Array.from(this.persistentConnections.entries()).filter(([_, conn]) => conn.dormant);
    
    console.log(`🩺 Health check: ${activeConnections.length} active, ${dormantConnections.length} dormant connections`);
    
    // Check active connections
    for (const [guildId, connection] of activeConnections) {
      try {
        await this.checkConnectionHealth(guildId, connection);
      } catch (error) {
        console.warn(`⚠️ Active connection health check failed for guild ${guildId}: ${error.message}`);
      }
    }
    
    // Light check for dormant connections (just verify Lavalink is alive)
    for (const [guildId, connection] of dormantConnections) {
      try {
        await this.checkDormantConnectionHealth(guildId, connection);
      } catch (error) {
        console.warn(`⚠️ Dormant connection health check failed for guild ${guildId}: ${error.message}`);
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
    
    // Check if player is actually playing (only for active connections)
    if (!connection.dormant && !player.track && connection.currentStation) {
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
      return;
    }
    
    console.log(`✅ Health check passed for active connection ${guildId}`);
  }
  
  async checkDormantConnectionHealth(guildId, connection) {
    const { player } = connection;
    
    if (!player || player.destroyed) {
      console.warn(`💀 Dead dormant player detected for guild ${guildId}, removing`);
      this.persistentConnections.delete(guildId);
      return;
    }
    
    // For dormant connections, just verify the Lavalink player is alive
    if (!player.node || player.node.state !== 2) {
      console.warn(`⚠️ Dormant player node unhealthy for guild ${guildId}, cleaning up`);
      this.persistentConnections.delete(guildId);
      return;
    }
    
    // Check how long it's been dormant
    const dormantTime = Date.now() - (connection.lastVoiceDisconnect || connection.lastUsed);
    const maxDormantTime = parseInt(process.env.MAX_DORMANT_TIME) || 3600000; // 1 hour default
    
    if (dormantTime > maxDormantTime) {
      console.log(`💤 Dormant connection for guild ${guildId} expired after ${Math.floor(dormantTime / 1000 / 60)} minutes, cleaning up`);
      await this.cleanupPersistentConnection(guildId);
      return;
    }
    
    console.log(`💤 Dormant connection ${guildId} healthy (dormant for ${Math.floor(dormantTime / 1000 / 60)} minutes)`);
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
        
        // Skip monitoring if dormant
        if (connection.dormant) {
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
   * DORMANT CONNECTION METHODS
   * ================================
   */
  
  /**
   * Mark a connection as dormant (Lavalink alive, Discord voice disconnected)
   */
  async setConnectionDormant(guildId, preserveTrackInfo = true) {
    const connection = this.persistentConnections.get(guildId);
    if (!connection) {
      console.warn(`⚠️ Cannot set dormant: No connection found for guild ${guildId}`);
      return;
    }
    
    console.log(`💤 Setting connection dormant for guild ${guildId}`);
    
    // Preserve current state
    if (preserveTrackInfo && connection.player?.track) {
      connection.trackInfo = {
        position: connection.player.position || 0,
        isPaused: connection.player.paused || false,
        stationKey: connection.currentStation
      };
    }
    
    // Mark as dormant
    connection.dormant = true;
    connection.lastVoiceDisconnect = Date.now();
    
    console.log(`💤 Connection for guild ${guildId} is now dormant`);
  }
  
  /**
   * Reactivate a dormant connection
   */
  async reactivateDormantConnection(guildId, voiceChannelId) {
    const connection = this.persistentConnections.get(guildId);
    if (!connection || !connection.dormant) {
      console.warn(`⚠️ Cannot reactivate: No dormant connection found for guild ${guildId}`);
      return false;
    }
    
    console.log(`🚀 Reactivating dormant connection for guild ${guildId}`);
    
    try {
      // Reconnect to Discord voice
      await this.ensurePlayerInVoiceChannel(connection.player, guildId, voiceChannelId);
      
      // Mark as active
      connection.dormant = false;
      connection.voiceChannelId = voiceChannelId;
      connection.lastUsed = Date.now();
      
      // Resume playback if needed
      if (connection.trackInfo && connection.currentStation) {
        console.log(`🎵 Resuming playback: ${connection.currentStation}`);
        
        // If track stopped during dormancy, restart it
        if (!connection.player.track) {
          await this.playStationOnPlayer(connection.player, connection.currentStation);
        }
      }
      
      console.log(`✅ Dormant connection reactivated for guild ${guildId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to reactivate dormant connection for guild ${guildId}: ${error.message}`);
      return false;
    }
  }

  /**
   * ================================
   * UTILITY METHODS - ENHANCED
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

  async getConnectionStatus(guildId = null) {
    if (guildId) {
      // Get status for specific guild
      const connection = this.persistentConnections.get(guildId);
      const player = connection?.player;
      const guild = this.client.guilds.cache.get(guildId);
      const botMember = guild?.members.cache.get(this.client.user.id);
      
      return {
        hasPlayer: !!player,
        hasPersistentConnection: !!connection,
        playerDestroyed: player?.destroyed,
        playerPlaying: !!player?.track,
        currentStation: connection?.currentStation,
        isDormant: connection?.dormant || false,
        inVoiceChannel: !!botMember?.voice.channel,
        voiceChannelId: botMember?.voice.channel?.id,
        voiceChannelName: botMember?.voice.channel?.name,
        isSwitching: this.switchingStations.has(guildId),
        lastUsed: connection?.lastUsed,
        connectionAge: connection ? Date.now() - connection.created : null,
        dormantSince: connection?.lastVoiceDisconnect
      };
    }
    
    // Get global status
    const nodes = this.client.shoukaku?.nodes;
    const nodeStates = nodes ? Array.from(nodes.values()).map(node => ({
      name: node.name,
      state: node.state,
      stateText: ['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'][node.state] || 'UNKNOWN',
      healthy: node.state === 2
    })) : [];
    
    const totalConnections = this.persistentConnections.size;
    const dormantConnections = Array.from(this.persistentConnections.values()).filter(conn => conn.dormant).length;
    const activeConnections = totalConnections - dormantConnections;
    
    return {
      persistentConnections: totalConnections,
      activeConnections: activeConnections,
      dormantConnections: dormantConnections,
      activeHealthChecks: this.streamHealthChecks.size,
      switchingStations: this.switchingStations.size,
      nodes: nodeStates,
      connectedNodes: nodeStates.filter(n => n.healthy).length,
      totalNodes: nodeStates.length,
      defaultVolume: this.defaultVolume,
      cooldownGuilds: this.reconnectCooldowns.size
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down enhanced radio manager...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.recoveryInterval) {
      clearInterval(this.recoveryInterval);
    }
    
    for (const [guildId, intervalId] of this.streamHealthChecks.entries()) {
      clearInterval(intervalId);
    }
    this.streamHealthChecks.clear();
    
    for (const [guildId] of this.persistentConnections.entries()) {
      await this.cleanupPersistentConnection(guildId);
    }
    
    // Clear recovery tracking
    this.recoveryAttempts.clear();
    this.lastRecoveryTime.clear();
    this.reconnectCooldowns.clear();
    
    console.log('✅ Enhanced radio manager shutdown complete');
  }
}
