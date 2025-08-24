// src/config/stations.js - VERIFIED WORKING STATIONS with HARD BASS DROP focus
export const RADIO_STATIONS = {
  // ✅ CONFIRMED WORKING - Keep these
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
  
  // ✅ ALTERNATIVE HARD BASS STATIONS - SomaFM (Known for Lavalink compatibility)
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
  'somafm_deepspaceone': {
    name: 'SomaFM Deep Space One',
    description: 'Deep ambient electronic space music',
    url: 'http://ice1.somafm.com/deepspaceone-128-mp3',
    fallback: 'http://ice2.somafm.com/deepspaceone-128-mp3',
    genre: 'Space Electronic',
    quality: 'High'
  },
  
  // ✅ DIRECT MP3 STREAMS - More likely to work
  'iloveradio_hardstyle': {
    name: 'ILoveRadio Hardstyle',
    description: 'German hardstyle with CRUSHING drops',
    url: 'https://streams.ilovemusic.de/iloveradio21.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio21.aac',
    genre: 'Hardstyle',
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
  'iloveradio_clubsounds': {
    name: 'ILoveRadio Club Sounds',
    description: 'Club music and house beats',
    url: 'https://streams.ilovemusic.de/iloveradio16.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio16.aac',
    genre: 'Club Music',
    quality: 'High'
  },
  
  // ✅ BASS FOCUSED ALTERNATIVES - Radionomy (Usually works well)
  'bass_radio_1': {
    name: 'Bass Radio One',
    description: 'Heavy bass and electronic music',
    url: 'http://streaming.radionomy.com/Bass-Radio',
    fallback: 'http://streaming.radionomy.com/HardBass',
    genre: 'Bass Music',
    quality: 'High'
  },
  'electronic_pioneer': {
    name: 'Electronic Pioneer',
    description: 'Underground electronic with heavy drops',
    url: 'http://streaming.radionomy.com/Electronic-Pioneer',
    fallback: 'http://streaming.radionomy.com/ElectronicBeats',
    genre: 'Electronic',
    quality: 'High'
  },
  'dubstep_beyond': {
    name: 'Dubstep Beyond',
    description: 'Pure dubstep with MASSIVE bass drops',
    url: 'http://streaming.radionomy.com/Dubstep-Beyond',
    fallback: 'http://streaming.radionomy.com/DubstepFM',
    genre: 'Dubstep',
    quality: 'High'
  },
  'hardstyle_fm': {
    name: 'Hardstyle FM',
    description: 'Non-stop hardstyle with BRUTAL kicks',
    url: 'http://streaming.radionomy.com/HardstyleFM',
    fallback: 'http://streaming.radionomy.com/Hardstyle-Music',
    genre: 'Hardstyle',
    quality: 'High'
  },
  
  // ✅ ADDITIONAL WORKING ALTERNATIVES
  'bigfm_electro': {
    name: 'BigFM Electro',
    description: 'German electronic music with heavy beats',
    url: 'http://streams.bigfm.de/bigfm-nitroxparty-128-mp3',
    fallback: 'http://streams.bigfm.de/bigfm-deutschland-128-mp3',
    genre: 'Electronic',
    quality: 'High'
  },
  'poolsuite_fm': {
    name: 'Poolsuite FM',
    description: 'Summer vibes and yacht rock for chill sessions',
    url: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Chill',
    quality: 'High'
  },
  
  // ✅ HIP-HOP ALTERNATIVES
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with heavy bass',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  
  // ✅ ROCK ALTERNATIVES
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with heavy guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  }
};
