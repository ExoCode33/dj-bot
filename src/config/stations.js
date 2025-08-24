// src/config/stations.js - CLEAN VERSION WITH 22 STATIONS
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
};

export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Chart Toppers',
    description: 'Today\'s biggest pop hits and radio favorites',
    stations: ['z100_nyc', 'capital_london', 'kiis_fm_la']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop Universe',
    description: 'Korean and Japanese music featuring BlackPink, BTS, TWICE, and anime hits',
    stations: ['big_b_kpop', 'kpop_highway_radio', 'listen_moe_kpop', 'exclusively_bts', 'hotmixradio_kpop', 'listen_moe_jpop', 'big_b_jpop', 'asia_dream_jpop']
  },
  'hiphop_rnb': {
    name: '🎤 Hip-Hop & Urban',
    description: 'Premium hip-hop and R&B from legendary stations',
    stations: ['hot97_nyc']
  },
  'electronic_dubstep': {
    name: '🎵 Electronic & Bass',
    description: 'Dubstep, trap, future bass, and high-energy electronic music',
    stations: ['trap_nation_electronic', 'radio_record_dubstep', 'radio_record_bass_house', 'radio_record_future_bass', 'radio_record_hardstyle']
  },
  'chill_lofi': {
    name: '🌸 Chill & Study Vibes',
    description: 'Lo-fi hip-hop, ambient, and relaxing beats for focus and relaxation',
    stations: ['electronic_gaming_radio', 'somafm_groove_salad_lofi', 'laut_fm_lofi', 'lofi_girl']
  }
};
