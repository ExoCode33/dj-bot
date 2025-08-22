// src/features/panel/handleQueueModal.js
// Simplified version without LavaSrc plugin dependency

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

  // Get the Railway node
  const nodeMap = modal.client.shoukaku.nodes;
  let node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
  
  if (!node || node.state !== 2) {
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Uta's sound system is temporarily offline. Please try again in a moment!")]
    });
  }

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
      player = await modal.client.shoukaku.joinVoiceChannel({ 
        guildId: modal.guildId, 
        channelId: vc.id, 
        shardId: modal.guild.shardId 
      });
      await player.setGlobalVolume(cfg.uta.defaultVolume);
    } catch (error) {
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Couldn't join voice channel!")]
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
      .setFooter({ text: 'Basic Lavalink - Direct URLs work best! 🎵' })
    ]
  });

  // Simplified search strategies (no plugin dependency)
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
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'Direct Search', query: query, priority: 'medium' }
    ];
  }

  // Execute search
  let track = null;
  let successfulStrategy = null;
  let attempts = [];
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query.substring(0, 100)}`);
      
      const res = await searchWithRetry(node, strategy.query, 2);
      
      attempts.push({
        strategy: strategy.name,
        priority: strategy.priority,
        success: !!res?.tracks?.length,
        loadType: res?.loadType
      });
      
      if (res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ SUCCESS with ${strategy.name}: ${track.info?.title}`);
        break;
      }
    } catch (error) {
      console.error(`❌ ${strategy.name} failed:`, error.message);
      attempts.push({
        strategy: strategy.name,
        priority: strategy.priority,
        success: false,
        error: error.message
      });
    }
  }

  // No results found
  if (!track) {
    const failedEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query.substring(0, 100)}"`)
      .addFields(
        {
          name: '💡 Try These Options',
          value: [
            '🟠 **SoundCloud**: Direct URLs work best!',
            '🔴 **YouTube**: Use direct video URLs',
            '🟢 **Bandcamp**: Direct track URLs',
            '📁 **Direct Files**: .mp3, .wav, .ogg URLs'
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Search Attempts',
          value: attempts.slice(0, 3).map(a => 
            `${a.success ? '✅' : '❌'} ${a.strategy}`
          ).join('\n') || 'No attempts logged',
          inline: false
        }
      )
      .setFooter({ text: 'Direct URLs have the highest success rate! 🎵' });

    return modal.editReply({ embeds: [failedEmbed] });
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    await player.playTrack({ track: track.encoded });

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
    console.error('Playback failed:', error);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed(`Failed to start playback: ${error.message}`)]
    });
  }
}

// Helper Functions
async function searchWithRetry(node, query, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await node.rest.resolve(query);
      
      if (result && result.tracks?.length > 0) {
        return result;
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500 * attempt));
      }
    } catch (error) {
      if (attempt === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
  return null;
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
