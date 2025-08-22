import { SlashCommandBuilder } from 'discord.js';
import { UtaUI } from '../features/panel/ui.js';
import { handleButton } from '../features/panel/handleButtons.js';
import { handleQueueModal } from '../features/panel/handleQueueModal.js';
import { toDisplay } from '../features/music/state.js';
import { isAuthorized } from '../utils/permissions.js';
import { cfg } from '../config/index.js';

export const data = new SlashCommandBuilder()
  .setName('uta')
  .setDescription('🎤 Open Uta\'s music control panel');

export const execute = async (interaction) => {
  // Authorization check
  if (!isAuthorized(interaction.member, cfg.uta.authorizedRoleId)) {
    return interaction.reply({
      embeds: [UtaUI.errorEmbed("Only authorized DJs can control Uta's performance!", false)],
      ephemeral: true
    });
  }

  // Get current player state
  const player = interaction.client.shoukaku.players.get(interaction.guildId);
  const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));

  // Send the main panel
  const message = await interaction.reply({
    embeds: [UtaUI.panelEmbed({ current: toDisplay(player) })],
    components: [UtaUI.buttons(player?.paused || false, hasTrack)]
  });

  // Set up component collectors
  const buttonCollector = message.createMessageComponentCollector({
    filter: (i) => i.isButton(),
    time: 600000 // 10 minutes
  });

  const modalCollector = interaction.client.on('interactionCreate', async (modalInteraction) => {
    if (!modalInteraction.isModalSubmit()) return;
    if (modalInteraction.message?.id !== message.id) return;
    
    await handleQueueModal(modalInteraction, interaction);
  });

  buttonCollector.on('collect', async (buttonInteraction) => {
    await handleButton(buttonInteraction, interaction);
  });

  buttonCollector.on('end', () => {
    console.log('🎤 Uta panel collector ended');
  });
};
