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
      embeds: [UtaUI.errorEmbed("Please enter a song name, YouTube URL, or SoundCloud link!")],
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

  // Determine if it's a YouTube URL
  const isYouTubeUrl = query.includes('youtube.com') || query.includes('youtu.be');
  
  // Show appropriate searching message
  await modal.editReply({
    embeds: [new (await import('discord.js')).EmbedBuilder()
      .setColor('#FFA502')
      .setTitle('🔍 Uta is searching for your song...')
      .setDescription(
        isYouTubeUrl 
          ? `🔴 **YouTube Link Detected**\n⚠️ *YouTube links may not work due to anti-bot measures*\n🎵 Looking for: **${query}**` 
          : `🎵 Looking for: **${query}**\n🔍 *Trying multiple sources...*`
      )
      .setFooter({ text: 'This may take a moment...' })
    ]
  });

  // Smart search strategy - prioritize non-YouTube sources
  let track = null;
  let successfulStrategy = null;
  
  const searchStrategies = isYouTubeUrl 
    ? [
        // For YouTube URLs, try direct first, then give helpful error
        { name: 'Direct YouTube URL', query: query },
        { name: 'YouTube Search Fallback', query: `ytsearch:${query.split('v=')[1]?.split('&')[0] || query}` }
      ]
    : [
        // For search terms, prioritize SoundCloud and other sources
        { name: 'SoundCloud Search', query: `scsearch:${query}` },
        { name: 'Direct Search', query: query },
        { name: 'SoundCloud + Official', query: `scsearch:${query} official` },
        { name: 'YouTube Search', query: `ytsearch:${query}` },
        { name: 'YouTube + Official', query: `ytsearch:${query} official` },
        { name: 'YouTube + Audio', query: `ytsearch:${query} audio` }
      ];

  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 Trying ${strategy.name}: ${strategy.query}`);
      const res = await node.rest.resolve(strategy.query);
      
      if (res?.tracks?.length > 0) {
        track = res.tracks[0];
        successfulStrategy = strategy.name;
        console.log(`✅ Success with ${strategy.name}: ${track.info?.title}`);
        break;
      }
    } catch (error) {
      console.log(`❌ ${strategy.name} failed: ${error.message}`);
    }
  }

  // Handle no results with context-aware messages
  if (!track) {
    if (isYouTubeUrl) {
      // Special message for YouTube URLs
      return modal.editReply({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FF4757')
          .setTitle('🔴 YouTube Link Blocked!')
          .setDescription(`😔 *"YouTube has blocked access to this video"*\n\n**🎯 Try These Alternatives Instead:**`)
          .addFields(
            {
              name: '🟠 SoundCloud (Recommended)',
              value: '• Search for the same song on SoundCloud\n• Copy SoundCloud URL: `https://soundcloud.com/...`\n• SoundCloud rarely blocks music bots!',
              inline: false
            },
            {
              name: '🔍 Search by Name',
              value: '• Try searching: `Artist - Song Name`\n• Example: `Michael Jackson - Smooth Criminal`\n• Let Uta find it from available sources',
              inline: false
            },
            {
              name: '🎵 Other Sources',
              value: '• Bandcamp: `https://bandcamp.com/...`\n• Direct MP3 links\n• Twitch clips',
              inline: false
            }
          )
          .setFooter({ text: 'YouTube blocking is common - try SoundCloud! 🎶' })
        ]
      });
    } else {
      // General no results message
      return modal.editReply({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FF4757')
          .setTitle('🎭 No results found!')
          .setDescription(`😔 Couldn't find "${query}" on any available platform`)
          .addFields(
            {
              name: '🎯 Try These Tips:',
              value: '• Use simpler search terms\n• Try just the song name\n• Check spelling\n• Add artist name: `Artist - Song`',
              inline: false
            },
            {
              name: '🔗 Direct Links Work Best:',
              value: '• SoundCloud: `https://soundcloud.com/...`\n• Bandcamp: `https://bandcamp.com/...`\n• Direct audio files',
              inline: false
            },
            {
              name: '📱 Pro Tip:',
              value: 'Find the song on SoundCloud and paste the URL!',
              inline: false
            }
          )
          .setFooter({ text: 'SoundCloud has the best compatibility! 🎵' })
      ]
      });
    }
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    await player.playTrack({ track: track.encoded });

    // Success message with source info
    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor('#00FF94')
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription(`✨ **${track.info.title}** ✨\n🎯 Found via: **${successfulStrategy}**`)
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
