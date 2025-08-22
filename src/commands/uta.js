import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('uta')
  .setDescription('🎤 Open Uta\'s music control panel');

export const execute = async (interaction) => {
  console.log('🎤 Uta command executed');

  // Check if user is in voice channel
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Voice Channel Required')
        .setDescription('You need to be in a voice channel to use Uta\'s music panel!')
      ],
      ephemeral: true
    });
  }

  // Get current player state
  const player = interaction.client.shoukaku.players.get(interaction.guildId);
  const isPlaying = player?.playing || false;
  const isPaused = player?.paused || false;
  const currentTrack = player?.track?.info;

  // Create main panel embed
  const embed = new EmbedBuilder()
    .setColor('#FF6B9D')
    .setTitle('🎤 Uta\'s Music Studio')
    .setDescription('*"The world\'s greatest diva at your service!"*')
    .setTimestamp();

  if (currentTrack) {
    embed.addFields(
      {
        name: '🎵 Now Playing',
        value: `**${currentTrack.title}**\n*by ${currentTrack.author}*`,
        inline: false
      },
      {
        name: '⏱️ Duration',
        value: formatDuration(currentTrack.length),
        inline: true
      },
      {
        name: '🎭 Status',
        value: isPaused ? '⏸️ Paused' : '▶️ Playing',
        inline: true
      }
    );
  } else {
    embed.addFields({
      name: '🎵 Current Performance',
      value: '🌙 *Uta is taking a well-deserved break...*\n\nUse `/radio` to start streaming DI.FM!',
      inline: false
    });
  }

  // Create control buttons
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('uta_play_pause')
      .setLabel(isPaused ? 'Resume' : (isPlaying ? 'Pause' : 'Play'))
      .setStyle(ButtonStyle.Primary)
      .setEmoji(isPaused ? '▶️' : (isPlaying ? '⏸️' : '▶️'))
      .setDisabled(!isPlaying && !isPaused),
    new ButtonBuilder()
      .setCustomId('uta_stop')
      .setLabel('Stop')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('⏹️')
      .setDisabled(!isPlaying && !isPaused),
    new ButtonBuilder()
      .setCustomId('uta_radio')
      .setLabel('Open Radio')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('📻')
  );

  const message = await interaction.reply({
    embeds: [embed],
    components: [buttons]
  });

  // Set up button collector
  const collector = message.createMessageComponentCollector({ 
    time: 300000 // 5 minutes
  });

  collector.on('collect', async (buttonInteraction) => {
    try {
      if (buttonInteraction.user.id !== interaction.user.id) {
        return buttonInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Access Denied')
            .setDescription('Only the original user can control this panel!')
          ],
          ephemeral: true
        });
      }

      const player = interaction.client.shoukaku.players.get(interaction.guildId);

      if (buttonInteraction.customId === 'uta_play_pause') {
        if (!player || !player.track) {
          return buttonInteraction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Nothing Playing')
              .setDescription('No music is currently playing. Use `/radio` to start streaming!')
            ],
            ephemeral: true
          });
        }

        if (player.paused) {
          await player.resume();
          await buttonInteraction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('▶️ Resumed')
              .setDescription('Uta has resumed the performance!')
            ],
            ephemeral: true
          });
        } else {
          await player.pause();
          await buttonInteraction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FFA500')
              .setTitle('⏸️ Paused')
              .setDescription('Uta has paused for a moment...')
            ],
            ephemeral: true
          });
        }

      } else if (buttonInteraction.customId === 'uta_stop') {
        if (player) {
          await player.stopTrack();
          await player.disconnect();
          interaction.client.shoukaku.players.delete(interaction.guildId);
        }

        await buttonInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⏹️ Stopped')
            .setDescription('Uta has ended the performance and left the stage.')
          ],
          ephemeral: true
        });

      } else if (buttonInteraction.customId === 'uta_radio') {
        await buttonInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('📻 Radio Command')
            .setDescription('Use `/radio` to open the DI.FM streaming interface!')
          ],
          ephemeral: true
        });
      }

    } catch (error) {
      console.error('❌ Uta panel error:', error);
      if (!buttonInteraction.replied && !buttonInteraction.deferred) {
        await buttonInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('An error occurred while processing your request.')
          ],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  collector.on('end', () => {
    console.log('🎤 Uta panel collector ended');
  });
};

function formatDuration(ms) {
  if (!ms || ms < 0) return 'Live Stream';
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}
