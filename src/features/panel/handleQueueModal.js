import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

// Smart node selection that prefers public nodes for YouTube
function selectBestNode(client) {
  const nodeMap = client.shoukaku.nodes;
  
  // Get all connected nodes
  const connectedNodes = Array.from(nodeMap.values()).filter(node => node.connected);
  
  if (connectedNodes.length === 0) {
    return null;
  }
  
  // Prefer public nodes for better YouTube access
  const publicNodes = connectedNodes.filter(node => node.name.includes('public'));
  const privateNodes = connectedNodes.filter(node => !node.name.includes('public'));
  
  // Use public node if available, otherwise use private
  const preferredNodes = publicNodes.length > 0 ? publicNodes : privateNodes;
  
  // From preferred nodes, pick the one with lowest load
  return preferredNodes.sort((a, b) => {
    const aLoad = a.stats?.cpu?.systemLoad || 0;
    const bLoad = b.stats?.cpu?.systemLoad || 0;
    return aLoad - bLoad;
  })[0];
}

export async function handleQueueModal(modal, rootInteraction) {
  console.log('🎵 Modal handler called!');
  console.log('Modal customId:', modal.customId);
  console.log('Expected customId:', UI.Modals.QueueModal);
  
  if (modal.customId !== UI.Modals.QueueModal) {
    console.log('❌ Modal customId does not match, returning');
    return;
  }

  console.log('✅ Modal customId matches, processing...');
  const query = modal.fields.getTextInputValue(UI.Inputs.Query).trim();
  console.log('🔍 User query:', query);
  
  // Enhanced input validation
  if (!query) {
    console.log('❌ Empty query provided');
    return modal.reply({
      embeds: [UtaUI.errorEmbed("Please enter a song name, YouTube URL, or SoundCloud link!")],
      ephemeral: true
    });
  }

  console.log('🔄 Attempting to defer reply...');
  // Check if we can defer the reply
  try {
    if (!modal.deferred && !modal.replied) {
      await modal.deferReply({ ephemeral: true });
      console.log('✅ Successfully deferred reply');
    } else {
      console.log('⚠️ Modal already deferred or replied');
    }
  } catch (error) {
    // If deferReply fails, the interaction might be expired
    console.error('❌ Failed to defer modal reply:', error.message);
    return;
  }

  console.log('🎵 Getting best Lavalink node...');
  console.log('Available nodes:', modal.client.shoukaku.nodes.size);
  
  // Use smart node selection
  const node = selectBestNode(modal.client);
  
  if (!node) {
    console.log('❌ No Lavalink nodes available');
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("No Lavalink nodes available. Please try again later!")]
    });
  }
  
  console.log(`🎵 Using node: ${node.name} (${node.connected ? 'connected' : 'disconnected'})`);
  console.log('Node state:', node.state);

  console.log('🎮 Getting player...');
  let player = modal.client.shoukaku.players.get(modal.guildId);
  console.log('Player exists:', !!player);
  
  if (!player) {
    console.log('🎤 No existing player, creating new one...');
    const member = await modal.guild.members.fetch(modal.user.id);
    const vc = member?.voice?.channel;
    console.log('User voice channel:', vc?.name || 'none');
    
    if (!vc) {
      console.log('❌ User not in voice channel');
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Please join a voice channel first so Uta knows where to perform!")]
      });
    }
    
    try {
      console.log('🔗 Creating new player for channel:', vc.name);
      player = await modal.client.shoukaku.joinVoiceChannel({ 
        guildId: modal.guildId, 
        channelId: vc.id, 
        shardId: modal.guild.shardId 
      });
      await player.setGlobalVolume(cfg.uta.defaultVolume);
      console.log('✅ Player created successfully');
    } catch (error) {
      console.error('❌ Failed to create player:', error);
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Uta couldn't join the voice channel. Please check permissions!")]
      });
    }
  }

  console.log('🔍 Starting search process...');

  try {
    // Show searching message with node info
    try {
      await modal.editReply({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FFA502')
          .setTitle('🔍 Uta is searching for your song...')
          .setDescription(`🎵 Looking for: **${query}**\n🌐 Using node: **${node.name}**\n⏳ *"Let me find that perfect track!"*`)
          .setFooter({ text: 'Trying multiple search strategies... 📚' })
        ]
      });
    } catch (editError) {
      console.error('Failed to edit modal reply:', editError.message);
      return; // Exit if we can't communicate with the user
    }

    // Try multiple search strategies with smart ordering
    let track = null;
    let successfulStrategy = null;
    
    const searchStrategies = [
      { name: 'Direct URL', query: query },
      { name: 'YouTube Search', query: `ytsearch:${query}` },
      { name: 'SoundCloud Search', query: `scsearch:${query}` },
      { name: 'YouTube + Official', query: `ytsearch:${query} official` },
      { name: 'YouTube + Audio', query: `ytsearch:${query} audio` },
      { name: 'SoundCloud + Official', query: `scsearch:${query} official` }
    ];

    for (const strategy of searchStrategies) {
      try {
        console.log(`🔍 [${node.name}] Trying ${strategy.name}: ${strategy.query}`);
        const res = await node.rest.resolve(strategy.query);
        console.log(`Search result for "${strategy.name}":`, res?.tracks?.length || 0, 'tracks found');
        
        if (res?.tracks?.length > 0) {
          track = res.tracks[0];
          successfulStrategy = strategy.name;
          console.log(`✅ [${node.name}] Success with ${strategy.name}: ${track.info?.title}`);
          break;
        } else {
          console.log(`❌ [${node.name}] ${strategy.name} returned no results`);
        }
      } catch (error) {
        console.log(`❌ [${node.name}] ${strategy.name} failed: ${error.message}`);
        continue; // Try next strategy
      }
    }

    // If no track found, provide helpful error with node info
    if (!track) {
      console.log('❌ No tracks found with any search strategy on any node');
      return modal.editReply({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FF4757')
          .setTitle('🎭 No results found!')
          .setDescription(`😔 Couldn't find "${query}" on any platform\n🌐 Searched using: **${node.name}**`)
          .addFields(
            {
              name: '🎯 Try These Instead:',
              value: '**Direct URLs (Most Reliable):**\n' +
                     '🔴 `https://youtube.com/watch?v=...`\n' +
                     '🟠 `https://soundcloud.com/...`\n' +
                     '🔵 `https://bandcamp.com/...`',
              inline: false
            },
            {
              name: '🔍 Search Tips:',
              value: '• Use artist + song name\n' +
                     '• Try simpler terms\n' +
                     '• Check spelling\n' +
                     '• SoundCloud often works better',
              inline: false
            },
            {
              name: '🌐 Node Status:',
              value: `Current: **${node.name}**\n` +
                     `Connected nodes: **${Array.from(modal.client.shoukaku.nodes.values()).filter(n => n.connected).length}**`,
              inline: false
            }
          )
          .setFooter({ text: 'Direct links work best! 🎵' })
      ]
      });
    }

    console.log('Found track:', track.info?.title);
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    console.log('Player was empty:', wasEmpty);
    
    // Play the track
    console.log('🎵 Starting playback...');
    await player.playTrack({ track: track.encoded });

    // Success with detailed info
    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor('#00FF94')
        .setTitle(wasEmpty ? '🎤 Now Playing!' : '🎵 Added to Queue!')
        .setDescription(`✨ **${track.info.title}** ✨\n🎯 Found via: **${successfulStrategy}**\n🌐 Node: **${node.name}**`)
        .setFooter({ text: wasEmpty ? 'Enjoy the music! 🎭' : 'Added to Uta\'s setlist! 🎵' })
      ]
    });

    // Update the main panel with error handling
    try {
      const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
      await rootInteraction.editReply({ 
        embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], 
        components: [UtaUI.buttons(player.paused, hasTrack)] 
      });
    } catch (panelError) {
      console.error('Failed to update main panel:', panelError.message);
      // Don't return error to user since the song was successfully added
    }

  } catch (error) {
    console.error('Error in queue modal:', error);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Something went wrong while processing your request. Please try again!")]
    });
  }
}
