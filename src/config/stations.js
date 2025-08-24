// src/config/stations.js - UPDATED WITH TRENDY 2025 STATIONS
export const RADIO_STATIONS = {
  // LOFI & CHILL
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'chill_cafe': {
    name: 'ChillCafe Radio',
    description: 'Cozy coffee shop vibes with jazzy lofi beats',
    url: 'http://streaming.radionomy.com/ChillCafe',
    fallback: 'http://streaming.radionomy.com/Jazz-LoFi',
    genre: 'Chill Lo-Fi',
    quality: 'High'
  },
  'study_vibes': {
    name: 'Study Vibes 24/7',
    description: 'Perfect background music for productivity and focus',
    url: 'http://streaming.radionomy.com/StudyBeats247',
    fallback: 'http://streaming.radionomy.com/Instrumental-Focus',
    genre: 'Study Beats',
    quality: 'High'
  },

  // TIKTOK TRENDING & POP
  'tiktok_hits': {
    name: 'TikTok Viral Hits',
    description: 'Latest viral songs trending on TikTok and social media',
    url: 'http://streaming.radionomy.com/TikTokHits',
    fallback: 'http://streaming.radionomy.com/Viral-Pop-Hits',
    genre: 'Viral Pop',
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
  'gen_z_anthems': {
    name: 'Gen Z Anthems',
    description: 'The hottest tracks Gen Z is obsessing over',
    url: 'http://streaming.radionomy.com/GenZ-Anthems',
    fallback: 'http://streaming.radionomy.com/Youth-Pop-2025',
    genre: 'Gen Z Pop',
    quality: 'High'
  },

  // HIP-HOP & RAP
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with powerful beats',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'trap_central': {
    name: 'Trap Central',
    description: 'Heavy trap beats and modern rap bangers',
    url: 'http://streaming.radionomy.com/Trap-Central',
    fallback: 'http://streaming.radionomy.com/Modern-Trap',
    genre: 'Trap',
    quality: 'High'
  },
  'drill_beats': {
    name: 'Drill Beats Radio',
    description: 'UK Drill, Chicago Drill, and international drill music',
    url: 'http://streaming.radionomy.com/Drill-Beats',
    fallback: 'http://streaming.radionomy.com/UK-Drill-Radio',
    genre: 'Drill',
    quality: 'High'
  },

  // ROCK & ALTERNATIVE
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with powerful guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  },
  'alt_rock_central': {
    name: 'Alternative Rock Central',
    description: 'Modern alternative rock and indie hits',
    url: 'http://streaming.radionomy.com/Alternative-Rock-Central',
    fallback: 'http://streaming.radionomy.com/Indie-Rock-Station',
    genre: 'Alt Rock',
    quality: 'High'
  },
  'metal_mayhem': {
    name: 'Metal Mayhem',
    description: 'Heavy metal, metalcore, and hardcore tracks',
    url: 'http://streaming.radionomy.com/Metal-Mayhem',
    fallback: 'http://streaming.radionomy.com/Heavy-Metal-Radio',
    genre: 'Metal',
    quality: 'High'
  },

  // ELECTRONIC & DUBSTEP
  'bass_boost': {
    name: 'Bass Boost FM',
    description: 'Heavy dubstep, bass drops, and electronic mayhem',
    url: 'http://streaming.radionomy.com/Bass-Boost-FM',
    fallback: 'http://streaming.radionomy.com/Dubstep-Central',
    genre: 'Dubstep',
    quality: 'High'
  },
  'edm_festival': {
    name: 'EDM Festival Radio',
    description: 'Festival anthems, progressive house, and big room beats',
    url: 'http://streaming.radionomy.com/EDM-Festival',
    fallback: 'http://streaming.radionomy.com/Progressive-House',
    genre: 'EDM',
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
  'future_bass': {
    name: 'Future Bass Central',
    description: 'Melodic dubstep, future bass, and emotional drops',
    url: 'http://streaming.radionomy.com/Future-Bass-Central',
    fallback: 'http://streaming.radionomy.com/Melodic-Dubstep',
    genre: 'Future Bass',
    quality: 'High'
  },

  // ANIME & INTERNATIONAL
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
  }
};

// Radio Categories - Updated with new trendy stations
export const RADIO_CATEGORIES = {
  'viral_trending': {
    name: '🔥 Viral & Trending',
    description: 'TikTok hits and what\'s trending right now',
    stations: ['tiktok_hits', 'gen_z_anthems', 'z100_nyc']
  },
  'hiphop_rap': {
    name: '🎤 Hip-Hop & Rap',
    description: 'Trap, drill, and the hottest rap tracks',
    stations: ['hiphop_nation', 'trap_central', 'drill_beats']
  },
  'electronic_bass': {
    name: '🔊 Electronic & Bass',
    description: 'Dubstep, EDM, and heavy bass drops',
    stations: ['bass_boost', 'edm_festival', 'future_bass', 'iloveradio_dance']
  },
  'rock_metal': {
    name: '🎸 Rock & Metal',
    description: 'Alternative rock, metal, and heavy guitars',
    stations: ['rock_antenne', 'alt_rock_central', 'metal_mayhem']
  },
  'chill_lofi': {
    name: '🌸 Chill & Lo-Fi',
    description: 'Study beats, coffee shop vibes, and relaxing sounds',
    stations: ['lofi_girl', 'chill_cafe', 'study_vibes']
  },
  'anime_international': {
    name: '🎌 Anime & International',
    description: 'Japanese, Korean, and international music',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  }
};
