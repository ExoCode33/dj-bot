// src/features/radio/manager.js - OPTIMIZED FOR RAPID SWITCHING
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.lastSwitchTime = new Map(); // Track last switch per guild
  }

  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced wait time
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 1000)); // Reduced wait time
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  // IMPROVED: Better rapid switching handling
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Enhanced rate limiting
    const now = Date.now();
    const lastSwitch = this.lastSwitchTime.get(guildId);
    if (lastSwitch && (now - lastSwitch) < 2000) { // 2 second minimum between switches
      const waitTime = Math.ceil((2000 - (now - lastSwitch)) / 1000);
      throw new Error(`Please wait ${waitTime} more seconds before switching stations`);
    }

    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    this.lastSwitchTime.set(guildId, now);
    
    try {
      // Check recent failed attempts
      const attempts = this.connectionAttempts.get(guildId) || 0;
      if (attempts >= 3) {
        throw new Error('Too many connection attempts. Please wait 1 minute and try again.');
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try existing player first (IMPROVED)
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && this.isPlayerHealthy(existingPlayer)) {
        console.log('🎵 Using existing healthy player...');
        try {
          // Quick switch - just stop and play new stream
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
          }
          
          // Shorter wait for existing player
          await new Promise(resolve => setTimeout(resolve, 500));
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          // Success - reset failed attempts
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully used existing player');
          return result;
          
        } catch (existingError) {
          console.warn('⚠️ Existing player failed, will recreate:', existingError.message);
        }
      }

      // STRATEGY 2: Smart cleanup and recreate
      console.log('🔄 Recreating connection...');
      await this.smartCleanup(guildId);
      
      // STRATEGY 3: Create new player with better error handling
      const newPlayer = await this.createStableConnection(guildId, voiceChannelId, guild);
      
      // STRATEGY 4: Set volume and connect
      await newPlayer.setGlobalVolume(this.defaultVolume);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      // Success - reset attempts
      this.connectionAttempts.delete(guildId);
      console.log('✅ Successfully created fresh connection');
      return result;
      
    } catch (error) {
      // Track failed attempts with exponential backoff
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      // Auto-clear attempts after delay
      const clearDelay = attempts * 15000; // 15s, 30s, 45s...
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, clearDelay);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  // IMPROVED: Smarter cleanup that's less aggressive
  async smartCleanup(guildId) {
    console.log('🧹 Smart cleanup starting...');
    
    // Step 1: Stop and destroy existing player gracefully
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      try {
        if (existingPlayer.track) {
          await existingPlayer.stopTrack();
        }
        await existingPlayer.destroy();
        console.log('💀 Player destroyed gracefully');
      } catch (error) {
        console.warn('⚠️ Error destroying player:', error.message);
      }
    }
    
    // Step 2: Clear from maps
    this.client.shoukaku.players.delete(guildId);
    
    // Step 3: Brief wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Smart cleanup completed');
  }

  // IMPROVED: More reliable connection creation with better retry logic
  async createStableConnection(guildId, voiceChannelId, guild) {
    console.log('🔊 Creating stable connection...');
    
    let player;
    let lastError;
    
    // Try up to 2 times with smart delays
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/2`);
        
        player = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        
        if (player) {
          console.log(`✅ Player created on attempt ${attempt}`);
          
          // Quick stability check
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (player.node && player.guildId && !player.destroyed) {
            console.log('✅ Connection is stable');
            return player;
          }
        }
        
        throw new Error('Player not properly initialized');
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
        
        if (error.message.includes('existing connection') && attempt < 2) {
          console.log('🧹 Existing connection detected, deeper cleanup...');
          await this.forceCleanup(guildId);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    throw new Error(`Failed to create connection: ${lastError?.message || 'Unknown error'}`);
  }

  // Force cleanup for stubborn connections
  async forceCleanup(guildId) {
    console.log('🔥 Force cleanup for stubborn connection...');
    
    // Clear from Shoukaku
    this.client.shoukaku.players.delete(guildId);
    
    // Force Discord disconnect
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          await botMember.voice.disconnect();
          await botMember.voice.setChannel(null);
        }
      }
    } catch (error) {
      console.warn('⚠️ Discord force cleanup error:', error.message);
    }
    
    console.log('🔥 Force cleanup completed');
  }

  // Better player health check
  isPlayerHealthy(player) {
    return player && 
           player.node && 
           player.guildId && 
           !player.destroyed && 
           player.voiceConnection && 
           player.voiceConnection.state !== undefined;
  }

  // Get connection status with more details
  async getConnectionStatus(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    return {
      hasPlayer: !!player,
      playerState: player?.voiceConnection?.state,
      playerHealthy: this.isPlayerHealthy(player),
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId),
      recentAttempts: this.connectionAttempts.get(guildId) || 0,
      lastSwitch: this.lastSwitchTime.get(guildId),
      canSwitch: !this.switchingStations.has(guildId) && 
                 (!this.lastSwitchTime.get(guildId) || 
                  (Date.now() - this.lastSwitchTime.get(guildId)) > 2000)
    };
  }
}
