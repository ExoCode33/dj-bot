import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { UI } from '../../constants/ui.js';

export const UtaUI = {
  panelEmbed(queueState = {}) {
    const { title, author, duration, url } = queueState.current || {};
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B9D') // Uta's signature pink
      .setTitle('🎤 Uta\'s Music Studio')
      .setDescription('*"The world\'s greatest diva at your service!"*\n\n🎵 Queue your favorite songs and let me perform for you!')
      .setThumbnail('https://i.imgur.com/placeholder.png') // Add Uta image URL here
      .setFooter({ 
        text: 'Uta • World\'s #1 Songstress', 
        iconURL: 'https://i.imgur.com/placeholder.png' // Add small Uta icon here
      })
      .setTimestamp();

    if (title) {
      embed.addFields(
        { 
          name: '🎵 Now Performing', 
          value: `**[${title}](${url || 'https://youtu.be/'})**\n*Uta\'s magical voice brings this song to life!*`,
          inline: false
        },
        { 
          name: '🎨 Artist', 
          value: `\`${author || 'Unknown Artist'}\``, 
          inline: true 
        },
        { 
          name: '⏱️ Duration', 
          value: `\`${duration || 'Live'}\``, 
          inline: true 
        },
        { 
          name: '🎭 Performance Status', 
          value: '✨ **LIVE PERFORMANCE** ✨', 
          inline: true 
        }
      );
    } else {
      embed.addFields(
        { 
          name: '🎵 Current Performance', 
          value: '🌙 *Uta is taking a well-deserved break...*\n\nRequest a song to hear her incredible voice!',
          inline: false
        },
        {
          name: '🎪 Available Platforms',
          value: '🔴 **YouTube** • 🟢 **Spotify**\n*Just paste a link or search by name!*',
          inline: false
        }
      );
    }

    return embed;
  },

  buttons(isPaused = false, hasTrack = false) {
    const playPauseLabel = !hasTrack ? 'Request Song' : (isPaused ? 'Resume Show' : 'Pause Show');
    const playPauseEmoji = !hasTrack ? '🎤' : (isPaused ? '▶️' : '⏸️');
    
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Queue)
        .setLabel('Song Request')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎵'),
      new ButtonBuilder()
        .setCustomId(UI.Buttons.PlayPause)
        .setLabel(playPauseLabel)
        .setStyle(hasTrack ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setEmoji(playPauseEmoji),
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Skip)
        .setLabel('Next Song')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('⏭️')
        .setDisabled(!hasTrack)
    );
  },

  queueModal() {
    const modal = new ModalBuilder()
      .setCustomId(UI.Modals.QueueModal)
      .setTitle('🎤 Uta\'s Song Request Booth');
      
    const input = new TextInputBuilder()
      .setCustomId(UI.Inputs.Query)
      .setLabel('🎵 What would you like Uta to perform?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter YouTube URL, Spotify link, or song name... ♪')
      .setMaxLength(500)
      .setRequired(true);
      
    return modal.addComponents(new ActionRowBuilder().addComponents(input));
  },

  // New success response embed
  successEmbed(trackTitle, isFirstInQueue = false) {
    const embed = new EmbedBuilder()
      .setColor('#00FF94') // Success green
      .setTitle(isFirstInQueue ? '🎤 Uta is now performing!' : '🎵 Added to Uta\'s setlist!')
      .setDescription(isFirstInQueue 
        ? `✨ **${trackTitle}** ✨\n*Uta has taken the stage and begun her performance!*`
        : `🎶 **${trackTitle}** 🎶\n*Added to the queue! Uta will perform this next.*`
      )
      .setFooter({ text: 'Enjoy the show! ✨' })
      .setTimestamp();
      
    return embed;
  },

  // Error embed
  errorEmbed(message) {
    const embed = new EmbedBuilder()
      .setColor('#FF4757') // Error red
      .setTitle('🎭 Uta encountered an issue!')
      .setDescription(`😔 *${message}*\n\nPlease try again with a different song or check your request format.`)
      .setFooter({ text: 'Uta believes in you! Try again! 💪' })
      .setTimestamp();
      
    return embed;
  }
};
