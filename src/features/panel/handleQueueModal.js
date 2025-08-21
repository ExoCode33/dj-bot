import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

export async function handleQueueModal(modal, rootInteraction) {
  if (modal.customId !== UI.Modals.QueueModal) return;

  const query = modal.fields.getTextInputValue(UI.Inputs.Query).trim();
  
  // Enhanced input validation
  if (!query) {
    return modal.reply({
      embeds: [UtaUI.errorEmbed("Please enter a song name, YouTube URL, or Spotify link!")],
      ephemeral: true
    });
  }

  await modal.deferReply({ ephemeral: true });

  const node = modal.client.shoukaku.getNode();
  
  if (!node) {
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Uta's sound system is temporarily offline. Please try again in a moment!")]
    });
  }

  let player = modal.client.shoukaku.players.get(modal.guildId);
  
  if (!player) {
    const member = await modal.guild.members.fetch(modal.user.id);
    const vc = member?.voice?.channel;
    
    if (!vc) {
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Please join a voice channel first so Uta knows where to perform!")]
      });
    }
    
    try {
      player = await node.joinChannel({ 
        guildId: modal.guildId, 
        channelId: vc.id, 
        shardId: modal.guild.shardId, 
        deaf: true 
      });
      player.setVolume(cfg.uta.defaultVolume);
    } catch (error) {
      return modal.editReply({
        embeds: [UtaUI.errorEmbed("Uta couldn't join the voice channel. Please check permissions!")]
      });
    }
  }

  try {
    // Show searching message
    await modal.editReply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor('#FFA502')
        .setTitle('🔍 Uta is searching for your song...')
        .setDescription(`🎵 Looking for: **${query}**\n⏳ *"Give me just a moment to find that perfect track!"*`)
        .setFooter({ text: 'Searching through the music library... 📚' })
      ]
    });

    const res = await node.rest.resolve(query);
    const track = res?.tracks?.[0];
    
    if (!track) {
      return modal.editReply({
        embeds: [UtaUI.errorEmbed(`Uta couldn't find "${query}". Try a different search term or check the URL format!`)]
      });
    }

    const wasEmpty = !player.track && !player.playing && (!player.queue || player.queue.length === 0);
    
    // Add to queue
    if (!player.queue) player.queue = [];
    player.queue.push(track);
    
    // Start playing if nothing was playing
    if (wasEmpty) {
      await player.play();
    }

    // Success response
    await modal.editReply({
      embeds: [UtaUI.successEmbed(track.info.title, wasEmpty)]
    });

    // Update the main panel
    const hasTrack = !!(player?.track || player?.playing || (player.queue && player.queue.length > 0));
    await rootInteraction.editReply({ 
      embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], 
      components: [UtaUI.buttons(player.paused, hasTrack)] 
    });

  } catch (error) {
    console.error('Error in queue modal:', error);
    return modal.editReply({
      embeds: [UtaUI.errorEmbed("Something went wrong while processing your request. Please try again!")]
    });
  }
}
