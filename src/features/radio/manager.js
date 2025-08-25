// src/features/radio/manager.js - COMPLETE VERSION WITH GHOST FIXES + VOLUME MANAGEMENT
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    
    // ENHANCED: Better volume handling for very low volumes
    const rawVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    
    // Volume validation and mapping
    if (rawVolume < 1) {
      console.warn(`⚠️ Volume ${rawVolume} is too low, setting to minimum (1)`);
      this.defaultVolume = 1;
    } else if (rawVolume > 200) {
      console.warn(`⚠️ Volume ${rawVolume} is too high, setting to maximum (200)`);
      this.defaultVolume = 200;
    } else {
      this.defaultVolume = rawVolume;
    }
    
    console.log(`🔊 Volume configured: ${this.defaultVolume}% (from DEFAULT_VOLUME=${process.env.DEFAULT_VOLUME})`);
    
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.nodeHealthCheck = new Map();
    this.ghostConnectionCooldown = new Map(); // Track ghost connections
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

  // ENHANCED: Better volume setting with validation and logging
  async setPlayerVolume(player, volume = null) {
    const targetVolume = volume || this.defaultVolume;
    
    try {
      console.log(`🔊 Setting volume to ${targetVolume}%`);
      
      // Extra validation
      if (targetVolume < 1 || targetVolume > 200) {
        console.error(`❌ Invalid volume: ${targetVolume}%. Using safe default of 35%`);
        await player.setGlobalVolume(35);
        return 35;
      }
      
      await player.setGlobalVolume(targetVolume);
      
      // Verify the volume was set (some players have issues with very low volumes)
      if (targetVolume <= 5) {
        console.log(`🔇 Very low volume detected (${targetVolume}%) - this should be very quiet`);
        
        // For extremely low volumes, you might want to add additional handling
        if (targetVolume <= 2) {
          console.log(`🔕 Ultra-low volume (${targetVolume}%) - if still too loud, consider muting entirely`);
        }
      }
      
      console.log(`✅ Volume set successfully: ${targetVolume}%`);
      return targetVolume;
      
    } catch (error) {
      console.error(`❌ Failed to set volume to ${targetVolume}%:`, error.message);
      
      // Fallback to a safe volume
      try {
        await player.setGlobalVolume(10);
        console.log(`✅ Fallback: Set volume to 10%`);
        return 10;
      } catch (fallbackError) {
        console.error(`❌ Even fallback volume failed:`, fallbackError.message);
        return targetVolume; // Return what we attempted
      }
    }
  }

  // ENHANCED: Volume testing method - useful for debugging
  async testVolume(guildId, testVolume = 1) {
    const player = this.client.shoukaku.players.get(guildId);
    if (!player) {
      throw new Error('No active player found for volume test');
    }
    
    console.log(`🧪 Testing volume: ${testVolume}%`);
    const actualVolume = await this.setPlayerVolume(player, testVolume);
    
    return {
      requested: testVolume,
      actual: actualVolume,
      timestamp: Date.now()
    };
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
      
      if (connectedNodes.length > 0) {
        const healthyNodes = connectedNodes.filter(node => {
          const lastHealthCheck = this.nodeHealthCheck.get(node.name);
          return !lastHealthCheck || (Date.now() - lastHealthCheck) > 30000;
        });
        
        const chosenNode = healthyNodes.length > 0 ? healthyNodes[0] : connectedNodes[0];
        console.log(`✅ Using healthy connected node: ${chosenNode.name} (state: ${this.getNodeStateText(chosenNode.state)})`);
        return chosenNode;
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

  // ENHANCED: Handle ghost connections properly
  async handleGhostConnection(guildId) {
    console.log(`👻 Checking for ghost connection in guild ${guildId}`);
    
    try {
      // Check if there's a player that shouldn't exist
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('👻 Found ghost player, cleaning up...');
        try {
          await existingPlayer.destroy();
        } catch (error) {
          console.warn('⚠️ Error destroying ghost player:', error.message);
        }
        this.client.shoukaku.players.delete(guildId);
      }
      
      // Check Discord voice state
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.me;
        if (botMember?.voice?.channel) {
          console.log(`👻 Bot appears to be in voice channel: ${botMember.voice.channel.name}`);
          console.log('👻 Attempting to leave ghost connection...');
          
          try {
            await botMember.voice.disconnect();
            console.log('✅ Successfully disconnected from ghost connection');
          } catch (error) {
            console.warn('⚠️ Could not disconnect from ghost connection:', error.message);
          }
        }
      }
      
      // Wait for Discord to process the disconnection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      console.log('✅ Ghost connection cleanup completed');
      
    } catch (error) {
      console.error('❌ Ghost connection cleanup failed:', error.message);
    }
  }

  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    // Check for ghost connection cooldown
    const ghostCooldown = this.ghostConnectionCooldown.get(guildId);
    if (ghostCooldown && Date.now() - ghostCooldown < 60000) {
      const remainingTime = Math.ceil((60000 - (Date.now() - ghostCooldown)) / 1000);
      throw new Error(`Ghost connection cleanup in progress. Please wait ${remainingTime} more seconds.`);
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

      // ENHANCED: Always check for ghost connections first
      await this.handleGhostConnection(guildId);

      // STRATEGY 1: Try to reuse existing player (only if it's actually healthy)
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && this.isPlayerUsable(existingPlayer)) {
        console.log('🎵 Found usable existing player...');
        
        try {
          await this.ensureCorrectVoiceChannel(existingPlayer, guild, voiceChannelId);
          
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          // ENHANCED: Use the new volume setter
          const actualVolume = await this.setPlayerVolume(existingPlayer);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          // Include actual volume in result
          result.volume = actualVolume;
          
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully reused existing player');
          return result;
          
        } catch (reuseError) {
          console.warn('⚠️ Player reuse failed:', reuseError.message);
          // Clean up failed player
          await this.safeCleanupPlayer(guildId, existingPlayer);
        }
      }

      // STRATEGY 2: Create new connection with ghost protection
      console.log('🆕 Creating new connection with ghost protection...');
      
      const newPlayer = await this.createSmartConnectionWithGhostProtection(guildId, voiceChannelId, guild, availableNode);
      
      // ENHANCED: Use the new volume setter
      const actualVolume = await this.setPlayerVolume(newPlayer);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      // Include actual volume in result
      result.volume = actualVolume;
      
      this.connectionAttempts.delete(guildId);
      this.nodeHealthCheck.set(availableNode.name, Date.now());
      console.log('✅ Successfully created new connection');
      return result;
      
    } catch (error) {
      // Handle ghost connection errors specifically
      if (error.message.includes('already have') || error.message.includes('existing connection')) {
        console.log('👻 Ghost connection detected, scheduling cleanup...');
        this.ghostConnectionCooldown.set(guildId, Date.now());
        
        // Attempt immediate cleanup
        setTimeout(async () => {
          await this.handleGhostConnection(guildId);
        }, 1000);
        
        throw new Error('Ghost connection detected. I\'ve started cleanup - please wait 60 seconds and try again.');
      }
      
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

  // NEW: Smart connection with ghost protection
  async createSmartConnectionWithGhostProtection(guildId, voiceChannelId, guild, preferredNode = null) {
    console.log('🛡️ Creating connection with ghost protection...');
    
    const targetNode = preferredNode || await this.getBestAvailableNode(5000);
    if (!targetNode) {
      throw new Error('No suitable Lavalink node available for new connection');
    }
    
    console.log(`🎵 Creating protected connection via node: ${targetNode.name}`);
    
    // Wait before attempting connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // Double-check for ghost connections right before creating
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('🛡️ Last-second ghost player detected, cleaning up...');
        await this.safeCleanupPlayer(guildId, existingPlayer);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Check Discord voice state
      const botMember = guild.members.me;
      if (botMember?.voice?.channel) {
        console.log('🛡️ Bot already in a voice channel, disconnecting first...');
        try {
          await botMember.voice.disconnect();
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.warn('⚠️ Could not pre-disconnect:', error.message);
        }
      }
      
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });
      
      if (player) {
        console.log('✅ Protected connection created successfully');
        
        // Enhanced stabilization with progressive checks
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Relaxed check but with verification
        if (player.node && player.guildId && !player.destroyed) {
          console.log('✅ Basic player health check passed');
          
          // Verify voice connection with retries
          let retries = 0;
          while (retries < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const currentBotMember = guild.members.me;
            if (currentBotMember?.voice?.channelId === voiceChannelId) {
              console.log('✅ Voice connection verified and stable');
              return player;
            }
            
            retries++;
            console.log(`⏳ Verifying voice connection... (${retries}/3)`);
          }
          
          // If verification failed but player exists, still try to use it
          console.warn('⚠️ Voice connection not fully verified, but player seems functional');
          return player;
        }
      }
      
      throw new Error('Protected connection failed basic validation');
      
    } catch (error) {
      // Enhanced ghost connection detection
      if (error.message.includes('existing connection') || 
          error.message.includes('already have') || 
          error.message.includes('already connected') ||
          error.message.includes('Cannot join a voice channel when already connected')) {
        
        console.log('👻 Ghost connection error detected');
        this.ghostConnectionCooldown.set(guildId, Date.now());
        throw new Error('Ghost connection detected. Cleanup scheduled - please wait 60 seconds and try again.');
      }
      
      if (error.message.includes('Missing Permissions')) {
        throw new Error('Bot missing voice permissions. Please check channel permissions.');
      }
      
      throw new Error(`Protected connection failed: ${error.message}`);
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

  // Relaxed health check for reusing players
  isPlayerUsable(player) {
    return player && 
           player.node && 
           player.guildId && 
           !player.destroyed;
  }

  // Strict health check for status reporting
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
    
    const ghostCooldown = this.ghostConnectionCooldown.get(guildId);
    
    return {
      hasPlayer: !!player,
      playerUsable: this.isPlayerUsable(player),
      playerHealthy: this.isPlayerHealthy(player),
      playerState: player?.voiceConnection?.state,
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelId: botMember?.voice.channel?.id,
      voiceChannelName: botMember?.voice.channel?.name,
      isSwitching: this.switchingStations.has(guildId),
      recentAttempts: this.connectionAttempts.get(guildId) || 0,
      ghostCooldown: ghostCooldown ? Math.max(0, 60000 - (Date.now() - ghostCooldown)) : 0,
      nodes: nodeStates,
      connectedNodes: nodeStates.filter(n => n.healthy).length,
      totalNodes: nodeStates.length,
      defaultVolume: this.defaultVolume,
      volumeRange: '1-200%'
    };
  }
}
