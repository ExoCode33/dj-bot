import { ChannelType } from 'discord.js';
import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { isAuthorized } from '../../utils/permissions.js';
import { cfg } from '../../config/index.js';

export async function handleButton(btn, rootInteraction) {
  const id = btn.customId;

  if (btn.user.id !== rootInteraction.user.id && !isAuthorized(btn.member, cfg.uta.authorizedRoleId)) {
    return btn.reply({ content: 'You are not authorized.', ephemeral: true });
  }

  const vc = btn.member?.voice?.channel;
  if (!vc || vc.type !== ChannelType.GuildVoice) {
    return btn.reply({ content: 'Join a voice channel first.', ephemeral: true });
  }

  const node = btn.client.shoukaku.getNode();
  let player = btn.client.shoukaku.players.get(btn.guildId);
  if (!player) {
    player = await node.joinChannel({
      guildId: btn.guildId,
      channelId: vc.id,
      shardId: btn.guild.shardId,
      deaf: true
    });
    player.setVolume(cfg.uta.defaultVolume);
  }

  if (id === UI.Buttons.Queue) return btn.showModal(UtaUI.queueModal());

  if (id === UI.Buttons.PlayPause) {
    if (!player?.track && !player?.playing) return btn.reply({ content: 'Nothing is playing.', ephemeral: true });
    if (player.paused) await player.resume(); else await player.pause();
    await btn.deferUpdate();
    return rootInteraction.editReply({ embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], components: [UtaUI.buttons(player.paused)] });
  }

  if (id === UI.Buttons.Skip) {
    if (!player?.track && !player?.playing) return btn.reply({ content: 'Nothing to skip.', ephemeral: true });
    await player.stopTrack();
    await btn.deferUpdate();
    return rootInteraction.editReply({ embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], components: [UtaUI.buttons(player.paused)] });
  }
}
