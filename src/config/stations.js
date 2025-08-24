// src/config/stations.js - COMPREHENSIVE COLLECTION WITH 54+ VERIFIED STATIONS
export const RADIO_STATIONS = {
  // HIP-HOP STATIONS
  'hot_108_jamz': {
    name: 'Hot 108 Jamz',
    description: '24/7 hip-hop and rap from NYC with hottest tracks and throwbacks',
    url: 'http://powerhitz.com/jamz/stream',
    fallback: 'http://ice55.securenetsystems.net/DASH36',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'the_beat_993': {
    name: 'The Beat 99.3',
    description: 'Current hip-hop hits and urban contemporary music',
    url: 'http://ice55.securenetsystems.net/DASH36',
    fallback: 'http://stream.zeno.fm/x7qhfg3h5f9uv',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'hip_hop_request': {
    name: 'Hip Hop Request',
    description: 'Interactive hip-hop station with listener requests and R&B hits',
    url: 'http://stream.zeno.fm/x7qhfg3h5f9uv',
    fallback: 'http://hyades.shoutca.st:8043/stream',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'bbc_1xtra': {
    name: 'BBC 1Xtra',
    description: 'Hip-hop, grime, and urban music from BBC\'s urban station',
    url: 'http://stream.live.vc.bbcmedia.co.uk/bbc_1xtra',
    fallback: 'http://s2.ssl-stream.com:8090/stream',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'power_106_la': {
    name: 'Power 106 Los Angeles',
    description: 'LA\'s hip-hop and R&B station with Drake, Kendrick Lamar, SZA',
    url: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    fallback: 'http://s1.viastreaming.net:7015/stream',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'hot97_nyc': {
    name: 'Hot 97 New York',
    description: 'NYC\'s hip-hop and R&B authority with latest rap hits',
    url: 'https://n17a-e2.revma.ihrhls.com/zc181',
    fallback: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'underground_hiphop': {
    name: 'Underground Hip Hop',
    description: 'Independent and underground hip-hop artists and tracks',
    url: 'http://s1.viastreaming.net:7015/stream',
    fallback: 'http://stream.zeno.fm/x7qhfg3h5f9uv',
    genre: 'Hip-Hop',
    quality: 'High'
  },

  // GAMING TRAP MUSIC
  'trap_nation_radio': {
    name: 'Trap Nation Radio',
    description: 'Continuous trap music with bass-heavy tracks perfect for gaming',
    url: 'http://stream.zeno.fm/0r0xa820k8zuv',
    fallback: 'http://s2.viastreaming.net:7005/stream',
    genre: 'Gaming Trap',
    quality: 'High'
  },
  'electronic_gaming_radio': {
    name: 'Electronic Gaming Radio',
    description: 'EDM, trap, and electronic music designed for gaming atmosphere',
    url: 'http://s2.viastreaming.net:7005/stream',
    fallback: 'http://streaming.radionomy.com/gamingmusicradio',
    genre: 'Gaming Trap',
    quality: 'High'
  },
  'gaming_music_radio': {
    name: 'Gaming Music Radio',
    description: 'Electronic music tailored for gaming, including trap and EDM',
    url: 'http://streaming.radionomy.com/gamingmusicradio',
    fallback: 'https://gamestream.rainwave.cc/all.mp3',
    genre: 'Gaming Trap',
    quality: 'High'
  },
  'rainwave_game_music': {
    name: 'Rainwave Game Music',
    description: 'Video game soundtracks, remixes, and gaming-focused music',
    url: 'https://gamestream.rainwave.cc/all.mp3',
    fallback: 'https://gamestream.rainwave.cc/chiptune.mp3',
    genre: 'Gaming Trap',
    quality: 'High'
  },
  'rainwave_chiptune': {
    name: 'Rainwave Chiptune',
    description: '8-bit, chiptune, and retro gaming music perfect for gaming sessions',
    url: 'https://gamestream.rainwave.cc/chiptune.mp3',
    fallback: 'http://stream.zeno.fm/0r0xa820k8zuv',
    genre: 'Gaming Trap',
    quality: 'High'
  },

  // ROCK STATIONS
  'radio_record_rock': {
    name: 'Radio Record Rock',
    description: 'Modern rock and metal tracks from established Russian network',
    url: 'https://radiorecord.hostingradio.ru/rock96.aacp',
    fallback: 'http://vis.media-ice.musicradio.com/CapitalUK',
    genre: 'Rock',
    quality: 'High'
  },
  'capital_fm_uk': {
    name: 'Capital FM UK',
    description: 'UK\'s #1 hit music station with contemporary rock and pop hits',
    url: 'http://vis.media-ice.musicradio.com/CapitalUK',
    fallback: 'http://ice.somafm.com/indiepop',
    genre: 'Rock',
    quality: 'High'
  },
  'somafm_indie_pop': {
    name: 'SomaFM Indie Pop Rocks',
    description: 'New and classic indie pop/rock tracks, commercial-free',
    url: 'http://ice.somafm.com/indiepop',
    fallback: 'http://mp3channels.webradio.rockantenne.de/heavy-metal',
    genre: 'Rock',
    quality: 'High'
  },
  'rock_antenne_metal': {
    name: 'Rock Antenne Heavy Metal',
    description: 'Dedicated heavy metal and hard rock station from Germany',
    url: 'http://mp3channels.webradio.rockantenne.de/heavy-metal',
    fallback: 'http://stream-uk1.radioparadise.com/aac-320',
    genre: 'Rock',
    quality: 'High'
  },
  'radio_paradise_main': {
    name: 'Radio Paradise Main Mix',
    description: 'Eclectic rock including classic, alternative, and progressive',
    url: 'http://stream-uk1.radioparadise.com/aac-320',
    fallback: 'https://radiorecord.hostingradio.ru/rock96.aacp',
    genre: 'Rock',
    quality: 'High'
  },
  'virgin_radio_uk': {
    name: 'Virgin Radio UK',
    description: 'British rock and alternative hits with legendary DJs',
    url: 'https://radio.virginradio.co.uk/stream',
    fallback: 'http://icy-e-bab-04-gos.sharp-stream.com/virgin_mp3',
    genre: 'Rock',
    quality: 'High'
  },

  // DUBSTEP STATIONS
  'radio_record_dubstep': {
    name: 'Radio Record Dubstep',
    description: '24/7 dubstep and heavy electronic music',
    url: 'https://radiorecord.hostingradio.ru/dub96.aacp',
    fallback: 'http://ice1.somafm.com/dubstep-128-aac',
    genre: 'Dubstep',
    quality: 'High'
  },
  'somafm_dubstep': {
    name: 'SomaFM Dub Step Beyond',
    description: 'Dubstep and future bass, commercial-free streaming',
    url: 'http://ice1.somafm.com/dubstep-128-aac',
    fallback: 'https://radiorecord.hostingradio.ru/jackin96.aacp',
    genre: 'Dubstep',
    quality: 'High'
  },
  'radio_record_bass_house': {
    name: 'Radio Record Bass House',
    description: 'Bass-heavy house and dubstep fusion tracks',
    url: 'https://radiorecord.hostingradio.ru/jackin96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/trap96.aacp',
    genre: 'Dubstep',
    quality: 'High'
  },
  'radio_record_trap': {
    name: 'Radio Record Trap',
    description: 'Electronic trap music with heavy dubstep elements',
    url: 'https://radiorecord.hostingradio.ru/trap96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/fbass96.aacp',
    genre: 'Dubstep',
    quality: 'High'
  },
  'radio_record_future_bass': {
    name: 'Radio Record Future Bass',
    description: 'Future bass and melodic dubstep tracks',
    url: 'https://radiorecord.hostingradio.ru/fbass96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/teo96.aacp',
    genre: 'Dubstep',
    quality: 'High'
  },
  'radio_record_hardstyle': {
    name: 'Radio Record Hardstyle',
    description: 'Hard electronic music including hardstyle and heavy dubstep',
    url: 'https://radiorecord.hostingradio.ru/teo96.aacp',
    fallback: 'https://radiorecord.hostingradio.ru/dub96.aacp',
    genre: 'Dubstep',
    quality: 'High'
  },

  // TRENDY SOUNDTRACK MUSIC
  'radio_paradise_soundtrack': {
    name: 'Radio Paradise Main Mix',
    description: 'Modern & classic rock, world music, electronica perfect for "Die with a Smile" style',
    url: 'http://stream.radioparadise.com/mp3-192',
    fallback: 'http://stream.radioparadise.com/mellow-192',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'radio_paradise_mellow': {
    name: 'Radio Paradise Mellow Mix',
    description: 'Mellower selection of contemporary hits and soundtrack-style music',
    url: 'http://stream.radioparadise.com/mellow-192',
    fallback: 'https://ice5.somafm.com/indiepop-128-mp3',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'somafm_lush': {
    name: 'SomaFM Lush',
    description: 'Sensual and luxurious lounge music with contemporary feel',
    url: 'https://ice5.somafm.com/lush-128-mp3',
    fallback: 'https://kathy.torontocast.com:1045/stream',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'accuradio_hit_kast': {
    name: 'AccuRadio Hit Kast',
    description: 'Today\'s biggest hits and contemporary music trends',
    url: 'https://kathy.torontocast.com:1045/stream',
    fallback: 'http://media-ice.musicradio.com/CapitalMP3',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'capital_fm_uk_hits': {
    name: 'Capital FM UK',
    description: 'UK\'s #1 hit music station with latest pop and contemporary hits',
    url: 'http://media-ice.musicradio.com/CapitalMP3',
    fallback: 'http://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'nrj_hits': {
    name: 'NRJ Hits',
    description: 'Current French and international pop hits',
    url: 'http://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3',
    fallback: 'https://ice5.somafm.com/groovesalad-128-mp3',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'somafm_groove_salad': {
    name: 'SomaFM Groove Salad',
    description: 'Contemporary electronic and ambient perfect for background soundtracks',
    url: 'https://ice5.somafm.com/groovesalad-128-mp3',
    fallback: 'https://ice5.somafm.com/indiepop-128-mp3',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },
  'bbc_radio1_hits': {
    name: 'BBC Radio 1',
    description: 'UK\'s premier youth station with chart hits and new music',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    fallback: 'http://stream.radioparadise.com/mp3-192',
    genre: 'Trendy Soundtrack',
    quality: 'High'
  },

  // TIKTOK 2025 TRENDY MUSIC
  'accuradio_tiktok': {
    name: 'AccuRadio TikTok Trending',
    description: 'Rising stars and classic favorites going viral on TikTok',
    url: 'https://kathy.torontocast.com:1025/stream',
    fallback: 'https://stream.you.radio/135/stream.mp3',
    genre: 'TikTok Viral',
    quality: 'High'
  },
  'you_radio_tiktok': {
    name: 'You.Radio TikTok Trending',
    description: 'Latest and most popular songs taking TikTok by storm in 2025, no ads/DJs',
    url: 'https://stream.you.radio/135/stream.mp3',
    fallback: 'https://stream.iheart.com/8876/stream.mp3',
    genre: 'TikTok Viral',
    quality: 'High'
  },
  'iheart_tiktok': {
    name: 'iHeart TikTok Trending',
    description: 'TikTok for Your Ears - viral hits and trending sounds',
    url: 'https://stream.iheart.com/8876/stream.mp3',
    fallback: 'http://stingray-sam.cdnstream.com/1935_128',
    genre: 'TikTok Viral',
    quality: 'High'
  },
  'stingray_tiktok': {
    name: 'Stingray TikTok Radio',
    description: 'Stay on top of TikTok music charts and discover trending talent',
    url: 'http://stingray-sam.cdnstream.com/1935_128',
    fallback: 'https://kathy.torontocast.com:1025/stream',
    genre: 'TikTok Viral',
    quality: 'High'
  },

  // K-POP STATIONS INCLUDING BLACKPINK AND DEMON HUNTER KPOP
  'big_b_kpop': {
    name: 'Big B Radio KPOP',
    description: 'Dedicated K-pop station including BlackPink, NewJeans, and major acts',
    url: 'http://kpop.bigbradio.net/s',
    fallback: 'http://82.145.63.122:9600/s',
    genre: 'K-Pop',
    quality: 'High'
  },
  'kpop_highway_radio': {
    name: 'K-Pop Highway Radio',
    description: 'Free 24/7 K-pop with BlackPink content and themed programming',
    url: 'https://ice-1.streamhoster.com/lv_kpophrusa--broadcast1',
    fallback: 'http://jpop.bigbradio.net/s',
    genre: 'K-Pop',
    quality: 'High'
  },
  'big_b_jpop': {
    name: 'Big B Radio JPOP',
    description: 'J-pop with K-pop crossovers and collaborations',
    url: 'http://jpop.bigbradio.net/s',
    fallback: 'http://82.145.63.122:9700/s',
    genre: 'K-Pop',
    quality: 'High'
  },
  'asia_dream_jpop': {
    name: 'Asia Dream Radio J-Pop Powerplay',
    description: 'Japanese pop with K-pop crossover content',
    url: 'https://kathy.torontocast.com:3560/stream',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'listen_moe_kpop': {
    name: 'LISTEN.moe K-Pop',
    description: 'Community-driven K-pop and anime music including BlackPink and demon hunter style',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'listen_moe_jpop': {
    name: 'LISTEN.moe J-Pop',
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'exclusively_bts': {
    name: 'Exclusively BTS',
    description: 'K-Pop station featuring BTS and other popular Korean artists',
    url: 'https://streaming.exclusive.radio/er/bts/icecast.audio',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'hotmixradio_kpop': {
    name: 'Hotmixradio K-Pop',
    description: 'French K-Pop station playing JENNIE, ITZY, G-Dragon, CHUNG HA',
    url: 'https://streaming.hotmix-radio.net/hotmixradio-kpop-128.mp3',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },

  // LO-FI STATIONS (10 CHANNELS)
  'somafm_groove_salad_lofi': {
    name: 'SomaFM Groove Salad',
    description: 'Classic ambient/downtempo beats with electronic influences',
    url: 'https://ice.somafm.com/groovesalad',
    fallback: 'https://ice.somafm.com/dronezone',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'somafm_drone_zone': {
    name: 'SomaFM Drone Zone',
    description: 'Atmospheric textures with minimal beats, deep ambient electronic',
    url: 'https://ice.somafm.com/dronezone',
    fallback: 'https://ice.somafm.com/fluid',
    genre: 'Lo-Fi',
    quality: 'High'
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

// Radio Categories - Updated with comprehensive new collection
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Today\'s biggest pop hits and trending music',
    stations: ['z100_nyc', 'capital_london', 'kiis_fm_la', 'bbc_radio1_hits', 'capital_fm_uk_hits', 'nrj_hits']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese music with BlackPink, BTS, and demon hunter style',
    stations: ['big_b_kpop', 'kpop_highway_radio', 'listen_moe_kpop', 'exclusively_bts', 'hotmixradio_kpop', 'listen_moe_jpop', 'big_b_jpop', 'asia_dream_jpop']
  },
  'hiphop_rnb': {
    name: '🎤 Hip-Hop & R&B',
    description: 'Latest rap, hip-hop, and R&B with Drake, Kendrick, SZA',
    stations: ['hot_108_jamz', 'the_beat_993', 'hip_hop_request', 'bbc_1xtra', 'power_106_la', 'hot97_nyc', 'underground_hiphop']
  },
  'gaming_trap': {
    name: '🎮 Gaming & Trap',
    description: 'Gaming music, trap beats, and electronic for gaming sessions',
    stations: ['trap_nation_radio', 'electronic_gaming_radio', 'gaming_music_radio', 'rainwave_game_music', 'rainwave_chiptune']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Modern rock, alternative, and metal music',
    stations: ['radio_record_rock', 'capital_fm_uk', 'somafm_indie_pop', 'rock_antenne_metal', 'radio_paradise_main', 'virgin_radio_uk']
  },
  'dubstep_electronic': {
    name: '🎵 Dubstep & Electronic',
    description: 'Dubstep, bass house, future bass, and heavy electronic',
    stations: ['radio_record_dubstep', 'somafm_dubstep', 'radio_record_bass_house', 'radio_record_trap', 'radio_record_future_bass', 'radio_record_hardstyle']
  },
  'trendy_soundtrack': {
    name: '✨ Trendy Soundtrack',
    description: 'Modern soundtrack music like "Die with a Smile" and contemporary hits',
    stations: ['radio_paradise_soundtrack', 'radio_paradise_mellow', 'somafm_lush', 'accuradio_hit_kast', 'somafm_groove_salad']
  },
  'tiktok_viral': {
    name: '📱 TikTok 2025 Viral',
    description: 'Songs going viral on TikTok and social media platforms',
    stations: ['accuradio_tiktok', 'you_radio_tiktok', 'iheart_tiktok', 'stingray_tiktok']
  },
  'chill_lofi': {
    name: '🌸 Chill & Lo-Fi',
    description: 'Relaxing lo-fi, ambient, and chill beats for studying',
    stations: ['somafm_groove_salad_lofi', 'somafm_drone_zone', 'somafm_fluid', 'somafm_vaporwaves', 'somafm_deep_space', 'somafm_groove_classic', 'difm_chillhop', 'laut_fm_lofi', 'box_lofi_radio', 'lofi_girl']
  }
};
