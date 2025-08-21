import { SlashCommandBuilder, ComponentType } from 'discord.js';
import { UtaUI } from '../features/panel/ui.js';
import { handleButton } from '../features/panel/handleButtons.js';
import { handleQueueModal } from '../features/panel/handleQueueModal.js';
import { toDisplay } from '../features/music/state.js';

export const data = new SlashCommandBuilder()
  .setName('uta')
  .setDescription("🎤 Open Uta's professional music studio and request performances!");

export const execute = async (interaction) => {
  // Check if there's an existing player and if it has tracks
  const player = interaction.client.shoukaku.players.get(interaction.guildId);
  const hasTrack = !!(player?.track || player?.playing || (player?.queue && player.queue.length > 0));
  const isPaused = player?.paused || false;
  
  // Get current track info for the embed
  const currentTrack = toDisplay(player);

  const message = await interaction.reply({
    embeds: [UtaUI.panelEmbed(currentTrack ? { current: currentTrack } : {})],
    components: [UtaUI.buttons(isPaused, hasTrack)],
    ephemeral: false
  });

  // Create button collector with extended timeout for professional use
  const collector = message.createMessageComponentCollector({ 
    componentType: ComponentType.Button, 
    time: 30 * 60 * 1000 // 30 minutes
  });
  
  collector.on('collect', async (btn) => {
    try {
      await handleButton(btn, interaction);
    } catch (error) {
      console.error('Button handler error:', error);
      try {
        await btn.reply({
          embeds: [UtaUI.errorEmbed("Something went wrong! Please try again.")],
          ephemeral: true
        });
      } catch {} // Ignore if already replied
    }
  });
  
  collector.on('end', async () => {
    try {
      await message.edit({ 
        components: [new (await import('discord.js')).ActionRowBuilder().addComponents(
          new (await import('discord.js')).ButtonBuilder()
            .setCustomId('expired')
            .setLabel('Session Expired - Use /uta again')
            .setStyle(4) // Danger style
            .setEmoji('⏰')
            .setDisabled(true)
        )]
      });
    } catch {} // Ignore if message was deleted
  });

  // Modal handler with better error handling
  const modalHandler = async (i) => {
    if (!i.isModalSubmit()) return;
    if (i.user.id !== interaction.user.id) return;
    
    try {
      await handleQueueModal(i, interaction);
    } catch (error) {
      console.error('Modal handler error:', error);
      try {
        if (!i.replied && !i.deferred) {
          await i.reply({
            embeds: [UtaUI.errorEmbed("Something went wrong processing your request!")],
            ephemeral: true
          });
        }
      } catch {} // Ignore if already replied
    }
  };

  interaction.client.on('interactionCreate', modalHandler);
  
  // Clean up the modal handler when collector ends
  collector.on('end', () => {
    interaction.client.off('interactionCreate', modalHandler);
  });
};
