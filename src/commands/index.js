// src/commands/index.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { RADIO_CATEGORIES } from '../config/stations.js';

const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";

export const radioCommand = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('🎤 Visit Uta\'s Radio Studio'),
  
  async execute(interaction) {
    await interaction.reply({
      content: `🎤 *"Come visit my radio studio!"*\n\nI'm waiting for you at <#${RADIO_CHANNEL_ID}> to play amazing music together! ✨`,
      ephemeral: true
    });
  }
};

export const utaCommand = {
  data: new SlashCommandBuilder()
    .setName('uta')
    .setDescription('💕 About Uta, the world\'s greatest diva'),
  
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FF6B9D')
      .setTitle('🎤 Hi! I\'m Uta!')
      .setDescription(`*"I want to make everyone happy through music!"*\n\n**Visit my radio studio: <#${RADIO_CHANNEL_ID}>**`)
      .addFields(
        {
          name: '✨ About Me',
          value: `🌟 World's beloved diva\n🎭 Daughter of Red-Haired Shanks\n🎵 Music lover extraordinaire\n💕 Voice that brings joy to everyone`,
          inline: false
        },
        {
          name: '🎵 My Radio Studio Features',
          value: `• ${Object.keys(RADIO_CATEGORIES).length} music styles\n• ${Object.values(RADIO_CATEGORIES).reduce((total, cat) => total + cat.stations.length, 0)} radio stations\n• Instant auto-play when you select a station!\n• Easy station switching anytime`,
          inline: false
        }
      )
      .setFooter({ text: 'With love, Uta ♪ Let\'s enjoy music together! 💕' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
