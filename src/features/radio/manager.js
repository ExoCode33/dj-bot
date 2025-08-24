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

  // FIXED: Proper connection cleanup before switching
  async switchToStation(guildId, stationKey, voiceChannelId) {
    console.log(`🔄 Switching to station: ${stationKey} for guild ${guildId}`);
    
    // Step 1: Clean up existing connection PROPERLY
    const existingPlayer = this.client.shoukaku.players.get(guildId);
    if (existingPlayer) {
      console.log('🧹 Cleaning up existing connection...');
      
      try {
        // Stop the track first
        await existingPlayer.stopTrack();
        console.log('⏹️ Track stopped');
        
        // Destroy the player
        await existingPlayer.destroy();
        console.log('💀 Player destroyed');
        
        // Remove from the map
        this.client.shoukaku.players.delete(guildId);
        console.log('🗑️ Player removed from map');
        
        // Wait for cleanup to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Cleanup wait completed');
        
      } catch (cleanupError) {
        console.warn('⚠️ Error during cleanup:', cleanupError.message);
        // Force remove even if cleanup fails
        this.client.shoukaku.players.delete(guildId);
      }
    }
    
    // Step 2: Get guild and voice channel
    const guild = this.client.guilds.cache.get(guildId);
    const voiceChannel = guild.channels.cache.get(voiceChannelId);
    
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Step 3: Create NEW connection
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
        // If we still get this error, force cleanup again
        console.warn('⚠️ Still getting existing connection error, forcing cleanup...');
        this.client.shoukaku.players.delete(guildId);
        
        // Wait longer and try again
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        newPlayer = await this.client.shoukaku.joinVoiceChannel({
          guildId: guildId,
          channelId: voiceChannelId,
          shardId: guild.shardId
        });
        console.log('✅ New voice connection created after force cleanup');
      } else {
        throw connectionError;
      }
    }
    
    // Step 4: Set volume and connect to stream
    await newPlayer.setGlobalVolume(this.defaultVolume);
    console.log(`🔊 Volume set to ${this.defaultVolume}%`);
    
    const result = await this.connectToStream(newPlayer, stationKey);
    console.log('✅ Successfully switched to new station');
    
    return result;
  }
}
