// src/commands/radio.js
import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, ComponentType, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { cfg } from '../config/index.js';
import { isAuthorized } from '../utils/permissions.js';

// Complete DI.FM channel configuration
const DIFM_CHANNELS = {
  // Popular Electronic
  'trance': { name: 'Trance', description: 'Uplifting and euphoric trance music', category: 'Popular' },
  'house': { name: 'House', description: 'Classic and modern house beats', category: 'Popular' },
  'techno': { name: 'Techno', description: 'Underground techno sounds', category: 'Popular' },
  'progressive': { name: 'Progressive', description: 'Progressive electronic music', category: 'Popular' },
  'dubstep': { name: 'Dubstep', description: 'Heavy bass and electronic drops', category: 'Popular' },
  'drum-and-bass': { name: 'Drum & Bass', description: 'Fast breakbeats and bass', category: 'Popular' },
  
  // House Subgenres
  'deep-house': { name: 'Deep House', description: 'Deep and soulful house music', category: 'House' },
  'tech-house': { name: 'Tech House', description: 'Technical house music', category: 'House' },
  'electro-house': { name: 'Electro House', description: 'Electronic house fusion', category: 'House' },
  'future-house': { name: 'Future House', description: 'Modern future house', category: 'House' },
  'tribal-house': { name: 'Tribal House', description: 'Tribal percussion house', category: 'House' },
  'funky-house': { name: 'Funky House', description: 'Funky disco house', category: 'House' },
  'vocal-house': { name: 'Vocal House', description: 'House with vocals', category: 'House' },
  
  // Trance Subgenres
  'uplifting-trance': { name: 'Uplifting Trance', description: 'Euphoric uplifting trance', category: 'Trance' },
  'vocal-trance': { name: 'Vocal Trance', description: 'Trance with vocals', category: 'Trance' },
  'tech-trance': { name: 'Tech Trance', description: 'Technical trance music', category: 'Trance' },
  'psytrance': { name: 'PsyTrance', description: 'Psychedelic trance music', category: 'Trance' },
  'classic-trance': { name: 'Classic Trance', description: 'Classic trance hits', category: 'Trance' },
  
  // Ambient & Chill
  'chillout': { name: 'Chillout', description: 'Relaxing ambient electronic', category: 'Chill' },
  'ambient': { name: 'Ambient', description: 'Atmospheric soundscapes', category: 'Chill' },
  'lounge': { name: 'Lounge', description: 'Sophisticated lounge music', category: 'Chill' },
  'downtempo': { name: 'Downtempo', description: 'Slow tempo electronic', category: 'Chill' },
  'chillstep': { name: 'Chillstep', description: 'Relaxed dubstep variant', category: 'Chill' },
  'liquid-dnb': { name: 'Liquid D&B', description: 'Smooth liquid drum & bass', category: 'Chill' },
  
  // Bass Music
  'bass': { name: 'Bass', description: 'Heavy bass electronic music', category: 'Bass' },
  'trap': { name: 'Trap', description: 'Electronic trap music', category: 'Bass' },
  'future-bass': { name: 'Future Bass', description: 'Melodic future bass', category: 'Bass' },
  'neurofunk': { name: 'Neurofunk', description: 'Dark neurofunk D&B', category: 'Bass' },
  'jumpup': { name: 'Jump Up', description: 'Jump up drum & bass', category: 'Bass' },
  'hardcore': { name: 'Hardcore', description: 'Hard electronic dance music', category: 'Bass' },
  'hardstyle': { name: 'Hardstyle', description: 'Hardstyle electronic dance', category: 'Bass' },
  
  // Underground
  'minimal': { name: 'Minimal', description: 'Minimalist electronic sounds', category: 'Underground' },
  'experimental': { name: 'Experimental', description: 'Experimental electronic', category: 'Underground' },
  'IDM': { name: 'IDM', description: 'Intelligent dance music', category: 'Underground' },
  'glitch': { name: 'Glitch', description: 'Glitch electronic music', category: 'Underground' },
  'dark-ambient': { name: 'Dark Ambient', description: 'Dark atmospheric music', category: 'Underground' },
  
  // Breaks
  'breaks': { name: 'Breaks', description: 'Breakbeat electronic music', category: 'Breaks' },
  'nu-breaks': { name: 'Nu Breaks', description: 'Modern breakbeat', category: 'Breaks' },
  'big-beat': { name: 'Big Beat', description: 'Big beat electronic', category: 'Breaks' },
  
  // Classic
  'classic-eurodance': { name: 'Classic Eurodance', description: '90s Eurodance hits', category: 'Classic' },
  'old-school-rave': { name: 'Old School Rave', description: 'Classic rave music', category: 'Classic' },
  'classic-techno': { name: 'Classic Techno', description: 'Original techno sounds', category: 'Classic' },
  'retro-electro': { name: 'Retro Electro', description: 'Retro electronic music', category: 'Classic' },
  
  // Modern
  'synthwave': { name: 'Synthwave', description: 'Retro synthwave music', category: 'Modern' },
  'vaporwave': { name: 'Vaporwave', description: 'Nostalgic vaporwave', category: 'Modern' },
  'uk-garage': { name: 'UK Garage', description: 'UK garage music', category: 'Modern' },
  'grime': { name: 'Grime', description: 'UK grime electronic', category: 'Modern' },
  'future-garage': { name: 'Future Garage', description: 'Modern UK garage', category: 'Modern' },
  '2-step': { name: '2-Step', description: '2-step garage music', category: 'Modern' },
  
  // Special
  'space-dreams': { name: 'Space Dreams', description: 'Cosmic ambient music', category: 'Special' },
  'nature': { name: 'Nature', description: 'Nature-inspired ambient', category: 'Special' },
  'meditation': { name: 'Meditation', description: 'Meditative electronic', category: 'Special' },
  'sleep': { name: 'Sleep', description: 'Sleep-inducing ambient', category: 'Special' }
};

// Stream reliability manager
class StreamManager {
  constructor() {
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 2000;
  }

  getStreamUrls(channel) {
    const servers = [
      'http://pub7.di.fm',
      'http://pub6.di.fm', 
      'http://pub5.di.fm',
      'http://pub8.di.fm'
    ];
    
    // Check for premium API key
    const apiKey = process.env.DIFM_API_KEY;
    if (apiKey) {
      return [`http://prem2.di.fm/${channel}?${apiKey}`];
    }
    
    return servers.map(server => `${server}/${channel}`);
  }

  async connectToStream(player, channel, guildId) {
    const streamUrls = this.getStreamUrls(channel);
    let lastError;
    
    for (let i = 0; i < streamUrls.length; i++) {
      try {
        const url = streamUrls[i];
        console.log(`Trying stream URL: ${url}`);
        
        const result = await player.node.rest.resolve(url);
        
        if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: result.tracks[0].encoded });
          player.currentRadioChannel = channel;
          this.reconnectAttempts.set(guildId, 0);
          this.setupEventHandlers(player, channel, guildId);
          return { success: true, url };
        }
      } catch (error) {
        lastError = error;
        console.log(`Stream URL failed: ${streamUrls[i]} - ${error.message}`);
      }
    }
    
    throw lastError || new Error('All stream URLs failed');
  }

  setupEventHandlers(player, channel, guildId) {
    // Remove existing listeners to prevent duplicates
    player.removeAllListeners('trackEnd');
    player.removeAllListeners('trackException');
    
    player.on('trackEnd', async (event) => {
      if (event.reason === 'finished' || event.reason === 'loadFailed') {
        await this.handleReconnection(player, channel, guildId);
      }
    });

    player.on('trackException', async (event) => {
      console.error('Stream error:', event.exception);
      await this.handleReconnection(player, channel, guildId);
    });
  }

  async handleReconnection(player, channel, guildId) {
    const attempts = this.reconnectAttempts.get(guildId) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(guildId, attempts + 1);
      
      setTimeout(async () => {
        try {
          await this.connectToStream(player, channel, guildId);
          console.log(`Stream reconnected successfully (attempt ${attempts + 1})`);
        } catch (error) {
          console.error(`Reconnection failed (attempt ${attempts + 1}):`, error.message);
        }
      }, this.reconnectDelay * (attempts + 1));
    }
  }
}

const streamManager = new StreamManager();

// Search channels function
function searchChannels(query) {
  const lowercaseQuery = query.toLowerCase();
  
  return Object.entries(DIFM_CHANNELS)
    .filter(([key, channel]) => 
      key.includes(lowercaseQuery) || 
      channel.name.toLowerCase().includes(lowercaseQuery) ||
      channel.description.toLowerCase().includes(lowercaseQuery)
    )
    .slice(0, 25)
    .map(([key, channel]) => ({
      label: channel.name,
      description: channel.description.slice(0, 100),
      value: key
    }));
}

// Get channels by category
function getChannelsByCategory(category) {
  return Object.entries(DIFM_CHANNELS)
    .filter(([_, channel]) => channel.category === category)
    .slice(0, 25)
    .map(([key, channel]) => ({
      label: channel.name,
      description: channel.description.slice(0, 100),
      value: key
    }));
}

export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Stream electronic music from DI.FM radio channels')
  .addStringOption(option =>
    option.setName('search')
      .setDescription('Search for a specific channel')
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Browse channels by category')
      .setRequired(false)
      .addChoices(
        { name: 'Popular', value: 'Popular' },
        { name: 'House Music', value: 'House' },
        { name: 'Trance', value: 'Trance' },
        { name: 'Chill & Ambient', value: 'Chill' },
        { name: 'Bass Music', value: 'Bass' },
        { name: 'Underground', value: 'Underground' },
        { name: 'Breaks', value: 'Breaks' },
        { name: 'Classic', value: 'Classic' },
        { name: 'Modern', value: 'Modern' },
        { name: 'Special', value: 'Special' }
      )
  );

export const execute = async (interaction) => {
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

  const searchQuery = interaction.options.getString('search');
  const category = interaction.options.getString('category');
  
  let channelOptions;
  let title;
  
  if (searchQuery) {
    channelOptions = searchChannels(searchQuery);
    title = `Search Results for "${searchQuery}"`;
  } else if (category) {
    channelOptions = getChannelsByCategory(category);
    title = `${category} Channels`;
  } else {
    channelOptions = getChannelsByCategory('Popular');
    title = 'Popular Channels';
  }

  if (channelOptions.length === 0) {
    return interaction.reply({
      embeds: [createErrorEmbed(`No channels found ${searchQuery ? `for "${searchQuery}"` : 'in that category'}.`)],
      ephemeral: true
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('radio_channel_select')
    .setPlaceholder('Choose a radio channel...')
    .addOptions(channelOptions);

  const actionRow = new ActionRowBuilder().addComponents(selectMenu);
  
  // Add stop button
  const stopButton = new ButtonBuilder()
    .setCustomId('radio_stop')
    .setLabel('Stop Radio')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('⏹️');

  const buttonRow = new ActionRowBuilder().addComponents(stopButton);

  // Get current playing info
  const player = interaction.client.shoukaku.players.get(interaction.guildId);
  const currentChannel = player?.currentRadioChannel || null;

  const embed = createRadioEmbed(title, currentChannel);

  const message = await interaction.reply({
    embeds: [embed],
    components: [actionRow, buttonRow],
    ephemeral: false
  });

  // Create collector
  const collector = message.createMessageComponentCollector({
    time: 300000 // 5 minutes
  });

  collector.on('collect', async (componentInteraction) => {
    try {
      if (componentInteraction.customId === 'radio_channel_select') {
        await handleChannelSelection(componentInteraction, interaction);
      } else if (componentInteraction.customId === 'radio_stop') {
        await handleStopRadio(componentInteraction, interaction);
      }
    } catch (error) {
      console.error('Radio interaction error:', error);
      await componentInteraction.reply({
        embeds: [createErrorEmbed("An error occurred!")],
        ephemeral: true
      });
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
      // Ignore errors when editing expired messages
    }
  });
};

async function handleChannelSelection(selectInteraction, originalInteraction) {
  const selectedChannel = selectInteraction.values[0];
  const channelInfo = DIFM_CHANNELS[selectedChannel];

  await selectInteraction.deferReply({ ephemeral: true });

  let player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  const voiceChannel = originalInteraction.member.voice.channel;
  
  if (!player) {
    try {
      player = await originalInteraction.client.shoukaku.joinVoiceChannel({
        guildId: originalInteraction.guildId,
        channelId: voiceChannel.id,
        shardId: originalInteraction.guild.shardId
      });
      await player.setGlobalVolume(cfg.uta.defaultVolume);
    } catch (error) {
      return selectInteraction.editReply({
        embeds: [createErrorEmbed("Couldn't join the voice channel!")]
      });
    }
  }

  try {
    await streamManager.connectToStream(player, selectedChannel, originalInteraction.guildId);
    
    await selectInteraction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name)]
    });

    await originalInteraction.editReply({
      embeds: [createRadioEmbed('DI.FM Radio', selectedChannel)]
    });

  } catch (error) {
    console.error('Failed to play radio stream:', error);
    await selectInteraction.editReply({
      embeds: [createErrorEmbed(`Failed to play ${channelInfo.name}. All servers may be unavailable.`)]
    });
  }
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ ephemeral: true });

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  
  if (player) {
    await player.stopTrack();
    await player.disconnect();
    originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
  }

  await buttonInteraction.editReply({
    embeds: [createSuccessEmbed({ name: 'Radio Stopped', description: 'Radio has been disconnected' }, 'Voice Channel')]
  });

  await originalInteraction.editReply({
    embeds: [createRadioEmbed('DI.FM Radio', null)]
  });
}

function createRadioEmbed(title, currentChannel = null) {
  const embed = new EmbedBuilder()
    .setColor('#1DB954')
    .setTitle(`📻 ${title}`)
    .setDescription('Select a channel to start streaming electronic music!')
    .addFields(
      {
        name: '🎵 Available Categories',
        value: 'Popular • House • Trance • Chill • Bass • Underground • Classic',
        inline: false
      },
      {
        name: '🔍 How to Use',
        value: 'Use `/radio category:Popular` or `/radio search:trance` to filter channels',
        inline: false
      }
    )
    .setFooter({ text: 'DI.FM - Addictive Electronic Music' })
    .setTimestamp();

  if (currentChannel && DIFM_CHANNELS[currentChannel]) {
    const channelInfo = DIFM_CHANNELS[currentChannel];
    embed.addFields({
      name: '🔴 Currently Playing',
      value: `**${channelInfo.name}**\n${channelInfo.description}`,
      inline: false
    });
    embed.setColor('#FF4444');
  }

  return embed;
}

function createSuccessEmbed(channelInfo, voiceChannelName) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('📻 Radio Update')
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
