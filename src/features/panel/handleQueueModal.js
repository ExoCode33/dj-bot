import { UI } from '../../constants/ui.js';
import { UtaUI } from './ui.js';
import { toDisplay } from '../music/state.js';
import { cfg } from '../../config/index.js';

export async function handleQueueModal(modal, rootInteraction) {
  if (modal.customId !== UI.Modals.QueueModal) return;

  const query = modal.fields.getTextInputValue(UI.Inputs.Query);
  await modal.deferReply({ ephemeral: true });

  const node = modal.client.shoukaku.getNode();
  let player = modal.client.shoukaku.players.get(modal.guildId);
  if (!player) {
    const member = await modal.guild.members.fetch(modal.user.id);
    const vc = member?.voice?.channel;
    if (!vc) return modal.editReply('Join a voice channel first.');
    player = await node.joinChannel({ guildId: modal.guildId, channelId: vc.id, shardId: modal.guild.shardId, deaf: true });
    player.setVolume(cfg.uta.defaultVolume);
  }

  const res = await node.rest.resolve(query);
  const track = res?.tracks?.[0];
  if (!track) return modal.editReply('No results found.');

  player.queue.push(track);
  if (!player.playing) await player.play();

  await modal.editReply(`♪ Added: **${track.info.title}**`);
  return rootInteraction.editReply({ embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })], components: [UtaUI.buttons(player.paused)] });
}
