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
  'virgin_radio_uk': {
    name: 'Virgin Radio UK',
    description: 'British rock and pop hits with legendary DJs',
    url: 'https://radio.virginradio.co.uk/stream',
    fallback: 'http://icy-e-bab-04-gos.sharp-stream.com/virgin_mp3',
    genre: 'Rock/Pop',
    quality: 'High'
  },
  'kiss_fm_uk': {
    name: 'Kiss FM UK',
    description: 'Hip-hop, R&B, and urban music from the UK',
    url: 'https://media-ssl.musicradio.com/KissFMMP3',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Hip-Hop/Urban',
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
  'absolute_radio': {
    name: 'Absolute Radio UK',
    description: 'Alternative rock and indie music from the UK',
    url: 'https://ais-edge09-live365-dal02.cdnstream.com/a73197',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'radio_paradise_eclectic': {
    name: 'Radio Paradise',
    description: 'Eclectic mix of rock, world, and electronic music',
    url: 'http://stream.radioparadise.com/aac-320',
    fallback: 'http://stream.radioparadise.com/mp3-192',
    genre: 'Eclectic',
    quality: 'High'
  },
};

// Radio Categories - Music style groupings
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Top hits perfect for Uta\'s performances',
    stations: ['z100_nyc', 'capital_london', 'iloveradio_dance']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese music with BTS and popular K-Pop artists',
    stations: ['listen_moe_kpop', 'exclusively_bts', 'hotmixradio_kpop', 'listen_moe_jpop']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for energetic shows',
    stations: ['iloveradio_dance']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for quieter moments',
    stations: ['lofi_girl', 'radio_paradise_eclectic']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for powerful performances',
    stations: ['rock_antenne', 'virgin_radio_uk', 'absolute_radio']
  },
  'hiphop_urban': {
    name: '🎤 Hip-Hop & Urban',
    description: 'Hip-hop and rap music',
    stations: ['hiphop_nation', 'kiss_fm_uk']
  }
};
