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
  const isYouTubeUrl = query.includes('youtube.com') || query.includes('youtu.be');
  const isSoundCloudUrl = query.includes('soundcloud.com');
  const isSpotifyUrl = query.includes('spotify.com');
  
  // Show searching message with SoundCloud priority emphasis
  await modal.editReply({
    embeds: [new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔍 Uta is searching for your song...')
      .setDescription(
        isSoundCloudUrl 
          ? `🟠 **SoundCloud Link Detected** ✅\n🎵 Looking for: **${query}**\n⚡ *High success rate expected!*`
          : isYouTubeUrl
          ? `🔴 **YouTube Link Detected** ⚠️\n🎵 Looking for: **${query}**\n🟠 *Will try SoundCloud alternatives if this fails...*`
          : isSpotifyUrl
          ? `🟢 **Spotify Link Detected**\n🎵 Looking for: **${query}**\n🟠 *Searching for this song on SoundCloud...*`
          : `🎵 Looking for: **${query}**\n🟠 *Prioritizing SoundCloud for best results...*`
      )
      .setFooter({ text: '🟠 SoundCloud • 🔴 YouTube • 🎪 Other sources...' })
    ]
  });

  // SOUNDCLOUD-FIRST search strategies
  let track = null;
  let successfulStrategy = null;
  
  const searchStrategies = (() => {
    if (isSoundCloudUrl) {
      // SoundCloud URLs - try direct first
      return [
        { name: 'Direct SoundCloud URL', query: query, priority: 'high' },
      ];
    } else if (isSpotifyUrl) {
      // For Spotify URLs, extract track info and search on SoundCloud
      const spotifyTrackName = extractSpotifyTrackName(query);
      return [
        { name: 'SoundCloud (from Spotify)', query: `scsearch:${spotifyTrackName}`, priority: 'high' },
        { name: 'SoundCloud + Official', query: `scsearch:${spotifyTrackName} official`, priority: 'high' },
        { name: 'SoundCloud + Remix', query: `scsearch:${spotifyTrackName} remix`, priority: 'medium' },
        { name: 'YouTube (Spotify fallback)', query: `ytsearch:${spotifyTrackName}`, priority: 'low' },
        { name: 'Direct Spotify URL', query: query, priority: 'low' }
      ];
    } else if (isYouTubeUrl) {
      // For YouTube URLs, try direct but heavily prioritize SoundCloud alternatives
      const videoTitle = extractYouTubeVideoId(query);
      return [
        { name: 'Direct YouTube URL', query: query, priority: 'low' },
        { name: 'SoundCloud Alternative', query: `scsearch:${videoTitle}`, priority: 'high' },
        { name: 'YouTube Search Fallback', query: `ytsearch:${videoTitle}`, priority: 'low' }
      ];
    } else {
      // For search terms, heavily prioritize SoundCloud
      return [
        { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'high' },
        { name: 'SoundCloud + Official', query: `scsearch:${query} official`, priority: 'high' },
        { name: 'SoundCloud + Live', query: `scsearch:${query} live`, priority: 'medium' },
        { name: 'SoundCloud + Remix', query: `scsearch:${query} remix`, priority: 'medium' },
        { name: 'SoundCloud + Cover', query: `scsearch:${query} cover`, priority: 'medium' },
        { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'medium' },
        { name: 'Direct Search', query: query, priority: 'medium' },
        { name: 'YouTube Search', query: `ytsearch:${query}`, priority: 'low' },
        { name: 'YouTube + Official', query: `ytsearch:${query} official`, priority: 'low' }
      ];
    }
  })();

  // Try strategies in priority order
  const priorityOrder = ['high', 'medium', 'low'];
  
  for (const priority of priorityOrder) {
    const strategiesForPriority = searchStrategies.filter(s => s.priority === priority);
    
    for (const strategy of strategiesForPriority) {
      try {
        console.log(`🔍 [${priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query}`);
        const res = await node.rest.resolve(strategy.query);
        
        if (res?.tracks?.length > 0) {
          track = res.tracks[0];
          successfulStrategy = strategy.name;
          console.log(`✅ Success with ${strategy.name}: ${track.info?.title}`);
          break;
        } else {
          console.log(`❌ ${strategy.name} returned no results`);
        }
      } catch (error) {
        console.log(`❌ ${strategy.name} failed: ${error.message}`);
      }
    }
    
    // If found with current priority level, stop searching
    if (track) break;
  }

  // Handle no results with SoundCloud-focused suggestions
  if (!track) {
    const suggestionEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query}" on any platform`)
      .addFields(
        {
          name: '🟠 Try SoundCloud Directly (Recommended)',
          value: '• Go to [soundcloud.com](https://soundcloud.com)\n• Search for your song\n• Copy the URL and paste it here\n• **95% success rate with SoundCloud URLs!**',
          inline: false
        },
        {
          name: '🎵 Alternative Search Terms',
          value: '• Try: `artist song cover`\n• Try: `artist song remix`\n• Try: `artist song live`\n• Try: `artist song acoustic`',
          inline: false
        }
      );

    if (isYouTubeUrl) {
      suggestionEmbed.addFields({
        name: '🔴 YouTube Links Often Blocked',
        value: '• YouTube actively blocks music bots\n• Find the same song on SoundCloud instead\n• Or try searching by the song name',
        inline: false
      });
    }

    suggestionEmbed.setFooter({ text: 'SoundCloud works best! 🟠' });

    return modal.editReply({ embeds: [suggestionEmbed] });
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    await player.playTrack({ track: track.encoded });

    // Success message with source emphasis
    const successColor = successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                         successfulStrategy.includes('YouTube') ? '#FF0000' : '#00FF94';

    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor(successColor)
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription(`✨ **${track.info.title}** ✨\n🎯 Found via: **${successfulStrategy}**`)
        .addFields({
          name: successfulStrategy.includes('SoundCloud') ? '🟠 Played from SoundCloud' : 
                successfulStrategy.includes('YouTube') ? '🔴 Played from YouTube' : '🎵 Played from Other Source',
          value: successfulStrategy.includes('SoundCloud') ? 
                 '*Excellent choice! SoundCloud has great audio quality.*' :
                 '*Lucky! YouTube worked this time.*',
          inline: false
        })
        .setFooter({ text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to Uta\'s setlist! 🎵' })
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
      embeds: [UtaUI.errorEmbed("Failed to play the track. Try again!")]
    });
  }
}

// Helper functions
function extractSpotifyTrackName(url) {
  // Simple extraction - you might want to use Spotify API for better results
  try {
    const trackId = url.split('/track/')[1]?.split('?')[0];
    return trackId || url;
  } catch {
    return url;
  }
}

function extractYouTubeVideoId(url) {
  try {
    const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/')[url.split('/').length - 1];
    return videoId || url;
  } catch {
    return url;
  }
}
