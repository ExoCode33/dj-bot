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

  // Detect URL types and normalize
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
          ? `🟠 **SoundCloud Link Detected** ✅\n🎵 Looking for: **${query}**\n⚡ *Processing direct URL...*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected** ⚠️\n🎵 Looking for: **${query}**\n🔍 *Trying YouTube then SoundCloud alternatives...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Looking for: **${query}**\n🔍 *Searching for alternatives on SoundCloud...*`
          : `🎵 Looking for: **${query}**\n🔍 *Searching across platforms...*`
      )
      .setFooter({ text: '🟠 SoundCloud • 🔴 YouTube • 🟢 Spotify • 🎪 Other sources...' })
    ]
  });

  // Define search strategies based on input type
  let searchStrategies = [];
  
  if (isSoundCloudUrl) {
    // Direct SoundCloud URLs should work as-is
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'high' }
    ];
  } else if (isSpotifyUrl) {
    // Extract Spotify track info and search alternatives
    const trackInfo = extractSpotifyInfo(query);
    searchStrategies = [
      { name: 'SoundCloud (from Spotify)', query: `scsearch:${trackInfo}`, priority: 'high' },
      { name: 'YouTube (from Spotify)', query: `ytsearch:${trackInfo}`, priority: 'medium' },
      { name: 'Direct Spotify URL', query: query, priority: 'low' }
    ];
  } else if (isYouTubeUrl) {
    // YouTube URLs with SoundCloud alternatives
    const videoInfo = extractYouTubeInfo(query);
    searchStrategies = [
      { name: 'Direct YouTube URL', query: query, priority: 'medium' },
      { name: 'SoundCloud Alternative', query: `scsearch:${videoInfo}`, priority: 'high' }
    ];
  } else {
    // Search terms - prioritize SoundCloud
    searchStrategies = [
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
      { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'medium' },
      { name: 'Direct Search', query: query, priority: 'low' }
    ];
  }

  // Try strategies in priority order
  let track = null;
  let successfulStrategy = null;
  
  const priorityOrder = ['high', 'medium', 'low'];
  
  for (const priority of priorityOrder) {
    const strategiesForPriority = searchStrategies.filter(s => s.priority === priority);
    
    for (const strategy of strategiesForPriority) {
      try {
        console.log(`🔍 [${priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query}`);
        
        // Use Lavalink's REST API to resolve tracks
        const res = await node.rest.resolve(strategy.query);
        
        console.log(`📊 Search result for ${strategy.name}:`, {
          loadType: res?.loadType,
          tracksCount: res?.tracks?.length || 0,
          playlistName: res?.playlistInfo?.name || 'N/A'
        });
        
        if (res?.tracks?.length > 0) {
          track = res.tracks[0];
          successfulStrategy = strategy.name;
          console.log(`✅ Success with ${strategy.name}: ${track.info?.title} by ${track.info?.author}`);
          break;
        } else {
          console.log(`❌ ${strategy.name} returned no tracks (loadType: ${res?.loadType})`);
        }
      } catch (error) {
        console.log(`❌ ${strategy.name} failed: ${error.message}`);
      }
    }
    
    // If found with current priority level, stop searching
    if (track) break;
  }

  // Handle no results
  if (!track) {
    const suggestionEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query}" on any platform`)
      .addFields(
        {
          name: '🟠 Try SoundCloud Directly (Best Success Rate)',
          value: '• Go to [soundcloud.com](https://soundcloud.com)\n• Search for your song\n• Copy the URL and paste it here\n• **Most reliable method!**',
          inline: false
        },
        {
          name: '🎵 Alternative Search Terms',
          value: '• Try: `artist - song title`\n• Try: `song title remix`\n• Try: `song title cover`\n• Be more specific with artist name',
          inline: false
        }
      );

    if (isYouTubeUrl) {
      suggestionEmbed.addFields({
        name: '🔴 YouTube Issues',
        value: '• YouTube actively blocks music bots\n• Many videos are region-restricted\n• Find the same song on SoundCloud instead',
        inline: false
      });
    }

    suggestionEmbed.setFooter({ text: 'SoundCloud has the highest success rate! 🟠' });

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
        .setDescription(`✨ **${track.info.title}**\n👤 *by ${track.info.author}*\n${sourceEmoji} Found via: **${successfulStrategy}**`)
        .addFields({
          name: `${sourceEmoji} Source: ${getSourceName(successfulStrategy)}`,
          value: getSourceMessage(successfulStrategy),
          inline: false
        })
        .setFooter({ 
          text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to Uta\'s setlist! 🎵',
          iconURL: track.info.artworkUrl || undefined
        })
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
      embeds: [UtaUI.errorEmbed("Failed to start playback. The track might be unavailable or restricted.")]
    });
  }
}

// Helper functions
function extractSpotifyInfo(url) {
  try {
    // Extract track ID from Spotify URL
    const trackId = url.split('/track/')[1]?.split('?')[0];
    if (trackId) {
      return trackId; // Lavalink can handle Spotify track IDs
    }
    return url;
  } catch {
    return url;
  }
}

function extractYouTubeInfo(url) {
  try {
    // Extract video ID and try to get title from URL if possible
    const videoId = url.match(/(?:v=|\/embed\/|\/\d+\/|\/vi\/|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId || url;
  } catch {
    return url;
  }
}

function getSourceName(strategy) {
  if (strategy.includes('SoundCloud')) return 'SoundCloud';
  if (strategy.includes('YouTube')) return 'YouTube';
  if (strategy.includes('Spotify')) return 'Spotify';
  return 'Other';
}

function getSourceMessage(strategy) {
  if (strategy.includes('SoundCloud')) {
    return '*Excellent choice! SoundCloud provides reliable, high-quality audio streaming.*';
  }
  if (strategy.includes('YouTube')) {
    return '*Lucky! YouTube worked this time, but SoundCloud is more reliable.*';
  }
  if (strategy.includes('Spotify')) {
    return '*Playing via Spotify integration.*';
  }
  return '*Successfully found and playing!*';
}
