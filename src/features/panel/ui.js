import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { UI } from '../../constants/ui.js';

export const UtaUI = {
  panelEmbed(queueState = {}) {
    const { title, author, duration, url } = queueState.current || {};
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B9D') // Uta's signature pink
      .setTitle('🎤 Uta\'s Music Studio')
      .setDescription('*"The world\'s greatest diva at your service!"*\n\n🟠 **SoundCloud recommended** for best results!')
      .setThumbnail('https://i.imgur.com/placeholder.png') // Add Uta image URL here
      .setFooter({ 
        text: 'Uta • World\'s #1 Songstress • 🟠 SoundCloud Priority', 
        iconURL: 'https://i.imgur.com/placeholder.png' // Add small Uta icon here
      })
      .setTimestamp();

    if (title) {
      embed.addFields(
        { 
          name: '🎵 Now Performing', 
          value: `**[${title}](${url || 'https://soundcloud.com/'})**\n*Uta\'s magical voice brings this song to life!*`,
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
          name: '🎪 Recommended Sources',
          value: '🟠 **SoundCloud** (Best success rate)\n🔴 **YouTube** (Often blocked)\n🟢 **Spotify** (Links only)',
          inline: false
        },
        {
          name: '💡 Pro Tip',
          value: 'Search on [SoundCloud](https://soundcloud.com) first and paste the URL for guaranteed playback!',
          inline: false
        }
      );
    }

    return embed;
  },

  buttons(isPaused = false, hasTrack = false) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Queue)
        .setLabel('Add Song')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🟠'), // SoundCloud orange theme
      new ButtonBuilder()
        .setCustomId(UI.Buttons.PlayPause)
        .setLabel(hasTrack ? (isPaused ? 'Resume' : 'Pause') : 'Play')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(hasTrack ? (isPaused ? '▶️' : '⏸️') : '▶️'),
      new ButtonBuilder()
        .setCustomId(UI.Buttons.Skip)
        .setLabel('Skip')
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
      .setLabel('🟠 What would you like Uta to perform?')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('🟠 SoundCloud URL (best) or song name... ♪')
      .setMaxLength(500)
      .setRequired(true);
      
    return modal.addComponents(new ActionRowBuilder().addComponents(input));
  },

  // Enhanced success response embed with source highlighting
  successEmbed(trackTitle, isFirstInQueue = false, source = '') {
    const isFromSoundCloud = source.toLowerCase().includes('soundcloud');
    const color = isFromSoundCloud ? '#FF6B35' : '#00FF94'; // Orange for SoundCloud, green for others
    
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(isFirstInQueue ? '🎤 Uta is now performing!' : '🎵 Added to Uta\'s setlist!')
      .setDescription(isFirstInQueue 
        ? `✨ **${trackTitle}** ✨\n*Uta has taken the stage and begun her performance!*`
        : `🎶 **${trackTitle}** 🎶\n*Added to the queue! Uta will perform this next.*`
      )
      .setTimestamp();

    if (isFromSoundCloud) {
      embed.addFields({
        name: '🟠 Played from SoundCloud',
        value: '*Excellent choice! SoundCloud provides reliable, high-quality audio for Uta\'s performances.*',
        inline: false
      });
      embed.setFooter({ text: 'SoundCloud = Best Experience! 🟠✨' });
    } else {
      embed.setFooter({ text: 'Enjoy the show! ✨' });
    }
      
    return embed;
  },

  // Enhanced error embed with SoundCloud suggestions
  errorEmbed(message, showSoundCloudTip = true) {
    const embed = new EmbedBuilder()
      .setColor('#FF4757') // Error red
      .setTitle('🎭 Uta encountered an issue!')
      .setDescription(`😔 *${message}*`)
      .setTimestamp();

    if (showSoundCloudTip) {
      embed.addFields({
        name: '💡 Try SoundCloud Instead!',
        value: '🟠 Go to [soundcloud.com](https://soundcloud.com)\n🔍 Search for your song\n📋 Copy the URL and paste it here\n✅ **95% success rate guaranteed!**',
        inline: false
      });
      embed.setFooter({ text: 'SoundCloud works best! 🟠' });
    } else {
      embed.setFooter({ text: 'Uta believes in you! Try again! 💪' });
    }
      
    return embed;
  }
};
