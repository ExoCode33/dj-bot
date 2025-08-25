// src/features/voice/autoLeaveHandler.js - FIXED VERSION THAT ACTUALLY LEAVES
export class AutoLeaveHandler {
  constructor(client, radioManager, currentlyPlaying, updatePersistentMessage) {
    this.client = client;
    this.radioManager = radioManager;
    this.currentlyPlaying = currentlyPlaying;
    this.updatePersistentMessage = updatePersistentMessage;
    this.leaveTimers = new Map();
    this.leaveDelay = parseInt(process.env.AUTO_LEAVE_DELAY) || 30000;
  }

  hasRealUsers(voiceChannel) {
    if (!voiceChannel) return false;
    
    const realUsers = voiceChannel.members.filter(member => !member.user.bot);
    console.log(`👥 Channel "${voiceChannel.name}": ${realUsers.size} real users, ${voiceChannel.members.size - realUsers.size} bots`);
    
    return realUsers.size > 0;
  }

  scheduleLeave(guildId, voiceChannel) {
    if (this.leaveTimers.has(guildId)) {
      console.log(`⏰ Clearing existing leave timer for guild ${guildId}`);
      clearTimeout(this.leaveTimers.get(guildId));
    }

    console.log(`⏰ Scheduling auto-leave in ${this.leaveDelay / 1000}s for channel "${voiceChannel.name}"`);
    
    const timer = setTimeout(async () => {
      try {
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

  cancelScheduledLeave(guildId) {
    if (this.leaveTimers.has(guildId)) {
      console.log(`❌ Canceling scheduled leave for guild ${guildId} - users joined`);
      clearTimeout(this.leaveTimers.get(guildId));
      this.leaveTimers.delete(guildId);
    }
  }

  // FIXED: Actually disconnect from Discord voice channel
  async leaveVoiceChannel(guildId) {
    console.log(`🚪 Starting complete voice channel exit for guild ${guildId}`);
    
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`❌ Guild ${guildId} not found for voice leave`);
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
            console.log(`✅ Force disconnect completed`);
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
          console.log(`✅ Fallback disconnect successful`);
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

    console.log(`✅ Complete voice channel exit finished for guild ${guildId}`);
  }

  async handleVoiceStateUpdate(oldState, newState) {
    try {
      const guild = oldState.guild || newState.guild;
      const botMember = guild.members.me;
      const botVoiceChannel = botMember?.voice?.channel;

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

      if (affectedChannels.size === 0) {
        return;
      }

      console.log(`🔄 Voice update affecting bot's channel "${botVoiceChannel.name}"`);

      // Check if the bot's current channel has real users
      if (this.hasRealUsers(botVoiceChannel)) {
        this.cancelScheduledLeave(guild.id);
      } else {
        if (!this.leaveTimers.has(guild.id)) {
          console.log(`🚪 No real users in "${botVoiceChannel.name}", scheduling auto-leave`);
          this.scheduleLeave(guild.id, botVoiceChannel);
        }
      }

    } catch (error) {
      console.error('❌ Auto-leave handler error:', error.message);
    }
  }

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

  getStatus() {
    return {
      activeTimers: this.leaveTimers.size,
      leaveDelay: this.leaveDelay,
      guildsWithTimers: Array.from(this.leaveTimers.keys())
    };
  }
}
