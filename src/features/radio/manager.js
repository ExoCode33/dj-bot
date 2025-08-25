// src/features/radio/manager.js - FIXED VERSION WITH RELAXED HEALTH CHECK
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.nodeHealthCheck = new Map();
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
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  async getBestAvailableNode(maxWaitTime = 20000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const nodes = this.client.shoukaku?.nodes;
      
      if (!nodes || nodes.size === 0) {
        console.log('⏳ No Lavalink nodes configured, waiting...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const allNodes = Array.from(nodes.values());
      const connectedNodes = allNodes.filter(node => node.state === 2);
      const reconnectingNodes = allNodes.filter(node => node.state === 3);
      
      if (connectedNodes.length > 0) {
        const healthyNodes = connectedNodes.filter(node => {
          const lastHealthCheck = this.nodeHealthCheck.get(node.name);
          return !lastHealthCheck || (Date.now() - lastHealthCheck) > 30000;
        });
        
        const chosenNode = healthyNodes.length > 0 ? healthyNodes[0] : connectedNodes[0];
        console.log(`✅ Using healthy connected node: ${chosenNode.name} (state: ${this.getNodeStateText(chosenNode.state)})`);
        return chosenNode;
      }
      
      if (reconnectingNodes.length > 0) {
        const waitTime = Date.now() - startTime;
        if (waitTime < 10000) {
          console.log(`⏳ Waiting for reconnecting nodes... (${Math.ceil((10000 - waitTime) / 1000)}s remaining)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        } else {
          console.warn('⚠️ Reconnecting nodes taking too long, will create connection without them');
          break;
        }
      }
      
      const nodeStates = allNodes.map(node => `${node.name}: ${this.getNodeStateText(node.state)}`).join(', ');
      console.log(`⏳ Waiting for stable nodes... States: ${nodeStates}`);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    const nodes = this.client.shoukaku?.nodes;
    if (nodes && nodes.size > 0) {
      const allNodes = Array.from(nodes.values());
      const anyUsableNode = allNodes.find(node => node.state === 2);
      
      if (anyUsableNode) {
        console.warn(`⚠️ Using any available node as last resort: ${anyUsableNode.name}`);
        return anyUsableNode;
      }
    }
    
    const finalStates = nodes ? Array.from(nodes.values()).map(node => `${node.name}: ${this.getNodeStateText(node.state)}`).join(', ') : 'No nodes';
    console.error(`❌ No usable nodes available. Final states: ${finalStates}`);
    return null;
  }

  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    const availableNode = await this.getBestAvailableNode();
    if (!availableNode) {
      throw new Error('No Lavalink nodes available. Please wait for the service to reconnect.');
    }
    
    console.log(`✅ Using node: ${availableNode.name} (${this.getNodeStateText(availableNode.state)})`);
    
    this.switchingStations.add(guildId);
    
    try {
      const attempts = this.connectionAttempts.get(guildId) || 0;
      if (attempts >= 3) {
        const waitTime = Math.min(60 + (attempts - 3) * 30, 300);
        throw new Error(`Too many connection attempts. Please wait ${waitTime} seconds and try again.`);
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try to reuse existing player
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && this.isPlayerUsable(existingPlayer)) {  // CHANGED: Use relaxed check
        console.log('🎵 Found usable existing player...');
        
        try {
          await this.ensureCorrectVoiceChannel(existingPlayer, guild, voiceChannelId);
          
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully reused existing player');
          return result;
          
        } catch (reuseError) {
          console.warn('⚠️ Player reuse failed:', reuseError.message);
        }
      }

      // STRATEGY 2: Create new connection
      console.log('🆕 Creating new connection...');
      
      if (existingPlayer) {
        await this.safeCleanupPlayer(guildId, existingPlayer);
      }
      
      const newPlayer = await this.createSmartConnection(guildId, voiceChannelId, guild, availableNode);
      
      await newPlayer.setGlobalVolume(this.defaultVolume);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      this.connectionAttempts.delete(guildId);
      this.nodeHealthCheck.set(availableNode.name, Date.now());
      console.log('✅ Successfully created new connection');
      return result;
      
    } catch (error) {
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      if (availableNode) {
        this.nodeHealthCheck.set(availableNode.name, Date.now());
      }
      
      const clearTime = Math.min(60000 + (attempts - 1) * 30000, 300000);
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, clearTime);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  async ensureCorrectVoiceChannel(player, guild, targetChannelId) {
    const botMember = guild.members.me;
    const currentChannelId = botMember?.voice?.channelId;
    
    if (currentChannelId === targetChannelId) {
      console.log('✅ Bot already in correct voice channel');
      return;
    }
    
    console.log(`🚶 Moving from channel ${currentChannelId} to ${targetChannelId}`);
    
    try {
      await botMember.voice.setChannel(targetChannelId);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newChannelId = guild.members.me?.voice?.channelId;
      if (newChannelId !== targetChannelId) {
        throw new Error(`Channel move verification failed: expected ${targetChannelId}, got ${newChannelId}`);
      }
      
      console.log('✅ Successfully moved to new voice channel');
    } catch (moveError) {
      console.error('❌ Voice channel move failed:', moveError.message);
      throw new Error(`Could not join voice channel: ${moveError.message}`);
    }
  }

  // FIXED: More relaxed connection creation with better health checks
  async createSmartConnection(guildId, voiceChannelId, guild, preferredNode = null) {
    console.log('🧠 Creating smart connection...');
    
    const targetNode = preferredNode || await this.getBestAvailableNode(5000);
    if (!targetNode) {
      throw new Error('No suitable Lavalink node available for new connection');
    }
    
    console.log(`🎵 Creating connection via node: ${targetNode.name}`);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });
      
      if (player) {
        console.log('✅ Smart connection created successfully');
        
        // Enhanced stabilization with progressive checks
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // RELAXED CHECK: Just verify basic properties exist
        if (player.node && player.guildId && !player.destroyed) {
          console.log('✅ Basic player health check passed');
          
          // Additional wait for voice connection to stabilize
          let retries = 0;
          while (retries < 5) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if we can get voice connection info
            const guild = this.client.guilds.cache.get(guildId);
            const botMember = guild?.members.me;
            
            if (botMember?.voice?.channelId === voiceChannelId) {
              console.log('✅ Voice connection verified');
              return player;
            }
            
            retries++;
            console.log(`⏳ Waiting for voice connection... (${retries}/5)`);
          }
          
          // Even if voice connection isn't perfect, try to use the player
          console.warn('⚠️ Voice connection not fully verified, but proceeding with player');
          return player;
        }
      }
      
      throw new Error('Player creation failed basic checks');
      
    } catch (error) {
      if (error.message.includes('existing connection') || error.message.includes('already have')) {
        throw new Error('Discord voice system needs to reset. Please wait 60 seconds and try again.');
      }
      
      if (error.message.includes('Missing Permissions')) {
        throw new Error('Bot missing voice permissions. Please check channel permissions.');
      }
      
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  async safeCleanupPlayer(guildId, player) {
    console.log('🧽 Safe player cleanup...');
    
    try {
      if (player && !player.destroyed) {
        if (player.track) {
          await player.stopTrack();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        await player.destroy();
      }
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
    
    this.client.shoukaku.players.delete(guildId);
    console.log('✅ Safe cleanup completed');
  }

  // RELAXED: More permissive health check for reusing players
  isPlayerUsable(player) {
    return player && 
           player.node && 
           player.guildId && 
           !player.destroyed;
    // REMOVED: Strict voice connection and node state checks
  }

  // STRICT: Full health check for status reporting
  isPlayerHealthy(player) {
    return player && 
           player.node && 
           player.node.state === 2 && 
           player.guildId && 
           !player.destroyed &&
           player.voiceConnection;
  }

  getNodeStateText(state) {
    const states = {
      0: 'DISCONNECTED',
      1: 'CONNECTING', 
      2: 'CONNECTED',
      3: 'RECONNECTING'
    };
    return states[state] || `UNKNOWN(${state})`;
  }

  async getConnectionStatus(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    const nodes = this.client.shoukaku?.nodes;
    const nodeStates = nodes ? Array.from(nodes.values()).map(node => ({
      name: node.name,
      state: node.state,
      stateText: this.getNodeStateText(node.state),
      healthy: node.state === 2
    })) : [];
    
    return {
      hasPlayer: !!player,
      playerUsable: this.isPlayerUsable(player),    // NEW: Relaxed check
      playerHealthy: this.isPlayerHealthy(player),  // EXISTING: Strict check
      playerState: player?.voiceConnection?.state,
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelId: botMember?.voice.channel?.id,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId),
      recentAttempts: this.connectionAttempts.get(guildId) || 0,
      nodes: nodeStates,
      connectedNodes: nodeStates.filter(n => n.healthy).length,
      totalNodes: nodeStates.length
    };
  }
}
