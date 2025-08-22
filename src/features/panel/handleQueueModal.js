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
  let node = nodeMap.get('railway-node') || nodeMap.values().next().value;
  
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

  // Detect URL types
  const isYouTubeUrl = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/.test(query);
  const isSoundCloudUrl = /soundcloud\.com/.test(query);
  const isSpotifyUrl = /spotify\.com\/track\//.test(query);
  
  // Show searching message
  await modal.editReply({
    embeds: [new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔍 Uta is searching for your song...')
      .setDescription(
        isSoundCloudUrl 
          ? `🟠 **SoundCloud Link Detected**\n🎵 Processing: **${query}**\n🔄 *Trying multiple methods...*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected**\n🎵 Processing: **${query}**\n🔄 *YouTube + alternatives...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Processing: **${query}**\n🔄 *Finding alternatives...*`
          : `🎵 Searching for: **${query}**\n🔄 *Checking multiple sources...*`
      )
      .setFooter({ text: 'Trying different methods for best results...' })
    ]
  });

  // FIXED: Better search strategies that actually work with Lavalink
  let searchStrategies = [];
  
  if (isSoundCloudUrl) {
    // For SoundCloud URLs - try direct first, then extract and search
    const trackInfo = extractSoundCloudInfo(query);
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'high' },
      { name: 'SoundCloud Search from URL', query: `scsearch:${trackInfo}`, priority: 'high' },
      { name: 'YouTube Alternative', query: `ytsearch:${trackInfo}`, priority: 'medium' }
    ];
  } else if (isSpotifyUrl) {
    // For Spotify URLs
    const trackInfo = extractSpotifyInfo(query);
    searchStrategies = [
      { name: 'Direct Spotify URL', query: query, priority: 'high' },
      { name: 'SoundCloud from Spotify', query: `scsearch:${trackInfo}`, priority: 'high' },
      { name: 'YouTube from Spotify', query: `ytsearch:${trackInfo}`, priority: 'medium' }
    ];
  } else if (isYouTubeUrl) {
    // For YouTube URLs
    const videoInfo = extractYouTubeInfo(query);
    searchStrategies = [
      { name: 'Direct YouTube URL', query: query, priority: 'high' },
      { name: 'SoundCloud Alternative', query: `scsearch:${videoInfo}`, priority: 'medium' }
    ];
  } else {
    // For search terms - use simpler, more reliable searches
    searchStrategies = [
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
      { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'medium' }
    ];
  }

  // Try strategies in priority order with better error handling
  let track = null;
  let successfulStrategy = null;
  let lastError = null;
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query}`);
      
      // Use Lavalink's REST API to resolve tracks
      const res = await node.rest.resolve(strategy.query);
      
      console.log(`📊 Search result for ${strategy.name}:`, {
        loadType: res?.loadType,
        tracksCount: res?.tracks?.length || 0,
        exception: res?.exception?.message || 'None'
      });
      
      // Handle different load types properly
      if (res?.loadType === 'track' && res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ Success with ${strategy.name}: ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.loadType === 'playlist' && res?.tracks?.length > 0) {
        track = res.tracks[0]; // Take first track from playlist
        successfulStrategy = strategy.name;
        console.log(`✅ Success with ${strategy.name} (playlist): ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.loadType === 'search' && res?.tracks?.length > 0) {
        track = res.tracks[0]; // Take first search result
        successfulStrategy = strategy.name;
        console.log(`✅ Success with ${strategy.name} (search): ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.exception) {
        console.log(`❌ ${strategy.name} failed with exception: ${res.exception.message}`);
        lastError = res.exception.message;
      } else {
        console.log(`❌ ${strategy.name} returned no usable results (loadType: ${res?.loadType})`);
      }
    } catch (error) {
      console.log(`❌ ${strategy.name} failed with error: ${error.message}`);
      lastError = error.message;
    }
  }

  // Handle no results with better suggestions
  if (!track) {
    const suggestionEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query}" on any platform\n${lastError ? `\n🔍 Last error: ${lastError}` : ''}`)
      .addFields(
        {
          name: '💡 Try These Alternatives',
          value: [
            '🎵 **Search by song name instead of URL**',
            '🔍 Try: `artist name - song title`',
            '🎤 Try: `song title cover` or `song title remix`',
            '📻 Use more popular/mainstream songs'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎯 Working Examples',
          value: [
            '✅ `never gonna give you up`',
            '✅ `imagine dragons - believer`',
            '✅ `lofi hip hop study music`'
          ].join('\n'),
          inline: false
        }
      );

    if (isSoundCloudUrl) {
      suggestionEmbed.addFields({
        name: '🟠 SoundCloud URL Issues',
        value: [
          '• Some SoundCloud tracks are region-restricted',
          '• Private or deleted tracks won\'t work',
          '• Try searching for the song name instead'
        ].join('\n'),
        inline: false
      });
    } else if (isYouTubeUrl) {
      suggestionEmbed.addFields({
        name: '🔴 YouTube URL Issues',
        value: [
          '• Many YouTube videos are blocked for bots',
          '• Music videos often have copyright restrictions',
          '• Try searching for the song name instead'
        ].join('\n'),
        inline: false
      });
    }

    suggestionEmbed.setFooter({ text: 'Song names work better than URLs! 🎵' });

    return modal.editReply({ embeds: [suggestionEmbed] });
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    // Use the proper Shoukaku method to play
    await player.playTrack({ track: track.encoded });

    // Success message
    const successColor = successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                         successfulStrategy.includes('YouTube') ? '#FF0000' : 
                         successfulStrategy.includes('Spotify') ? '#1DB954' : '#00FF94';

    const sourceEmoji = successfulStrategy.includes('SoundCloud') ? '🟠' :
                       successfulStrategy.includes('YouTube') ? '🔴' :
                       successfulStrategy.includes('Spotify') ? '🟢' : '🎵';

    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor(successColor)
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription([
          `✨ **${track.info.title}**`,
          `👤 *by ${track.info.author}*`,
          `${sourceEmoji} Found via: **${successfulStrategy}**`,
          `⏱️ Duration: ${formatDuration(track.info.length)}`
        ].join('\n'))
        .addFields({
          name: `${sourceEmoji} Source: ${getSourceName(successfulStrategy)}`,
          value: getSourceMessage(successfulStrategy),
          inline: false
        })
        .setFooter({ 
          text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to Uta\'s setlist! 🎵'
        })
        .setThumbnail(track.info.artworkUrl || null)
      ]
    });

    // Update main panel
    try {
      const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
      await rootInteraction.editReply({ 
        embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], 
        components: [UtaUI.buttons(player.paused, hasTrack)] 
      });
    } catch (panelError) {
      console.error('Panel update failed:', panelError.message);
    }

  } catch (error) {
    console.error('Playback failed:', error);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed(`Failed to start playback: ${error.message}`)]
    });
  }
}

// Helper functions
function extractSoundCloudInfo(url) {
  try {
    // Extract artist and track name from SoundCloud URL
    const parts = url.split('/');
    const artist = parts[parts.length - 2];
    const track = parts[parts.length - 1];
    return `${artist} ${track}`.replace(/-/g, ' ');
  } catch {
    return url;
  }
}

function extractSpotifyInfo(url) {
  try {
    // For now, just return the track ID
    const trackId = url.split('/track/')[1]?.split('?')[0];
    return trackId || url;
  } catch {
    return url;
  }
}

function extractYouTubeInfo(url) {
  try {
    // Extract video ID
    const videoId = url.match(/(?:v=|\/embed\/|\/\d+\/|\/vi\/|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId || url;
  } catch {
    return url;
  }
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

function getSourceName(strategy) {
  if (strategy.includes('SoundCloud')) return 'SoundCloud';
  if (strategy.includes('YouTube')) return 'YouTube';
  if (strategy.includes('Spotify')) return 'Spotify';
  if (strategy.includes('Bandcamp')) return 'Bandcamp';
  return 'Other';
}

function getSourceMessage(strategy) {
  if (strategy.includes('SoundCloud')) {
    return '*Great choice! SoundCloud provides high-quality audio streaming.*';
  }
  if (strategy.includes('YouTube')) {
    return '*Successfully found on YouTube!*';
  }
  if (strategy.includes('Spotify')) {
    return '*Playing via Spotify integration.*';
  }
  if (strategy.includes('Bandcamp')) {
    return '*High-quality audio from Bandcamp!*';
  }
  return '*Successfully found and playing!*';
}
