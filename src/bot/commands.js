// src/bot/commands.js - Bot-specific command definitions (internal use only)
import { SlashCommandBuilder } from 'discord.js';

const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";

// Internal redirect command - points users to radio channel
export const radioCommand = {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('🎤 Visit Uta\'s Radio Studio channel'),
  
  async execute(interaction) {
    await interaction.reply({
      content: `🎤 *"Come visit my radio studio!"*\n\nI'm waiting for you at <#${RADIO_CHANNEL_ID}> to play amazing music together! ✨\n\n💡 **Tip:** You can also use \`/uta\` to open the radio interface directly!`,
      ephemeral: true
    });
  }
};
