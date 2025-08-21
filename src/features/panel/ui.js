import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { UI } from '../../constants/ui.js';

export const UtaUI = {
  panelEmbed(queueState = {}) {
    const { title, author, duration, url } = queueState.current || {};
    const e = new EmbedBuilder()
      .setTitle('♪ Uta Control Panel')
      .setDescription('Queue songs, play/pause, skip.\nSupports YouTube & Spotify.')
      .setFooter({ text: 'Uta DJ' });

    if (title) {
      e.addFields(
        { name: 'Now Playing', value: `[${title}](${url || 'https://youtu.be/'})` },
        { name: 'Channel', value: author || 'Unknown', inline: true },
        { name: 'Duration', value: duration || 'Live', inline: true }
      );
    } else {
      e.addFields({ name: 'Now Playing', value: '_(silence)_' });
    }
    return e;
  },

  buttons(isPaused = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(UI.Buttons.Queue).setLabel('Queue').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(UI.Buttons.PlayPause).setLabel(isPaused ? 'Resume' : 'Pause').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(UI.Buttons.Skip).setLabel('Skip').setStyle(ButtonStyle.Secondary)
    );
  },

  queueModal() {
    const modal = new ModalBuilder().setCustomId(UI.Modals.QueueModal).setTitle("Add to Uta's setlist");
    const input = new TextInputBuilder()
      .setCustomId(UI.Inputs.Query)
      .setLabel('YouTube/Spotify link or search')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    return modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
};
