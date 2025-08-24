// src/features/radio/manager.js - FIXED VERSION
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set(); // Track guilds currently switching
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

  // FIXED: Smarter station switching with proper connection management
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Prevent concurrent switching
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    
    try {
      // Step 1: Check if we already have a working player
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      
      if (existingPlayer && existingPlayer.voiceConnection?.state === 4) { // Ready state
        console.log('🎵 Using existing connection, just switching stream...');
        
        try {
          // Just stop current track and start new one
          await existingPlayer.stopTrack();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Set volume and connect to new stream
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          console.log('✅ Successfully switched stream on existing connection');
          return result;
          
        } catch (switchError) {
          console.warn('⚠️ Failed to switch on existing connection, creating new one:', switchError.message);
          // Fall through to create new connection
        }
      }
      
      // Step 2: Clean up if needed and create new connection
      await this.smartCleanupConnection(guildId);
      
      // Step 3: Get guild and voice channel
      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // Step 4: Create new connection with single retry
      console.log('🔊 Creating new voice connection...');
      
      let newPlayer;
      try {
        newPlayer = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        console.log('✅ New voice connection created');
        
      } catch (connectionError) {
        if (connectionError.message.includes('existing connection')) {
          console.log('🧹 One more cleanup attempt...');
          await this.forceConnectionReset(guildId);
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Try once more
          try {
            newPlayer = await this.client.shoukaku.joinVoiceChannel({
              guildId: guildId,
              channelId: voiceChannelId,
              shardId: guild.shardId
            });
            console.log('✅ New voice connection created (retry)');
          } catch (retryError) {
            throw new Error(`Connection failed: ${retryError.message}. Please wait 10 seconds and try again.`);
          }
        } else {
          throw connectionError;
        }
      }
      
      if (!newPlayer) {
        throw new Error('Failed to create voice connection');
      }
      
      // Step 5: Set volume and connect to stream
      await newPlayer.setGlobalVolume(this.defaultVolume);
      console.log(`🔊 Volume set to ${this.defaultVolume}%`);
      
      const result = await this.connectToStream(newPlayer, stationKey);
      console.log('✅ Successfully switched to new station');
      
      return result;
      
    } finally {
      // Always remove from switching set
      this.switchingStations.delete(guildId);
    }
  }

  // FIXED: Smarter cleanup that doesn't break existing connections
  async smartCleanupConnection(guildId) {
    console.log('🧹 Smart cleanup starting...');
    
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    
    if (existingPlayer) {
      // Check if connection is actually broken
      if (existingPlayer.voiceConnection?.state === 4) {
        console.log('✅ Connection is healthy, keeping it');
        return; // Don't clean up healthy connections
      }
      
      console.log('🧹 Cleaning up unhealthy player...');
      
      try {
        if (existingPlayer.track || existingPlayer.playing) {
          await existingPlayer.stopTrack();
          console.log('⏹️ Track stopped');
        }
        
        await existingPlayer.destroy();
        console.log('💀 Player destroyed');
        
      } catch (cleanupError) {
        console.warn('⚠️ Error during player cleanup:', cleanupError.message);
      }
    }
    
    // Always remove from map
    this.client.shoukaku.players.delete(guildId);
    console.log('🗑️ Player removed from map');
    
    // Wait for cleanup to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Smart cleanup completed');
  }

  // FIXED: Nuclear option only when really needed
  async forceConnectionReset(guildId) {
    console.log('🔥 FORCE RESET - This should rarely happen');
    
    // Remove from all tracking
    this.client.shoukaku.players.delete(guildId);
    
    // Clean up Shoukaku connections
    try {
      const nodes = this.client.shoukaku.nodes;
      for (const [nodeName, node] of nodes) {
        if (node.connections && node.connections.has(guildId)) {
          console.log(`🧹 Removing connection from node ${nodeName}`);
          node.connections.delete(guildId);
        }
      }
    } catch (nodeCleanupError) {
      console.warn('⚠️ Error cleaning node connections:', nodeCleanupError.message);
    }
    
    // Force Discord disconnect if still connected
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.cache.get(this.client.user.id);
        if (botMember?.voice.channel) {
          console.log('🔌 Forcing Discord voice disconnect...');
          await botMember.voice.disconnect();
          console.log('✅ Forced Discord disconnect');
        }
      }
    } catch (voiceError) {
      console.warn('⚠️ Error forcing disconnect:', voiceError.message);
    }
    
    // Clear connector state if accessible
    try {
      const connector = this.client.shoukaku.connector;
      if (connector?.connections) {
        connector.connections.delete(guildId);
        console.log('🔥 Cleared connector state');
      }
    } catch (connectorError) {
      console.warn('⚠️ Error cleaning connector:', connectorError.message);
    }
    
    console.log('🔥 Force reset completed');
  }

  // Utility method to check connection status
  async getConnectionStatus(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    return {
      hasPlayer: !!player,
      playerState: player?.voiceConnection?.state,
      playerConnected: player?.voiceConnection?.state === 4,
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId)
    };
  }
}
