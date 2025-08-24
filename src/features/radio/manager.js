// src/features/radio/manager.js - FINAL ROBUST VERSION
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

  // FINAL FIX: Simplified and more reliable approach
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    
    try {
      // Check recent failed attempts
      const attempts = this.connectionAttempts.get(guildId) || 0;
      if (attempts >= 2) {
        throw new Error('Too many connection attempts. Please wait 30 seconds and try again.');
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try existing player first
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('🎵 Trying to use existing player...');
        try {
          // Just stop and play new stream
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          // Success - reset failed attempts
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully used existing player');
          return result;
          
        } catch (existingError) {
          console.warn('⚠️ Existing player failed, creating new connection:', existingError.message);
          // Continue to create new connection
        }
      }

      // STRATEGY 2: Clean disconnect and create fresh
      console.log('🔄 Creating fresh connection...');
      await this.cleanDisconnect(guildId);
      
      // STRATEGY 3: Create new player with relaxed verification
      const newPlayer = await this.createReliableConnection(guildId, voiceChannelId, guild);
      
      // STRATEGY 4: Set volume and connect
      await newPlayer.setGlobalVolume(this.defaultVolume);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      // Success - reset attempts
      this.connectionAttempts.delete(guildId);
      console.log('✅ Successfully created fresh connection');
      return result;
      
    } catch (error) {
      // Track failed attempts
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      // Auto-clear attempts after 30 seconds
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, 30000);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  // Simplified clean disconnect
  async cleanDisconnect(guildId) {
    console.log('🧹 Clean disconnect starting...');
    
    // Step 1: Stop and destroy existing player
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      try {
        if (existingPlayer.track) {
          await existingPlayer.stopTrack();
        }
        await existingPlayer.destroy();
        console.log('💀 Player destroyed');
      } catch (error) {
        console.warn('⚠️ Error destroying player:', error.message);
      }
    }
    
    // Step 2: Clear from maps
    this.client.shoukaku.players.delete(guildId);
    
    // Step 3: Disconnect from Discord voice
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.cache.get(this.client.user.id);
        if (botMember?.voice?.channel) {
          await botMember.voice.disconnect();
          console.log('🔌 Discord voice disconnected');
        }
      }
    } catch (error) {
      console.warn('⚠️ Discord disconnect error:', error.message);
    }
    
    // Step 4: Wait for state to clear
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Clean disconnect completed');
  }

  // More reliable connection creation
  async createReliableConnection(guildId, voiceChannelId, guild) {
    console.log('🔊 Creating reliable connection...');
    
    let player;
    let lastError;
    
    // Try up to 3 times with increasing delays
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/3`);
        
        player = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        
        if (player) {
          console.log(`✅ Player created on attempt ${attempt}`);
          
          // Wait a bit for connection to stabilize, but don't verify too strictly
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Basic check - if player exists and has a node, we're probably good
          if (player.node && player.guildId) {
            console.log('✅ Connection appears stable');
            return player;
          }
        }
        
        throw new Error('Player not properly initialized');
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
        
        if (error.message.includes('existing connection') && attempt < 3) {
          console.log('🧹 Existing connection detected, extra cleanup...');
          
          // More aggressive cleanup for existing connection errors
          await this.deepCleanup(guildId);
          
          // Wait longer before retry
          const waitTime = attempt * 3000; // 3s, 6s, 9s
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt >= 3) {
          break; // Don't retry on last attempt
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to create connection after 3 attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Deep cleanup for stubborn connections
  async deepCleanup(guildId) {
    console.log('🔥 Deep cleanup for stubborn connection...');
    
    // Clear from Shoukaku tracking
    this.client.shoukaku.players.delete(guildId);
    
    // Clear from nodes
    const nodes = this.client.shoukaku.nodes;
    for (const [nodeName, node] of nodes) {
      if (node.connections?.has(guildId)) {
        node.connections.delete(guildId);
        console.log(`🧹 Cleared from node ${nodeName}`);
      }
    }
    
    // Force Discord disconnect multiple ways
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          // Method 1: Standard disconnect
          await botMember.voice.disconnect();
          
          // Method 2: Set channel to null
          await botMember.voice.setChannel(null);
        }
      }
    } catch (error) {
      console.warn('⚠️ Discord cleanup error:', error.message);
    }
    
    // Clear connector state
    try {
      const connector = this.client.shoukaku.connector;
      if (connector?.connections) {
        connector.connections.delete(guildId);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    console.log('🔥 Deep cleanup completed');
  }

  // Check if player is healthy (simplified)
  isPlayerHealthy(player) {
    return player && player.node && player.guildId && !player.destroyed;
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
      recentAttempts: this.connectionAttempts.get(guildId) || 0
    };
  }
}
