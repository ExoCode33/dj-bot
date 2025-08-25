// src/features/voice/autoLeaveHandler.js - Auto-leave when no users remain
export class AutoLeaveHandler {
  constructor(client, radioManager, currentlyPlaying, updatePersistentMessage) {
    this.client = client;
    this.radioManager = radioManager;
    this.currentlyPlaying = currentlyPlaying;
    this.updatePersistentMessage = updatePersistentMessage;
    this.leaveTimers = new Map(); // Track delayed leave timers
    this.leaveDelay = parseInt(process.env.AUTO_LEAVE_DELAY) || 30000; // 30 seconds default
  }

  /**
   * Checks if a voice channel has any real users (non-bots)
   * @param {VoiceChannel} voiceChannel - The voice channel to check
   * @returns {boolean} - True if there are real users, false if only bots
   */
  hasRealUsers(voiceChannel) {
    if (!voiceChannel) return false;
    
    const realUsers = voiceChannel.members.filter(member => !member.user.bot);
    console.log(`👥 Channel "${voiceChannel.name}": ${realUsers.size} real users, ${voiceChannel.members.size - realUsers.size} bots`);
    
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
   * Leaves the voice channel and cleans up
   * @param {string} guildId - Guild ID
   */
  async leaveVoiceChannel(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    
    if (player) {
      try {
        console.log(`🎵 Stopping music for guild ${guildId}`);
        
        if (player.track) {
          await player.stopTrack();
        }
        
        await player.destroy();
        this.client.shoukaku.players.delete(guildId);
        
        console.log(`✅ Successfully left voice channel for guild ${guildId}`);
        
      } catch (error) {
        console.error('❌ Error leaving voice channel:', error.message);
        // Force cleanup even if there's an error
        this.client.shoukaku.players.delete(guildId);
      }
    }

    // Clean up tracking
    this.currentlyPlaying.delete(guildId);
    
    // Update the persistent radio message
    if (this.updatePersistentMessage) {
      await this.updatePersistentMessage();
    }
  }

  /**
   * Handles voice state updates for auto-leave logic
   * @param {VoiceState} oldState - Previous voice state
   * @param {VoiceState} newState - New voice state
   */
  async handleVoiceStateUpdate(oldState, newState) {
    try {
      // Get the bot's member object
      const botId = this.client.user.id;
      const guild = oldState.guild || newState.guild;
      const botMember = guild.members.me;
      const botVoiceChannel = botMember?.voice?.channel;

      // Only process if the bot is in a voice channel
      if (!botVoiceChannel) {
        return;
      }

      // Check if this voice state change affects the bot's channel
      const affectedChannels = new Set();
      
      if (oldState.channelId === botVoiceChannel.id) {
        affectedChannels.add(botVoiceChannel);
      }
      
      if (newState.channelId === botVoiceChannel.id) {
        affectedChannels.add(botVoiceChannel);
      }

      // If no relevant channels affected, ignore this update
      if (affectedChannels.size === 0) {
        return;
      }

      console.log(`🔄 Voice update affecting bot's channel "${botVoiceChannel.name}"`);

      // Check if the bot's current channel has real users
      if (this.hasRealUsers(botVoiceChannel)) {
        // Users present - cancel any scheduled leave
        this.cancelScheduledLeave(guild.id);
      } else {
        // No real users - schedule leave (unless already scheduled)
        if (!this.leaveTimers.has(guild.id)) {
          console.log(`🚪 No real users in "${botVoiceChannel.name}", scheduling auto-leave`);
          this.scheduleLeave(guild.id, botVoiceChannel);
        }
      }

    } catch (error) {
      console.error('❌ Auto-leave handler error:', error.message);
    }
  }

  /**
   * Performs initial check when bot starts - leaves channels with no users
   */
  async performStartupCheck() {
    console.log('🔍 Performing startup auto-leave check...');
    
    try {
      const players = this.client.shoukaku.players;
      
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

        if (!this.hasRealUsers(voiceChannel)) {
          console.log(`🚪 Startup: No real users in "${voiceChannel.name}" (${guild.name}), leaving immediately`);
          await this.leaveVoiceChannel(guildId);
        } else {
          console.log(`✅ Startup: Real users found in "${voiceChannel.name}" (${guild.name}), staying`);
        }
      }
      
      console.log('✅ Startup auto-leave check completed');
      
    } catch (error) {
      console.error('❌ Startup auto-leave check error:', error.message);
    }
  }

  /**
   * Gets status information for debugging
   */
  getStatus() {
    return {
      activeTimers: this.leaveTimers.size,
      leaveDelay: this.leaveDelay,
      guildsWithTimers: Array.from(this.leaveTimers.keys())
    };
  }
}
