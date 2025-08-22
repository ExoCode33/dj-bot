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

  // Enhanced search strategies with LavaSrc support
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
          ? `🟠 **SoundCloud Link Detected**\n🎵 Processing: **${query}**\n🔄 *Using enhanced LavaSrc...*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected**\n🎵 Processing: **${query}**\n🔄 *Multiple search methods...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Processing: **${query}**\n🔄 *Converting to playable source...*`
          : `🎵 Searching for: **${query}**\n🔄 *Checking multiple sources with plugins...*`
      )
      .setFooter({ text: 'Enhanced with LavaSrc & LavaSearch plugins...' })
    ]
  });

  // Enhanced search strategies with plugin support
  let searchStrategies = [];
  
  if (!isYouTubeUrl && !isSoundCloudUrl && !isSpotifyUrl) {
    // For plain text searches - prioritize LavaSrc enhanced searches
    searchStrategies = [
      { name: 'LavaSrc YouTube Search', query: `ytsearch:${query}`, priority: 'high' },
      { name: 'Direct LavaSrc Search', query: query, priority: 'high' },
      { name: 'Enhanced SoundCloud', query: `scsearch:${query}`, priority: 'high' },
      { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'medium' },
      { name: 'Spotify Search Fallback', query: `spsearch:${query}`, priority: 'medium' },
      { name: 'Apple Music Fallback', query: `amsearch:${query}`, priority: 'low' }
    ];
  } else if (isYouTubeUrl) {
    const videoId = extractYouTubeVideoId(query);
    const searchTerms = generateSearchTermsFromYouTube(query);
    searchStrategies = [
      { name: 'Direct YouTube URL', query: query, priority: 'high' },
      { name: 'LavaSrc YouTube', query: `ytsearch:${searchTerms}`, priority: 'high' },
      { name: 'SoundCloud Alternative', query: `scsearch:${searchTerms}`, priority: 'medium' },
      { name: 'Spotify Alternative', query: `spsearch:${searchTerms}`, priority: 'medium' }
    ];
  } else if (isSoundCloudUrl) {
    const searchTerms = extractSoundCloudInfo(query);
    const artistSong = extractArtistAndSong(query);
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'high' },
      { name: 'Enhanced SoundCloud Search', query: `scsearch:${artistSong}`, priority: 'high' },
      { name: 'LavaSrc YouTube (from SC)', query: `ytsearch:${artistSong}`, priority: 'high' },
      { name: 'Spotify Alternative', query: `spsearch:${searchTerms}`, priority: 'medium' }
    ];
  } else if (isSpotifyUrl) {
    const trackId = extractSpotifyTrackId(query);
    searchStrategies = [
      { name: 'LavaSrc Spotify URL', query: query, priority: 'high' },
      { name: 'Spotify Search Enhanced', query: `spsearch:${trackId}`, priority: 'high' },
      { name: 'YouTube from Spotify', query: `ytsearch:${trackId}`, priority: 'high' },
      { name: 'SoundCloud from Spotify', query: `scsearch:${trackId}`, priority: 'medium' }
    ];
  }

  // Enhanced search execution with better error handling
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

  // Enhanced no results handling
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
            '🎵 **Use specific song names**',
            '✅ Example: `imagine dragons radioactive`',
            '✅ Example: `rick astley never gonna give you up`',
            '✅ Example: `lofi hip hop study music`',
            '🟠 **Or SoundCloud URLs for best results**'
          ].join('\n'),
          inline: false
        },
        {
          name: '🔧 Enhanced Search Features',
          value: [
            '• LavaSrc plugin for better YouTube access',
            '• Spotify link conversion',
            '• Multiple source fallbacks',
            '• Enhanced SoundCloud support'
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

    // Enhanced success message
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
          name: `${sourceEmoji} Enhanced Source: ${getSourceName(successfulStrategy)}`,
          value: getEnhancedSourceMessage(successfulStrategy),
          inline: false
        })
        .setFooter({ 
          text: wasEmpty ? 'Enjoy the enhanced audio quality! 🎭' : 'Added with LavaSrc enhancement! 🎵'
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

// All the helper functions remain the same...
function extractSoundCloudInfo(url) {
  try {
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
    const parts = url.split('/');
    if (parts.length >= 5) {
      const artist = parts[parts.length - 2];
      const track = parts[parts.length - 1].split('?')[0];
      
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
  return 'Enhanced Source';
}

function getEnhancedSourceMessage(strategy) {
  if (strategy.includes('LavaSrc')) {
    return '*Enhanced with LavaSrc plugin for superior audio quality and reliability.*';
  }
  if (strategy.includes('YouTube')) {
    return '*Found via enhanced YouTube integration with anti-blocking measures.*';
  }
  if (strategy.includes('SoundCloud')) {
    return '*Premium SoundCloud integration for high-quality independent music.*';
  }
  if (strategy.includes('Spotify')) {
    return '*Spotify link converted to high-quality playable source.*';
  }
  return '*Successfully found with enhanced plugin support!*';
}
