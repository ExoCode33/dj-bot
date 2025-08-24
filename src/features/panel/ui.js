import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { UI } from '../../constants/ui.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory and setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '..', '..', '..', 'images');
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

// Helper function to get image URL
function getImageUrl(filename) {
  const imagePath = path.join(IMAGES_DIR, filename);
  return fs.existsSync(imagePath) ? `${BASE_URL}/images/${filename}` : null;
}

export const UtaUI = {
  panelEmbed(queueState = {}) {
    const { title, author, duration, url } = queueState.current || {};
    
    const embed = new EmbedBuilder()
      .setColor('#FF6B9D') // Uta's signature pink
      .setTitle('🎤 Uta\'s Music Studio')
      .setDescription('*"The world\'s greatest diva at your service!"*\n\n🟠 **SoundCloud recommended** for best results!')
      .setTimestamp();

    // Add LOCAL images if they exist
    const bannerUrl = getImageUrl('uta-banner.png');
    const profileUrl = getImageUrl('uta-profile.png');
    const iconUrl = getImageUrl('uta-icon.png');

    if (bannerUrl) {
      embed.setImage(bannerUrl);
    }
    if (profileUrl) {
      embed.setThumbnail(profileUrl);
    }
    if (iconUrl) {
      embed.setFooter({ 
        text: 'Uta • World\'s #1 Songstress • 🟠 SoundCloud Priority', 
        iconURL: iconUrl
      });
    } else {
      embed.setFooter({ 
        text: 'Uta • World\'s #1 Songstress • 🟠 SoundCloud Priority'
      });
    }

    if (title) {
      embed.addFields(
        { 
          name: '🎵 Now Playing', 
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
