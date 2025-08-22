// src/features/panel/handleQueueModal.js
// Fixed version with proper node readiness checks and connection stability

import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

export async function handleQueueModal(modal, rootInteraction) {
  console.log('🎵 Modal handler called!');
  
  if (modal.customId !== UI.Modals.QueueModal) {
    return;
  }

  const query = modal.fields.getTextInputValue(UI.Inputs.Query).trim();
  console.log('🔍 User query:', query);
  
  if (!query) {
    return modal.reply({
      embeds: [UtaUI.errorEmbed("Please enter a song name or URL!")],
      ephemeral: true
    });
  }

  try {
    await modal.deferReply({ ephemeral: true });
  } catch (error) {
    console.error('❌ Failed to defer modal reply:', error.message);
    return;
  }

  // Get the Railway node with extensive debug logging
  const nodeMap = modal.client.shoukaku.nodes;
  let node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
  
  console.log('🔧 Debug info:');
  console.log('  - Node map size:', nodeMap.size);
  console.log('  - Available nodes:', Array.from(nodeMap.keys()));
  console.log('  - Node states:', Array.from(nodeMap.values()).map(n => ({ name: n.name, state: n.state })));
  console.log('  - Selected node name:', node?.name || 'undefined');
  console.log('  - Selected node state:', node?.state || 'undefined');
  console.log('  - Node connected:', !!node);
  
  // Check if node exists
  if (!node) {
    console.error('❌ No node found');
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("No Lavalink node available!")]
    });
  }

  // Wait for node to be ready with timeout
  console.log('⏳ Checking node readiness...');
  let retries = 0;
  const maxRetries = 5;
  
  while (node.state !== 2 && retries < maxRetries) {
    console.log(`⏳ Node not ready (state: ${node.state}), waiting... (attempt ${retries + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Refresh node reference
    node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
    retries++;
  }
  
  if (node.state !== 2) {
    console.error('❌ Node never became ready. Final state:', node.state);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Lavalink is connecting. Please try again in a moment.")]
    });
  }
  
  console.log('✅ Node is ready for operations');

  // Get or create player
  let player = modal.client.shoukaku.players.get(modal.guildId);
  
  if (!player) {
    const member = await modal.guild.members.fetch(modal.user.id);
    const vc = member?.voice?.channel;
    
    if (!vc) {
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Please join a voice channel first!")]
      });
    }
    
    try {
      console.log('🔊 Attempting to join voice channel:', vc.name);
      console.log('🔊 Voice channel ID:', vc.id);
      console.log('🔊 Guild shard ID:', modal.guild.shardId);
      
      // Verify node is still available before voice operation
      const currentNodes = Array.from(nodeMap.values()).filter(n => n.state === 2);
      console.log('🔊 Ready nodes available:', currentNodes.length);
      
      if (currentNodes.length === 0) {
        throw new Error('No ready nodes available for voice connection');
      }
      
      player = await modal.client.shoukaku.joinVoiceChannel({ 
        guildId: modal.guildId, 
        channelId: vc.id, 
        shardId: modal.guild.shardId 
      });
      
      console.log('✅ Successfully joined voice channel');
      await player.setGlobalVolume(cfg.uta.defaultVolume);
      console.log('🔊 Volume set to:', cfg.uta.defaultVolume);
      
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        availableNodes: Array.from(nodeMap.values()).map(n => ({ name: n.name, state: n.state }))
      });
      
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Couldn't join voice channel! The bot may be experiencing connection issues.")]
      });
    }
  }

  // Enhanced URL detection
  const urlPatterns = {
    soundcloud: /(?:soundcloud\.com|snd\.sc)/i,
    youtube: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i,
    bandcamp: /\.bandcamp\.com/i,
    directFile: /\.(mp3|wav|ogg|m4a|flac|webm|mp4)$/i
  };

  const detectedSource = Object.entries(urlPatterns).find(([_, pattern]) => pattern.test(query))?.[0];

  // Show searching message
  await modal.editReply({
    embeds: [new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔍 Uta is searching for your song...')
      .setDescription(
        detectedSource === 'soundcloud' 
          ? `🟠 **SoundCloud Detected**\n🎵 Processing: **${query}**\n✨ *Direct URL - best reliability!*`
          : detectedSource
          ? `🎵 **${detectedSource.charAt(0).toUpperCase() + detectedSource.slice(1)} Detected**\n🔄 Processing: **${query}**`
          : `🎵 Searching for: **${query}**\n🔄 *Trying multiple sources...*`
      )
      .setFooter({ text: 'YouTube plugin enabled! 🎵' })
    ]
  });

  // Simplified search strategies
  let searchStrategies = [];
  
  if (detectedSource === 'soundcloud' || detectedSource === 'youtube' || detectedSource === 'bandcamp') {
    // Direct URLs
    searchStrategies = [
      { name: `Direct ${detectedSource} URL`, query: query, priority: 'critical' }
    ];
  } else if (detectedSource === 'directFile') {
    // Direct audio file URLs
    searchStrategies = [
      { name: 'Direct HTTP Stream', query: query, priority: 'critical' }
    ];
  } else {
    // Text search - use Lavalink's built-in search
    searchStrategies = [
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
      { name: 'Direct Search', query: query, priority: 'medium' }
    ];
  }

  // Execute search with enhanced error handling and logging
  let track = null;
  let successfulStrategy = null;
  let attempts = [];
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query.substring(0, 100)}`);
      
      // Verify node is still ready before search
      if (node.state !== 2) {
        console.log('⚠️ Node became unavailable during search, refreshing...');
        node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
        if (!node || node.state !== 2) {
          throw new Error('Node became unavailable during search operation');
        }
      }
      
      // Enhanced search with detailed logging
      const res = await searchWithTimeout(node, strategy.query, 30000);
      
      console.log(`📊 Search result for ${strategy.name}:`, {
        loadType: res?.loadType,
        trackCount: res?.tracks?.length || 0,
        playlistName: res?.playlistInfo?.name || 'N/A',
        exception: res?.exception?.message || 'none'
      });
      
      attempts.push({
        strategy: strategy.name,
        priority: strategy.priority,
        success: !!res?.tracks?.length,
        loadType: res?.loadType,
        trackCount: res?.tracks?.length || 0,
        exception: res?.exception?.message || null
      });
      
      if (res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ SUCCESS with ${strategy.name}: ${track.info?.title}`);
        break;
      } else {
        console.log(`❌ No tracks found with ${strategy.name}. LoadType: ${res?.loadType}, Exception: ${res?.exception?.message || 'none'}`);
      }
    } catch (error) {
      console.error(`❌ ${strategy.name} failed:`, error.message);
      console.error('Full error:', error);
      attempts.push({
        strategy: strategy.name,
        priority: strategy.priority,
        success: false,
        error: error.message
      });
    }
  }

  // No results found - provide detailed help
  if (!track) {
    const failedEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query.substring(0, 100)}"`)
      .addFields(
        {
          name: '💡 Try These Options',
          value: [
            '🟠 **SoundCloud**: Paste direct track URLs',
            '🔴 **YouTube**: Use direct video URLs',
            '🟢 **Bandcamp**: Direct track URLs work best',
            '📁 **Direct Files**: .mp3, .wav, .ogg URLs'
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Search Attempts',
          value: attempts.slice(0, 4).map(a => 
            `${a.success ? '✅' : '❌'} ${a.strategy} ${a.loadType ? `(${a.loadType})` : ''} ${a.exception ? `- ${a.exception.substring(0, 50)}` : ''}`
          ).join('\n') || 'No attempts logged',
          inline: false
        },
        {
          name: '🔧 Debug Info',
          value: [
            `Node connected: ${!!node}`,
            `Node state: ${node?.state || 'unknown'}`,
            `Attempts made: ${attempts.length}`,
            `Player exists: ${!!player}`
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'Direct URLs have the highest success rate! 🎵' });

    return modal.editReply({ embeds: [failedEmbed] });
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    console.log(`🎵 Playing track: ${track.info.title} (${track.info.length}ms)`);
    console.log(`🎵 Track URI: ${track.info.uri}`);
    console.log(`🎵 Track encoded length: ${track.encoded?.length || 0}`);
    
    await player.playTrack({ track: track.encoded });
    console.log('✅ Track playback started successfully');

    // Success message
    const sourceColor = successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                       successfulStrategy.includes('YouTube') ? '#FF0000' : '#00FF94';

    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor(sourceColor)
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription([
          `✨ **${track.info.title}**`,
          `👤 *by ${track.info.author}*`,
          `⏱️ Duration: ${formatDuration(track.info.length)}`,
          `🔗 [Source](${track.info.uri})`
        ].join('\n'))
        .addFields({
          name: `🎵 Found via ${successfulStrategy}`,
          value: '*Successfully loaded and ready to play!*',
          inline: false
        })
        .setFooter({ text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to playlist! 🎵' })
        .setThumbnail(track.info.artworkUrl || null)
      ]
    });

    // Update main panel
    const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
    await rootInteraction.editReply({ 
      embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], 
      components: [UtaUI.buttons(player.paused, hasTrack)] 
    });

  } catch (error) {
    console.error('❌ Playback failed:', error);
    console.error('Playback error details:', {
      message: error.message,
      stack: error.stack,
      playerState: player ? 'exists' : 'null',
      trackEncoded: track?.encoded ? 'exists' : 'null'
    });
    
    return modal.editReply({
      embeds: [UtaUI.errorEmbed(`Failed to start playback: ${error.message}`)]
    });
  }
}

// Enhanced search function with proper timeout and error handling
async function searchWithTimeout(node, query, timeout = 30000) {
  return new Promise((resolve, reject) => {
    // Set a timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Search timed out after ${timeout/1000} seconds`));
    }, timeout);

    // Perform the search
    node.rest.resolve(query)
      .then(result => {
        clearTimeout(timeoutId);
        console.log(`🔍 Search completed for: ${query.substring(0, 50)}...`);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error(`🔍 Search failed for: ${query.substring(0, 50)}...`, error.message);
        reject(error);
      });
  });
}

function formatDuration(ms) {
  if (!ms || ms < 0) return 'Live';
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
