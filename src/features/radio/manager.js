// src/features/radio/manager.js - SMART CONNECTION REUSE VERSION
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
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
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 1500));
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  // SMART APPROACH: Always try to reuse existing connections first
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    
    try {
      // Check recent failed attempts
      const attempts = this.connectionAttempts.get(guildId) || 0;
      if (attempts >= 3) {
        throw new Error('Too many connection attempts. Please wait 60 seconds and try again.');
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Always try existing player first (most reliable)
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('🎵 Using existing player (smart reuse)...');
        try {
          // Check if player is in the right voice channel
          const botMember = guild.members.me;
          const currentChannelId = botMember?.voice?.channelId;
          
          if (currentChannelId !== voiceChannelId) {
            console.log(`🔄 Moving from channel ${currentChannelId} to ${voiceChannelId}`);
            // Move to correct voice channel
            await botMember.voice.setChannel(voiceChannelId);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Stop current track and play new one
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          // Success - reset failed attempts
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully reused existing player');
          return result;
          
        } catch (existingError) {
          console.warn('⚠️ Existing player failed:', existingError.message);
          // Don't destroy - fall through to create new only if really necessary
        }
      }

      // STRATEGY 2: Only create new connection if no existing player worked
      console.log('🆕 Creating new connection (last resort)...');
      
      // Simple cleanup - just clear our references
      this.client.shoukaku.players.delete(guildId);
      
      const newPlayer = await this.createSmartConnection(guildId, voiceChannelId, guild);
      
      await newPlayer.setGlobalVolume(this.defaultVolume);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      // Success - reset attempts
      this.connectionAttempts.delete(guildId);
      console.log('✅ Successfully created new connection');
      return result;
      
    } catch (error) {
      // Track failed attempts
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      // Auto-clear attempts after 60 seconds (longer cooldown)
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, 60000);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  // SMART: Only create connection when absolutely necessary
  async createSmartConnection(guildId, voiceChannelId, guild) {
    console.log('🧠 Creating smart connection...');
    
    // Wait a bit before creating new connection (let Discord settle)
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });
      
      if (player) {
        console.log('✅ Smart connection created successfully');
        
        // Short stabilization wait
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (player.node && player.guildId && !player.destroyed) {
          return player;
        }
      }
      
      throw new Error('Smart connection failed to initialize');
      
    } catch (error) {
      // If ghost connection error, wait longer and suggest user retry
      if (error.message.includes('existing connection') || error.message.includes('already have')) {
        throw new Error('Discord voice system is resetting. Please wait 30 seconds and try again.');
      }
      
      throw new Error(`Smart connection failed: ${error.message}`);
    }
  }

  // MINIMAL: Simple cleanup that doesn't cause ghost connections
  async gentleCleanup(guildId) {
    console.log('🧽 Gentle cleanup...');
    
    const player = this.client.shoukaku.players.get(guildId);
    if (player) {
      try {
        if (player.track) {
          await player.stopTrack();
        }
        // Don't destroy - just stop the track
        console.log('🛑 Track stopped (player preserved)');
      } catch (error) {
        console.warn('⚠️ Error stopping track:', error.message);
      }
    }
    
    // Only clear our reference, don't touch Discord voice state
    this.client.shoukaku.players.delete(guildId);
    console.log('✅ Gentle cleanup completed');
  }

  // Check if player is healthy
  isPlayerHealthy(player) {
    return player && 
           player.node && 
           player.guildId && 
           !player.destroyed;
  }

  // Get connection status
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
      smartReuse: true // Indicates this version uses smart reuse
    };
  }
}
