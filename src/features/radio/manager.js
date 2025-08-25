// src/features/radio/manager.js - FIXED VERSION WITH PROPER GHOST CONNECTION HANDLING
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
    this.ghostConnectionCooldown = new Map();
    this.lastDisconnectTime = new Map(); // Track when we last disconnected
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

  // FIXED: Enhanced ghost connection handling with Discord state synchronization
  async handleGhostConnection(guildId) {
    console.log(`👻 Comprehensive ghost connection cleanup for guild ${guildId}`);
    
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (!guild) {
        console.warn(`⚠️ Guild ${guildId} not found during ghost cleanup`);
        return;
      }

      let cleanupNeeded = false;

      // Step 1: Check and clean up Lavalink player
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer) {
        console.log('👻 Found ghost Lavalink player, destroying...');
        try {
          if (!existingPlayer.destroyed) {
            if (existingPlayer.track) {
              await existingPlayer.stopTrack();
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            await existingPlayer.destroy();
          }
        } catch (error) {
          console.warn('⚠️ Error destroying ghost player:', error.message);
        }
        
        this.client.shoukaku.players.delete(guildId);
        cleanupNeeded = true;
        console.log('✅ Ghost Lavalink player cleaned up');
      }

      // Step 2: Check and clean up Discord voice connection
      const botMember = guild.members.me;
      if (botMember?.voice?.channel) {
        console.log(`👻 Bot appears to be in voice channel: ${botMember.voice.channel.name}`);
        console.log('👻 Attempting to disconnect from ghost voice connection...');
        
        try {
          await botMember.voice.disconnect();
          cleanupNeeded = true;
          console.log('✅ Successfully disconnected from ghost voice connection');
        } catch (error) {
          console.warn('⚠️ Could not disconnect from ghost voice connection:', error.message);
          
          // Try alternative disconnect method
          try {
            await botMember.voice.setChannel(null);
            cleanupNeeded = true;
            console.log('✅ Alternative disconnect method succeeded');
          } catch (altError) {
            console.error('❌ All disconnect methods failed:', altError.message);
          }
        }
      }

      // Step 3: CRITICAL - Force cleanup Discord's internal voice state
      // Even if no visible connection, Discord may have internal state conflicts
      if (!cleanupNeeded) {
        console.log('👻 No visible connections, but checking for hidden Discord voice state...');
        try {
          // Force a disconnect attempt even if we don't see a connection
          await botMember.voice.disconnect();
          console.log('✅ Forced disconnect of hidden voice state');
          cleanupNeeded = true;
        } catch (error) {
          // This is expected if there's really no connection
          console.log('✅ No hidden voice state found (this is good)');
        }
      }

      if (cleanupNeeded) {
        // Record the cleanup time
        this.lastDisconnectTime.set(guildId, Date.now());
        
        // Wait longer for Discord to fully process the disconnection
        console.log('⏳ Waiting for Discord to process ghost connection cleanup...');
        await new Promise(resolve => setTimeout(resolve, 7000)); // Increased to 7 seconds
        
        // Verify cleanup was successful with multiple checks
        let verificationPassed = true;
        
        const finalCheck = guild.members.me?.voice?.channel;
        const finalPlayer = this.client.shoukaku.players.get(guildId);
        
        if (finalCheck) {
          console.warn(`⚠️ Bot still appears connected to ${finalCheck.name} after cleanup`);
          verificationPassed = false;
        }
        
        if (finalPlayer) {
          console.warn(`⚠️ Player still exists after cleanup attempt`);
          verificationPassed = false;
        }
        
        if (verificationPassed) {
          console.log('✅ Ghost connection cleanup fully verified');
          this.ghostConnectionCooldown.delete(guildId);
        } else {
          console.warn('⚠️ Cleanup verification failed, setting extended cooldown');
          this.ghostConnectionCooldown.set(guildId, Date.now());
        }
      } else {
        console.log('✅ No ghost connections detected, but performing precautionary wait...');
        // Even if no cleanup was needed, wait a bit for Discord state consistency
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error('❌ Ghost connection cleanup failed:', error.message);
      this.ghostConnectionCooldown.set(guildId, Date.now());
    }
  }

  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    // IMPROVED: More intelligent cooldown handling
    const ghostCooldown = this.ghostConnectionCooldown.get(guildId);
    const lastDisconnect = this.lastDisconnectTime.get(guildId);
    
    // Check if we're in a cooldown period
    if (ghostCooldown) {
      const cooldownRemaining = 30000 - (Date.now() - ghostCooldown); // Reduced from 60s to 30s
      if (cooldownRemaining > 0) {
        const remainingTime = Math.ceil(cooldownRemaining / 1000);
        throw new Error(`Connection stabilizing after cleanup. Please wait ${remainingTime} more seconds.`);
      } else {
        // Cooldown expired, clear it
        this.ghostConnectionCooldown.delete(guildId);
        console.log('✅ Ghost connection cooldown expired, proceeding...');
      }
    }
    
    // If we recently disconnected, wait a bit longer for Discord to stabilize
    if (lastDisconnect && (Date.now() - lastDisconnect) < 10000) {
      console.log('⏳ Recent disconnect detected, waiting for Discord to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 3000));
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
        const waitTime = Math.min(60 + (attempts - 3) * 30, 180); // Reduced max wait from 300s to 180s
        throw new Error(`Too many connection attempts. Please wait ${waitTime} seconds and try again.`);
      }

      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try to reuse existing player if it's healthy
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && this.isPlayerUsable(existingPlayer)) {
        console.log('🎵 Found usable existing player, attempting reuse...');
        
        try {
          await this.ensureCorrectVoiceChannel(existingPlayer, guild, voiceChannelId);
          
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const actualVolume = await this.setPlayerVolume(existingPlayer);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          result.volume = actualVolume;
          
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully reused existing player');
          return result;
          
        } catch (reuseError) {
          console.warn('⚠️ Player reuse failed:', reuseError.message);
          await this.safeCleanupPlayer(guildId, existingPlayer);
          // Don't immediately retry, let it fall through to new connection
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // STRATEGY 2: Create new connection with improved ghost protection
      console.log('🆕 Creating new connection...');
      
      // IMPROVED: Always perform comprehensive cleanup before new connections
      await this.handleGhostConnection(guildId);
      
      // Wait a bit more after cleanup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newPlayer = await this.createReliableConnection(guildId, voiceChannelId, guild, availableNode);
      
      const actualVolume = await this.setPlayerVolume(newPlayer);
      const result = await this.connectToStream(newPlayer, stationKey);
      
      result.volume = actualVolume;
      
      this.connectionAttempts.delete(guildId);
      this.nodeHealthCheck.set(availableNode.name, Date.now());
      console.log('✅ Successfully created new connection');
      return result;
      
    } catch (error) {
      // IMPROVED: Better error classification and handling
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('already connected') || 
          errorMsg.includes('existing connection') || 
          errorMsg.includes('already have') ||
          errorMsg.includes('cannot join')) {
        
        console.log('👻 Connection conflict detected, performing cleanup...');
        
        // Perform immediate cleanup
        try {
          await this.handleGhostConnection(guildId);
        } catch (cleanupError) {
          console.warn('⚠️ Cleanup failed:', cleanupError.message);
        }
        
        // Set a shorter cooldown since we did immediate cleanup
        this.ghostConnectionCooldown.set(guildId, Date.now());
        
        throw new Error('Connection conflict resolved. Please try again in 15-30 seconds.');
      }
      
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      if (availableNode) {
        this.nodeHealthCheck.set(availableNode.name, Date.now());
      }
      
      const clearTime = Math.min(60000 + (attempts - 1) * 15000, 180000); // Reduced scaling
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

  // ENHANCED: More robust connection creation with forced Discord state reset
  async createReliableConnection(guildId, voiceChannelId, guild, preferredNode = null) {
    console.log('🔗 Creating reliable connection with enhanced state management...');
    
    const targetNode = preferredNode || await this.getBestAvailableNode(5000);
    if (!targetNode) {
      throw new Error('No suitable Lavalink node available for new connection');
    }
    
    console.log(`🎵 Connecting via node: ${targetNode.name}`);
    
    try {
      // CRITICAL: Always force a disconnect attempt before connecting
      // This handles Discord's internal state issues that aren't visible to us
      console.log('🛡️ Performing aggressive pre-connection state reset...');
      
      const botMember = guild.members.me;
      
      // Force disconnect attempt (even if we don't think we're connected)
      try {
        console.log('🔌 Force disconnecting (even from invisible state)...');
        await botMember.voice.disconnect();
        console.log('✅ Force disconnect completed');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (disconnectError) {
        console.log('✅ Force disconnect failed as expected (no connection to break)');
      }
      
      // Double-check and force cleanup any remaining players
      const prePlayer = this.client.shoukaku.players.get(guildId);
      if (prePlayer) {
        console.log('🧹 Final player cleanup before connection...');
        await this.safeCleanupPlayer(guildId, prePlayer);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Additional Discord state settlement time
      console.log('⏳ Allowing Discord state to fully settle...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Now attempt the connection
      console.log('🚀 Attempting voice channel connection with clean state...');
      
      let player;
      let connectionAttempts = 0;
      const maxAttempts = 3;
      
      while (connectionAttempts < maxAttempts) {
        try {
          connectionAttempts++;
          console.log(`🔄 Connection attempt ${connectionAttempts}/${maxAttempts}...`);
          
          player = await this.client.shoukaku.joinVoiceChannel({
            guildId: guildId,
            channelId: voiceChannelId,
            shardId: guild.shardId
          });
          
          if (player) {
            console.log('✅ Initial connection created, stabilizing...');
            break;
          } else {
            throw new Error('joinVoiceChannel returned null');
          }
          
        } catch (attemptError) {
          console.warn(`❌ Connection attempt ${connectionAttempts} failed: ${attemptError.message}`);
          
          if (connectionAttempts < maxAttempts) {
            console.log(`⏳ Waiting before retry attempt...`);
            
            // Clean up any partial connection
            const partialPlayer = this.client.shoukaku.players.get(guildId);
            if (partialPlayer) {
              await this.safeCleanupPlayer(guildId, partialPlayer);
            }
            
            // Force another disconnect attempt
            try {
              await botMember.voice.disconnect();
            } catch (err) {
              // Expected
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000 * connectionAttempts));
          } else {
            throw attemptError;
          }
        }
      }
      
      if (!player) {
        throw new Error('Failed to create player after all attempts');
      }
      
      // Enhanced stabilization with progressive verification
      console.log('🔄 Stabilizing connection...');
      await new Promise(resolve => setTimeout(resolve, 4000)); // Increased stabilization time
      
      // Verify the connection is actually working
      if (player.destroyed) {
        throw new Error('Player was destroyed immediately after creation');
      }
      
      if (!player.node || player.node.state !== 2) {
        throw new Error('Player node is not in connected state');
      }
      
      // Enhanced voice connection verification with more attempts
      let voiceVerified = false;
      console.log('🔍 Verifying voice connection stability...');
      
      for (let attempt = 0; attempt < 8; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const currentBotMember = guild.members.me;
        if (currentBotMember?.voice?.channelId === voiceChannelId) {
          voiceVerified = true;
          console.log(`✅ Voice connection verified on attempt ${attempt + 1}`);
          break;
        }
        
        console.log(`⏳ Voice verification attempt ${attempt + 1}/8...`);
      }
      
      if (!voiceVerified) {
        console.warn('⚠️ Voice connection verification failed');
        console.warn('⚠️ This may indicate Discord API delays or issues');
        
        // Don't fail immediately - give it one more chance
        await new Promise(resolve => setTimeout(resolve, 3000));
        const finalCheck = guild.members.me?.voice?.channelId;
        
        if (finalCheck === voiceChannelId) {
          console.log('✅ Final verification check passed!');
          voiceVerified = true;
        } else {
          console.error('❌ Final verification failed - connection may be unstable');
          // We'll proceed but warn
        }
      }
      
      console.log('✅ Enhanced connection established successfully');
      return player;
      
    } catch (error) {
      console.error('❌ Enhanced connection creation failed:', error.message);
      
      // Enhanced error classification
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('missing permissions') || errorMsg.includes('no permission')) {
        throw new Error('Bot missing voice permissions. Please check channel permissions.');
      }
      
      if (errorMsg.includes('user limit') || errorMsg.includes('channel full')) {
        throw new Error('Voice channel is full. Please make room or try another channel.');
      }
      
      if (errorMsg.includes('already connected') || 
          errorMsg.includes('existing connection') || 
          errorMsg.includes('cannot join') ||
          errorMsg.includes('already have')) {
        
        console.log('🔄 Persistent connection conflict - Discord state desync detected');
        
        // Set cooldown and provide better error message
        this.ghostConnectionCooldown.set(guildId, Date.now());
        
        throw new Error('Discord voice state desync detected. This usually resolves in 30-60 seconds. Please try again later.');
      }
      
      throw new Error(`Enhanced connection failed: ${error.message}`);
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
           !player.destroyed &&
           player.node.state === 2; // Require connected node for reuse
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
    const lastDisconnect = this.lastDisconnectTime.get(guildId);
    
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
      ghostCooldown: ghostCooldown ? Math.max(0, 30000 - (Date.now() - ghostCooldown)) : 0,
      lastDisconnect: lastDisconnect ? Date.now() - lastDisconnect : null,
      nodes: nodeStates,
      connectedNodes: nodeStates.filter(n => n.healthy).length,
      totalNodes: nodeStates.length,
      defaultVolume: this.defaultVolume,
      volumeRange: '1-200%'
    };
  }
}
