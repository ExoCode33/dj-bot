// src/features/radio/manager.js - FIXED: NO MORE LEAVING VC!
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
    this.switchingStations = new Set();
    this.connectionAttempts = new Map();
    this.lastSwitchTime = new Map();
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
          await new Promise(resolve => setTimeout(resolve, 800));
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 800));
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }

  // FIXED: Stay in VC and just switch tracks!
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Rate limiting check
    const now = Date.now();
    const lastSwitch = this.lastSwitchTime.get(guildId);
    if (lastSwitch && (now - lastSwitch) < 3000) { // 3 second cooldown
      const waitTime = Math.ceil((3000 - (now - lastSwitch)) / 1000);
      throw new Error(`Please wait ${waitTime} more seconds before switching stations`);
    }

    if (this.switchingStations.has(guildId)) {
      throw new Error('Already switching stations, please wait...');
    }
    
    this.switchingStations.add(guildId);
    this.lastSwitchTime.set(guildId, now);
    
    try {
      const guild = this.client.guilds.cache.get(guildId);
      const voiceChannel = guild.channels.cache.get(voiceChannelId);
      
      if (!voiceChannel) {
        throw new Error('Voice channel not found');
      }

      // STRATEGY 1: Try to reuse existing player (STAY IN VC!)
      const existingPlayer = this.client.shoukaku.players.get(guildId);
      if (existingPlayer && !existingPlayer.destroyed) {
        console.log('🎵 Reusing existing player - staying in VC...');
        try {
          // Just stop current track and play new one - DON'T DISCONNECT!
          if (existingPlayer.track) {
            await existingPlayer.stopTrack();
          }
          
          // Brief pause then play new station
          await new Promise(resolve => setTimeout(resolve, 500));
          await existingPlayer.setGlobalVolume(this.defaultVolume);
          const result = await this.connectToStream(existingPlayer, stationKey);
          
          this.connectionAttempts.delete(guildId);
          console.log('✅ Successfully switched stations (stayed in VC)');
          return result;
          
        } catch (switchError) {
          console.warn('⚠️ Track switch failed, will try reconnecting:', switchError.message);
          // DON'T destroy the player yet - try to fix it
        }
      }

      // STRATEGY 2: Only if no player exists, create one
      if (!existingPlayer || existingPlayer.destroyed) {
        console.log('🔊 No player exists, creating new connection...');
        const newPlayer = await this.createNewPlayer(guildId, voiceChannelId, guild);
        await newPlayer.setGlobalVolume(this.defaultVolume);
        const result = await this.connectToStream(newPlayer, stationKey);
        
        this.connectionAttempts.delete(guildId);
        console.log('✅ Successfully created new player connection');
        return result;
      }

      // STRATEGY 3: Last resort - gentle restart
      console.log('🔄 Gently restarting player connection...');
      await this.gentleRestart(guildId, voiceChannelId, guild, stationKey);
      
      const player = this.client.shoukaku.players.get(guildId);
      const result = await this.connectToStream(player, stationKey);
      
      this.connectionAttempts.delete(guildId);
      console.log('✅ Successfully restarted player');
      return result;
      
    } catch (error) {
      const attempts = (this.connectionAttempts.get(guildId) || 0) + 1;
      this.connectionAttempts.set(guildId, attempts);
      
      setTimeout(() => {
        this.connectionAttempts.delete(guildId);
      }, 30000);
      
      console.error('❌ Station switch failed:', error.message);
      throw error;
      
    } finally {
      this.switchingStations.delete(guildId);
    }
  }

  // NEW: Create player without destroying existing connections
  async createNewPlayer(guildId, voiceChannelId, guild) {
    console.log('🔊 Creating new player...');
    
    try {
      const player = await this.client.shoukaku.joinVoiceChannel({
        guildId: guildId,
        channelId: voiceChannelId,
        shardId: guild.shardId
      });
      
      if (!player) {
        throw new Error('Failed to create player');
      }
      
      // Quick stability check
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (player.node && player.guildId && !player.destroyed) {
        console.log('✅ New player created successfully');
        return player;
      }
      
      throw new Error('Player not stable');
      
    } catch (error) {
      console.error('❌ Create player failed:', error.message);
      
      // If "existing connection" error, try to get the existing player
      if (error.message.includes('existing connection')) {
        console.log('🔍 Looking for existing player...');
        const existingPlayer = this.client.shoukaku.players.get(guildId);
        if (existingPlayer && !existingPlayer.destroyed) {
          console.log('✅ Found existing healthy player');
          return existingPlayer;
        }
        
        // Last resort: wait and try once more
        console.log('⏳ Waiting 2 seconds and trying once more...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const retryPlayer = this.client.shoukaku.players.get(guildId);
        if (retryPlayer && !retryPlayer.destroyed) {
          return retryPlayer;
        }
      }
      
      throw error;
    }
  }

  // NEW: Gentle restart that tries to keep VC connection
  async gentleRestart(guildId, voiceChannelId, guild, stationKey) {
    console.log('🔄 Gentle restart - trying to stay connected...');
    
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    
    // Step 1: Just stop the track, don't destroy player
    if (existingPlayer && existingPlayer.track) {
      try {
        await existingPlayer.stopTrack();
      } catch (e) {
        console.warn('⚠️ Stop track failed:', e.message);
      }
    }
    
    // Step 2: Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Check if player is still good
    if (existingPlayer && !existingPlayer.destroyed && existingPlayer.node) {
      console.log('✅ Player survived gentle restart');
      return existingPlayer;
    }
    
    // Step 4: Only now try to recreate if absolutely necessary
    console.log('🔄 Player needs recreation...');
    
    // Minimal cleanup - only clear the map
    this.client.shoukaku.players.delete(guildId);
    
    // Wait for state to clear
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create new player
    return await this.createNewPlayer(guildId, voiceChannelId, guild);
  }

  // Simple health check
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
      lastSwitch: this.lastSwitchTime.get(guildId),
      canSwitch: !this.switchingStations.has(guildId) && 
                 (!this.lastSwitchTime.get(guildId) || 
                  (Date.now() - this.lastSwitchTime.get(guildId)) > 3000)
    };
  }
}
