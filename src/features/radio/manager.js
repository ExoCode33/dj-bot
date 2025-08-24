// src/features/radio/manager.js - ROBUST FINAL VERSION
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set(); // Track guilds currently switching
    this.connectionAttempts = new Map(); // Track failed attempts per guild
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

  // FINAL FIX: Complete rewrite with foolproof connection management
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Prevent concurrent switching
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    
    try {
      // Check recent failed attempts
      const attempts = this.connectionAttempts.get(guildId) || 0;
      if (attempts >= 2) {
        console.log('🛑 Too many recent attempts, enforcing cooldown...');
        throw new Error('Too many connection attempts. Please wait 30 seconds and try again.');
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try to use existing healthy connection
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && this.isPlayerHealthy(existingPlayer)) {
        console.log('🎵 Using existing healthy connection...');
        try {
          await this.switchStreamOnly(existingPlayer, stationKey);
          this.connectionAttempts.delete(guildId); // Success - reset attempts
          return { success: true, station: RADIO_STATIONS[stationKey] };
        } catch (streamError) {
          console.warn('⚠️ Stream switch failed on existing connection:', streamError.message);
          // Continue to full reconnection
        }
      }

      // STRATEGY 2: Full connection reset with maximum reliability
      console.log('🔄 Performing full connection reset...');
      await this.performCompleteReset(guildId);
      
      // STRATEGY 3: Create completely fresh connection with retries
      const newPlayer = await this.createFreshConnection(guildId, voiceChannelId, guild);
      
      // STRATEGY 4: Connect to stream
      await newPlayer.setGlobalVolume(this.defaultVolume);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      // Success - reset failed attempts counter
      this.connectionAttempts.delete(guildId);
      console.log('✅ Successfully switched to new station');
      return result;
      
    } catch (error) {
      // Track failed attempts
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      // Clear failed attempts after 30 seconds
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, 30000);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  // Check if player connection is actually healthy
  isPlayerHealthy(player) {
    if (!player) return false;
    
    // Check voice connection state (4 = Ready/Connected)
    if (player.voiceConnection?.state !== 4) return false;
    
    // Check if player is properly initialized
    if (!player.node || !player.guildId) return false;
    
    return true;
  }

  // Switch stream on existing healthy connection
  async switchStreamOnly(player, stationKey) {
    console.log('🎵 Switching stream on existing connection...');
    
    // Stop current stream gently
    if (player.track) {
      await player.stopTrack();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Connect to new stream
    const result = await this.connectToStream(player, stationKey);
    console.log('✅ Stream switched successfully');
    return result;
  }

  // Perform complete connection reset - most thorough cleanup possible
  async performCompleteReset(guildId) {
    console.log('🔄 Performing COMPLETE connection reset...');
    
    // Step 1: Clean up existing player completely
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      console.log('🧹 Cleaning up existing player...');
      try {
        if (existingPlayer.playing || existingPlayer.track) {
          await existingPlayer.stopTrack();
        }
        await existingPlayer.destroy();
      } catch (error) {
        console.warn('⚠️ Error destroying player:', error.message);
      }
    }
    
    // Step 2: Remove from all Shoukaku tracking
    this.client.shoukaku.players.delete(guildId);
    
    // Step 3: Clean up node connections
    const nodes = this.client.shoukaku.nodes;
    for (const [nodeName, node] of nodes) {
      if (node.connections?.has(guildId)) {
        console.log(`🧹 Removing from node ${nodeName}`);
        node.connections.delete(guildId);
      }
    }
    
    // Step 4: Force Discord voice disconnect
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) {
      const botMember = guild.members.cache.get(this.client.user.id);
      if (botMember?.voice?.channel) {
        console.log('🔌 Forcing Discord disconnect...');
        try {
          await botMember.voice.disconnect();
        } catch (error) {
          console.warn('⚠️ Discord disconnect failed:', error.message);
        }
      }
    }
    
    // Step 5: Clear connector state (deepest level cleanup)
    try {
      const connector = this.client.shoukaku.connector;
      if (connector?.connections) {
        connector.connections.delete(guildId);
      }
    } catch (error) {
      console.warn('⚠️ Connector cleanup failed:', error.message);
    }
    
    // Step 6: Wait for all cleanup to propagate through Discord/Lavalink
    console.log('⏳ Waiting for complete state reset...');
    await new Promise(resolve => setTimeout(resolve, 8000)); // Increased wait time
    
    console.log('✅ Complete reset finished');
  }

  // Create completely fresh connection with sophisticated retry logic
  async createFreshConnection(guildId, voiceChannelId, guild) {
    console.log('🔊 Creating fresh connection...');
    
    const maxRetries = 3;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      attempt++;
      console.log(`🔄 Connection attempt ${attempt}/${maxRetries}`);
      
      try {
        const player = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        
        // Verify connection is actually ready
        let verificationAttempts = 0;
        while (verificationAttempts < 10 && (!player.voiceConnection || player.voiceConnection.state !== 4)) {
          await new Promise(resolve => setTimeout(resolve, 500));
          verificationAttempts++;
        }
        
        if (player.voiceConnection?.state === 4) {
          console.log('✅ Fresh connection created and verified');
          return player;
        } else {
          throw new Error('Connection created but not ready');
        }
        
      } catch (connectionError) {
        console.warn(`⚠️ Attempt ${attempt} failed: ${connectionError.message}`);
        
        if (connectionError.message.includes('existing connection')) {
          // If still getting "existing connection", do even more aggressive cleanup
          console.log('🔥 Existing connection detected, nuclear cleanup...');
          await this.nuclearCleanup(guildId);
          
          // Exponential backoff
          const waitTime = Math.min(5000 * Math.pow(2, attempt - 1), 15000);
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          if (attempt >= maxRetries) {
            throw new Error(`Failed to create connection after ${maxRetries} attempts. Discord/Lavalink may need a few minutes to reset. Please try again later.`);
          }
        } else {
          // Different error, don't retry
          throw connectionError;
        }
      }
    }
    
    throw new Error('Maximum connection attempts exceeded');
  }

  // Nuclear cleanup - absolutely everything possible
  async nuclearCleanup(guildId) {
    console.log('🔥 NUCLEAR CLEANUP - Clearing absolutely everything');
    
    // Clear from every possible tracking location
    this.client.shoukaku.players.delete(guildId);
    
    // Clear from all nodes more aggressively
    const nodes = this.client.shoukaku.nodes;
    for (const [nodeName, node] of nodes) {
      try {
        if (node.connections) node.connections.delete(guildId);
        if (node.players) node.players.delete(guildId);
        // Clear any internal websocket tracking
        if (node.ws && node.ws.players) {
          node.ws.players.delete(guildId);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    
    // Try multiple Discord disconnection methods
    const guild = this.client.guilds.cache.get(guildId);
    if (guild) {
      try {
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          await botMember.voice.disconnect();
          await botMember.voice.setChannel(null);
        }
      } catch (error) {
        // Try raw voice state update
        try {
          await this.client.ws.send({
            op: 4, // Voice State Update
            d: {
              guild_id: guildId,
              channel_id: null,
              self_mute: false,
              self_deaf: false
            }
          });
        } catch (wsError) {
          console.warn('⚠️ Raw voice state update failed:', wsError.message);
        }
      }
    }
    
    // Clear Shoukaku connector state more thoroughly
    try {
      const shoukaku = this.client.shoukaku;
      if (shoukaku.connector) {
        const connector = shoukaku.connector;
        
        // Clear all possible connection references
        if (connector.connections) connector.connections.delete(guildId);
        if (connector.pending) connector.pending.delete(guildId);
        if (connector.attempts) connector.attempts.delete(guildId);
      }
    } catch (error) {
      console.warn('⚠️ Deep connector cleanup failed:', error.message);
    }
    
    console.log('🔥 Nuclear cleanup completed');
  }

  // Utility method to get detailed connection status
  async getConnectionStatus(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    return {
      hasPlayer: !!player,
      playerState: player?.voiceConnection?.state,
      playerConnected: this.isPlayerHealthy(player),
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId),
      recentAttempts: this.connectionAttempts.get(guildId) || 0,
      nodeCount: this.client.shoukaku.nodes.size
    };
  }
}
