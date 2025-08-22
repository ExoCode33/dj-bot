// src/features/panel/handleQueueModal.js
// Enhanced version with better SoundCloud handling and fallback strategies

import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

// SoundCloud Client ID (public, rotates occasionally)
const SOUNDCLOUD_CLIENT_IDS = [
  'iZIs9mchVcX5lhVRyQGGAYlNPVldzAoX',
  'z8LRYFPM4UK5MMLaBe9vixfph5kqNA25',
  '2t9loNQH90kzJcsFCODdigxfp325aq4z'
];

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
    spotify: /spotify\.com\/track\//i,
    bandcamp: /\.bandcamp\.com/i,
    directFile: /\.(mp3|wav|ogg|m4a|flac|webm|mp4)$/i
  };

  const detectedSource = Object.entries(urlPatterns).find(([_, pattern]) => pattern.test(query))?.[0];

  // Show searching message with source info
  await modal.editReply({
    embeds: [new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF6B35')
      .setTitle('🔍 Uta is searching for your song...')
      .setDescription(
        detectedSource === 'soundcloud' 
          ? `🟠 **SoundCloud Detected**\n🎵 Processing: **${query}**\n✨ *Best source for reliability!*`
          : detectedSource
          ? `🎵 **${detectedSource.charAt(0).toUpperCase() + detectedSource.slice(1)} Detected**\n🔄 Processing: **${query}**`
          : `🎵 Searching for: **${query}**\n🔄 *Prioritizing SoundCloud...*`
      )
      .setFooter({ text: 'Optimized for SoundCloud playback 🟠' })
    ]
  });

  // Enhanced search strategies with SoundCloud priority
  let searchStrategies = [];
  
  if (detectedSource === 'soundcloud') {
    // For SoundCloud URLs - try multiple approaches
    searchStrategies = [
      { name: 'Direct SoundCloud URL', query: query, priority: 'critical' },
      { name: 'SoundCloud HTTP', query: query.replace('https://', 'http://'), priority: 'high' },
      { name: 'SoundCloud API', query: await resolveSoundCloudUrl(query), priority: 'high' },
      { name: 'SoundCloud Search Extract', query: `scsearch:${extractSoundCloudInfo(query)}`, priority: 'medium' }
    ];
  } else if (detectedSource === 'directFile') {
    // Direct audio file URLs
    searchStrategies = [
      { name: 'Direct HTTP Stream', query: query, priority: 'critical' }
    ];
  } else if (!detectedSource) {
    // Text search - prioritize SoundCloud
    searchStrategies = [
      { name: 'SoundCloud Search', query: `scsearch:${query}`, priority: 'critical' },
      { name: 'SoundCloud Official', query: `scsearch:${query} official`, priority: 'high' },
      { name: 'SoundCloud Remix', query: `scsearch:${query} remix`, priority: 'medium' },
      { name: 'Bandcamp Search', query: `bcsearch:${query}`, priority: 'medium' },
      { name: 'Direct Search', query: query, priority: 'low' },
      { name: 'YouTube Fallback', query: `ytsearch:${query}`, priority: 'low' }
    ];
  } else {
    // Other sources - still try SoundCloud first
    const searchTerms = extractSearchTerms(query);
    searchStrategies = [
      { name: `Direct ${detectedSource} URL`, query: query, priority: 'high' },
      { name: 'SoundCloud Alternative', query: `scsearch:${searchTerms}`, priority: 'high' },
      { name: 'Bandcamp Alternative', query: `bcsearch:${searchTerms}`, priority: 'medium' },
      { name: 'YouTube Search', query: `ytsearch:${searchTerms}`, priority: 'low' }
    ];
  }

  // Execute search with enhanced retry logic
  let track = null;
  let successfulStrategy = null;
  let attempts = [];
  
  // Sort strategies by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  searchStrategies.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  for (const strategy of searchStrategies) {
    try {
      console.log(`🔍 [${strategy.priority.toUpperCase()}] Trying ${strategy.name}: ${strategy.query.substring(0, 100)}`);
      
      const res = await searchWithRetry(node, strategy.query, strategy.priority === 'critical' ? 3 : 2);
      
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

  // No results found - provide detailed help
  if (!track) {
    const failedEmbed = new (await import('discord.js')).EmbedBuilder()
      .setColor('#FF4757')
      .setTitle('🎭 No results found!')
      .setDescription(`😔 Couldn't find "${query.substring(0, 100)}" on any platform`)
      .addFields(
        {
          name: '🟠 Best Solution: Use SoundCloud Directly',
          value: [
            '1️⃣ Go to [soundcloud.com](https://soundcloud.com)',
            '2️⃣ Search for your song there',
            '3️⃣ Copy the URL from your browser',
            '4️⃣ Paste it here for guaranteed playback!'
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Search Attempts',
          value: attempts.slice(0, 5).map(a => 
            `${a.success ? '✅' : '❌'} ${a.strategy} (${a.priority})`
          ).join('\n') || 'No attempts logged',
          inline: false
        },
        {
          name: '💡 Alternative Options',
          value: [
            '• Try searching with "artist - song title"',
            '• Use direct audio file URLs (.mp3, .wav)',
            '• Check Bandcamp for indie/underground music',
            '• Ensure the song exists on streaming platforms'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'SoundCloud URLs have the highest success rate! 🟠' });

    return modal.editReply({ embeds: [failedEmbed] });
  }

  // Play the track
  try {
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    
    await player.playTrack({ track: track.encoded });

    // Success message
    const sourceColor = successfulStrategy.includes('SoundCloud') ? '#FF6B35' : 
                       successfulStrategy.includes('Bandcamp') ? '#629AA0' : 
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
          name: `🎵 Played via ${successfulStrategy}`,
          value: successfulStrategy.includes('SoundCloud') 
            ? '*Excellent! SoundCloud provides the most reliable playback.*'
            : '*Successfully found and ready to play!*',
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

async function resolveSoundCloudUrl(url) {
  // Try to resolve SoundCloud URL using API
  try {
    for (const clientId of SOUNDCLOUD_CLIENT_IDS) {
      const apiUrl = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(url)}&client_id=${clientId}`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.permalink_url) {
          return data.permalink_url;
        }
      }
    }
  } catch (error) {
    console.error('SoundCloud API resolution failed:', error);
  }
  return url;
}

function extractSoundCloudInfo(url) {
  try {
    const parts = url.split('/').filter(p => p);
    if (parts.length >= 2) {
      const artist = parts[parts.length - 2].replace(/[-_]/g, ' ');
      const track = parts[parts.length - 1].split('?')[0].replace(/[-_]/g, ' ');
      return `${artist} ${track}`;
    }
  } catch {}
  return url;
}

function extractSearchTerms(url) {
  // Extract search terms from various URL formats
  try {
    if (url.includes('spotify.com')) {
      return url.split('/track/')[1]?.split('?')[0] || url;
    }
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return url.match(/[?&]v=([^&]+)/)?.[1] || url;
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
