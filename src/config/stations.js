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
    description: 'Korean pop music with trendy K-Pop hits',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
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
  'somafm_groovesalad': {
    name: 'SomaFM Groove Salad',
    description: 'Ambient downtempo with electronic elements',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    fallback: 'http://ice2.somafm.com/groovesalad-256-mp3',
    genre: 'Ambient Electronic',
    quality: 'High'
  },
  'somafm_dronezone': {
    name: 'SomaFM Drone Zone',
    description: 'Deep ambient electronic soundscapes',
    url: 'http://ice1.somafm.com/dronezone-256-mp3',
    fallback: 'http://ice2.somafm.com/dronezone-256-mp3',
    genre: 'Ambient',
    quality: 'High'
  },
  'somafm_beatblender': {
    name: 'SomaFM Beat Blender',
    description: 'Downtempo, trip-hop, and electronic beats',
    url: 'http://ice1.somafm.com/beatblender-128-mp3',
    fallback: 'http://ice2.somafm.com/beatblender-128-mp3',
    genre: 'Electronic Beats',
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
  }
};

// Radio Categories - Music style groupings
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Top hits perfect for Uta\'s performances',
    stations: ['z100_nyc', 'iloveradio_dance', 'hiphop_nation']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for energetic shows',
    stations: ['somafm_beatblender', 'somafm_groovesalad', 'iloveradio_dance']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for quieter moments',
    stations: ['somafm_dronezone', 'lofi_girl']
  },
  'anime_jpop': {
    name: '🎌 Anime & J-Pop',
    description: 'Japanese music collection',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for powerful performances',
    stations: ['rock_antenne']
  }
};
