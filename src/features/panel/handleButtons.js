import { ChannelType } from 'discord.js';
import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { isAuthorized } from '../../utils/permissions.js';
import { cfg } from '../../config/index.js';

export async function handleButton(btn, rootInteraction) {
  const id = btn.customId;

  // Authorization check with Uta-themed message
  if (btn.user.id !== rootInteraction.user.id && !isAuthorized(btn.member, cfg.uta.authorizedRoleId)) {
    return btn.reply({ 
      embeds: [UtaUI.errorEmbed("Only authorized DJs can control Uta's performance!")],
      ephemeral: true 
    });
  }

  // Voice channel check with Uta-themed message
  const vc = btn.member?.voice?.channel;
  if (!vc || vc.type !== ChannelType.GuildVoice) {
    return btn.reply({ 
      embeds: [UtaUI.errorEmbed("Uta needs you to be in a voice channel to hear her beautiful voice!")],
      ephemeral: true 
    });
  }

  // Get the first available node
  const node = btn.client.shoukaku.nodes.values().next().value;
  
  // Check if Lavalink is available
  if (!node || !node.connected) {
    return btn.reply({ 
      embeds: [UtaUI.errorEmbed("Uta's sound system is temporarily offline. Please try again in a moment!")],
      ephemeral: true 
    });
  }

  let player = btn.client.shoukaku.players.get(btn.guildId);
  if (!player) {
    try {
      player = await node.joinChannel({
        guildId: btn.guildId,
        channelId: vc.id,
        shardId: btn.guild.shardId,
        deaf: true
      });
      player.setVolume(cfg.uta.defaultVolume);
      
      // Welcome message when Uta joins
      await btn.followUp({
        embeds: [new (await import('discord.js')).EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta has entered the building!')
          .setDescription(`✨ *"Hello everyone! I'm ready to perform!"* ✨\n\nUta has joined **${vc.name}** and is ready to sing!`)
          .setFooter({ text: 'Let the show begin! 🎭' })
        ],
        ephemeral: true
      });
    } catch (error) {
      return btn.reply({
        embeds: [UtaUI.errorEmbed("Uta couldn't join the voice channel. Please check the bot's permissions!")],
        ephemeral: true
      });
    }
  }

  if (id === UI.Buttons.Queue) {
    return btn.showModal(UtaUI.queueModal());
  }

  if (id === UI.Buttons.PlayPause) {
    // If no track is playing/queued, show the modal to add a song
    if (!player?.track && !player?.playing && (!player?.queue || player.queue.length === 0)) {
      return btn.showModal(UtaUI.queueModal());
    }
    
    // If there's a track, handle play/pause
    if (player.paused) {
      await player.resume();
    } else {
      await player.pause();
    }
    
    await btn.deferUpdate();
    const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
    return rootInteraction.editReply({
      embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })],
      components: [UtaUI.buttons(player.paused, hasTrack)]
    });
  }

  if (id === UI.Buttons.Skip) {
    if (!player?.track && !player?.playing) {
      return btn.reply({ 
        embeds: [UtaUI.errorEmbed("There's no song to skip! Request something for Uta to perform first.")],
        ephemeral: true 
      });
    }
    
    const currentTrack = toDisplay(player);
    await player.stopTrack();
    
    await btn.reply({
      embeds: [new (await import('discord.js')).EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('⏭️ Uta moves to the next song!')
        .setDescription(currentTrack?.title 
          ? `🎵 Finished: **${currentTrack.title}**\n✨ *"Thank you for listening! Here's the next one!"*`
          : '🎤 *"Let\'s try something new!"*'
        )
        .setFooter({ text: 'The concert continues! 🎭' })
      ],
      ephemeral: true
    });
    
    const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
    return btn.message.edit({ 
      embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], 
      components: [UtaUI.buttons(player.paused, hasTrack)] 
    });
  }
}
