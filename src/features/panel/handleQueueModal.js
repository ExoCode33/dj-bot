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
          ? `🟠 **SoundCloud Link Detected**\n🎵 Processing: **${query}**\n🔄 *Trying multiple approaches...*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected**\n🎵 Processing: **${query}**\n🔄 *YouTube + alternatives...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Processing: **${query}**\n🔄 *Finding alternatives...*`
          : `🎵 Searching for: **${query}**\n🔄 *Checking multiple sources...*`
      )
      .setFooter({ text: 'Trying the most reliable methods first...' })
    ]
  });

  // PRIORITY: Start with what works best
  let searchStrategies = [];
  
  if (!isYouTubeUrl && !isSoundCloudUrl && !isSpotifyUrl) {
    // For plain text searches - prioritize what actually works
    searchStrategies = [
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'Direct Search', query: query, priority: 'high' },
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'medium' },
      { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'low' }
    ];
  } else if (isYouTubeUrl) {
    // For YouTube URLs - try direct first, then extract title
    const videoId = extractYouTubeVideoId(query);
    const searchTerms = generateSearchTermsFromYouTube(query);
    searchStrategies = [
      { name: 'Direct YouTube URL', query: query, priority: 'high' },
      { name: 'YouTube Search (extracted)', query: `ytsearch:${searchTerms}`, priority: 'high' },
      { name: 'SoundCloud Alternative', query: `scsearch:${searchTerms}`, priority: 'medium' }
    ];
  } else if (isSoundCloudUrl) {
    // For SoundCloud URLs - multiple extraction methods
    const searchTerms = extractSoundCloudInfo(query);
    const artistSong = extractArtistAndSong(query);
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'high' },
      { name: 'YouTube Search (from SC)', query: `ytsearch:${artistSong}`, priority: 'high' },
      { name: 'SoundCloud Search (extracted)', query: `scsearch:${searchTerms}`, priority: 'medium' },
      { name: 'General Search', query: artistSong, priority: 'medium' }
    ];
  } else if (isSpotifyUrl) {
    // For Spotify URLs
    const trackId = extractSpotifyTrackId(query);
    searchStrategies = [
      { name: 'Direct Spotify URL', query: query, priority: 'high' },
      { name: 'YouTube Search (Spotify)', query: `ytsearch:${trackId}`, priority: 'medium' },
      { name: 'SoundCloud Search (Spotify)', query: `scsearch:${trackId}`, priority: 'low' }
    ];
  }

  // Try strategies with better error handling
  let track = null;
  let successfulStrategy = null;
  let lastError = null;
  let allResults = [];
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query}`);
      
      const res = await node.rest.resolve(strategy.query);
      
      console.log(`📊 Search result for ${strategy.name}:`, {
        loadType: res?.loadType,
        tracksCount: res?.tracks?.length || 0,
        exception: res?.exception?.message || 'None',
        playlistName: res?.playlistInfo?.name || 'N/A'
      });
      
      // Store result for debugging
      allResults.push({
        strategy: strategy.name,
        loadType: res?.loadType,
        tracksCount: res?.tracks?.length || 0,
        exception: res?.exception?.message
      });
      
      // Handle different load types properly
      if (res?.loadType === 'track' && res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ SUCCESS with ${strategy.name}: ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.loadType === 'playlist' && res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ SUCCESS with ${strategy.name} (playlist): ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.loadType === 'search' && res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ SUCCESS with ${strategy.name} (search): ${track.info?.title} by ${track.info?.author}`);
        break;
      } else if (res?.exception) {
        console.log(`❌ ${strategy.name} failed with exception: ${res.exception.message}`);
        lastError = res.exception.message;
      } else if (res?.loadType === 'error') {
        console.log(`❌ ${strategy.name} returned error loadType`);
        lastError = 'Search returned error';
      } else {
        console.log(`❌ ${strategy.name} returned no usable results (loadType: ${res?.loadType})`);
      }
    } catch (error) {
      console.log(`❌ ${strategy.name} failed with error: ${error.message}`);
      lastError = error.message;
      allResults.push({
        strategy: strategy.name,
        error: error.message
      });
    }
  }

  // Enhanced no results handling with debugging info
  if (!track) {
    console.log('🔍 DEBUG: All search results:', JSON.stringify(allResults, null, 2));
    
    const suggestionEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription([
        `😔 Couldn't find "${query}" on any platform`,
        lastError ? `\n🔍 Last error: ${lastError}` : '',
        '\n**Debug Info:**',
        allResults.slice(0, 3).map(r => 
          `• ${r.strategy}: ${r.error || `${r.loadType} (${r.tracksCount} tracks)`}`
        ).join('\n')
      ].join(''))
      .addFields(
        {
          name: '💡 Try These Instead',
          value: [
            '🎵 **Use song names instead of URLs**',
            '✅ Example: `never gonna give you up`',
            '✅ Example: `imagine dragons believer`',
            '✅ Example: `lofi hip hop study music`'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎯 What Works Best',
          value: [
            '• Popular songs and artists',
            '• YouTube searches work most reliably',
            '• Avoid region-restricted content',
            '• Try different variations of the song name'
          ].join('\n'),
          inline: false
        }
      );

    if (isSoundCloudUrl) {
      suggestionEmbed.addFields({
        name: '🟠 SoundCloud Issues',
        value: [
          '• This track might be private or deleted',
          '• Could be region-restricted',
          '• Try searching for: `artist - song name`'
        ].join('\n'),
        inline: false
      });
    }

    suggestionEmbed.setFooter({ text: 'Song names work much better than URLs! 🎵' });

    return modal.editReply({ embeds: [suggestionEmbed] });
  }

  // SUCCESS - Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    await player.playTrack({ track: track.encoded });

    // Success message with detailed info
    const successColor = successfulStrategy.includes('YouTube') ? '#FF0000' : 
                         successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                         successfulStrategy.includes('Spotify') ? '#1DB954' : '#00FF94';

    const sourceEmoji = successfulStrategy.includes('YouTube') ? '🔴' :
                       successfulStrategy.includes('SoundCloud') ? '🟠' :
                       successfulStrategy.includes('Spotify') ? '🟢' : '🎵';

    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor(successColor)
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription([
          `✨ **${track.info.title}**`,
          `👤 *by ${track.info.author}*`,
          `${sourceEmoji} Found via: **${successfulStrategy}**`,
          `⏱️ Duration: ${formatDuration(track.info.length)}`,
          `🔗 [Source](${track.info.uri})`
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

// Enhanced extraction functions
function extractSoundCloudInfo(url) {
  try {
    // Extract from URL like: https://soundcloud.com/onthehuntmusic/lizard
    const parts = url.split('/');
    if (parts.length >= 5) {
      const artist = parts[parts.length - 2].replace(/-/g, ' ');
      const track = parts[parts.length - 1].split('?')[0].replace(/-/g, ' ');
      return `${artist} ${track}`;
    }
    return url;
  } catch {
    return url;
  }
}

function extractArtistAndSong(url) {
  try {
    // More aggressive extraction for SoundCloud
    const parts = url.split('/');
    if (parts.length >= 5) {
      const artist = parts[parts.length - 2];
      const track = parts[parts.length - 1].split('?')[0];
      
      // Clean up the strings
      const cleanArtist = artist.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      const cleanTrack = track.replace(/[-_]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
      
      return `${cleanArtist} - ${cleanTrack}`;
    }
    return url;
  } catch {
    return url;
  }
}

function generateSearchTermsFromYouTube(url) {
  try {
    // Extract video ID and try to generate search terms
    const videoId = url.match(/(?:v=|\/embed\/|\/\d+\/|\/vi\/|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId || url;
  } catch {
    return url;
  }
}

function extractYouTubeVideoId(url) {
  try {
    const match = url.match(/(?:v=|\/embed\/|\/\d+\/|\/vi\/|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : url;
  } catch {
    return url;
  }
}

function extractSpotifyTrackId(url) {
  try {
    const trackId = url.split('/track/')[1]?.split('?')[0];
    return trackId || url;
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
  if (strategy.includes('YouTube')) return 'YouTube';
  if (strategy.includes('SoundCloud')) return 'SoundCloud';
  if (strategy.includes('Spotify')) return 'Spotify';
  if (strategy.includes('Bandcamp')) return 'Bandcamp';
  return 'Other';
}

function getSourceMessage(strategy) {
  if (strategy.includes('YouTube')) {
    return '*Successfully found on YouTube! This platform works most reliably.*';
  }
  if (strategy.includes('SoundCloud')) {
    return '*Found on SoundCloud! Great for independent artists.*';
  }
  if (strategy.includes('Spotify')) {
    return '*Playing via Spotify integration.*';
  }
  return '*Successfully found and playing!*';
}
