import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, getVoiceConnection } from '@discordjs/voice';
import { createReadStream } from 'fs';
import { get } from 'https';
import { cfg } from '../config/index.js';
import { isAuthorized } from '../utils/permissions.js';

// Radio channels with direct HTTP streams
const RADIO_CHANNELS = {
  'trance': { 
    name: 'Trance', 
    description: 'Uplifting and euphoric trance music',
    streams: [
      'https://ice1.somafm.com/groovesalad-256-mp3',
      'https://streams.ilovemusic.de/iloveradio7.mp3'
    ]
  },
  'house': { 
    name: 'House', 
    description: 'Classic and modern house beats',
    streams: [
      'https://ice1.somafm.com/dronezone-256-mp3',
      'https://streams.ilovemusic.de/iloveradio11.mp3'
    ]
  },
  'techno': { 
    name: 'Techno', 
    description: 'Underground techno sounds',
    streams: [
      'https://ice1.somafm.com/beatblender-256-mp3',
      'https://streams.ilovemusic.de/iloveradio15.mp3'
    ]
  },
  'dubstep': { 
    name: 'Dubstep', 
    description: 'Heavy bass and electronic drops',
    streams: [
      'https://ice1.somafm.com/digitalis-256-mp3',
      'https://ice1.somafm.com/bagel-256-mp3'
    ]
  },
  'ambient': { 
    name: 'Ambient', 
    description: 'Atmospheric soundscapes',
    streams: [
      'https://ice1.somafm.com/deepspaceone-256-mp3',
      'https://ice1.somafm.com/spacestation-256-mp3'
    ]
  },
  'progressive': { 
    name: 'Progressive', 
    description: 'Progressive electronic music',
    streams: [
      'https://ice1.somafm.com/spacestation-256-mp3',
      'https://ice1.somafm.com/lush-256-mp3'
    ]
  }
};

// Store active players
const activeConnections = new Map();

export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Stream electronic music radio channels')
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Browse channels by category')
      .setRequired(false)
      .addChoices(
        { name: 'All Channels', value: 'all' }
      )
  );

export const execute = async (interaction) => {
  console.log('====== DIRECT RADIO COMMAND ======');
  
  // Authorization check
  if (!isAuthorized(interaction.member, cfg.uta.authorizedRoleId)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Only authorized DJs can control the radio!")],
      ephemeral: true
    });
  }

  // Voice channel check
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [createErrorEmbed("You need to be in a voice channel to use the radio!")],
      ephemeral: true
    });
  }

  const channelOptions = Object.entries(RADIO_CHANNELS).map(([key, channel]) => ({
    label: channel.name,
    description: channel.description,
    value: key
  }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('direct_radio_select')
    .setPlaceholder('Choose a radio channel...')
    .addOptions(channelOptions);

  const stopButton = new ButtonBuilder()
    .setCustomId('direct_radio_stop')
    .setLabel('Stop Radio')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('⏹️');

  const embed = createRadioEmbed();

  const message = await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      new ActionRowBuilder().addComponents(stopButton)
    ]
  });

  // Create collector
  const collector = message.createMessageComponentCollector({ time: 300000 });

  collector.on('collect', async (componentInteraction) => {
    if (componentInteraction.customId === 'direct_radio_select') {
      await handleChannelSelection(componentInteraction, voiceChannel);
    } else if (componentInteraction.customId === 'direct_radio_stop') {
      await handleStopRadio(componentInteraction);
    }
  });

  collector.on('end', async () => {
    try {
      const disabledComponents = [
        new ActionRowBuilder().addComponents(
          StringSelectMenuBuilder.from(selectMenu).setDisabled(true)
        ),
        new ActionRowBuilder().addComponents(
          ButtonBuilder.from(stopButton).setDisabled(true)
        )
      ];
      await message.edit({ components: disabledComponents });
    } catch (error) {
      console.log('Error disabling components:', error.message);
    }
  });
};

async function handleChannelSelection(interaction, voiceChannel) {
  const selectedChannel = interaction.values[0];
  const channelInfo = RADIO_CHANNELS[selectedChannel];
  
  await interaction.deferReply({ ephemeral: true });

  try {
    console.log(`Starting radio channel: ${channelInfo.name}`);
    
    // Join voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });

    // Create audio player
    const player = createAudioPlayer();
    
    // Try streams until one works
    let streamStarted = false;
    for (const streamUrl of channelInfo.streams) {
      try {
        console.log(`Trying stream: ${streamUrl}`);
        
        // Create audio resource from HTTP stream
        const resource = await createAudioResourceFromUrl(streamUrl);
        
        // Play the resource
        player.play(resource);
        connection.subscribe(player);
        
        console.log(`Successfully started stream: ${streamUrl}`);
        streamStarted = true;
        break;
      } catch (error) {
        console.log(`Stream failed: ${streamUrl} - ${error.message}`);
      }
    }

    if (!streamStarted) {
      throw new Error('All streams failed to start');
    }

    // Store connection info
    activeConnections.set(interaction.guildId, {
      connection,
      player,
      channel: selectedChannel
    });

    // Handle player events
    player.on(AudioPlayerStatus.Playing, () => {
      console.log(`Radio playing: ${channelInfo.name}`);
    });

    player.on(AudioPlayerStatus.Idle, () => {
      console.log(`Radio stopped: ${channelInfo.name}`);
    });

    player.on('error', (error) => {
      console.error(`Radio error: ${error.message}`);
    });

    await interaction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name)]
    });

  } catch (error) {
    console.error('Radio start error:', error);
    await interaction.editReply({
      embeds: [createErrorEmbed(`Failed to start radio: ${error.message}`)]
    });
  }
}

async function handleStopRadio(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const connectionInfo = activeConnections.get(interaction.guildId);
  
  if (connectionInfo) {
    try {
      connectionInfo.player.stop();
      connectionInfo.connection.destroy();
      activeConnections.delete(interaction.guildId);
      
      await interaction.editReply({
        embeds: [createSuccessEmbed({ name: 'Radio Stopped', description: 'Radio disconnected' }, 'Voice Channel')]
      });
    } catch (error) {
      console.error('Stop radio error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Failed to stop radio')]
      });
    }
  } else {
    await interaction.editReply({
      embeds: [createErrorEmbed('No active radio connection found')]
    });
  }
}

async function createAudioResourceFromUrl(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      try {
        const resource = createAudioResource(response, {
          inputType: 'arbitrary'
        });
        resolve(resource);
      } catch (error) {
        reject(error);
      }
    });

    request.on('error', reject);
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

function createRadioEmbed() {
  return new EmbedBuilder()
    .setColor('#1DB954')
    .setTitle('📻 Direct Radio Streaming')
    .setDescription('High-quality electronic music streams\nPowered by Node.js direct streaming')
    .addFields(
      {
        name: '🎵 Available Channels',
        value: Object.values(RADIO_CHANNELS).map(ch => `**${ch.name}** - ${ch.description}`).join('\n'),
        inline: false
      },
      {
        name: '🔧 Technology',
        value: 'Direct HTTP streaming via @discordjs/voice\nNo external dependencies required',
        inline: false
      }
    )
    .setFooter({ text: 'Direct Node.js Streaming' })
    .setTimestamp();
}

function createSuccessEmbed(channelInfo, voiceChannelName) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('📻 Radio Started')
    .setDescription(`**${channelInfo.name}** in **${voiceChannelName}**`)
    .addFields({
      name: '🎵 Channel Info',
      value: channelInfo.description,
      inline: false
    })
    .setTimestamp();
}

function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();
}
