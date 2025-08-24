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
  '113fm_kpop': {
    name: '113.FM K-Pop',
    description: 'Dedicated K-Pop station with BTS, BlackPink, Stray Kids, and more',
    url: 'https://113fm-atunwadigital.streamguys1.com/1018',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'big_b_kpop': {
    name: 'Big B Radio K-Pop',
    description: 'Korean pop music with latest idol groups and comebacks',
    url: 'http://streams.bigbradio.com/bigb-kpop-64',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'hunter_fm_kpop': {
    name: 'Hunter.FM K-Pop',
    description: 'Non-stop K-Pop hits from top Korean artists',
    url: 'https://hunterradio.radioca.st:8443/kpop',
    fallback: 'https://113fm-atunwadigital.streamguys1.com/1018',
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
  'dubstep_fm': {
    name: 'Dubstep.fm',
    description: 'Heavy dubstep drops, riddim, and electronic bass music',
    url: 'http://hi5.dubstep.fm:8000/dubstep',
    fallback: 'https://streams.ilovemusic.de/iloveradio8.mp3',
    genre: 'Dubstep',
    quality: 'High'
  },
  'bassport_fm': {
    name: 'Bassport FM',
    description: 'UK dubstep, drum & bass, and heavy electronic music',
    url: 'https://bassport.org:8000/stream',
    fallback: 'http://hi5.dubstep.fm:8000/dubstep',
    genre: 'Bass/Dubstep',
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
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop Collection',
    description: 'Korean and Japanese music including BlackPink, BTS, and anime OSTs',
    stations: ['listen_moe_kpop', '113fm_kpop', 'big_b_kpop', 'hunter_fm_kpop', 'listen_moe_jpop']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for energetic shows',
    stations: ['iloveradio_dance', 'dubstep_fm', 'bassport_fm']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for quieter moments',
    stations: ['lofi_girl']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for powerful performances',
    stations: ['rock_antenne']
  }
};
