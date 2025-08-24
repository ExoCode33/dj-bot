// src/commands/uta.js - Main UTA slash command
import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RADIO_CATEGORIES, RADIO_STATIONS } from '../config/stations.js';

export const data = new SlashCommandBuilder()
  .setName('uta')
  .setDescription('🎤 Open Uta\'s Radio Studio interface');

export const execute = async (interaction) => {
  console.log('🎤 /uta command executed - opening radio interface');

  // Check if user is in voice channel
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Voice Channel Required')
        .setDescription('*"Please join a voice channel first so I can play music for you!"* 🎤')
        .setFooter({ text: 'Join a voice channel and try again!' })
      ],
      ephemeral: true
    });
  }

  // Check if bot can connect to voice
  if (!voiceChannel.permissionsFor(interaction.client.user).has(['Connect', 'Speak'])) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Missing Permissions')
        .setDescription('*"I need permission to join and speak in your voice channel!"* 🎤')
        .setFooter({ text: 'Check bot permissions and try again!' })
      ],
      ephemeral: true
    });
  }

  // Check Lavalink connection
  const nodes = interaction.client.shoukaku?.nodes;
  const node = nodes?.get('railway-node') || nodes?.values().next().value;
  
  if (!node || node.state !== 2) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Music Service Offline')
        .setDescription('*"My audio system isn\'t ready yet... please try again in a moment!"* ✨')
        .addFields({
          name: 'Debug Info',
          value: `Nodes: ${nodes?.size || 0}, State: ${node?.state || 'none'}`,
          inline: true
        })
        .setFooter({ text: 'Service will be back online shortly!' })
      ],
      ephemeral: true
    });
  }

  // Create category selection menu
  const categorySelect = new StringSelectMenuBuilder()
    .setCustomId('uta_category_select')
    .setPlaceholder('🎵 What music style would you like?')
    .addOptions(
      Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
        label: category.name,
        description: category.description,
        value: key
      }))
    );

  const stationSelect = new StringSelectMenuBuilder()
    .setCustomId('uta_station_select')
    .setPlaceholder('🎤 Choose a music style first...')
    .addOptions([{
      label: 'Select music style above',
      description: 'Pick from the menu above',
      value: 'placeholder'
    }])
    .setDisabled(true);

  const stopButton = new ButtonBuilder()
    .setCustomId('uta_stop')
    .setLabel('⏸️ Stop Radio')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🛑')
    .setDisabled(true);

  const statusButton = new ButtonBuilder()
    .setCustomId('uta_status')
    .setLabel('📊 Status')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('🎭');

  // Create the main embed
  const embed = new EmbedBuilder()
    .setColor('#FF6B9D')
    .setTitle('🎤 Uta\'s Radio Studio')
    .setDescription('*"Welcome to my radio studio! Pick any station and I\'ll start playing it immediately!"*\n\n🎵 Choose a music style and station below!')
    .addFields(
      {
        name: '🎶 Music Styles Available',
        value: Object.values(RADIO_CATEGORIES).map(cat => 
          `${cat.name} - ${cat.description}`
        ).join('\n'),
        inline: false
      },
      {
        name: '🔊 Current Voice Channel',
        value: `📍 **${voiceChannel.name}**`,
        inline: true
      },
      {
        name: '✨ How It Works',
        value: '1️⃣ Pick a **music style**\n2️⃣ Choose your **station** → **Auto-plays immediately!**\n3️⃣ Switch stations anytime\n4️⃣ Use **⏸️ Stop** when done',
        inline: true
      }
    )
    .setFooter({ 
      text: 'Uta\'s Radio Studio • Auto-Play Enabled ✨',
      iconURL: interaction.client.user?.displayAvatarURL() 
    })
    .setTimestamp();

  // Send the interface
  const message = await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(categorySelect),
      new ActionRowBuilder().addComponents(stationSelect),
      new ActionRowBuilder().addComponents(stopButton, statusButton)
    ]
  });

  // Set up collectors to handle interactions
  const collector = message.createMessageComponentCollector({ 
    time: 300000 // 5 minutes
  });

  // Store current playing state for this interaction
  const currentlyPlaying = new Map();

  collector.on('collect', async (componentInteraction) => {
    try {
      await handleUtaRadioInteraction(componentInteraction, interaction, currentlyPlaying);
    } catch (error) {
      console.error('❌ Uta radio interaction error:', error);
      if (!componentInteraction.replied && !componentInteraction.deferred) {
        await componentInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('*"Something went wrong... let me try again!"* 🎤')
            .setFooter({ text: 'Please try again!' })
          ],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  collector.on('end', () => {
    console.log('🎤 Uta radio collector ended');
  });
};

// Handler for Uta radio interactions
async function handleUtaRadioInteraction(componentInteraction, originalInteraction, currentlyPlaying) {
  const { SimpleRadioManager } = await import('../features/radio/manager.js');
  const radioManager = new SimpleRadioManager(originalInteraction.client);
  const defaultVolume = parseInt(process.env.DEFAULT_VOLUME) || 35;

  if (componentInteraction.customId === 'uta_category_select') {
    const selectedCategory = componentInteraction.values[0];
    const category = RADIO_CATEGORIES[selectedCategory];
    
    const stationOptions = category.stations
      .filter(stationKey => RADIO_STATIONS[stationKey])
      .map(stationKey => {
        const station = RADIO_STATIONS[stationKey];
        return {
          label: station.name,
          description: `${station.description} (${station.genre})`,
          value: stationKey
        };
      });

    const newStationSelect = new StringSelectMenuBuilder()
      .setCustomId('uta_station_select')
      .setPlaceholder(`🎵 Choose from ${category.name}... (Auto-plays!)`)
      .addOptions(stationOptions)
      .setDisabled(false);

    const components = componentInteraction.message.components.map((row, index) => {
      if (index === 1) {
        return new ActionRowBuilder().addComponents(newStationSelect);
      }
      return ActionRowBuilder.from(row);
    });

    await componentInteraction.update({ components });

  } else if (componentInteraction.customId === 'uta_station_select') {
    const selectedStation = componentInteraction.values[0];
    const station = RADIO_STATIONS[selectedStation];
    
    const voiceChannel = componentInteraction.member?.voice?.channel;
    if (!voiceChannel) {
      return componentInteraction.reply({
        content: '*"Please join a voice channel first so I can play music for you!"* 🎤',
        ephemeral: true
      });
    }

    await componentInteraction.reply({
      content: `🎵 *"Switching to ${station.name}..."*`,
      ephemeral: true
    });

    try {
      // Use the radio manager to switch stations
      const result = await radioManager.switchToStation(
        componentInteraction.guildId, 
        selectedStation, 
        voiceChannel.id
      );

      // Update tracking
      currentlyPlaying.set(componentInteraction.guildId, {
        stationKey: selectedStation,
        stationName: station.name,
        voiceChannelId: voiceChannel.id,
        startedAt: Date.now()
      });

      // Enable stop button
      const components = componentInteraction.message.components.map((row, index) => {
        if (index === 2) { // Stop/Status button row
          return new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('uta_stop')
              .setLabel('⏸️ Stop Radio')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🛑')
              .setDisabled(false),
            new ButtonBuilder()
              .setCustomId('uta_status')
              .setLabel('📊 Status')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🎭')
          );
        }
        return ActionRowBuilder.from(row);
      });

      await originalInteraction.editReply({ components });

      await componentInteraction.editReply({
        content: `🎵 *"Now playing ${station.name}!"* (Volume: ${defaultVolume}%)\n🎧 Playing in **${voiceChannel.name}**`
      });

      // Auto-delete success message after 4 seconds
      setTimeout(async () => {
        try {
          await componentInteraction.deleteReply();
        } catch (err) {}
      }, 4000);

    } catch (error) {
      console.error('❌ Auto-play failed:', error);
      await componentInteraction.editReply({
        content: `*"Sorry, I couldn't play ${station.name}. ${error.message}"*`
      });
    }

  } else if (componentInteraction.customId === 'uta_stop') {
    await componentInteraction.reply({
      content: '*"Stopping the music... Thank you for listening!"* 🎭',
      ephemeral: true
    });

    const player = originalInteraction.client.shoukaku.players.get(componentInteraction.guildId);
    
    if (player) {
      try {
        await player.stopTrack();
        await player.destroy();
        originalInteraction.client.shoukaku.players.delete(componentInteraction.guildId);
      } catch (error) {
        originalInteraction.client.shoukaku.players.delete(componentInteraction.guildId);
      }
    }

    currentlyPlaying.delete(componentInteraction.guildId);

    // Disable stop button
    const components = componentInteraction.message.components.map((row, index) => {
      if (index === 2) { // Stop/Status button row
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('uta_stop')
            .setLabel('⏸️ Stop Radio')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛑')
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('uta_status')
            .setLabel('📊 Status')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎭')
        );
      }
      return ActionRowBuilder.from(row);
    });

    await originalInteraction.editReply({ components });

    setTimeout(async () => {
      try {
        await componentInteraction.deleteReply();
      } catch (err) {}
    }, 3000);

  } else if (componentInteraction.customId === 'uta_status') {
    const playingInfo = currentlyPlaying.get(componentInteraction.guildId);
    const player = originalInteraction.client.shoukaku.players.get(componentInteraction.guildId);

    await componentInteraction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('🌟 Radio Status')
        .addFields(
          {
            name: '🎵 Currently Playing',
            value: playingInfo ? 
              `🎧 **${playingInfo.stationName}**\n📍 ${componentInteraction.guild.channels.cache.get(playingInfo.voiceChannelId)?.name}\n🔊 Volume: ${defaultVolume}%\n⏰ Started: <t:${Math.floor(playingInfo.startedAt / 1000)}:R>` : 
              '✨ Ready to play music!',
            inline: false
          },
          {
            name: '💖 System Status',
            value: `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}\nPlayer: ${player ? '✅ Connected' : '❌ Disconnected'}`,
            inline: false
          },
          {
            name: '🎪 Available Stations',
            value: `${Object.keys(RADIO_CATEGORIES).reduce((total, cat) => total + RADIO_CATEGORIES[cat].stations.length, 0)} stations across ${Object.keys(RADIO_CATEGORIES).length} categories`,
            inline: false
          }
        )
        .setTimestamp()
      ],
      ephemeral: true
    });
  }
}
