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
          ? `🟠 **SoundCloud Link Detected**\n🎵 Processing: **${query}**\n🔄 *Using basic Lavalink sources...*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected**\n🎵 Processing: **${query}**\n🔄 *Multiple search strategies...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Processing: **${query}**\n🔄 *Converting to searchable terms...*`
          : `🎵 Searching for: **${query}**\n🔄 *Checking all available sources...*`
      )
      .setFooter({ text: 'Basic Lavalink - trying multiple approaches...' })
    ]
  });

  // Enhanced search strategies for basic Lavalink (no plugins)
  let searchStrategies = [];
  
  if (!isYouTubeUrl && !isSoundCloudUrl && !isSpotifyUrl) {
    // For plain text searches - use multiple approaches with variations
    searchStrategies = [
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'Direct Search', query: query, priority: 'high' },
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
      { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'medium' },
      { name: 'YouTube Official', query: `ytsearch:${query} official`, priority: 'medium' },
      { name: 'YouTube Music Video', query: `ytsearch:${query} music video`, priority: 'medium' },
      { name: 'YouTube Audio', query: `ytsearch:${query} audio`, priority: 'low' },
      { name: 'SoundCloud Extended', query: `scsearch:${query} remix`, priority: 'low' }
    ];
  } else if (isYouTubeUrl) {
    // For YouTube URLs - try direct first, then extract and search
    const extractedTerms = extractSearchTermsFromYouTube(query);
    searchStrategies = [
      { name: 'Direct YouTube URL', query: query, priority: 'high' },
      { name: 'YouTube Search Fallback', query: `ytsearch:${extractedTerms}`, priority: 'high' },
      { name: 'SoundCloud Alternative', query: `scsearch:${extractedTerms}`, priority: 'medium' },
      { name: 'Bandcamp Alternative', query: `bcsearch:${extractedTerms}`, priority: 'low' }
    ];
  } else if (isSoundCloudUrl) {
    // For SoundCloud URLs - multiple extraction methods
    const searchTerms = extractSoundCloudInfo(query);
    const artistSong = extractArtistAndSong(query);
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'high' },
      { name: 'SoundCloud Search (extracted)', query: `scsearch:${artistSong}`, priority: 'high' },
      { name: 'YouTube Alternative', query: `ytsearch:${artistSong}`, priority: 'high' },
      { name: 'SoundCloud Basic', query: `scsearch:${searchTerms}`, priority: 'medium' },
      { name: 'YouTube Basic', query: `ytsearch:${searchTerms}`, priority: 'medium' },
      { name: 'Bandcamp Alternative', query: `bcsearch:${artistSong}`, priority: 'low' }
    ];
  } else if (isSpotifyUrl) {
    // For Spotify URLs - can't get metadata without API, so try basic extraction
    const trackInfo = extractSpotifyInfo(query);
    searchStrategies = [
      { name: 'YouTube from Spotify', query: `ytsearch:${trackInfo}`, priority: 'high' },
      { name: 'SoundCloud from Spotify', query: `scsearch:${trackInfo}`, priority: 'high' },
      { name: 'YouTube Extended', query: `ytsearch:${trackInfo} official`, priority: 'medium' },
      { name: 'Bandcamp from Spotify', query: `bcsearch:${trackInfo}`, priority: 'low' }
    ];
  }

  // Enhanced search execution with retry logic
  let track = null;
  let successfulStrategy = null;
  let lastError = null;
  let allResults = [];
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query}`);
      
      // Use retry logic for better reliability
      const res = await searchWithRetry(node, strategy.query, 2);
      
      if (!res) {
        console.log(`❌ ${strategy.name} returned no results after retries`);
        allResults.push({
          strategy: strategy.name,
          error: 'No results after retries'
        });
        continue;
      }
      
      console.log(`📊 Search result for ${strategy.name}:`, {
        loadType: res?.loadType,
        tracksCount: res?.tracks?.length || 0,
        exception: res?.exception?.message || 'None',
        playlistName: res?.playlistInfo?.name || 'N/A'
      });
      
      allResults.push({
        strategy: strategy.name,
        loadType: res?.loadType,
        tracksCount: res?.tracks?.length || 0,
        exception: res?.exception?.message
      });
      
      // Enhanced result handling for different load types
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

  // Enhanced no results handling with better suggestions
  if (!track) {
    console.log('🔍 DEBUG: All search results:', JSON.stringify(allResults, null, 2));
    
    const suggestionEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription([
        `😔 Couldn't find "${query}" on any platform`,
        lastError ? `\n🔍 Last error: ${lastError}` : '',
        '\n**Search Attempts:**',
        allResults.slice(0, 4).map(r => 
          `• ${r.strategy}: ${r.error || `${r.loadType} (${r.tracksCount} tracks)`}`
        ).join('\n')
      ].join(''))
      .addFields(
        {
          name: '💡 Try These Search Tips',
          value: [
            '🎵 **Use full song titles with artist names**',
            '✅ Good: `imagine dragons radioactive`',
            '✅ Good: `rick astley never gonna give you up`',
            '✅ Good: `the beatles hey jude`',
            '❌ Avoid: `radioactive` (too vague)',
            '🟠 **SoundCloud URLs work best for reliability**'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎯 What Works Best with Basic Lavalink',
          value: [
            '• Popular songs and well-known artists',
            '• Full song titles with artist names',
            '• SoundCloud direct links',
            '• Bandcamp links for indie music',
            '• Avoid very new or obscure tracks'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔧 Technical Info',
          value: [
            '• Using basic Lavalink (no plugins)',
            '• YouTube access may be limited',
            '• SoundCloud + Bandcamp more reliable',
            `• Tried ${allResults.length} different search methods`
          ].join('\n'),
          inline: false
        }
      );

    return modal.editReply({ embeds: [suggestionEmbed] });
  }

  // SUCCESS - Play the track with enhanced feedback
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    await player.playTrack({ track: track.encoded });

    // Enhanced success message with source info
    const successColor = successfulStrategy.includes('YouTube') ? '#FF0000' : 
                         successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                         successfulStrategy.includes('Bandcamp') ? '#629AA0' : '#00FF94';

    const sourceEmoji = successfulStrategy.includes('YouTube') ? '🔴' :
                       successfulStrategy.includes('SoundCloud') ? '🟠' :
                       successfulStrategy.includes('Bandcamp') ? '🎺' : '🎵';

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
          text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to Uta\'s playlist! 🎵'
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

// Helper Functions for Enhanced Search

async function searchWithRetry(node, query, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Search attempt ${attempt}/${maxRetries} for: ${query}`);
      
      const result = await node.rest.resolve(query);
      
      // Log detailed result info
      console.log(`📊 Attempt ${attempt} result:`, {
        loadType: result?.loadType,
        tracksCount: result?.tracks?.length || 0,
        exception: result?.exception?.message || 'None'
      });
      
      // Check if we got valid results
      if (result && (
        (result.loadType === 'track' && result.tracks?.length > 0) ||
        (result.loadType === 'playlist' && result.tracks?.length > 0) ||
        (result.loadType === 'search' && result.tracks?.length > 0)
      )) {
        return result;
      }
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxRetries) {
        console.log(`⏳ Waiting 1 second before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return null;
}

function extractSoundCloudInfo(url) {
  try {
    // Extract from URL like: https://soundcloud.com/artist/track-name
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
      
      // Clean up the strings more thoroughly
      const cleanArtist = artist
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      
      const cleanTrack = track
        .replace(/[-_]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, l => l.toUpperCase()); // Title case
      
      return `${cleanArtist} - ${cleanTrack}`;
    }
    return url;
  } catch {
    return url;
  }
}

function extractSearchTermsFromYouTube(url) {
  try {
    // Extract video ID and return it (basic approach)
    const videoId = url.match(/(?:v=|\/embed\/|\/\d+\/|\/vi\/|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId || url;
  } catch {
    return url;
  }
}

function extractSpotifyInfo(url) {
  try {
    // Extract track ID from Spotify URL
    const trackId = url.split('/track/')[1]?.split('?')[0];
    if (trackId) {
      // Without Spotify API, we can only use the track ID
      // This is a limitation of basic Lavalink
      return trackId;
    }
    return url;
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
  if (strategy.includes('Bandcamp')) return 'Bandcamp';
  return 'Music Source';
}

function getSourceMessage(strategy) {
  if (strategy.includes('YouTube')) {
    return '*Found on YouTube! Success rate may vary due to basic Lavalink limitations.*';
  }
  if (strategy.includes('SoundCloud')) {
    return '*Great choice! SoundCloud works excellently with basic Lavalink.*';
  }
  if (strategy.includes('Bandcamp')) {
    return '*Excellent! Bandcamp provides high-quality audio and reliable access.*';
  }
  return '*Successfully found and ready to play!*';
}
