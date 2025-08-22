import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { cfg } from '../config/index.js';
import { isAuthorized } from '../utils/permissions.js';

// DI.FM channels with proper API names
const DIFM_CHANNELS = {
  'trance': { name: 'Trance', description: 'Uplifting and euphoric trance music', category: 'Popular' },
  'house': { name: 'House', description: 'Classic and modern house beats', category: 'Popular' },
  'techno': { name: 'Techno', description: 'Underground techno sounds', category: 'Popular' },
  'progressive': { name: 'Progressive', description: 'Progressive electronic music', category: 'Popular' },
  'dubstep': { name: 'Dubstep', description: 'Heavy bass and electronic drops', category: 'Popular' },
  'drumandbass': { name: 'Drum & Bass', description: 'Fast breakbeats and bass', category: 'Popular' },
  'deephouse': { name: 'Deep House', description: 'Deep and soulful house music', category: 'House' },
  'ambient': { name: 'Ambient', description: 'Atmospheric soundscapes', category: 'Chill' },
  'chillout': { name: 'Chillout', description: 'Relaxing ambient electronic', category: 'Chill' }
};

class DiFMManager {
  constructor() {
    this.apiKey = cfg.difm?.apiKey || process.env.DIFM_API_KEY;
  }

  async getChannelStreamUrl(channelKey) {
    if (!this.apiKey) {
      console.log('No DI.FM API key, using free streams');
      return `http://pub7.di.fm/di_${channelKey}`;
    }

    try {
      console.log(`Fetching premium stream URL for: ${channelKey}`);
      
      // Try the listen API endpoint
      const response = await fetch(`https://www.di.fm/tracks?channel=${channelKey}`, {
        headers: {
          'User-Agent': 'UTA-DJ-BOT/1.0.0',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('DI.FM API response received');
        
        // Extract stream URL if available
        if (data?.streams?.premium_high) {
          return data.streams.premium_high;
        }
      }
    } catch (error) {
      console.warn('DI.FM API failed:', error.message);
    }

    // Fallback to known premium URL format
    console.log('Using premium URL format fallback');
    return `https://listen.di.fm/premium_high/${channelKey}?listen_key=${this.apiKey}`;
  }

  async connectToStream(player, channel, guildId) {
    console.log(`Connecting to DI.FM channel: ${channel}`);
    
    try {
      const streamUrl = await this.getChannelStreamUrl(channel);
      console.log(`Stream URL: ${streamUrl}`);
      
      const result = await player.node.rest.resolve(streamUrl);
      console.log(`Lavalink resolve result:`, {
        loadType: result?.loadType,
        trackCount: result?.tracks?.length || 0,
        exception: result?.exception?.message || 'none'
      });
      
      if (result.tracks && result.tracks.length > 0) {
        await player.playTrack({ track: result.tracks[0].encoded });
        player.currentRadioChannel = channel;
        console.log(`Successfully started DI.FM stream: ${channel}`);
        return { success: true, url: streamUrl };
      } else if (result.loadType === 'track') {
        // Handle direct stream
        await player.playTrack({ 
          track: Buffer.from(JSON.stringify({
            identifier: streamUrl,
            isSeekable: false,
            author: "DI.FM",
            length: 0,
            isStream: true,
            title: `DI.FM ${DIFM_CHANNELS[channel]?.name || channel}`,
            uri: streamUrl
          })).toString('base64')
        });
        
        player.currentRadioChannel = channel;
        console.log(`Successfully started DI.FM direct stream: ${channel}`);
        return { success: true, url: streamUrl };
      }
      
      throw new Error('No playable tracks found');
      
    } catch (error) {
      console.error(`Failed to connect to DI.FM channel ${channel}:`, error.message);
      throw error;
    }
  }
}

const difmManager = new DiFMManager();

export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Stream DI.FM electronic music channels')
  .addStringOption(option =>
    option.setName('category')
      .setDescription('Browse channels by category')
      .setRequired(false)
      .addChoices(
        { name: 'Popular', value: 'Popular' },
        { name: 'House Music', value: 'House' },
        { name: 'Chill & Ambient', value: 'Chill' }
      )
  );

export const execute = async (interaction) => {
  if (!isAuthorized(interaction.member, cfg.uta.authorizedRoleId)) {
    return interaction.reply({
      embeds: [createErrorEmbed("Only authorized DJs can control the radio!")],
      ephemeral: true
    });
  }

  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [createErrorEmbed("You need to be in a voice channel!")],
      ephemeral: true
    });
  }

  const category = interaction.options.getString('category') || 'Popular';
  const channelOptions = Object.entries(DIFM_CHANNELS)
    .filter(([_, channel]) => channel.category === category)
    .slice(0, 25)
    .map(([key, channel]) => ({
      label: channel.name,
      description: channel.description,
      value: key
    }));

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('difm_select')
    .setPlaceholder('Choose a DI.FM channel...')
    .addOptions(channelOptions);

  const stopButton = new ButtonBuilder()
    .setCustomId('difm_stop')
    .setLabel('Stop DI.FM')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('📻');

  const embed = createRadioEmbed(category);

  const message = await interaction.reply({
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(selectMenu),
      new ActionRowBuilder().addComponents(stopButton)
    ]
  });

  const collector = message.createMessageComponentCollector({ time: 300000 });

  collector.on('collect', async (componentInteraction) => {
    try {
      if (componentInteraction.customId === 'difm_select') {
        await handleChannelSelection(componentInteraction, interaction);
      } else if (componentInteraction.customId === 'difm_stop') {
        await handleStopRadio(componentInteraction, interaction);
      }
    } catch (error) {
      console.error('DI.FM interaction error:', error);
      await componentInteraction.reply({
        embeds: [createErrorEmbed("An error occurred!")],
        ephemeral: true
      });
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
        embeds: [createErrorEmbed("Couldn't join voice channel!")]
      });
    }
  }

  try {
    await difmManager.connectToStream(player, selectedChannel, originalInteraction.guildId);
    
    await selectInteraction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name)]
    });

  } catch (error) {
    await selectInteraction.editReply({
      embeds: [createErrorEmbed(`Failed to start ${channelInfo.name}: ${error.message}`)]
    });
  }
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ ephemeral: true });

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  
  if (player) {
    try {
      await player.stopTrack();
      await player.disconnect();
      originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
    } catch (error) {
      console.error('Error stopping DI.FM:', error);
    }
  }

  await buttonInteraction.editReply({
    embeds: [createSuccessEmbed({ name: 'DI.FM Stopped', description: 'Radio disconnected' }, 'Voice Channel')]
  });
}

function createRadioEmbed(category) {
  const hasApiKey = !!(cfg.difm?.apiKey || process.env.DIFM_API_KEY);
  
  return new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('📻 DI.FM Electronic Music')
    .setDescription('The world\'s most addictive electronic music')
    .addFields(
      {
        name: '🎵 Available Categories',
        value: 'Popular • House • Chill & Ambient',
        inline: false
      },
      {
        name: hasApiKey ? '✅ Premium Access' : '⚠️ Free Access',
        value: hasApiKey 
          ? 'Premium DI.FM subscription active - high quality streams!'
          : 'Free streams may have limitations',
        inline: false
      }
    )
    .setFooter({ text: 'DI.FM - Addictive Electronic Music' })
    .setTimestamp();
}

function createSuccessEmbed(channelInfo, voiceChannelName) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('📻 DI.FM Playing')
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
