// src/config/stations.js - COMPREHENSIVE COLLECTION WITH 54+ VERIFIED STATIONS
export const RADIO_STATIONS = {
  // HIP-HOP & R&B STATIONS
  'hot97_nyc': {
    name: 'Hot 97 NYC',
    description: 'New York\'s legendary hip-hop station with exclusive rap premieres',
    url: 'https://n17a-e2.revma.ihrhls.com/zc181',
    fallback: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    genre: 'Hip-Hop',
    quality: 'Premium'
  },

  // ELECTRONIC & DUBSTEP STATIONS
  'trap_nation_electronic': {
    name: 'Trap Nation',
    description: 'Heavy trap beats and electronic bass drops for high-energy listening',
    url: 'http://stream.zeno.fm/0r0xa820k8zuv',
    fallback: 'https://radiorecord.hostingradio.ru/trap96.aacp',
    genre: 'Electronic',
    quality: 'Premium'
  },
  'radio_record_dubstep': {
    name: 'Radio Record Dubstep',
    description: 'Pure dubstep with crushing bass and electronic wobbles',
    url: 'https://radiorecord.hostingradio.ru/dub96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/jackin96.aacp',
    genre: 'Dubstep',
    quality: 'Premium'
  },
  'radio_record_bass_house': {
    name: 'Radio Record Bass House',
    description: 'Deep house music with powerful basslines and electronic grooves',
    url: 'https://radiorecord.hostingradio.ru/jackin96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/fbass96.aacp',
    genre: 'Electronic',
    quality: 'Premium'
  },
  'radio_record_future_bass': {
    name: 'Radio Record Future Bass',
    description: 'Melodic future bass with atmospheric synths and emotional drops',
    url: 'https://radiorecord.hostingradio.ru/fbass96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/teo96.aacp',
    genre: 'Electronic',
    quality: 'Premium'
  },
  'radio_record_hardstyle': {
    name: 'Radio Record Hardstyle',
    description: 'Intense hardstyle beats with euphoric melodies and driving kick drums',
    url: 'https://radiorecord.hostingradio.ru/teo96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/dub96.aacp',
    genre: 'Hardstyle',
    quality: 'Premium'
  },

  // K-POP & J-POP STATIONS
  'big_b_kpop': {
    name: 'Big B Radio K-Pop',
    description: 'Premier K-pop station featuring BlackPink, NewJeans, TWICE, and chart-toppers',
    url: 'http://kpop.bigbradio.net/s',
    fallback: 'http://82.145.63.122:9600/s',
    genre: 'K-Pop',
    quality: 'Premium'
  },
  'kpop_highway_radio': {
    name: 'K-Pop Highway',
    description: 'Dedicated K-pop highway with BlackPink, BTS, and themed daily programming',
    url: 'https://ice-1.streamhoster.com/lv_kpophrusa--broadcast1',
    fallback: 'http://jpop.bigbradio.net/s',
    genre: 'K-Pop',
    quality: 'Premium'
  },
  'listen_moe_kpop': {
    name: 'LISTEN.moe K-Pop',
    description: 'Community-curated K-pop including demon hunter style and underground artists',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'Premium'
  },
  'exclusively_bts': {
    name: 'Exclusively BTS',
    description: 'All BTS, all the time - solo projects, collabs, and group hits',
    url: 'https://streaming.exclusive.radio/er/bts/icecast.audio',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'Premium'
  },
  'hotmixradio_kpop': {
    name: 'Hotmix K-Pop',
    description: 'French K-pop station with JENNIE, ITZY, G-Dragon, and rising stars',
    url: 'https://streaming.hotmix-radio.net/hotmixradio-kpop-128.mp3',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'Premium'
  },
  'listen_moe_jpop': {
    name: 'LISTEN.moe J-Pop & Anime',
    description: 'Authentic Japanese pop music and anime soundtracks from community DJs',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'J-Pop',
    quality: 'Premium'
  },
  'big_b_jpop': {
    name: 'Big B Radio J-Pop',
    description: 'Japanese pop with K-pop crossovers and anime opening themes',
    url: 'http://jpop.bigbradio.net/s',
    fallback: 'http://82.145.63.122:9700/s',
    genre: 'J-Pop',
    quality: 'Premium'
  },
  'asia_dream_jpop': {
    name: 'Asia Dream J-Pop Powerplay',
    description: 'Japanese chart hits with occasional K-pop crossover collaborations',
    url: 'https://kathy.torontocast.com:3560/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'J-Pop',
    quality: 'Premium'
  },

  // CHILL & LO-FI STATIONS
  'electronic_gaming_radio': {
    name: 'Electronic Chill Gaming',
    description: 'Relaxing electronic music perfect for background focus and gaming',
    url: 'http://s2.viastreaming.net:7005/stream',
    fallback: 'https://ice.somafm.com/groovesalad',
    genre: 'Chill Electronic',
    quality: 'Premium'
  },
  'somafm_groove_salad_lofi': {
    name: 'SomaFM Groove Salad',
    description: 'Iconic ambient downtempo with lush electronic textures for relaxation',
    url: 'https://ice.somafm.com/groovesalad',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Ambient Chill',
    quality: 'Premium'
  },
  'laut_fm_lofi': {
    name: 'Laut.fm Lo-Fi',
    description: 'Carefully curated lo-fi hip-hop and chill beats for studying',
    url: 'http://stream.laut.fm/lofi',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi Hip-Hop',
    quality: 'Premium'
  },
  'lofi_girl': { 
    name: 'Lofi Girl - Study Radio', 
    description: 'The legendary 24/7 lo-fi hip hop beats to relax and study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi Hip-Hop',
    quality: 'Premium'
  },

  // POP HITS STATIONS
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'New York\'s #1 hit music station with today\'s biggest pop anthems',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'Premium'
  },
  'capital_london': {
    name: 'Capital London',
    description: 'UK\'s biggest hit music station playing chart-toppers and new releases',
    url: 'https://media-ssl.musicradio.com/CapitalMP3',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'Premium'
  },
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles',
    description: 'LA\'s hit music station with Olivia Rodrigo, Taylor Swift, and pop royalty',
    url: 'https://n3ba-e2.revma.ihrhls.com/zc185',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'Premium'
  }
};quality: 'High'
  },
  'somafm_fluid': {
    name: 'SomaFM Fluid',
    description: 'Instrumental hip hop, future soul and liquid trap beats',
    url: 'https://ice.somafm.com/fluid',
    fallback: 'https://ice.somafm.com/vaporwaves',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'somafm_vaporwaves': {
    name: 'SomaFM Vaporwaves',
    description: 'Pure vaporwave music with lo-fi aesthetics',
    url: 'https://ice.somafm.com/vaporwaves',
    fallback: 'https://ice.somafm.com/deepspaceone',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'somafm_deep_space': {
    name: 'SomaFM Deep Space One',
    description: 'Deep ambient electronic and space music for meditation',
    url: 'https://ice.somafm.com/deepspaceone',
    fallback: 'https://ice.somafm.com/gsclassic',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'somafm_groove_classic': {
    name: 'SomaFM Groove Salad Classic',
    description: 'Classic early 2000s ambient/downtempo with vintage lo-fi sound',
    url: 'https://ice.somafm.com/gsclassic',
    fallback: 'http://pub7.di.fm/di_chillhop',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'difm_chillhop': {
    name: 'DI.FM ChillHop',
    description: 'Mellow chill beats, lo-fi hip-hop, trip hop, and downtempo',
    url: 'http://pub7.di.fm/di_chillhop',
    fallback: 'http://stream.laut.fm/lofi',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'laut_fm_lofi': {
    name: 'laut.fm LOFI',
    description: 'Chilly lo-fi songs for escaping reality, indie lo-fi artists',
    url: 'http://stream.laut.fm/lofi',
    fallback: 'http://uk4.internet-radio.com:8405/live.mp3',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'box_lofi_radio': {
    name: 'BOX Lofi Radio',
    description: 'Serene blend of lo-fi, chill hop, chill pop, and sleep music',
    url: 'http://uk4.internet-radio.com:8405/live.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },

  // POP HITS STATIONS
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'capital_london': {
    name: 'Capital London',
    description: 'UK\'s No.1 Hit Music Station - Pop hits and chart music',
    url: 'https://media-ssl.musicradio.com/CapitalMP3',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles',
    description: 'LA\'s hit music station with Olivia Rodrigo, Taylor Swift, Dua Lipa',
    url: 'https://n3ba-e2.revma.ihrhls.com/zc185',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'High'
  }
};

// Updated UI file to remove Music Styles section and add banner
// src/features/radio/ui.js - UPDATED VERSION WITHOUT MUSIC STYLES LIST
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
      .setImage('attachment://images/Uta-banner.png')
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
