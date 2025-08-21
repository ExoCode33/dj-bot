import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { UtaUI } from '../features/panel/ui.js';
import { handleButton } from '../features/panel/handleButtons.js';
import { handleQueueModal } from '../features/panel/handleQueueModal.js';

export const data = new SlashCommandBuilder().setName('uta').setDescription("Open Uta's DJ panel");

export const execute = async (interaction) => {
  // Check if there's an existing player and if it has tracks
  const player = interaction.client.shoukaku.players.get(interaction.guildId);
  const hasTrack = !!(player?.track || player?.playing || (player.queue && player.queue.length > 0));
  const isPaused = player?.paused || false;

  const message = await interaction.reply({
    embeds: [UtaUI.panelEmbed()],
    components: [UtaUI.buttons(isPaused, hasTrack)],
    ephemeral: false
  });

  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15 * 60 * 1000 });
  collector.on('collect', async (btn) => { try { await handleButton(btn, interaction); } catch {} });
  collector.on('end', async () => { try { await message.edit({ components: [] }); } catch {} });

  interaction.client.on('interactionCreate', async (i) => {
    if (!i.isModalSubmit()) return;
    if (i.user.id !== interaction.user.id) return;
    try { await handleQueueModal(i, interaction); } catch {}
  });
};
