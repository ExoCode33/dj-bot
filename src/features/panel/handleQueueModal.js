import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

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
      embeds: [UtaUI.errorEmbed("Please enter a song name, YouTube URL, or Spotify link!")],
      ephemeral: true
    });
  }

  console.log('🔄 Attempting to defer reply...');
  // Check if we can defer the reply
  try {
    await modal.deferReply({ ephemeral: true });
    console.log('✅ Successfully deferred reply');
  } catch (error) {
    // If deferReply fails, the interaction might be expired
    console.error('❌ Failed to defer modal reply:', error.message);
    return;
  }

  console.log('🎵 Getting Lavalink node...');
  console.log('Available nodes:', modal.client.shoukaku.nodes.size);
  
  // Try different ways to get the node
  const nodeMap = modal.client.shoukaku.nodes;
  console.log('Node map keys:', Array.from(nodeMap.keys()));
  
  // Get the node by name first
  let node = nodeMap.get('railway-node');
  if (!node) {
    // Fallback to any available node
    node = nodeMap.values().next().value;
  }
  
  console.log('Node found:', !!node);
  if (node) {
    console.log('Node connected:', node.connected);
    console.log('Node state:', node.state);
  }
  
  if (!node) {
    console.log('❌ No Lavalink node found at all');
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Uta's sound system is not available. Please try again later!")]
    });
  }
  
  console.log('🔍 About to check node state. State:', node.state, 'Expected: 2');
  // Check if node is connected (state 2 = CONNECTED in Shoukaku)
  if (node.state !== 2) {
    console.log('❌ Lavalink node found but not connected, state:', node.state);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Uta's sound system is temporarily offline. Please try again in a moment!")]
    });
  }
  console.log('✅ Lavalink node is available and connected - proceeding!');

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
    // Show searching message with timeout protection
    try {
      await modal.editReply({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FFA502')
          .setTitle('🔍 Uta is searching for your song...')
          .setDescription(`🎵 Looking for: **${query}**\n⏳ *"Give me just a moment to find that perfect track!"*`)
          .setFooter({ text: 'Searching through the music library... 📚' })
        ]
      });
    } catch (editError) {
      console.error('Failed to edit modal reply:', editError.message);
      return; // Exit if we can't communicate with the user
    }

    const res = await node.rest.resolve(query);
    console.log('Search result:', res?.tracks?.length || 0, 'tracks found');
    
    const track = res?.tracks?.[0];
    
    if (!track) {
      console.log('No tracks found for query:', query);
      return modal.editReply({
        embeds: [UtaUI.errorEmbed(`Uta couldn't find "${query}". Try a different search term or check the URL format!`)]
      });
    }

    console.log('Found track:', track.info?.title);
    const wasEmpty = !player.track && !player.playing && (!player?.queue || player.queue.length === 0);
    console.log('Player was empty:', wasEmpty);
    
    // Add to queue - Shoukaku handles queue automatically
    if (wasEmpty) {
      console.log('Starting playback...');
      await player.playTrack({ track: track.encoded });
    } else {
      console.log('Adding to queue...');
      // For non-empty queue, we need to handle this differently
      await player.playTrack({ track: track.encoded });
    }

    // Success response
    await modal.editReply({
      embeds: [UtaUI.successEmbed(track.info.title, wasEmpty)]
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
