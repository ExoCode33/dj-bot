// src/features/radio/manager.js - FIXED GHOST CONNECTION VERSION
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

  // FIXED: More aggressive cleanup for ghost connections
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
      if (existingPlayer && this.isPlayerHealthy(existingPlayer)) {
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

      // STRATEGY 2: Aggressive cleanup and create fresh
      console.log('🔄 Creating fresh connection...');
      await this.aggressiveCleanup(guildId);
      
      // STRATEGY 3: Create new player with multiple attempts
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

  // NUCLEAR: Ultimate cleanup that forces complete reset
  async aggressiveCleanup(guildId) {
    console.log('🧹 Nuclear cleanup starting...');
    
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
    
    // Step 2: Force clear from ALL Shoukaku maps
    this.client.shoukaku.players.delete(guildId);
    
    // Step 3: NUCLEAR - Clear from all nodes and their internal state
    const nodes = this.client.shoukaku.nodes;
    for (const [nodeName, node] of nodes) {
      try {
        // Clear connections
        if (node.connections) {
          const connection = node.connections.get(guildId);
          if (connection) {
            try {
              if (connection.destroy) await connection.destroy();
              if (connection.disconnect) await connection.disconnect();
            } catch (e) {}
          }
          node.connections.delete(guildId);
        }
        
        // Clear players
        if (node.players) {
          node.players.delete(guildId);
        }
        
        // Clear any other guild-related state
        if (node.stats) {
          delete node.stats[guildId];
        }
        
        console.log(`🧹 Nuclear cleared node ${nodeName}`);
      } catch (error) {
        console.warn(`⚠️ Error in nuclear node cleanup:`, error.message);
      }
    }
    
    // Step 4: NUCLEAR - Multiple Discord voice disconnect methods
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.me;
        
        // Method 1: Direct voice state manipulation
        if (botMember && botMember.voice) {
          try {
            // Force set voice state to null
            botMember.voice.channelId = null;
            botMember.voice.sessionId = null;
            await botMember.voice.setChannel(null);
            console.log('🔌 Force cleared voice state');
          } catch (e) {}
        }
        
        // Method 2: Raw WebSocket disconnect
        try {
          if (this.client.ws && this.client.ws.shards) {
            const shard = this.client.ws.shards.get(guild.shardId);
            if (shard && shard.connection && shard.connection.readyState === 1) {
              shard.send({
                op: 4,
                d: {
                  guild_id: guildId,
                  channel_id: null,
                  self_mute: false,
                  self_deaf: false
                }
              });
              console.log('🔌 Sent raw voice disconnect');
            }
          }
        } catch (e) {}
      }
    } catch (error) {
      console.warn('⚠️ Discord disconnect error:', error.message);
    }
    
    // Step 5: NUCLEAR - Connector complete reset
    try {
      const connector = this.client.shoukaku.connector;
      if (connector) {
        // Clear all guild references
        ['connections', 'players', 'pending'].forEach(mapName => {
          if (connector[mapName] && connector[mapName].has && connector[mapName].delete) {
            connector[mapName].delete(guildId);
          }
        });
        
        // Force WebSocket voice disconnect (multiple attempts)
        for (let i = 0; i < 3; i++) {
          try {
            if (connector.sendWS) {
              connector.sendWS(guildId, {
                op: 4,
                d: {
                  guild_id: guildId,
                  channel_id: null,
                  self_mute: false,
                  self_deaf: false
                }
              }, false);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {}
        }
        
        console.log('🧹 Nuclear connector cleanup completed');
      }
    } catch (error) {
      console.warn('⚠️ Connector cleanup error:', error.message);
    }
    
    // Step 6: WAIT LONGER - Discord needs time to process
    console.log('⏳ Waiting 10 seconds for Discord to reset...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Extended wait
    
    // Step 7: Final verification and cleanup
    try {
      // One more check and clear
      this.client.shoukaku.players.delete(guildId);
      for (const [nodeName, node] of this.client.shoukaku.nodes) {
        if (node.connections) node.connections.delete(guildId);
        if (node.players) node.players.delete(guildId);
      }
    } catch (e) {}
    
    console.log('☢️ Nuclear cleanup completed');
  }

  // FIXED: Simplified connection creation that handles ghost connections
  async createReliableConnection(guildId, voiceChannelId, guild) {
    console.log('🔊 Creating reliable connection...');
    
    let lastError;
    
    // Try up to 5 times with increasing delays
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(`🔄 Connection attempt ${attempt}/5`);
        
        // FIXED: Before each attempt, do a quick cleanup
        if (attempt > 1) {
          console.log('🧹 Quick pre-attempt cleanup...');
          this.client.shoukaku.players.delete(guildId);
          
          // Clear from nodes
          for (const [nodeName, node] of this.client.shoukaku.nodes) {
            if (node.connections) node.connections.delete(guildId);
            if (node.players) node.players.delete(guildId);
          }
          
          // Clear from connector
          if (this.client.shoukaku.connector?.connections) {
            this.client.shoukaku.connector.connections.delete(guildId);
          }
          
          // NUCLEAR: Direct shard voice reset
          try {
            const guild = this.client.guilds.cache.get(guildId);
            if (guild && this.client.ws?.shards) {
              const shard = this.client.ws.shards.get(guild.shardId);
              if (shard?.connection?.readyState === 1) {
                shard.send({
                  op: 4,
                  d: {
                    guild_id: guildId,
                    channel_id: null,
                    self_mute: false,
                    self_deaf: false
                  }
                });
                console.log('🔌 Sent pre-attempt voice reset');
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          } catch (e) {}
        }
        
        const player = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        
        if (player) {
          console.log(`✅ Player created on attempt ${attempt}`);
          
          // Wait for connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 2000 + (attempt * 1000))); // Progressive wait
          
          // Basic validation
          if (player.node && player.guildId && !player.destroyed) {
            console.log('✅ Connection appears stable');
            return player;
          }
        }
        
        throw new Error('Player not properly initialized');
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
        
        // If ghost connection error, do aggressive cleanup
        if (error.message.includes('existing connection') || error.message.includes('already have')) {
          console.log('👻 Ghost connection detected, aggressive cleanup...');
          await this.aggressiveCleanup(guildId);
          
          // Wait longer before retry for ghost connections
          const waitTime = attempt * 4000; // 4s, 8s, 12s, 16s, 20s
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (attempt < 5) {
          // Regular retry delay
          const waitTime = attempt * 2000;
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Failed to create connection after 5 attempts. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  // Simplified clean disconnect (deprecated in favor of aggressiveCleanup)
  async cleanDisconnect(guildId) {
    return this.aggressiveCleanup(guildId);
  }

  // Check if player is healthy
  isPlayerHealthy(player) {
    return player && 
           player.node && 
           player.guildId && 
           !player.destroyed && 
           player.voiceConnection && 
           player.voiceConnection.state !== undefined;
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
