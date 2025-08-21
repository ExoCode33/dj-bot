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

  buttons(isPaused = false, hasTrack = false) {
    const playPauseLabel = !hasTrack ? 'Play' : (isPaused ? 'Resume' : 'Pause');
    
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Queue)
        .setLabel('Add Song')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎵'),
      new ButtonBuilder()
        .setCustomId(UI.Buttons.PlayPause)
        .setLabel(playPauseLabel)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(isPaused || !hasTrack ? '▶️' : '⏸️'),
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Skip)
        .setLabel('Skip')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️')
        .setDisabled(!hasTrack)
    );
  },

  queueModal() {
    const modal = new ModalBuilder().setCustomId(UI.Modals.QueueModal).setTitle("Add to Uta's setlist");
    const input = new TextInputBuilder()
      .setCustomId(UI.Inputs.Query)
      .setLabel('YouTube/Spotify link or search')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter a YouTube URL, Spotify link, or song name...')
      .setRequired(true);
    return modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
};
