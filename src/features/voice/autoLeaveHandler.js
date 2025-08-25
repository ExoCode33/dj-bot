// src/features/voice/autoLeaveHandler.js - ENHANCED FOR PERSISTENT CONNECTIONS
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
   * BUT KEEPS THE PERSISTENT CONNECTION ALIVE
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

        console.log(`👋 Leaving voice channel "${voiceChannel.name}" - no real users remaining`);
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
   * NEW STRATEGY: Only leave voice channel, keep persistent connection alive
   * This solves the "This guild already have an existing connection" error
   */
  async leaveVoiceChannelOnly(guildId) {
    console.log(`🚪 Leaving voice channel but maintaining persistent connection for guild ${guildId}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`❌ Guild ${guildId} not found for voice leave`);
      return;
    }

    try {
      // STEP 1: Only disconnect from Discord voice - DON'T destroy the player
      const botMember = guild.members.me;
      const currentVoiceChannel = botMember?.voice?.channel;
      
      if (currentVoiceChannel) {
        console.log(`🔌 Disconnecting from Discord voice channel: "${currentVoiceChannel.name}"`);
        
        try {
          await botMember.voice.disconnect();
          console.log(`✅ Successfully left "${currentVoiceChannel.name}"`);
          
          // Wait for Discord to process the disconnection
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verify disconnection
          const stillConnected = guild.members.me?.voice?.channel;
          if (stillConnected) {
            console.warn(`⚠️ Bot still appears connected, attempting force disconnect`);
            await botMember.voice.setChannel(null);
          }
          
        } catch (disconnectError) {
          console.error('❌ Error disconnecting from Discord voice:', disconnectError.message);
          
          // Try alternative method
          try {
            await botMember.voice.setChannel(null);
          } catch (altError) {
            console.error('❌ Alternative disconnect also failed:', altError.message);
          }
        }
      } else {
        console.log(`ℹ️ Bot not in any voice channel for guild ${guild.name}`);
      }
      
      // STEP 2: Keep the persistent connection alive but mark it as "dormant"
      const status = await this.radioManager.getConnectionStatus(guildId);
      if (status.hasPersistentConnection) {
        console.log(`✅ Keeping persistent connection alive for guild ${guildId}`);
        console.log(`🎵 Music will resume automatically when users rejoin`);
        
        // The persistent connection stays alive, ready for instant reconnection
      }
      
      // STEP 3: Update UI but don't clear tracking (connection is still alive)
      if (this.updatePersistentMessage) {
        try {
          await this.updatePersistentMessage();
          console.log(`📻 Updated persistent radio message`);
        } catch (updateError) {
          console.warn('⚠️ Failed to update persistent message:', updateError.message);
        }
      }

      console.log(`✅ Voice leave completed for guild ${guildId} - persistent connection maintained`);
      
    } catch (error) {
      console.error(`❌ Voice leave error for guild ${guildId}:`, error.message);
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
   * Enhanced voice state update handler
   */
  async handleVoiceStateUpdate(oldState, newState) {
    try {
      // Skip if the bot itself is changing state (prevents loops)
      if (oldState.member?.id === this.client.user.id || newState.member?.id === this.client.user.id) {
        return;
      }

      const guild = oldState.guild || newState.guild;
      const botMember = guild.members.me;
      
      // Check if bot has a persistent connection (even if not in voice)
      const status = await this.radioManager.getConnectionStatus(guild.id);
      const hasActiveConnection = status.hasPersistentConnection && status.currentStation;
      
      // If no active connection, nothing to manage
      if (!hasActiveConnection) {
        return;
      }

      console.log(`🔄 Voice update for guild with active connection: ${guild.name}`);

      // Find which voice channel we should be monitoring
      let targetVoiceChannel = null;
      
      // If bot is currently in voice, use that channel
      if (botMember?.voice?.channel) {
        targetVoiceChannel = botMember.voice.channel;
      } else {
        // Bot not in voice but has persistent connection
        // Check if users are joining a channel where we should be
        if (newState.channelId && !oldState.channelId) {
          // User joined a channel - if we have a connection for this guild,
          // we might want to rejoin
          const channelTheyJoined = newState.channel;
          if (channelTheyJoined && this.hasRealUsers(channelTheyJoined)) {
            console.log(`👥 User joined "${channelTheyJoined.name}" - attempting to rejoin with persistent connection`);
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
        // No real users - schedule voice leave (but keep connection)
        if (!this.leaveTimers.has(guild.id)) {
          console.log(`🚪 No real users in "${updatedChannel.name}", scheduling voice leave`);
          this.scheduleLeave(guild.id, updatedChannel);
        }
      }

    } catch (error) {
      console.error('❌ Enhanced auto-leave handler error:', error.message);
    }
  }

  /**
   * Rejoin voice channel with existing persistent connection
   */
  async rejoinWithPersistentConnection(guildId, voiceChannelId) {
    try {
      console.log(`🔄 Attempting to rejoin voice with persistent connection for guild ${guildId}`);
      
      const status = await this.radioManager.getConnectionStatus(guildId);
      if (!status.hasPersistentConnection || !status.currentStation) {
        console.log('ℹ️ No persistent connection to rejoin with');
        return;
      }
      
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) return;
      
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      if (!voiceChannel) return;
      
      // Use the radio manager to reconnect to voice
      await this.radioManager.ensurePlayerInVoiceChannel(
        status.player, 
        guildId, 
        voiceChannelId
      );
      
      console.log(`✅ Successfully rejoined "${voiceChannel.name}" with persistent connection`);
      console.log(`🎵 Continuing to play: ${status.currentStation}`);
      
      // Update tracking
      this.currentlyPlaying.set(guildId, {
        stationKey: status.currentStation,
        stationName: RADIO_STATIONS[status.currentStation]?.name || 'Unknown',
        voiceChannelId: voiceChannelId,
        startedAt: Date.now() // Reset start time for UI
      });
      
      // Update UI
      if (this.updatePersistentMessage) {
        await this.updatePersistentMessage();
      }
      
    } catch (error) {
      console.error('❌ Failed to rejoin with persistent connection:', error.message);
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
            console.log(`🚪 Startup: No real users in "${voiceChannel.name}", leaving voice but keeping connection`);
            await this.leaveVoiceChannelOnly(guildId);
          } else {
            console.log(`✅ Startup: Real users found in "${voiceChannel.name}", staying connected`);
          }
        } else {
          console.log(`ℹ️ Persistent connection exists but not in voice for ${guild.name} - this is normal`);
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
   * Gets enhanced status information
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

    return {
      enabled: true,
      strategy: 'persistent-connection',
      activeLeaveTimers: this.leaveTimers.size,
      leaveDelay: this.leaveDelay,
      leaveDelaySeconds: this.leaveDelay / 1000,
      guildsWithTimers: timers,
      totalGuilds: this.client.guilds.cache.size,
      persistentConnections: this.radioManager?.persistentConnections?.size || 0,
      description: 'Leaves voice channels when empty but maintains persistent audio connections for instant rejoin'
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
