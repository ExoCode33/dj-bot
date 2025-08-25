// src/features/voice/autoLeaveHandler.js - COMPLETE FIXED VERSION
export class AutoLeaveHandler {
  constructor(client, radioManager, currentlyPlaying, updatePersistentMessage) {
    this.client = client;
    this.radioManager = radioManager;
    this.currentlyPlaying = currentlyPlaying;
    this.updatePersistentMessage = updatePersistentMessage;
    this.leaveTimers = new Map(); // Track delayed leave timers
    this.leaveDelay = parseInt(process.env.AUTO_LEAVE_DELAY) || 30000; // 30 seconds default
    
    console.log(`🚪 AutoLeaveHandler initialized with ${this.leaveDelay / 1000}s delay`);
  }

  /**
   * Checks if a voice channel has any real users (non-bots)
   * @param {VoiceChannel} voiceChannel - The voice channel to check
   * @returns {boolean} - True if there are real users, false if only bots
   */
  hasRealUsers(voiceChannel) {
    if (!voiceChannel) return false;
    
    const realUsers = voiceChannel.members.filter(member => !member.user.bot);
    const bots = voiceChannel.members.filter(member => member.user.bot);
    
    console.log(`👥 Channel "${voiceChannel.name}": ${realUsers.size} real users, ${bots.size} bots`);
    
    // Debug: Show who's in the channel
    if (realUsers.size > 0) {
      console.log(`👤 Real users: ${realUsers.map(u => u.user.username).join(', ')}`);
    }
    if (bots.size > 0) {
      console.log(`🤖 Bots: ${bots.map(u => u.user.username).join(', ')}`);
    }
    
    return realUsers.size > 0;
  }

  /**
   * Schedules the bot to leave a voice channel after a delay
   * @param {string} guildId - Guild ID
   * @param {VoiceChannel} voiceChannel - Voice channel to leave
   */
  scheduleLeave(guildId, voiceChannel) {
    // Clear any existing timer for this guild
    if (this.leaveTimers.has(guildId)) {
      console.log(`⏰ Clearing existing leave timer for guild ${guildId}`);
      clearTimeout(this.leaveTimers.get(guildId));
    }

    console.log(`⏰ Scheduling auto-leave in ${this.leaveDelay / 1000}s for channel "${voiceChannel.name}"`);
    
    const timer = setTimeout(async () => {
      try {
        // Double-check that there are still no real users
        const currentChannel = this.client.channels.cache.get(voiceChannel.id);
        if (!currentChannel || this.hasRealUsers(currentChannel)) {
          console.log(`✅ Users returned to "${voiceChannel.name}", canceling auto-leave`);
          this.leaveTimers.delete(guildId);
          return;
        }

        console.log(`👋 Auto-leaving "${voiceChannel.name}" - no real users remaining`);
        await this.leaveVoiceChannel(guildId);
        
      } catch (error) {
        console.error('❌ Auto-leave error:', error.message);
      } finally {
        this.leaveTimers.delete(guildId);
      }
    }, this.leaveDelay);

    this.leaveTimers.set(guildId, timer);
  }

  /**
   * Cancels a scheduled leave for a guild
   * @param {string} guildId - Guild ID
   */
  cancelScheduledLeave(guildId) {
    if (this.leaveTimers.has(guildId)) {
      console.log(`❌ Canceling scheduled leave for guild ${guildId} - users joined`);
      clearTimeout(this.leaveTimers.get(guildId));
      this.leaveTimers.delete(guildId);
    }
  }

  /**
   * FIXED: Actually leaves the voice channel completely
   * @param {string} guildId - Guild ID
   */
  async leaveVoiceChannel(guildId) {
    console.log(`🚪 Starting complete voice channel exit for guild ${guildId}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`❌ Guild ${guildId} not found for voice leave`);
      this.currentlyPlaying.delete(guildId);
      return;
    }

    // STEP 1: Stop and destroy Lavalink player
    const player = this.client.shoukaku.players.get(guildId);
    if (player) {
      try {
        console.log(`🎵 Stopping music for guild ${guildId}`);
        
        if (player.track) {
          await player.stopTrack();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log(`🔌 Destroying Lavalink player for guild ${guildId}`);
        await player.destroy();
        this.client.shoukaku.players.delete(guildId);
        
        console.log(`✅ Lavalink player cleaned up for guild ${guildId}`);
        
      } catch (error) {
        console.error('❌ Error cleaning up Lavalink player:', error.message);
        // Force cleanup even if there's an error
        this.client.shoukaku.players.delete(guildId);
      }
    } else {
      console.log(`ℹ️ No Lavalink player found for guild ${guildId}`);
    }

    // STEP 2: CRITICAL - Actually disconnect from Discord voice channel
    try {
      const botMember = guild.members.me;
      const currentVoiceChannel = botMember?.voice?.channel;
      
      if (currentVoiceChannel) {
        console.log(`🔌 Disconnecting bot from Discord voice channel: "${currentVoiceChannel.name}"`);
        
        // Method 1: Direct disconnect (most reliable)
        await botMember.voice.disconnect();
        console.log(`✅ Successfully disconnected from "${currentVoiceChannel.name}"`);
        
        // Wait a moment for Discord to process the disconnection
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify disconnection
        const stillConnected = guild.members.me?.voice?.channel;
        if (stillConnected) {
          console.warn(`⚠️ Bot still appears connected to "${stillConnected.name}", attempting force disconnect`);
          
          // Method 2: Force disconnect via setChannel(null)
          try {
            await botMember.voice.setChannel(null);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Final verification
            const finalCheck = guild.members.me?.voice?.channel;
            if (finalCheck) {
              console.error(`❌ Bot still connected to "${finalCheck.name}" after force disconnect`);
            } else {
              console.log(`✅ Force disconnect successful`);
            }
          } catch (forceError) {
            console.error('❌ Force disconnect failed:', forceError.message);
          }
        } else {
          console.log(`✅ Verified: Bot successfully left voice channel`);
        }
        
      } else {
        console.log(`ℹ️ Bot not in any voice channel for guild ${guild.name}`);
      }
      
    } catch (disconnectError) {
      console.error('❌ Error disconnecting from Discord voice:', disconnectError.message);
      
      // FALLBACK: Try alternative disconnect methods
      try {
        console.log(`🔄 Attempting fallback disconnect method...`);
        const botMember = guild.members.me;
        
        if (botMember?.voice?.channel) {
          // Try setChannel(null) as fallback
          await botMember.voice.setChannel(null);
          
          // Check if it worked
          await new Promise(resolve => setTimeout(resolve, 1000));
          const checkChannel = guild.members.me?.voice?.channel;
          
          if (checkChannel) {
            console.error('❌ All disconnect methods failed - bot may appear stuck');
            console.error('⚠️ Manual intervention or bot restart may be required');
          } else {
            console.log(`✅ Fallback disconnect successful`);
          }
        }
      } catch (fallbackError) {
        console.error('❌ All disconnect methods failed:', fallbackError.message);
        console.error('⚠️ Bot may appear stuck in voice channel until restart');
      }
    }

    // STEP 3: Clean up tracking data
    this.currentlyPlaying.delete(guildId);
    console.log(`🗑️ Cleaned up tracking data for guild ${guildId}`);
    
    // STEP 4: Update persistent radio message
    if (this.updatePersistentMessage) {
      try {
        await this.updatePersistentMessage();
        console.log(`📻 Updated persistent radio message`);
      } catch (updateError) {
        console.warn('⚠️ Failed to update persistent message:', updateError.message);
      }
    }

    console.log(`✅ Complete voice channel exit finished for guild ${guildId} (${guild.name})`);
  }

  /**
   * Handles voice state updates for auto-leave logic
   * @param {VoiceState} oldState - Previous voice state
   * @param {VoiceState} newState - New voice state
   */
  async handleVoiceStateUpdate(oldState, newState) {
    try {
      // Skip if the bot itself is changing state (prevents loops)
      if (oldState.member?.id === this.client.user.id || newState.member?.id === this.client.user.id) {
        return;
      }

      const guild = oldState.guild || newState.guild;
      const botMember = guild.members.me;
      const botVoiceChannel = botMember?.voice?.channel;

      // Only process if the bot is in a voice channel
      if (!botVoiceChannel) {
        return;
      }

      // Check if this voice state change affects the bot's channel
      const isRelevantUpdate = (
        oldState.channelId === botVoiceChannel.id || 
        newState.channelId === botVoiceChannel.id
      );

      if (!isRelevantUpdate) {
        return;
      }

      console.log(`🔄 Voice update affecting bot's channel "${botVoiceChannel.name}"`);

      // Add a small delay to let Discord settle the voice state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Re-fetch the voice channel to get updated member list
      const updatedChannel = this.client.channels.cache.get(botVoiceChannel.id);
      
      if (!updatedChannel) {
        console.warn(`⚠️ Could not re-fetch voice channel ${botVoiceChannel.id}`);
        return;
      }

      // Check if the bot's current channel has real users
      if (this.hasRealUsers(updatedChannel)) {
        // Users present - cancel any scheduled leave
        this.cancelScheduledLeave(guild.id);
      } else {
        // No real users - schedule leave (unless already scheduled)
        if (!this.leaveTimers.has(guild.id)) {
          console.log(`🚪 No real users in "${updatedChannel.name}", scheduling auto-leave`);
          this.scheduleLeave(guild.id, updatedChannel);
        } else {
          console.log(`⏰ Auto-leave already scheduled for "${updatedChannel.name}"`);
        }
      }

    } catch (error) {
      console.error('❌ Auto-leave handler error:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Performs initial check when bot starts - leaves channels with no users
   */
  async performStartupCheck() {
    console.log('🔍 Performing startup auto-leave check...');
    
    try {
      const players = this.client.shoukaku.players;
      
      if (!players || players.size === 0) {
        console.log('ℹ️ No active players found during startup check');
        return;
      }

      console.log(`🔍 Found ${players.size} active player(s) to check`);
      
      for (const [guildId, player] of players) {
        const guild = this.client.guilds.cache.get(guildId);
        if (!guild) {
          console.log(`⚠️ Guild ${guildId} not found, cleaning up player`);
          await this.leaveVoiceChannel(guildId);
          continue;
        }

        const botMember = guild.members.me;
        const voiceChannel = botMember?.voice?.channel;
        
        if (!voiceChannel) {
          console.log(`⚠️ Bot not in voice channel for guild ${guild.name}, cleaning up player`);
          await this.leaveVoiceChannel(guildId);
          continue;
        }

        console.log(`🔍 Checking voice channel "${voiceChannel.name}" in ${guild.name}`);
        
        if (!this.hasRealUsers(voiceChannel)) {
          console.log(`🚪 Startup: No real users in "${voiceChannel.name}" (${guild.name}), leaving immediately`);
          await this.leaveVoiceChannel(guildId);
        } else {
          console.log(`✅ Startup: Real users found in "${voiceChannel.name}" (${guild.name}), staying`);
        }

        // Add delay between checks to avoid overwhelming Discord API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      console.log('✅ Startup auto-leave check completed');
      
    } catch (error) {
      console.error('❌ Startup auto-leave check error:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }

  /**
   * Gets status information for debugging
   */
  getStatus() {
    const timers = Array.from(this.leaveTimers.entries()).map(([guildId, timer]) => {
      const guild = this.client.guilds.cache.get(guildId);
      return {
        guildId,
        guildName: guild?.name || 'Unknown',
        timerId: timer[Symbol.toPrimitive] || 'Active'
      };
    });

    return {
      enabled: true,
      activeTimers: this.leaveTimers.size,
      leaveDelay: this.leaveDelay,
      leaveDelaySeconds: this.leaveDelay / 1000,
      guildsWithTimers: timers,
      totalGuilds: this.client.guilds.cache.size,
      activePlayers: this.client.shoukaku?.players?.size || 0
    };
  }

  /**
   * Manual trigger for testing (use in debug commands)
   */
  async manualLeave(guildId) {
    console.log(`🧪 Manual leave triggered for guild ${guildId}`);
    await this.leaveVoiceChannel(guildId);
  }

  /**
   * Emergency cleanup - forces leave from all voice channels
   */
  async emergencyCleanup() {
    console.log('🚨 Emergency cleanup triggered');
    
    try {
      // Clear all timers
      for (const [guildId, timer] of this.leaveTimers) {
        clearTimeout(timer);
        console.log(`🧹 Cleared timer for guild ${guildId}`);
      }
      this.leaveTimers.clear();

      // Force leave all voice channels
      const players = this.client.shoukaku.players;
      if (players && players.size > 0) {
        for (const [guildId] of players) {
          console.log(`🧹 Emergency cleanup for guild ${guildId}`);
          await this.leaveVoiceChannel(guildId);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log('✅ Emergency cleanup completed');
      
    } catch (error) {
      console.error('❌ Emergency cleanup error:', error.message);
    }
  }
}
