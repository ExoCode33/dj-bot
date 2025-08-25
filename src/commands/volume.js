// Create this as src/commands/volume.js - For testing volume levels

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('🔊 Test and adjust volume levels')
  .addIntegerOption(option =>
    option.setName('level')
      .setDescription('Volume level (1-200, where 1 is very quiet)')
      .setMinValue(1)
      .setMaxValue(200)
      .setRequired(false)
  );

export const execute = async (interaction) => {
  console.log('🔊 /volume command executed');

  // Check if bot is playing music
  const player = interaction.client.shoukaku?.players.get(interaction.guildId);
  if (!player) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ No Music Playing')
        .setDescription('*"I need to be playing music to test volume levels!"* 🎤')
        .setFooter({ text: 'Start playing music first, then use /volume' })
      ],
      ephemeral: true
    });
  }

  const requestedLevel = interaction.options.getInteger('level');
  
  try {
    // Import the radio manager
    const { SimpleRadioManager } = await import('../features/radio/manager.js');
    const radioManager = new SimpleRadioManager(interaction.client);
    
    if (requestedLevel) {
      // Set specific volume
      const result = await radioManager.testVolume(interaction.guildId, requestedLevel);
      
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('🔊 Volume Adjusted')
          .setDescription(`*"I've set the volume to ${result.actual}%!"* 🎧`)
          .addFields(
            {
              name: '📊 Volume Details',
              value: `Requested: **${result.requested}%**\nActual: **${result.actual}%**\nDefault: **${radioManager.defaultVolume}%**`,
              inline: true
            },
            {
              name: '💡 Volume Guide',
              value: '**1-5%**: Ultra quiet\n**6-15%**: Very quiet\n**16-35%**: Quiet\n**36-70%**: Normal\n**71-100%**: Loud\n**100%+**: Very loud',
              inline: true
            }
          )
          .setFooter({ text: 'Volume changes apply immediately!' })
        ],
        ephemeral: true
      });
      
    } else {
      // Show current volume info
      const currentVolume = radioManager.defaultVolume;
      const guild = interaction.client.guilds.cache.get(interaction.guildId);
      const botMember = guild?.members.me;
      const voiceChannel = botMember?.voice?.channel;
      
      await interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🔊 Volume Status')
          .setDescription('*"Here\'s the current volume information!"* 🎧')
          .addFields(
            {
              name: '📊 Current Settings',
              value: `Default Volume: **${currentVolume}%**\nChannel: **${voiceChannel?.name || 'None'}**\nPlayer: **${player ? 'Active' : 'Inactive'}**`,
              inline: false
            },
            {
              name: '🎛️ Volume Test Options',
              value: 'Use `/volume level:1` for ultra-quiet\nUse `/volume level:5` for very quiet\nUse `/volume level:10` for quiet background\nUse `/volume level:25` for moderate',
              inline: false
            },
            {
              name: '⚙️ Environment Settings',
              value: `DEFAULT_VOLUME: **${process.env.DEFAULT_VOLUME}**\nCurrent effective: **${currentVolume}%**`,
              inline: false
            }
          )
          .setFooter({ text: 'Try different levels to find your perfect volume!' })
        ],
        ephemeral: true
      });
    }
    
  } catch (error) {
    console.error('❌ Volume command error:', error);
    await interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Volume Error')
        .setDescription(`*"Sorry, I couldn't adjust the volume: ${error.message}"* 🎤`)
      ],
      ephemeral: true
    });
  }
};
