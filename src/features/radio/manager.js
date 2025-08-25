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
    
    // Recovery system for connection conflicts
    this.recoveryAttempts = new Map(); // Guild -> count
    this.lastRecoveryTime = new Map(); // Guild -> timestamp
    
    // Stream monitoring for 24/7 reliability
    this.monitoringInterval = null;
    this.startGlobalMonitoring();
    
    // Setup automatic recovery system
    this.setupAutoRecovery();
    
    console.log('🎵 Enhanced Radio Manager initialized with persistent connection strategy');
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
        
        // Clear any potential voice connection remnants
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          try {
            await botMember.voice.disconnect();
            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (e) {
            console.log('ℹ️ Recovery disconnect failed (expected):', e.message);
          }
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
   * Creates a new persistent player with enhanced error handling and fallback methods
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
        
        let player;
        
        // Try different connection methods based on attempt number
        if (attempts <= 2) {
          // Standard method
          console.log('🔗 Using standard Shoukaku connection method');
          player = await this.client.shoukaku.joinVoiceChannel({
            guildId: guildId,
            channelId: voiceChannelId,
            shardId: guild.shardId,
            deaf: true,
            mute: false
          });
        } else {
          // Fallback method - create player more directly
          console.log('🔗 Using fallback connection method');
          player = await this.createPlayerWithFallbackMethod(guildId, voiceChannelId, guild, node);
        }
        
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
   * Fallback connection method - tries to create connection more directly
   */
  async createPlayerWithFallbackMethod(guildId, voiceChannelId, guild, node) {
    console.log('🔧 Attempting fallback connection method');
    
    try {
      // Method 1: Try to create player directly through the node
      const connectionOptions = {
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      };
      
      // Direct node connection attempt
      if (node.joinVoiceChannel && typeof node.joinVoiceChannel === 'function') {
        console.log('🔗 Trying direct node connection...');
        const player = await node.joinVoiceChannel(connectionOptions);
        if (player) {
          console.log('✅ Direct node connection successful');
          return player;
        }
      }
      
      // Method 2: Manual Discord voice connection + Shoukaku player
      console.log('🔗 Trying manual voice connection...');
      
      // First, manually connect to Discord voice
      const botMember = guild.members.me;
      await botMember.voice.setChannel(voiceChannelId);
      
      // Wait for voice connection to establish
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verify we're in the channel
      const connectedChannelId = guild.members.me?.voice?.channelId;
      if (connectedChannelId !== voiceChannelId) {
        throw new Error('Manual voice connection failed');
      }
      
      // Now try to create Shoukaku player for existing connection
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId,
        deaf: true,
        mute: false
      });
      
      if (player) {
        console.log('✅ Manual connection method successful');
        return player;
      }
      
      throw new Error('All fallback methods failed');
      
    } catch (error) {
      console.error('❌ Fallback connection method failed:', error.message);
      throw error;
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
      
      // 2. Clean up ALL Shoukaku players for this guild (from all possible locations)
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
            
            // Multiple approaches to clear node state
            if (node.players && typeof node.players.delete === 'function') {
              node.players.delete(guildId);
              console.log(`✅ Cleared ${nodeName} players map`);
            }
            
            // Try to access internal connection state
            if (node.connection) {
              if (node.connection.players && typeof node.connection.players.delete === 'function') {
                node.connection.players.delete(guildId);
                console.log(`✅ Cleared ${nodeName} connection players`);
              }
              
              // Try to clear any guild-specific connection state
              if (node.connection.guildConnections && typeof node.connection.guildConnections.delete === 'function') {
                node.connection.guildConnections.delete(guildId);
                console.log(`✅ Cleared ${nodeName} guild connections`);
              }
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
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`🔌 Disconnect attempt ${attempt}/3`);
            
            if (botMember?.voice?.channel) {
              if (attempt === 1) {
                await botMember.voice.disconnect();
              } else if (attempt === 2) {
                await botMember.voice.setChannel(null);
              } else {
                // Force via raw WebSocket if available
                const shard = guild.shard;
                if (shard && shard.send) {
                  await shard.send({
                    op: 4, // VOICE_STATE_UPDATE
                    d: {
                      guild_id: guildId,
                      channel_id: null,
                      self_mute: false,
                      self_deaf: false
                    }
                  });
                  console.log(`✅ Sent raw voice state update`);
                }
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
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Final verification
    const stillExists = this.client.shoukaku.players.has(guildId);
    const stillInVoice = guild?.members.me?.voice?.channel;
    
    console.log(`🔍 Final state: Player=${stillExists}, Voice=${!!stillInVoice}`);
    
    if (stillExists || stillInVoice) {
      console.warn('⚠️ Some cleanup may be incomplete, but proceeding...');
    }
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
    for (let i = 0; i < 15; i++) {
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
      if (connectionVerified && i >= 8) {
        console.log(`✅ Connection verified but voice state unclear - proceeding anyway`);
        return;
      }
      
      console.log(`⏳ Verification check ${i + 1}/15 (connection: ${connectionVerified}, voice: ${voiceVerified})`);
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
