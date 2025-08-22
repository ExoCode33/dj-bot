import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { cfg } from '../config/index.js';
import { isAuthorized } from '../utils/permissions.js';

// DI.FM channels with proper API names and working stream URLs
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
      // Updated free stream URLs that work better with Lavalink
      return [
        `http://pub1.di.fm/di_${channelKey}`,
        `http://pub2.di.fm/di_${channelKey}`,
        `http://pub3.di.fm/di_${channelKey}`,
        `http://pub7.di.fm/di_${channelKey}`
      ];
    }

    // Premium stream URLs with better compatibility
    const streamUrls = [
      // Working premium URLs
      `http://prem1.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
      `http://prem2.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
      `http://prem3.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
      // Fallback to free streams
      `http://pub1.di.fm/di_${channelKey}`,
      `http://pub2.di.fm/di_${channelKey}`,
      `http://pub7.di.fm/di_${channelKey}`
    ];

    return streamUrls;
  }

  async connectToStream(player, channel, guildId) {
    console.log(`🎵 Connecting to DI.FM channel: ${channel}`);
    
    try {
      const streamUrls = await this.getChannelStreamUrl(channel);
      const urls = Array.isArray(streamUrls) ? streamUrls : [streamUrls];
      
      // Try each URL until one works
      for (let i = 0; i < urls.length; i++) {
        const streamUrl = urls[i];
        console.log(`🔄 Trying stream URL ${i + 1}/${urls.length}: ${streamUrl}`);
        
        try {
          // Add timeout and better error handling
          const result = await this.resolveWithTimeout(player.node.rest, streamUrl, 15000);
          
          console.log(`📊 Lavalink resolve result for ${streamUrl}:`, {
            loadType: result?.loadType,
            trackCount: result?.tracks?.length || (result?.data ? 1 : 0),
            exception: result?.exception?.message || 'none',
            hasData: !!result?.data
          });
          
          // Handle different response formats
          let trackToPlay = null;
          
          if (result.loadType === 'track' && result.data) {
            // Single track format (newer Lavalink)
            trackToPlay = result.data;
          } else if (result.tracks && result.tracks.length > 0) {
            // Track array format (older Lavalink)
            trackToPlay = result.tracks[0];
          } else if (result.loadType === 'empty' || result.loadType === 'error') {
            console.log(`❌ Failed to load ${streamUrl}: ${result.loadType}`);
            continue; // Try next URL
          }
          
          if (trackToPlay) {
            // Successfully got a track, now try to play it
            await player.playTrack({ 
              track: trackToPlay.encoded || trackToPlay.track,
              options: { noReplace: false }
            });
            
            player.currentRadioChannel = channel;
            console.log(`✅ Successfully started DI.FM stream: ${channel} via ${streamUrl}`);
            return { success: true, url: streamUrl, isPremium: streamUrl.includes('listen_key') };
          }
          
        } catch (urlError) {
          console.log(`❌ Failed to load ${streamUrl}:`, urlError.message);
          continue; // Try next URL
        }
      }
      
      throw new Error('All stream URLs failed to load - DI.FM may be experiencing issues');
      
    } catch (error) {
      console.error(`❌ Failed to connect to DI.FM channel ${channel}:`, error.message);
      throw error;
    }
  }

  async resolveWithTimeout(rest, url, timeout = 15000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Request timed out after ${timeout}ms`));
      }, timeout);

      rest.resolve(url)
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
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

  // Check if Lavalink is ready
  const nodeMap = interaction.client.shoukaku.nodes;
  const node = nodeMap.get(cfg.lavalink.name) || nodeMap.values().next().value;
  
  if (!node || node.state !== 2) {
    return interaction.reply({
      embeds: [createErrorEmbed("Music system is not ready yet. Please try again in a moment.")],
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
    .setLabel('Stop Radio')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('🛑');

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
      console.error('❌ DI.FM interaction error:', error);
      await componentInteraction.reply({
        embeds: [createErrorEmbed("An error occurred while processing your request!")],
        flags: 64 // EPHEMERAL flag
      }).catch(() => {
        // Ignore if already replied
      });
    }
  });

  collector.on('end', () => {
    console.log('📻 DI.FM radio collector ended');
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
      console.log(`🔊 Joining voice channel: ${voiceChannel.name}`);
      player = await originalInteraction.client.shoukaku.joinVoiceChannel({
        guildId: originalInteraction.guildId,
        channelId: voiceChannel.id,
        shardId: originalInteraction.guild.shardId
      });
      await player.setGlobalVolume(cfg.uta.defaultVolume);
      console.log(`🔊 Successfully joined ${voiceChannel.name} and set volume to ${cfg.uta.defaultVolume}`);
    } catch (error) {
      console.error('❌ Failed to join voice channel:', error);
      return selectInteraction.editReply({
        embeds: [createErrorEmbed("Couldn't join voice channel! Please check bot permissions.")]
      });
    }
  }

  try {
    console.log(`🎵 Starting DI.FM channel: ${selectedChannel} (${channelInfo.name})`);
    const result = await difmManager.connectToStream(player, selectedChannel, originalInteraction.guildId);
    
    await selectInteraction.editReply({
      embeds: [createSuccessEmbed(channelInfo, voiceChannel.name, result.url, result.isPremium)]
    });

    console.log(`✅ DI.FM radio started successfully: ${channelInfo.name}`);

  } catch (error) {
    console.error(`❌ Failed to start DI.FM channel ${selectedChannel}:`, error);
    await selectInteraction.editReply({
      embeds: [createErrorEmbed(`Failed to start ${channelInfo.name}. DI.FM may be experiencing issues. Please try another channel.`)]
    });
  }
}

async function handleStopRadio(buttonInteraction, originalInteraction) {
  await buttonInteraction.deferReply({ flags: 64 }); // EPHEMERAL flag

  const player = originalInteraction.client.shoukaku.players.get(originalInteraction.guildId);
  
  if (player) {
    try {
      console.log('🛑 Stopping DI.FM radio and disconnecting player');
      await player.stopTrack();
      await player.disconnect();
      originalInteraction.client.shoukaku.players.delete(originalInteraction.guildId);
      console.log('✅ Successfully stopped DI.FM radio');
    } catch (error) {
      console.error('❌ Error stopping DI.FM radio:', error);
    }
  }

  await buttonInteraction.editReply({
    embeds: [new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🛑 DI.FM Radio Stopped')
      .setDescription('Radio has been disconnected successfully')
      .setTimestamp()
    ]
  });
}

function createRadioEmbed(category) {
  const hasApiKey = !!(cfg.difm?.apiKey || process.env.DIFM_API_KEY);
  
  return new EmbedBuilder()
    .setColor('#FF6B35')
    .setTitle('📻 DI.FM Electronic Music Radio')
    .setDescription('The world\'s most addictive electronic music streaming service')
    .addFields(
      {
        name: '🎵 Available Categories',
        value: '**Popular** • **House** • **Chill & Ambient**',
        inline: false
      },
      {
        name: hasApiKey ? '✅ Premium Access Active' : '🆓 Free Access',
        value: hasApiKey 
          ? 'Premium DI.FM subscription detected - enjoying high quality streams!'
          : 'Using free streams - consider upgrading for better quality',
        inline: false
      },
      {
        name: '🔧 Stream Quality',
        value: hasApiKey ? '🎧 **320kbps Premium**' : '🎧 **128kbps Free**',
        inline: true
      }
    )
    .setFooter({ text: 'DI.FM - Addictive Electronic Music Since 1999' })
    .setTimestamp();
}

function createSuccessEmbed(channelInfo, voiceChannelName, streamUrl, isPremium = false) {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('📻 DI.FM Radio Playing')
    .setDescription(`🎵 **${channelInfo.name}** is now playing in **${voiceChannelName}**`)
    .addFields(
      {
        name: '🎶 Channel Description',
        value: channelInfo.description,
        inline: false
      },
      {
        name: isPremium ? '💎 Premium Stream' : '🆓 Free Stream',
        value: isPremium 
          ? '🎧 High quality 320kbps premium audio' 
          : '🎧 Standard quality 128kbps audio',
        inline: true
      },
      {
        name: '🌐 Stream Source',
        value: `\`${streamUrl.split('?')[0]}\``,
        inline: false
      }
    )
    .setFooter({ text: 'Enjoy the music! Use the stop button to disconnect.' })
    .setTimestamp();
}

function createErrorEmbed(message) {
  return new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('❌ Radio Error')
    .setDescription(message)
    .addFields({
      name: '💡 Troubleshooting',
      value: '• Make sure you\'re in a voice channel\n• Check if the bot has voice permissions\n• Try a different DI.FM channel\n• DI.FM servers may be temporarily unavailable',
      inline: false
    })
    .setTimestamp();
}
