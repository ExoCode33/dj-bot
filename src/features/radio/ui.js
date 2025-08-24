// src/features/radio/ui.js - UPDATED VERSION WITH BANNER AND NO MUSIC STYLES LIST
import { 
  EmbedBuilder, 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';
import { RADIO_CATEGORIES } from '../../config/stations.js';

export class RadioUI {
  static async createPersistentRadioEmbed(client, currentlyPlaying) {
    const currentStatus = Array.from(currentlyPlaying.entries())
      .map(([guildId, info]) => `🎵 ${info.stationName}`)
      .join('\n') || '✨ Ready to play!';

    return new EmbedBuilder()
      .setColor('#FF6B9D')
      .setTitle('🎤 Uta\'s Radio Studio')
      .setDescription('*"Welcome to my radio studio! Pick any station and I\'ll start playing it immediately!"*\n\n🎵 Choose a music style and station below!')
      .setImage('attachment://images/Uta-banner.gif')
      .addFields(
        {
          name: '📻 Current Status',
          value: currentStatus,
          inline: false
        },
        {
          name: '✨ How It Works',
          value: '1️⃣ Pick a **music style**\n2️⃣ Choose your **station** → **Auto-plays immediately!**\n3️⃣ Switch stations anytime\n4️⃣ Use **⏸️ Stop** when done',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Uta\'s Radio Studio • Smart Connection Management ✨',
        iconURL: client.user?.displayAvatarURL() 
      })
      .setTimestamp();
  }

  static async createPersistentRadioComponents(guildId, currentlyPlaying) {
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_category_select')
      .setPlaceholder('🎵 What music style would you like?')
      .addOptions(
        Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key
        }))
      );

    const stationSelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_station_select')
      .setPlaceholder('🎤 Choose a music style first...')
      .addOptions([{
        label: 'Select music style above',
        description: 'Pick from the menu above',
        value: 'placeholder'
      }])
      .setDisabled(true);

    const isPlaying = currentlyPlaying.has(guildId);

    const stopButton = new ButtonBuilder()
      .setCustomId('persistent_stop')
      .setLabel('⏸️ Stop Radio')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🛑')
      .setDisabled(!isPlaying);

    const statusButton = new ButtonBuilder()
      .setCustomId('persistent_status')
      .setLabel('📊 Status')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🎭');

    return [
      new ActionRowBuilder().addComponents(categorySelect),
      new ActionRowBuilder().addComponents(stationSelect),
      new ActionRowBuilder().addComponents(stopButton, statusButton)
    ];
  }

  static createStatusEmbed(interaction, currentlyPlaying, player, defaultVolume, connectionStatus = null) {
    const playingInfo = currentlyPlaying.get(interaction.guildId);

    // Enhanced status info
    let systemStatusValue = `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}`;
    
    if (connectionStatus) {
      const playerStatus = connectionStatus.playerConnected ? '✅ Connected' : 
                          connectionStatus.hasPlayer ? '⚠️ Connecting' : '❌ Disconnected';
      systemStatusValue += `\nPlayer: ${playerStatus}`;
      
      if (connectionStatus.isSwitching) {
        systemStatusValue += '\n🔄 Switching stations...';
      }
      
      if (connectionStatus.playerState !== undefined) {
        const stateNames = ['Disconnected', 'Connecting', 'Nearly Connected', 'Nearly Disconnected', 'Connected'];
        systemStatusValue += `\nConnection State: ${stateNames[connectionStatus.playerState] || `Unknown (${connectionStatus.playerState})`}`;
      }
    } else {
      systemStatusValue += `\nPlayer: ${player ? '✅ Connected' : '❌ Disconnected'}`;
    }

    return new EmbedBuilder()
      .setColor('#FF6B9D')
      .setTitle('🌟 Radio Status')
      .addFields(
        {
          name: '🎵 Currently Playing',
          value: playingInfo ? 
            `🎧 **${playingInfo.stationName}**\n📍 ${interaction.guild.channels.cache.get(playingInfo.voiceChannelId)?.name}\n🔊 Volume: ${defaultVolume}%\n⏰ Started: <t:${Math.floor(playingInfo.startedAt / 1000)}:R>` : 
            '✨ Ready to play music!',
          inline: false
        },
        {
          name: '💖 System Status',
          value: systemStatusValue,
          inline: false
        },
        {
          name: '🎪 Available Stations',
          value: `${Object.keys(RADIO_CATEGORIES).reduce((total, cat) => total + RADIO_CATEGORIES[cat].stations.length, 0)} stations across ${Object.keys(RADIO_CATEGORIES).length} categories`,
          inline: false
        }
      )
      .setTimestamp();
  }
}
