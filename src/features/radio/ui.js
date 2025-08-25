// src/features/radio/ui.js - UPDATED VERSION WITH DORMANT CONNECTION SUPPORT
import { 
  EmbedBuilder, 
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';
import { RADIO_CATEGORIES, RADIO_STATIONS } from '../../config/stations.js';

export class RadioUI {
  static async createPersistentRadioEmbed(client, currentlyPlaying) {
    // Enhanced status that shows dormant connections
    const statusEntries = [];
    const dormantEntries = [];
    
    // Check for active and dormant connections
    if (client.radioManager?.persistentConnections) {
      for (const [guildId, connection] of client.radioManager.persistentConnections.entries()) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;
        
        const stationName = connection.currentStation ? 
          (RADIO_STATIONS[connection.currentStation]?.name || connection.currentStation) :
          'Unknown';
        
        if (connection.dormant) {
          // Dormant connection (Lavalink alive, not in Discord voice)
          const timeSinceDormant = connection.lastVoiceDisconnect ? 
            Math.floor((Date.now() - connection.lastVoiceDisconnect) / 1000 / 60) : 0;
          dormantEntries.push(`💤 ${stationName} (dormant ${timeSinceDormant}m)`);
        } else {
          // Active connection
          const playingInfo = currentlyPlaying.get(guildId);
          if (playingInfo) {
            statusEntries.push(`🎵 ${playingInfo.stationName}`);
          }
        }
      }
    }
    
    // Fallback to old method if no radio manager
    if (statusEntries.length === 0 && dormantEntries.length === 0) {
      statusEntries.push(...Array.from(currentlyPlaying.entries())
        .map(([guildId, info]) => `🎵 ${info.stationName}`));
    }
    
    const allStatus = [...statusEntries, ...dormantEntries];
    const currentStatus = allStatus.length > 0 ? allStatus.join('\n') : '✨ Ready to play!';

    // Add helpful dormant explanation if there are dormant connections
    let description = '*"Welcome to my radio studio! Pick any station and I\'ll start playing it immediately!"*\n\n🎵 Choose a music style and station below!';
    
    if (dormantEntries.length > 0) {
      description += '\n\n💤 **Dormant stations** will resume instantly when you join voice!';
    }

    return new EmbedBuilder()
      .setColor('#FF6B9D')
      .setImage('attachment://uta-banner.gif')
      .setTitle('🎤 Uta\'s Radio Studio')
      .setDescription(description)
      .addFields(
        {
          name: '📻 Current Status',
          value: currentStatus,
          inline: false
        },
        {
          name: '✨ How It Works',
          value: '1️⃣ Pick a **music style**\n2️⃣ Choose your **station** → **Auto-plays immediately!**\n3️⃣ Switch stations anytime\n4️⃣ Use **⏸️ Stop** when done\n\n💤 **Dormant** = Connection ready, join voice to resume instantly!',
          inline: false
        }
      )
      .setFooter({ 
        text: 'Uta\'s Radio Studio • Persistent Lavalink Connections ✨',
        iconURL: client.user?.displayAvatarURL() 
      })
      .setTimestamp();
  }

  static async createPersistentRadioComponents(guildId, currentlyPlaying, radioManager = null) {
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

    // Enhanced button logic for dormant connections
    let isPlaying = currentlyPlaying.has(guildId);
    let isDormant = false;
    
    // Check for dormant connection
    if (radioManager?.persistentConnections) {
      const persistent = radioManager.persistentConnections.get(guildId);
      if (persistent?.dormant) {
        isDormant = true;
        isPlaying = false; // Dormant connections show as not playing for UI purposes
      }
    }

    const stopButton = new ButtonBuilder()
      .setCustomId('persistent_stop')
      .setLabel(isDormant ? '🗑️ Destroy Connection' : '⏸️ Stop Radio')
      .setStyle(isDormant ? ButtonStyle.Secondary : ButtonStyle.Danger)
      .setEmoji(isDormant ? '💀' : '🛑')
      .setDisabled(!isPlaying && !isDormant);

    const statusButton = new ButtonBuilder()
      .setCustomId('persistent_status')
      .setLabel('📊 Status')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(isDormant ? '💤' : '🎭');

    return [
      new ActionRowBuilder().addComponents(categorySelect),
      new ActionRowBuilder().addComponents(stationSelect),
      new ActionRowBuilder().addComponents(stopButton, statusButton)
    ];
  }

  static createStatusEmbed(interaction, currentlyPlaying, player, defaultVolume, connectionStatus = null) {
    const playingInfo = currentlyPlaying.get(interaction.guildId);
    
    // Check for dormant connection
    let isDormant = false;
    let persistent = null;
    
    if (interaction.client.radioManager?.persistentConnections) {
      persistent = interaction.client.radioManager.persistentConnections.get(interaction.guildId);
      isDormant = persistent?.dormant === true;
    }

    let playingValue;
    if (isDormant && persistent) {
      const stationName = RADIO_STATIONS[persistent.currentStation]?.name || persistent.currentStation || 'Unknown';
      const timeSinceDormant = persistent.lastVoiceDisconnect ? 
        Math.floor((Date.now() - persistent.lastVoiceDisconnect) / 1000 / 60) : 0;
      
      playingValue = `💤 **${stationName}** (dormant)\n🔌 Lavalink connection alive\n📍 Ready to resume when you join voice\n⏰ Dormant for: ${timeSinceDormant} minutes\n🚀 **Join any voice channel to resume instantly!**`;
    } else if (playingInfo) {
      playingValue = `🎧 **${playingInfo.stationName}**\n📍 ${interaction.guild.channels.cache.get(playingInfo.voiceChannelId)?.name}\n🔊 Volume: ${defaultVolume}%\n⏰ Started: <t:${Math.floor(playingInfo.startedAt / 1000)}:R>`;
    } else {
      playingValue = '✨ Ready to play music!';
    }

    // Enhanced system status with dormant info
    let systemStatusValue = `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}`;
    
    if (connectionStatus) {
      const playerStatus = isDormant ? '💤 Dormant' :
                          connectionStatus.playerConnected ? '✅ Connected' : 
                          connectionStatus.hasPlayer ? '⚠️ Connecting' : '❌ Disconnected';
      systemStatusValue += `\nPlayer: ${playerStatus}`;
      
      if (connectionStatus.persistentConnections > 0) {
        systemStatusValue += `\nPersistent: ${connectionStatus.persistentConnections} connections`;
      }
      
      if (connectionStatus.dormantConnections > 0) {
        systemStatusValue += `\nDormant: ${connectionStatus.dormantConnections} ready to resume`;
      }
      
      if (isDormant) {
        systemStatusValue += `\n🔗 Lavalink: ✅ Alive & Ready`;
      }
    } else {
      const playerStatus = isDormant ? '💤 Dormant' : (player ? '✅ Connected' : '❌ Disconnected');
      systemStatusValue += `\nPlayer: ${playerStatus}`;
      
      if (isDormant) {
        systemStatusValue += `\n🔗 Lavalink: ✅ Alive & Ready`;
      }
    }

    // Connection info field
    let connectionInfoValue;
    if (isDormant) {
      connectionInfoValue = '💤 **Dormant Mode**: Lavalink connection preserved\n🎵 Music will resume instantly when you join voice\n⚡ No reconnection delays!\n🚀 **Zero latency resume** - just join any voice channel!';
    } else {
      const totalStations = Object.keys(RADIO_CATEGORIES).reduce((total, cat) => 
        total + (RADIO_CATEGORIES[cat].stations?.length || 0), 0);
      const totalCategories = Object.keys(RADIO_CATEGORIES).length;
      connectionInfoValue = `🎪 ${totalStations} stations across ${totalCategories} categories\n✨ Persistent connections for seamless experience`;
    }

    return new EmbedBuilder()
      .setColor(isDormant ? '#FFA500' : '#FF6B9D') // Orange for dormant, pink for active
      .setTitle(isDormant ? '💤 Dormant Radio Connection' : '🌟 Radio Status')
      .addFields(
        {
          name: isDormant ? '💤 Dormant Connection' : '🎵 Currently Playing',
          value: playingValue,
          inline: false
        },
        {
          name: '💖 System Status',
          value: systemStatusValue,
          inline: false
        },
        {
          name: isDormant ? '🚀 Instant Resume Ready' : '🎪 Connection Info',
          value: connectionInfoValue,
          inline: false
        }
      )
      .setTimestamp();
  }

  /**
   * Create embed for when dormant connection is reactivated
   */
  static createResumeEmbed(stationName, voiceChannelName, resumeTime = null) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🚀 Dormant Connection Resumed!')
      .setDescription(`*"Welcome back! Your music is ready to continue!"*`)
      .addFields(
        {
          name: '🎵 Now Playing',
          value: `🎧 **${stationName}**\n📍 **${voiceChannelName}**`,
          inline: true
        },
        {
          name: '⚡ Resume Speed',
          value: resumeTime ? `${resumeTime}ms` : 'Instant',
          inline: true
        },
        {
          name: '💤 Dormant Benefits',
          value: '✅ Zero reconnection time\n✅ Preserved playback state\n✅ No audio interruption',
          inline: false
        }
      )
      .setFooter({ text: 'Dormant connections = Better experience!' })
      .setTimestamp();

    return embed;
  }

  /**
   * Create embed for connection going dormant
   */
  static createDormantEmbed(stationName, reason = 'No users in voice channel') {
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('💤 Connection Going Dormant')
      .setDescription(`*"I'll keep your music ready while you're away!"*`)
      .addFields(
        {
          name: '🎵 Preserved Station',
          value: `💤 **${stationName}**`,
          inline: true
        },
        {
          name: '📡 Connection Status',
          value: '🔗 **Lavalink: Alive**\n🔌 **Discord Voice: Disconnected**',
          inline: true
        },
        {
          name: '🚀 Quick Resume',
          value: `${reason}\n\n✨ **Join any voice channel to resume instantly!**`,
          inline: false
        }
      )
      .setFooter({ text: 'Your music is safe and ready to resume!' })
      .setTimestamp();

    return embed;
  }

  /**
   * Create compact status line for persistent message updates
   */
  static formatStatusLine(guildId, currentlyPlaying, persistentConnections = null) {
    const playingInfo = currentlyPlaying.get(guildId);
    
    if (playingInfo) {
      return `🎵 ${playingInfo.stationName}`;
    }
    
    // Check for dormant connection
    if (persistentConnections) {
      const persistent = persistentConnections.get(guildId);
      if (persistent?.dormant && persistent.currentStation) {
        const stationName = RADIO_STATIONS[persistent.currentStation]?.name || persistent.currentStation;
        const timeSinceDormant = persistent.lastVoiceDisconnect ? 
          Math.floor((Date.now() - persistent.lastVoiceDisconnect) / 1000 / 60) : 0;
        return `💤 ${stationName} (dormant ${timeSinceDormant}m)`;
      }
    }
    
    return '✨ Ready to play!';
  }

  /**
   * Get status emoji based on connection state
   */
  static getStatusEmoji(guildId, currentlyPlaying, persistentConnections = null) {
    const playingInfo = currentlyPlaying.get(guildId);
    
    if (playingInfo) {
      return '🎵'; // Active
    }
    
    if (persistentConnections) {
      const persistent = persistentConnections.get(guildId);
      if (persistent?.dormant) {
        return '💤'; // Dormant
      }
    }
    
    return '✨'; // Ready
  }
}
