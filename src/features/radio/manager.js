// src/features/radio/manager.js
import { RADIO_STATIONS } from '../../config/stations.js';

export class SimpleRadioManager {
  constructor(client) {
    this.client = client;
    this.defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;
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

  // ENHANCED: More aggressive connection cleanup
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Step 1: AGGRESSIVE cleanup of existing connection
    await this.forceCleanupConnection(guildId);
    
    // Step 2: Get guild and voice channel
    const guild = this.client.guilds.cache.get(guildId);
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Step 3: Create NEW connection with retries
    console.log('🔊 Creating new voice connection...');
    
    let newPlayer;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        newPlayer = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        console.log('✅ New voice connection created');
        break;
        
      } catch (connectionError) {
        attempts++;
        console.warn(`⚠️ Connection attempt ${attempts}/${maxAttempts} failed: ${connectionError.message}`);
        
        if (connectionError.message.includes('existing connection')) {
          console.log('🧹 Forcing more aggressive cleanup...');
          
          // More aggressive cleanup
          await this.forceCleanupConnection(guildId);
          
          // Wait longer between attempts
          const waitTime = attempts * 2000; // 2s, 4s, 6s
          console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          
          if (attempts >= maxAttempts) {
            throw new Error(`Failed to create connection after ${maxAttempts} attempts. Please try again in a moment.`);
          }
        } else {
          throw connectionError;
        }
      }
    }
    
    if (!newPlayer) {
      throw new Error('Failed to create voice connection');
    }
    
    // Step 4: Set volume and connect to stream
    await newPlayer.setGlobalVolume(this.defaultVolume);
    console.log(`🔊 Volume set to ${this.defaultVolume}%`);
    
    const result = await this.connectToStream(newPlayer, stationKey);
    console.log('✅ Successfully switched to new station');
    
    return result;
  }

  // ENHANCED: Force cleanup with multiple strategies
  async forceCleanupConnection(guildId) {
    console.log('🧹 Starting aggressive connection cleanup...');
    
    // Strategy 1: Clean up existing player
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      console.log('🧹 Cleaning up existing player...');
      
      try {
        // Stop track first
        if (existingPlayer.track || existingPlayer.playing) {
          await existingPlayer.stopTrack();
          console.log('⏹️ Track stopped');
        }
        
        // Destroy player
        await existingPlayer.destroy();
        console.log('💀 Player destroyed');
        
      } catch (cleanupError) {
        console.warn('⚠️ Error during player cleanup:', cleanupError.message);
      }
    }
    
    // Strategy 2: Force remove from all tracking
    this.client.shoukaku.players.delete(guildId);
    console.log('🗑️ Player removed from Shoukaku map');
    
    // Strategy 3: Check Discord voice state and force disconnect if needed
    try {
      const guild = this.client.guilds.cache.get(guildId);
      if (guild) {
        const botMember = guild.members.cache.get(this.client.user.id);
        if (botMember && botMember.voice.channel) {
          console.log('🔌 Bot still in voice channel, forcing disconnect...');
          try {
            await botMember.voice.disconnect();
            console.log('✅ Forced Discord voice disconnect');
          } catch (disconnectError) {
            console.warn('⚠️ Could not force Discord disconnect:', disconnectError.message);
          }
        }
      }
    } catch (voiceError) {
      console.warn('⚠️ Error checking voice state:', voiceError.message);
    }
    
    // Strategy 4: Wait for cleanup to propagate
    console.log('⏳ Waiting for cleanup to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Cleanup completed');
  }

  // Utility method to check connection status
  async getConnectionStatus(guildId) {
    const player = this.client.shoukaku.players.get(guildId);
    const guild = this.client.guilds.cache.get(guildId);
    const botMember = guild?.members.cache.get(this.client.user.id);
    
    return {
      hasPlayer: !!player,
      playerConnected: player?.voiceConnection?.state === 'Ready',
      inVoiceChannel: !!botMember?.voice.channel,
      voiceChannelName: botMember?.voice.channel?.name
    };
  }
}
