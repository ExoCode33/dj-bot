// src/config/stations.js - VERIFIED WORKING STATIONS
export const RADIO_STATIONS = {
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'Anime',
    quality: 'High'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop music with BlackPink, BTS, NewJeans, and trending K-Pop',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'exclusively_blackpink': {
    name: 'Exclusively BlackPink',
    description: 'All BlackPink all the time - dedicated BlackPink radio station',
    url: 'https://streaming.exclusive.radio/er/blackpink/icecast.audio',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'exclusively_bts': {
    name: 'Exclusively BTS',
    description: 'Record-breaking K-pop septet - All BTS All The Time',
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
  'allzic_kpop': {
    name: 'Allzic Radio K-Pop',
    description: 'French K-Pop station with popular Korean artists',
    url: 'https://allzic29.ice.infomaniak.ch/allzic29.mp3',
    fallback: 'https://streaming.hotmix-radio.net/hotmixradio-kpop-128.mp3',
    genre: 'K-Pop',
    quality: 'High'
  },
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'Dance hits and electronic music',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'Dance',
    quality: 'High'
  },
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with powerful beats',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with powerful guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  },
  'bbc_radio_1': {
    name: 'BBC Radio 1',
    description: 'UK\'s leading pop and dance music station with live DJs',
    url: 'http://lstn.lv/bbcradio.m3u8?station=bbc_radio_one&bitrate=320000',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Pop/Dance',
    quality: 'High'
  },
  'bbc_radio_2': {
    name: 'BBC Radio 2',
    description: 'Adult contemporary hits and classic songs from the UK',
    url: 'http://lstn.lv/bbcradio.m3u8?station=bbc_radio_two&bitrate=320000',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Adult Contemporary',
    quality: 'High'
  },
  'radio_paradise': {
    name: 'Radio Paradise',
    description: 'Eclectic mix of rock, world, and electronic music',
    url: 'http://stream.radioparadise.com/aac-320',
    fallback: 'http://stream.radioparadise.com/mp3-192',
    genre: 'Eclectic',
    quality: 'High'
  },
  'kexp_seattle': {
    name: 'KEXP Seattle',
    description: 'Independent music from Seattle - alternative, indie, and world music',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    fallback: 'https://kexp-aac-64.streamguys1.com/kexp64.aac',
    genre: 'Alternative',
    quality: 'High'
  },
  'nts_radio': {
    name: 'NTS Radio',
    description: 'London-based station with experimental electronic and alternative music',
    url: 'https://stream-relay-geo.ntslive.net/stream',
    fallback: 'https://stream-relay-geo.ntslive.net/stream2',
    genre: 'Electronic/Alternative',
    quality: 'High'
  }
};

// Radio Categories - Music style groupings
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Top hits perfect for Uta\'s performances',
    stations: ['z100_nyc', 'bbc_radio_1', 'bbc_radio_2', 'iloveradio_dance']
  },
  'anime_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese music with BlackPink, BTS, and popular K-Pop artists',
    stations: ['listen_moe_kpop', 'exclusively_blackpink', 'exclusively_bts', 'hotmixradio_kpop', 'allzic_kpop', 'listen_moe_jpop']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for energetic shows',
    stations: ['iloveradio_dance', 'nts_radio']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for quieter moments',
    stations: ['lofi_girl', 'radio_paradise']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for powerful performances',
    stations: ['rock_antenne', 'kexp_seattle']
  },
  'hiphop_urban': {
    name: '🎤 Hip-Hop & Urban',
    description: 'Hip-hop and rap music',
    stations: ['hiphop_nation']
  }
};
