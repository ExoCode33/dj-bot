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
    // Check for premium API key
    const apiKey = cfg.difm?.apiKey || process.env.DIFM_API_KEY;
    
    if (apiKey) {
      console.log('✅ Using premium DI.FM stream with API key');
      // ✅ FIXED: Correct DI.FM premium stream URLs
      return [
        `https://listen.di.fm/premium_high/${channel}.pls?listen_key=${apiKey}`,
        `https://listen.di.fm/premium/${channel}.pls?listen_key=${apiKey}`,
        `http://listen.di.fm/premium_high/${channel}.pls?listen_key=${apiKey}`,
        // ✅ ADDED: Alternative direct stream format
        `https://listen.di.fm/premium_high/${channel}?listen_key=${apiKey}`,
        `http://listen.di.fm/premium/${channel}?listen_key=${apiKey}`
      ];
    }
    
    console.warn('⚠️ No premium DI.FM key found, attempting free streams (likely to fail)');
    console.warn('💡 Add DIFM_API_KEY to your environment variables for premium access');
    // Fallback to free streams (these will likely be blocked)
    return [
      `http://pub7.di.fm/${channel}`,
      `http://pub6.di.fm/${channel}`,
      `http://pub5.di.fm/${channel}`
    ];
  }

  async connectToStream(player, channel, guildId) {
    console.log(`Attempting to connect to channel: ${channel}`);
    const streamUrls = this.getStreamUrls(channel);
    let lastError;
    
    for (let i = 0; i < streamUrls.length; i++) {
      try {
        const url = streamUrls[i];
        console.log(`Trying stream URL: ${url}`);
        
        const result = await player.node.rest.resolve(url);
        console.log(`Resolve result:`, {
          loadType: result?.loadType,
          trackCount: result?.tracks?.length || 0
        });
        
        if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: result.tracks[0].encoded });
          player.currentRadioChannel = channel;
          this.reconnectAttempts.set(guildId, 0);
          this.setupEventHandlers(player, channel, guildId);
          console.log(`Successfully started stream: ${url}`);
          return { success: true, url };
        } else if (result.loadType === 'track') {
          // Handle live radio streams that don't populate tracks array
          console.log('Detected live stream, creating virtual track');
          try {
            // Create a virtual track for the live stream
            const virtualTrack = {
              track: Buffer.from(JSON.stringify({
                identifier: url,
                isSeekable: false,
                author: "DI.FM",
                length: 0,
                isStream: true,
                title: `DI.FM ${DIFM_CHANNELS[channel]?.name || channel}`,
                uri: url
              })).toString('base64')
            };
            
            await player.playTrack(virtualTrack);
            player.currentRadioChannel = channel;
            this.reconnectAttempts.set(guildId, 0);
            this.setupEventHandlers(player, channel, guildId);
            console.log(`Successfully started virtual track for: ${url}`);
            return { success: true, url };
          } catch (virtualTrackError) {
            console.log(`Virtual track creation failed: ${virtualTrackError.message}`);
          }
        }
      } catch (error) {
        lastError = error;
        console.log(`Stream URL failed: ${streamUrls[i]} - ${error.message}`);
      }
    }
    
    throw lastError || new Error('All stream URLs failed');
  }

  setupEventHandlers(player, channel, guildId) {
    console.log('Setting up event handlers for stream reconnection');
    
    // Remove existing listeners to prevent duplicates
    player.removeAllListeners('trackEnd');
    player.removeAllListeners('trackException');
    
    player.on('trackEnd', async (event) => {
      console.log(`Track ended: ${event.reason}`);
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
    console.log(`Handling reconnection attempt ${attempts + 1}/${this.maxReconnectAttempts}`);
    
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
  console.log('====== RADIO COMMAND DEBUG ======');
  console.log('Radio command executed by:', interaction.user.tag);
  console.log('Guild ID:', interaction.guildId);
  console.log('Channel ID:', interaction.channelId);
  console.log('User in voice channel:', !!interaction.member?.voice?.channel);
  console.log('Voice channel name:', interaction.member?.voice?.channel?.name);
  console.log('Voice channel ID:', interaction.member?.voice?.channel?.id);
  console.log('Member roles:', interaction.member?.roles?.cache?.map(r => r.name) || []);
  console.log('Authorized role ID:', cfg.uta.authorizedRoleId);
  console.log('Is authorized:', isAuthorized(interaction.member, cfg.uta.authorizedRoleId));
  console.log('DI.FM API Key configured:', !!(cfg.difm?.apiKey || process.env.DIFM_API_KEY));

  // Authorization check
  if (!isAuthorized(interaction.member, cfg.uta.authorizedRoleId)) {
    console.log('Authorization failed - user not authorized');
    return interaction.reply({
      embeds: [createErrorEmbed("Only authorized DJs can control the radio!")],
      ephemeral: true
    });
  }

  // Voice channel check
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    console.log('Voice channel check failed - user not in voice channel');
    return interaction.reply({
      embeds: [createErrorEmbed("You need to be in a voice channel to use the radio!")],
      ephemeral: true
    });
  }

  console.log('All checks passed, building interface...');

  const searchQuery = interaction.options.getString('search');
  const category = interaction.options.getString('category');
  
  console.log('Search query:', searchQuery);
  console.log('Category:', category);
  
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

  console.log('Channel options count:', channelOptions.length);
  console.log('First few options:', channelOptions.slice(0, 3));

  if (channelOptions.length === 0) {
    console.log('No channels found for criteria');
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
  
  console.log('Current player exists:', !!player);
  console.log('Current channel:', currentChannel);

  const embed = createRadioEmbed(title, currentChannel);

  console.log('Sending interaction reply...');

  const message = await interaction.reply({
    embeds: [embed],
    components: [actionRow, buttonRow],
    ephemeral: false
  });

  console.log('Interaction reply sent, setting up collector...');

  // Create collector
  const collector = message.createMessageComponentCollector({
    time: 300000 // 5 minutes
  });

  collector.on('collect', async (componentInteraction) => {
    console.log('====== COMPONENT INTERACTION ======');
    console.log('Component interaction type:', componentInteraction.componentType);
    console.log('Custom ID:', componentInteraction.customId);
    console.log('User:', componentInteraction.user.tag);
    
    try {
      if (componentInteraction.customId === 'radio_channel_select') {
        console.log('Selected values:', componentInteraction.values);
        await handleChannelSelection(componentInteraction, interaction);
      } else if (componentInteraction.customId === 'radio_stop') {
        console.log('Stop button pressed');
        await handleStopRadio(componentInteraction, interaction);
      }
    } catch (error) {
      console.error('Radio interaction error:', error);
      console.error('Error stack:', error.stack);
      await componentInteraction.reply({
        embeds: [createErrorEmbed("An error occurred!")],
        ephemeral: true
      });
    }
  });

  collector.on('end', async () => {
    console.log('Collector ended, disabling components');
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
      console.log('Error disabling components (expected if message deleted):', error.message);
    }
  });

  console.log('====== RADIO COMMAND COMPLETE ======');
};

async function handleChannelSelection(selectInteraction, originalInteraction) {
  console.log('====== HANDLING CHANNEL SELECTION ======');
  const selectedChannel = selectInteraction.values[0];
  const channelInfo = DIFM_CHANNELS[selectedChannel];
  
  console.log('Selected channel:', selectedChannel);
  console.log('Channel info:', channelInfo);

  await selectInteraction.deferReply({ ephemeral: true });

  let player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  const voiceChannel = originalInteraction.member.voice.channel;
  
  console.log('Existing player:', !!player);
  console.log('Voice channel for join:', voiceChannel?.name);
  
  if (!player) {
    try {
      console.log('Creating new player and joining voice channel...');
      console.log('Join parameters:', {
        guildId: originalInteraction.guildId,
        channelId: voiceChannel.id,
        shardId: originalInteraction.guild.shardId
      });
      
      player = await originalInteraction.client.shoukaku.joinVoiceChannel({
        guildId: originalInteraction.guildId,
        channelId: voiceChannel.id,
        shardId: originalInteraction.guild.shardId
      });
      
      await player.setGlobalVolume(cfg.uta.defaultVolume);
      console.log('Successfully joined voice channel and set volume');
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      console.error('Error details:', error.stack);
      return selectInteraction.editReply({
        embeds: [createErrorEmbed("Couldn't join the voice channel!")]
      });
    }
  } else {
    console.log('Using existing player');
  }

  try {
    console.log('Attempting to connect to stream...');
    await streamManager.connectToStream(player, selectedChannel, originalInteraction.guildId);
    
    console.log('Stream connected successfully');
    
    await selectInteraction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name)]
    });

    await originalInteraction.editReply({
      embeds: [createRadioEmbed('DI.FM Radio', selectedChannel)]
    });

  } catch (error) {
    console.error('Failed to play radio stream:', error);
    console.error('Stream error details:', error.stack);
    
    // Provide helpful error message based on API key status
    const hasApiKey = !!(cfg.difm?.apiKey || process.env.DIFM_API_KEY);
    const errorMessage = hasApiKey 
      ? `Failed to play ${channelInfo.name}. The premium stream may be temporarily unavailable.`
      : `Failed to play ${channelInfo.name}. Free streams are blocked - please add your DI.FM API key for premium access.`;
    
    await selectInteraction.editReply({
      embeds: [createErrorEmbed(errorMessage)]
    });
  }
  
  console.log('====== CHANNEL SELECTION COMPLETE ======');
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  console.log('====== HANDLING STOP RADIO ======');
  await buttonInteraction.deferReply({ ephemeral: true });

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  
  console.log('Player exists for stop:', !!player);
  
  if (player) {
    try {
      await player.stopTrack();
      await player.disconnect();
      originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
      console.log('Successfully stopped and disconnected player');
    } catch (error) {
      console.error('Error stopping player:', error);
    }
  }

  await buttonInteraction.editReply({
    embeds: [createSuccessEmbed({ name: 'Radio Stopped', description: 'Radio has been disconnected' }, 'Voice Channel')]
  });

  await originalInteraction.editReply({
    embeds: [createRadioEmbed('DI.FM Radio', null)]
  });
  
  console.log('====== STOP RADIO COMPLETE ======');
}

function createRadioEmbed(title, currentChannel = null) {
  const hasApiKey = !!(cfg.difm?.apiKey || process.env.DIFM_API_KEY);
  
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
    .setFooter({ 
      text: hasApiKey 
        ? 'DI.FM Premium - High Quality Streams ✨' 
        : 'DI.FM - Add API key for premium access'
    })
    .setTimestamp();

  // Add API key status field
  embed.addFields({
    name: hasApiKey ? '✅ Premium Access' : '⚠️ Free Access (Limited)',
    value: hasApiKey 
      ? 'Premium DI.FM subscription active - enjoy uninterrupted high-quality streams!'
      : 'Add your DI.FM API key to environment variables for premium access',
    inline: false
  });

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
