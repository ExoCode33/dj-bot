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
    console.log('DI.FM Manager initialized with API key:', this.apiKey ? 'YES' : 'NO');
  }

  async getChannelStreamUrl(channelKey) {
    if (!this.apiKey) {
      console.log('No DI.FM API key, using free streams');
      return `http://pub7.di.fm/di_${channelKey}`;
    }

    // Use multiple stream URL formats for better compatibility
    const streamUrls = [
      // Premium high quality
      `https://listen.di.fm/premium_high/${channelKey}?listen_key=${this.apiKey}`,
      // Premium medium quality (more reliable)
      `https://listen.di.fm/premium_medium/${channelKey}?listen_key=${this.apiKey}`,
      // Alternative premium format
      `http://prem2.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
      // Free fallback
      `http://pub7.di.fm/di_${channelKey}`
    ];

    return streamUrls;
  }

  async connectToStream(player, channel, guildId) {
    console.log(`Connecting to DI.FM channel: ${channel}`);
    
    try {
      const streamUrls = await this.getChannelStreamUrl(channel);
      const urls = Array.isArray(streamUrls) ? streamUrls : [streamUrls];
      
      // Try each URL until one works
      for (let i = 0; i < urls.length; i++) {
        const streamUrl = urls[i];
        console.log(`Trying stream URL ${i + 1}/${urls.length}: ${streamUrl}`);
        
        try {
          const result = await player.node.rest.resolve(streamUrl);
          console.log(`Lavalink resolve result for ${streamUrl}:`, {
            loadType: result?.loadType,
            trackCount: result?.tracks?.length || 0,
            exception: result?.exception?.message || 'none'
          });
          
          if (result.loadType === 'track' && result.data) {
            // Single track (HTTP stream)
            await player.playTrack({ 
              track: result.data.encoded,
              options: { noReplace: false }
            });
            player.currentRadioChannel = channel;
            console.log(`✅ Successfully started DI.FM stream: ${channel} via ${streamUrl}`);
            return { success: true, url: streamUrl };
            
          } else if (result.tracks && result.tracks.length > 0) {
            // Track list
            await player.playTrack({ 
              track: result.tracks[0].encoded,
              options: { noReplace: false }
            });
            player.currentRadioChannel = channel;
            console.log(`✅ Successfully started DI.FM stream: ${channel} via ${streamUrl}`);
            return { success: true, url: streamUrl };
            
          } else if (result.loadType !== 'error') {
            // Try to create a custom track for HTTP streams
            const customTrack = {
              identifier: streamUrl,
              isSeekable: false,
              author: "DI.FM",
              length: 0,
              isStream: true,
              title: `DI.FM ${DIFM_CHANNELS[channel]?.name || channel}`,
              uri: streamUrl,
              sourceName: 'http'
            };
            
            const encoded = Buffer.from(JSON.stringify(customTrack)).toString('base64');
            await player.playTrack({ 
              track: encoded,
              options: { noReplace: false }
            });
            
            player.currentRadioChannel = channel;
            console.log(`✅ Successfully started DI.FM custom stream: ${channel}`);
            return { success: true, url: streamUrl };
          }
          
        } catch (urlError) {
          console.log(`❌ Failed to load ${streamUrl}:`, urlError.message);
          continue; // Try next URL
        }
      }
      
      throw new Error('All stream URLs failed to load');
      
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
      flags: 64 // EPHEMERAL flag
    });
  }

  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      embeds: [createErrorEmbed("You need to be in a voice channel!")],
      flags: 64 // EPHEMERAL flag
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
        flags: 64 // EPHEMERAL flag
      });
    }
  });
};

async function handleChannelSelection(selectInteraction, originalInteraction) {
  const selectedChannel = selectInteraction.values[0];
  const channelInfo = DIFM_CHANNELS[selectedChannel];
  
  await selectInteraction.deferReply({ flags: 64 }); // EPHEMERAL flag

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
    const result = await difmManager.connectToStream(player, selectedChannel, originalInteraction.guildId);
    
    await selectInteraction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name, result.url)]
    });

  } catch (error) {
    await selectInteraction.editReply({
      embeds: [createErrorEmbed(`Failed to start ${channelInfo.name}: ${error.message}`)]
    });
  }
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ flags: 64 }); // EPHEMERAL flag

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
    embeds: [new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('📻 DI.FM Stopped')
      .setDescription('Radio disconnected successfully')
      .setTimestamp()
    ]
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

function createSuccessEmbed(channelInfo, voiceChannelName, streamUrl) {
  const isPremium = streamUrl.includes('listen_key');
  
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('📻 DI.FM Playing')
    .setDescription(`**${channelInfo.name}** in **${voiceChannelName}**`)
    .addFields(
      {
        name: '🎵 Channel Info',
        value: channelInfo.description,
        inline: false
      },
      {
        name: isPremium ? '💎 Premium Stream' : '🆓 Free Stream',
        value: isPremium ? 'High quality premium audio' : 'Standard quality',
        inline: true
      }
    )
    .setTimestamp();
}

function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Error')
    .setDescription(message)
    .setTimestamp();
}
