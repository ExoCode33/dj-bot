import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

// DI.FM channels that are known to work - Updated descriptions
const DIFM_CHANNELS = {
  'trance': { name: 'Trance', description: 'Uplifting and euphoric trance music' },
  'house': { name: 'House', description: 'Classic and modern house beats' },
  'techno': { name: 'Techno', description: 'Underground techno sounds' },
  'progressive': { name: 'Progressive', description: 'Progressive electronic music' },
  'dubstep': { name: 'Dubstep', description: 'Heavy bass and electronic drops' },
  'drumandbass': { name: 'Drum & Bass', description: 'Fast breakbeats and bass' }
};

export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Stream DI.FM electronic music channels');

export const execute = async (interaction) => {
  console.log('🎵 Radio command executed');

  // Check if user is in voice channel
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Voice Channel Required')
        .setDescription('You need to be in a voice channel to use the radio!')
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
        .setDescription('I need Connect and Speak permissions in your voice channel!')
        .setFooter({ text: 'Check bot permissions and try again!' })
      ],
      ephemeral: true
    });
  }

  // Check Lavalink connection
  const nodes = interaction.client.shoukaku.nodes;
  const node = nodes.get('railway-node') || nodes.values().next().value;
  
  if (!node || node.state !== 2) {
    return interaction.reply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Music Service Offline')
        .setDescription('The music service is currently unavailable. Please try again later.')
        .addFields({
          name: 'Debug Info',
          value: `Nodes: ${nodes.size}, State: ${node?.state || 'none'}`,
          inline: true
        })
        .setFooter({ text: 'Service will be back online shortly!' })
      ],
      ephemeral: true
    });
  }

  // Create channel selection menu
  const channelOptions = Object.entries(DIFM_CHANNELS).map(([key, channel]) => ({
    label: channel.name,
    description: `${channel.description} - Auto-plays when selected!`,
    value: key
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('difm_select')
    .setPlaceholder('Choose a DI.FM channel... (Auto-plays!)')
    .addOptions(channelOptions);

  const stopButton = new ButtonBuilder()
    .setCustomId('difm_stop')
    .setLabel('Stop Radio')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🛑');

  const statusButton = new ButtonBuilder()
    .setCustomId('difm_status')
    .setLabel('Radio Status')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('📊');

  const embed = new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('📻 DI.FM Electronic Music Radio')
    .setDescription('Select a channel below and it will start playing automatically!')
    .setImage('https://i.imgur.com/YourDIFMBanner.png') // Replace with DI.FM banner image
    .addFields(
      {
        name: '🎵 Available Channels',
        value: Object.values(DIFM_CHANNELS).map(ch => `• **${ch.name}** - ${ch.description}`).join('\n'),
        inline: false
      },
      {
        name: '🔊 Current Voice Channel',
        value: `📍 **${voiceChannel.name}**`,
        inline: true
      },
      {
        name: '✨ How It Works',
        value: '1️⃣ Select a channel below\n2️⃣ Music starts automatically\n3️⃣ Switch channels anytime\n4️⃣ Use Stop when done',
        inline: true
      }
    )
    .setFooter({ text: 'DI.FM - Addictive Electronic Music • Auto-Play Enabled' })
    .setTimestamp();

  const message = await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      new ActionRowBuilder().addComponents(stopButton, statusButton)
    ]
  });

  // Set up collectors
  const collector = message.createMessageComponentCollector({ 
    time: 300000 // 5 minutes
  });

  collector.on('collect', async (componentInteraction) => {
    try {
      if (componentInteraction.customId === 'difm_select') {
        await handleChannelSelection(componentInteraction, interaction);
      } else if (componentInteraction.customId === 'difm_stop') {
        await handleStopRadio(componentInteraction, interaction);
      } else if (componentInteraction.customId === 'difm_status') {
        await handleRadioStatus(componentInteraction, interaction);
      }
    } catch (error) {
      console.error('❌ Radio interaction error:', error);
      if (!componentInteraction.replied && !componentInteraction.deferred) {
        await componentInteraction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription('An error occurred while processing your request.')
            .setFooter({ text: 'Please try again!' })
          ],
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  collector.on('end', () => {
    console.log('📻 Radio collector ended');
  });
};

async function handleChannelSelection(selectInteraction, originalInteraction) {
  const selectedChannel = selectInteraction.values[0];
  const channelInfo = DIFM_CHANNELS[selectedChannel];
  
  console.log(`🎵 User selected DI.FM channel: ${selectedChannel}`);
  
  await selectInteraction.deferReply({ ephemeral: true });

  try {
    // Clean up existing player first
    let existingPlayer = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
    if (existingPlayer) {
      console.log('🧹 Cleaning up existing connection...');
      try {
        await existingPlayer.stopTrack();
        await existingPlayer.destroy();
        originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
      } catch (cleanupError) {
        console.warn('⚠️ Cleanup error:', cleanupError.message);
        originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
      }
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Get voice channel
    const voiceChannel = originalInteraction.member.voice.channel;
    if (!voiceChannel) {
      throw new Error('Voice channel not found');
    }

    // Create new player
    console.log('🔊 Creating new voice connection...');
    const player = await originalInteraction.client.shoukaku.joinVoiceChannel({
      guildId: originalInteraction.guildId,
      channelId: voiceChannel.id,
      shardId: originalInteraction.guild.shardId
    });
    
    // Set volume
    await player.setGlobalVolume(35);
    console.log('✅ Voice connection established');

    // Try different DI.FM stream URLs
    const streamUrls = [
      `http://pub1.di.fm/di_${selectedChannel}`,
      `http://pub2.di.fm/di_${selectedChannel}`,
      `http://pub7.di.fm/di_${selectedChannel}`
    ];

    let success = false;
    let usedUrl = '';

    for (const streamUrl of streamUrls) {
      try {
        console.log(`🔄 Trying stream URL: ${streamUrl}`);
        
        const result = await player.node.rest.resolve(streamUrl);
        console.log(`📊 Stream resolve result:`, {
          loadType: result?.loadType,
          hasData: !!result?.data,
          hasTrack: !!result?.tracks?.length
        });
        
        if (result?.data || (result?.tracks && result.tracks.length > 0)) {
          const track = result.data || result.tracks[0];
          await player.playTrack({ 
            track: track.encoded || track.track,
            options: { noReplace: false }
          });
          
          success = true;
          usedUrl = streamUrl;
          console.log(`✅ Successfully started stream: ${streamUrl}`);
          break;
        }
      } catch (urlError) {
        console.log(`❌ Stream URL failed: ${streamUrl} - ${urlError.message}`);
        continue;
      }
    }

    if (success) {
      await selectInteraction.editReply({
        embeds: [new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('📻 DI.FM Radio Playing!')
          .setDescription(`🎵 **${channelInfo.name}** is now playing in **${voiceChannel.name}**`)
          .addFields(
            {
              name: '🎶 Channel Info',
              value: channelInfo.description,
              inline: false
            },
            {
              name: '🔊 Audio Settings',
              value: `Volume: 35%\nQuality: High\nStatus: 🔴 Live`,
              inline: true
            },
            {
              name: '✨ Controls',
              value: 'Select another channel to switch\nUse Stop button to end playback',
              inline: true
            }
          )
          .setFooter({ text: 'Enjoy your music! 🎵' })
          .setTimestamp()
        ]
      });
    } else {
      throw new Error('All stream URLs failed');
    }

  } catch (error) {
    console.error(`❌ Failed to start DI.FM channel ${selectedChannel}:`, error);
    await selectInteraction.editReply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Stream Failed')
        .setDescription(`Failed to start ${channelInfo.name}. Please try another channel.`)
        .addFields({
          name: 'Error Details',
          value: error.message,
          inline: false
        })
        .setFooter({ text: 'Try selecting a different channel!' })
      ]
    });
  }
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ ephemeral: true });

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  
  if (player) {
    try {
      console.log('🛑 Stopping radio and disconnecting...');
      await player.stopTrack();
      await player.destroy();
      originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
      console.log('✅ Radio stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping radio:', error);
    }
  }

  await buttonInteraction.editReply({
    embeds: [new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🛑 Radio Stopped')
      .setDescription('DI.FM radio has been disconnected. Thanks for listening!')
      .setFooter({ text: 'Come back anytime for more music! 🎵' })
      .setTimestamp()
    ]
  });
}

async function handleRadioStatus(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ ephemeral: true });

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  const isPlaying = player && player.playing;
  
  const embed = new EmbedBuilder()
    .setColor(isPlaying ? '#00FF94' : '#FFA500')
    .setTitle('📊 Radio Status')
    .setThumbnail(originalInteraction.client.user.displayAvatarURL())
    .addFields(
      {
        name: '📻 Current Status',
        value: isPlaying 
          ? `🎵 **Playing DI.FM Radio**\n📍 ${originalInteraction.guild.channels.cache.get(player.voiceId)?.name || 'Unknown Channel'}\n🔊 Volume: 35%\n📡 Quality: High`
          : '⏸️ **Not Playing**\nSelect a channel above to start!',
        inline: false
      },
      {
        name: '🎵 Available Channels',
        value: `${Object.keys(DIFM_CHANNELS).length} electronic music channels`,
        inline: true
      },
      {
        name: '🔧 System Status',
        value: `Audio Engine: ✅ Ready\nConnection: ${player ? '✅ Connected' : '❌ Disconnected'}`,
        inline: true
      }
    )
    .setFooter({ text: 'DI.FM Radio Status • Auto-Play Enabled' })
    .setTimestamp();

  await buttonInteraction.editReply({ embeds: [embed] });
}
