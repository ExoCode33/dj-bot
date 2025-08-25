// src/features/voice/autoLeaveHandler.js - ENHANCED FOR DORMANT LAVALINK CONNECTIONS
import { RADIO_STATIONS } from '../../config/stations.js';

export class AutoLeaveHandler {
  constructor(client, radioManager, currentlyPlaying, updatePersistentMessage) {
    this.client = client;
    this.radioManager = radioManager;
    this.currentlyPlaying = currentlyPlaying;
    this.updatePersistentMessage = updatePersistentMessage;
    this.leaveTimers = new Map(); // Track delayed leave timers
    this.leaveDelay = parseInt(process.env.AUTO_LEAVE_DELAY) || 30000; // 30 seconds default
    
    console.log(`🚪 Enhanced AutoLeaveHandler initialized with ${this.leaveDelay / 1000}s delay`);
  }

  /**
   * Checks if a voice channel has any real users (non-bots)
   */
  hasRealUsers(voiceChannel) {
    if (!voiceChannel) return false;
    
    const realUsers = voiceChannel.members.filter(member => !member.user.bot);
    const bots = voiceChannel.members.filter(member => member.user.bot);
    
    console.log(`👥 Channel "${voiceChannel.name}": ${realUsers.size} real users, ${bots.size} bots`);
    
    return realUsers.size > 0;
  }

  /**
   * Schedules the bot to leave a voice channel after a delay
   * KEEPS LAVALINK CONNECTION ALIVE IN DORMANT STATE
   */
  scheduleLeave(guildId, voiceChannel) {
    // Clear any existing timer for this guild
    if (this.leaveTimers.has(guildId)) {
      console.log(`⏰ Clearing existing leave timer for guild ${guildId}`);
      clearTimeout(this.leaveTimers.get(guildId));
    }

    console.log(`⏰ Scheduling voice leave in ${this.leaveDelay / 1000}s for channel "${voiceChannel.name}"`);
    
    const timer = setTimeout(async () => {
      try {
        // Double-check that there are still no real users
        const currentChannel = this.client.channels.cache.get(voiceChannel.id);
        if (!currentChannel || this.hasRealUsers(currentChannel)) {
          console.log(`✅ Users returned to "${voiceChannel.name}", canceling leave`);
          this.leaveTimers.delete(guildId);
          return;
        }

        console.log(`👋 Leaving voice channel "${voiceChannel.name}" but keeping Lavalink alive`);
        await this.leaveVoiceChannelOnly(guildId);
        
      } catch (error) {
        console.error('❌ Auto-leave error:', error.message);
      } finally {
        this.leaveTimers.delete(guildId);
      }
    }, this.leaveDelay);

    this.leaveTimers.set(guildId, timer);
  }

  /**
   * NEW STRATEGY: Only leave Discord voice channel, keep Lavalink connection in dormant state
   */
  async leaveVoiceChannelOnly(guildId) {
    console.log(`🚪 Smart bot: Disconnecting from Discord voice but keeping Lavalink alive for guild ${guildId}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) return;

    try {
      // STEP 1: Get the current Lavalink player (keep it alive)
      const player = this.client.shoukaku.players.get(guildId);
      const persistent = this.radioManager.persistentConnections.get(guildId);
      
      if (player && persistent) {
        console.log(`🔄 Preserving Lavalink player for guild ${guildId}`);
        
        // Mark the connection as "dormant" (not in Discord voice but Lavalink alive)
        persistent.dormant = true;
        persistent.lastVoiceDisconnect = Date.now();
        
        // Keep track of what's playing
        if (player.track) {
          persistent.trackInfo = {
            position: player.position || 0,
            isPaused: player.paused || false
          };
          console.log(`💾 Saved track state: position=${persistent.trackInfo.position}ms`);
        }
        
        console.log(`💤 Connection marked as dormant - Lavalink stays alive`);
      }
      
      // STEP 2: ONLY disconnect from Discord voice (don't destroy Lavalink player)
      const botMember = guild.members.me;
      if (botMember?.voice?.channel) {
        const channelName = botMember.voice.channel.name;
        console.log(`🔌 Disconnecting from Discord voice channel: "${channelName}"`);
        
        try {
          // Method 1: Standard disconnect
          await botMember.voice.disconnect();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verify disconnection
          if (guild.members.me?.voice?.channel) {
            console.log('🔄 Using alternative disconnect method...');
            await botMember.voice.setChannel(null);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          console.log(`✅ Successfully disconnected from "${channelName}"`);
          
        } catch (disconnectError) {
          console.error('❌ Discord voice disconnect error:', disconnectError.message);
          
          // Fallback: Raw WebSocket disconnect
          try {
            const shard = guild.shard;
            if (shard?.send) {
              await shard.send({
                op: 4, // VOICE_STATE_UPDATE
                d: {
                  guild_id: guildId,
                  channel_id: null,
                  self_mute: false,
                  self_deaf: false
                }
              });
              console.log('✅ Raw WebSocket disconnect sent');
            }
          } catch (rawError) {
            console.error('❌ Raw disconnect failed:', rawError.message);
          }
        }
      }
      
      // STEP 3: Update UI but DON'T clear currentlyPlaying (connection still alive)
      console.log(`💤 Guild ${guildId} is now dormant (Lavalink alive, Discord voice disconnected)`);
      
      // Update persistent message to show "dormant" status
      if (this.updatePersistentMessage) {
        await this.updatePersistentMessage();
      }
      
      console.log(`✅ Smart bot voice disconnect completed - Lavalink connection preserved`);
      
    } catch (error) {
      console.error(`❌ Smart bot voice disconnect error: ${error.message}`);
    }
  }

  /**
   * Enhanced rejoin method that reuses existing Lavalink connection
   */
  async rejoinWithPersistentConnection(guildId, voiceChannelId) {
    try {
      console.log(`🔄 Smart bot: Rejoining Discord voice with existing Lavalink connection for guild ${guildId}`);
      
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;
      
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      if (!voiceChannel) return;
      
      // Check if we have a dormant Lavalink connection
      const persistent = this.radioManager.persistentConnections.get(guildId);
      const player = this.client.shoukaku.players.get(guildId);
      
      if (!persistent || !player || !persistent.dormant) {
        console.log('ℹ️ No dormant Lavalink connection found, creating fresh connection');
        return await this.createFreshConnection(guildId, voiceChannelId);
      }
      
      console.log(`🔄 Reusing dormant Lavalink player for "${voiceChannel.name}"`);
      
      // STEP 1: Reconnect to Discord voice ONLY
      try {
        const botMember = guild.members.me;
        await botMember.voice.setChannel(voiceChannelId);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify connection
        const connectedChannelId = guild.members.me?.voice?.channelId;
        if (connectedChannelId !== voiceChannelId) {
          throw new Error(`Voice connection verification failed: expected ${voiceChannelId}, got ${connectedChannelId}`);
        }
        
        console.log(`✅ Successfully reconnected to "${voiceChannel.name}"`);
        
      } catch (voiceError) {
        console.error('❌ Discord voice reconnection failed:', voiceError.message);
        // Fall back to fresh connection
        return await this.createFreshConnection(guildId, voiceChannelId);
      }
      
      // STEP 2: Reactivate the dormant Lavalink player
      try {
        // Mark as no longer dormant
        persistent.dormant = false;
        persistent.voiceChannelId = voiceChannelId;
        persistent.lastUsed = Date.now();
        
        // Resume playback if it was paused
        if (persistent.trackInfo?.isPaused === false && player.track) {
          console.log('🎵 Resuming playback from dormant state');
          // Player should continue playing automatically
        } else if (!player.track && persistent.currentStation) {
          console.log('🎵 Restarting station from dormant state');
          await this.radioManager.playStationOnPlayer(player, persistent.currentStation);
        }
        
        // Update tracking
        this.currentlyPlaying.set(guildId, {
          stationKey: persistent.currentStation,
          stationName: RADIO_STATIONS[persistent.currentStation]?.name || 'Unknown',
          voiceChannelId: voiceChannelId,
          startedAt: persistent.lastVoiceDisconnect || Date.now() // Keep original start time
        });
        
        console.log(`✅ Lavalink player reactivated successfully`);
        console.log(`🎵 Continuing: ${persistent.currentStation}`);
        
      } catch (reactivationError) {
        console.error('❌ Lavalink reactivation failed:', reactivationError.message);
        // Fall back to fresh connection
        return await this.createFreshConnection(guildId, voiceChannelId);
      }
      
      // STEP 3: Update UI
      if (this.updatePersistentMessage) {
        await this.updatePersistentMessage();
      }
      
      console.log(`✅ Smart bot successfully rejoined with preserved Lavalink connection`);
      
    } catch (error) {
      console.error('❌ Smart bot rejoin failed:', error.message);
      // Ultimate fallback
      await this.createFreshConnection(guildId, voiceChannelId);
    }
  }

  /**
   * Fallback method for fresh connections
   */
  async createFreshConnection(guildId, voiceChannelId) {
    console.log(`🆕 Creating fresh connection for guild ${guildId}`);
    
    try {
      // Get what station should be playing
      const persistent = this.radioManager.persistentConnections.get(guildId);
      const stationKey = persistent?.currentStation;
      
      if (!stationKey) {
        console.log('ℹ️ No station info available for fresh connection');
        return;
      }
      
      // Create completely new connection
      const result = await this.radioManager.switchToStation(guildId, stationKey, voiceChannelId);
      
      // Update tracking
      this.currentlyPlaying.set(guildId, {
        stationKey: stationKey,
        stationName: RADIO_STATIONS[stationKey]?.name || 'Unknown',
        voiceChannelId: voiceChannelId,
        startedAt: Date.now()
      });
      
      console.log(`✅ Fresh connection created and playing ${stationKey}`);
      
    } catch (error) {
      console.error('❌ Fresh connection creation failed:', error.message);
    }
  }

  /**
   * COMPLETE shutdown - destroys everything (used for manual stop)
   */
  async completeShutdown(guildId) {
    console.log(`🛑 Complete shutdown for guild ${guildId}`);
    
    // Cancel any pending leave
    this.cancelScheduledLeave(guildId);
    
    // Clean up persistent connection
    await this.radioManager.cleanupPersistentConnection(guildId);
    
    // Clean up tracking
    this.currentlyPlaying.delete(guildId);
    
    // Update UI
    if (this.updatePersistentMessage) {
      await this.updatePersistentMessage();
    }
    
    console.log(`✅ Complete shutdown finished for guild ${guildId}`);
  }

  /**
   * Cancels a scheduled leave for a guild
   */
  cancelScheduledLeave(guildId) {
    if (this.leaveTimers.has(guildId)) {
      console.log(`❌ Canceling scheduled leave for guild ${guildId} - users joined`);
      clearTimeout(this.leaveTimers.get(guildId));
      this.leaveTimers.delete(guildId);
    }
  }

  /**
   * Enhanced voice state update handler with dormant connection support
   */
  async handleVoiceStateUpdate(oldState, newState) {
    try {
      // Skip if the bot itself is changing state (prevents loops)
      if (oldState.member?.id === this.client.user.id || newState.member?.id === this.client.user.id) {
        return;
      }

      const guild = oldState.guild || newState.guild;
      const botMember = guild.members.me;
      
      // Check if bot has a persistent connection (active or dormant)
      const status = await this.radioManager.getConnectionStatus(guild.id);
      const hasActiveConnection = status.hasPersistentConnection && status.currentStation;
      
      // If no active connection, nothing to manage
      if (!hasActiveConnection) {
        return;
      }

      console.log(`🔄 Voice update for guild with connection (dormant: ${status.isDormant || false}): ${guild.name}`);

      // Find which voice channel we should be monitoring
      let targetVoiceChannel = null;
      
      // If bot is currently in voice, use that channel
      if (botMember?.voice?.channel) {
        targetVoiceChannel = botMember.voice.channel;
      } else {
        // Bot not in voice but has persistent connection (probably dormant)
        // Check if users are joining a channel where we should be
        if (newState.channelId && !oldState.channelId) {
          // User joined a channel - if we have a dormant connection, try to rejoin
          const channelTheyJoined = newState.channel;
          if (channelTheyJoined && this.hasRealUsers(channelTheyJoined)) {
            console.log(`👥 User joined "${channelTheyJoined.name}" - attempting to rejoin with dormant connection`);
            await this.rejoinWithPersistentConnection(guild.id, channelTheyJoined.id);
            return;
          }
        }
      }

      if (!targetVoiceChannel) {
        return; // Nothing to monitor
      }

      // Check if this voice state change affects our monitored channel
      const isRelevantUpdate = (
        oldState.channelId === targetVoiceChannel.id || 
        newState.channelId === targetVoiceChannel.id
      );

      if (!isRelevantUpdate) {
        return;
      }

      console.log(`🔄 Voice update affecting monitored channel "${targetVoiceChannel.name}"`);

      // Add a small delay to let Discord settle the voice state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-fetch the voice channel to get updated member list
      const updatedChannel = this.client.channels.cache.get(targetVoiceChannel.id);
      
      if (!updatedChannel) {
        console.warn(`⚠️ Could not re-fetch voice channel ${targetVoiceChannel.id}`);
        return;
      }

      // Check if the monitored channel has real users
      if (this.hasRealUsers(updatedChannel)) {
        // Users present - cancel any scheduled leave
        this.cancelScheduledLeave(guild.id);
      } else {
        // No real users - schedule voice leave (but keep Lavalink connection dormant)
        if (!this.leaveTimers.has(guild.id)) {
          console.log(`🚪 No real users in "${updatedChannel.name}", scheduling voice leave (Lavalink stays alive)`);
          this.scheduleLeave(guild.id, updatedChannel);
        }
      }

    } catch (error) {
      console.error('❌ Enhanced auto-leave handler error:', error.message);
    }
  }

  /**
   * Startup check - handles existing connections
   */
  async performStartupCheck() {
    console.log('🔍 Performing enhanced startup auto-leave check...');
    
    try {
      const status = await this.radioManager.getConnectionStatus();
      
      if (status.persistentConnections === 0) {
        console.log('ℹ️ No persistent connections found during startup check');
        return;
      }

      console.log(`🔍 Found ${status.persistentConnections} persistent connection(s) to check`);
      
      // Get all guilds with persistent connections
      for (const guildId of this.radioManager.persistentConnections.keys()) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
          console.log(`⚠️ Guild ${guildId} not found, cleaning up connection`);
          await this.radioManager.cleanupPersistentConnection(guildId);
          continue;
        }

        const botMember = guild.members.me;
        const voiceChannel = botMember?.voice?.channel;
        
        if (voiceChannel) {
          console.log(`🔍 Checking voice channel "${voiceChannel.name}" in ${guild.name}`);
          
          if (!this.hasRealUsers(voiceChannel)) {
            console.log(`🚪 Startup: No real users in "${voiceChannel.name}", going dormant`);
            await this.leaveVoiceChannelOnly(guildId);
          } else {
            console.log(`✅ Startup: Real users found in "${voiceChannel.name}", staying connected`);
          }
        } else {
          console.log(`ℹ️ Persistent connection exists but not in voice for ${guild.name} - checking if dormant`);
          const persistent = this.radioManager.persistentConnections.get(guildId);
          if (persistent && !persistent.dormant) {
            // Connection exists but not in voice and not marked dormant - mark it dormant
            persistent.dormant = true;
            persistent.lastVoiceDisconnect = Date.now();
            console.log(`💤 Marked connection as dormant for ${guild.name}`);
          }
        }

        // Add delay between checks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Enhanced startup auto-leave check completed');
      
    } catch (error) {
      console.error('❌ Enhanced startup auto-leave check error:', error.message);
    }
  }

  /**
   * Gets enhanced status information including dormant connections
   */
  getStatus() {
    const timers = Array.from(this.leaveTimers.entries()).map(([guildId, timer]) => {
      const guild = this.client.guilds.cache.get(guildId);
      return {
        guildId,
        guildName: guild?.name || 'Unknown',
        timerId: 'Active'
      };
    });

    // Count dormant connections
    let dormantConnections = 0;
    if (this.radioManager?.persistentConnections) {
      for (const [guildId, connection] of this.radioManager.persistentConnections.entries()) {
        if (connection.dormant) dormantConnections++;
      }
    }

    return {
      enabled: true,
      strategy: 'dormant-lavalink-connections',
      activeLeaveTimers: this.leaveTimers.size,
      leaveDelay: this.leaveDelay,
      leaveDelaySeconds: this.leaveDelay / 1000,
      guildsWithTimers: timers,
      totalGuilds: this.client.guilds.cache.size,
      persistentConnections: this.radioManager?.persistentConnections?.size || 0,
      dormantConnections: dormantConnections,
      activeConnections: (this.radioManager?.persistentConnections?.size || 0) - dormantConnections,
      description: 'Leaves Discord voice when empty but keeps Lavalink connections alive in dormant state for instant reconnection'
    };
  }

  /**
   * Emergency cleanup - forces complete shutdown
   */
  async emergencyCleanup() {
    console.log('🚨 Enhanced emergency cleanup triggered');
    
    try {
      // Clear all timers
      for (const [guildId, timer] of this.leaveTimers) {
        clearTimeout(timer);
        console.log(`🧹 Cleared timer for guild ${guildId}`);
      }
      this.leaveTimers.clear();

      // Use radio manager's shutdown
      if (this.radioManager) {
        await this.radioManager.shutdown();
      }

      // Clear our tracking
      this.currentlyPlaying.clear();

      console.log('✅ Enhanced emergency cleanup completed');
      
    } catch (error) {
      console.error('❌ Enhanced emergency cleanup error:', error.message);
    }
  }
}
