// src/config/stations.js - UPDATED GEN Z TRENDY STATIONS
export const RADIO_STATIONS = {
  // === GEN Z TRENDY POP & VIRAL HITS ===
  'power_106_la': { 
    name: 'Power 106 LA - Hip Hop & R&B', 
    description: 'LA\'s #1 for hip hop hits and viral TikTok music',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  'z100_nyc': {
    name: 'Z100 New York - Pop Hits',
    description: 'NYC\'s #1 hit music - Pop, dance, and viral chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles - Pop',
    description: 'Ryan Seacrest\'s station with latest pop and trending hits',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KIISFMAAC.aac',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Pop',
    quality: 'High'
  },

  // === K-POP & ASIAN HITS ===
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music, anime OSTs, and J-Pop hits',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'J-Pop/Anime',
    quality: 'High'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop with BlackPink, BTS, NewJeans, and trending K-Pop',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'kpop_starz': {
    name: 'K-Pop Starz Radio',
    description: 'Latest K-Pop hits including BlackPink, ITZY, aespa, and more',
    url: 'http://streaming.radionomy.com/KPOP-Starz',
    fallback: 'http://streaming.radionomy.com/Korea-Radio',
    genre: 'K-Pop',
    quality: 'High'
  },

  // === DUBSTEP & ELECTRONIC DANCE ===
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
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'EDM, house, techno, and festival electronic hits',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'EDM/Dance',
    quality: 'High'
  },
  'di_fm_dubstep': {
    name: 'DI.FM Dubstep',
    description: 'Premium dubstep channel with heavy drops and wobbles',
    url: 'https://prem2.di.fm:443/dubstep?5739cfabf2445ca8b6dee8e9',
    fallback: 'http://hi5.dubstep.fm:8000/dubstep',
    genre: 'Dubstep',
    quality: 'Premium'
  },

  // === HIP-HOP & RAP ===
  'hot_97_nyc': {
    name: 'Hot 97 New York - Hip Hop',
    description: 'NYC\'s original hip-hop station with latest rap and R&B',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HOT97AAC.aac',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'real_92_3_la': {
    name: 'Real 92.3 Los Angeles',
    description: 'LA\'s hip-hop and R&B with latest rap hits and throwbacks',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KRRLAAAAC.aac',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  'shade_45': {
    name: 'Shade 45 - Eminem\'s Channel',
    description: 'Eminem\'s uncensored hip-hop channel with hardcore rap',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/SIRIUSXMSHADE45AAC.aac',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Hardcore Rap',
    quality: 'High'
  },

  // === ROCK & ALTERNATIVE ===
  'kroq_la': {
    name: 'KROQ Los Angeles - Alternative Rock',
    description: 'LA\'s legendary alternative rock station with indie and modern rock',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KROQFMAAC.aac',
    fallback: 'http://mp3channels.webradio.antenne.de/alternative',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'alt_nation': {
    name: 'Alt Nation - Alternative',
    description: 'Alternative rock, indie, and modern rock hits',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/SIRIUSXMALTNATIONAAC.aac',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne',
    genre: 'Alternative',
    quality: 'High'
  },
  'octane_rock': {
    name: 'Octane - Hard Rock',
    description: 'Hard rock and heavy metal with powerful guitar riffs',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/SIRIUSXMOCTANEAAC.aac',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Hard Rock',
    quality: 'High'
  },

  // === LO-FI & CHILL ===
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'chillhop_radio': {
    name: 'Chillhop Radio',
    description: 'Chill beats, jazz hop, and relaxing instrumental music',
    url: 'http://streaming.radionomy.com/Chillhop-Radio',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Chillhop',
    quality: 'High'
  }
};

// Radio Categories - Updated for Gen Z trends
export const RADIO_CATEGORIES = {
  'viral_hits': {
    name: '🔥 Viral Hits & Trending',
    description: 'TikTok viral music, chart toppers, and trending pop hits',
    stations: ['z100_nyc', 'kiis_fm_la', 'power_106_la']
  },
  'kpop_asian': {
    name: '🎌 K-Pop & Asian Hits',
    description: 'BlackPink, BTS, NewJeans, and trending Asian pop music',
    stations: ['listen_moe_kpop', 'kpop_starz', 'listen_moe_jpop']
  },
  'dubstep_bass': {
    name: '🔊 Dubstep & Bass',
    description: 'Heavy drops, riddim, and electronic bass music',
    stations: ['dubstep_fm', 'bassport_fm', 'di_fm_dubstep']
  },
  'hiphop_rap': {
    name: '🎤 Hip-Hop & Rap',
    description: 'Latest rap hits, hardcore hip-hop, and R&B bangers',
    stations: ['hot_97_nyc', 'real_92_3_la', 'shade_45']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Alternative rock, indie, and modern rock hits',
    stations: ['kroq_la', 'alt_nation', 'octane_rock']
  },
  'electronic_dance': {
    name: '💃 Electronic & Dance',
    description: 'EDM, house, techno, and festival electronic music',
    stations: ['iloveradio_dance', 'dubstep_fm', 'bassport_fm']
  },
  'chill_lofi': {
    name: '🌸 Chill & Lo-Fi',
    description: 'Study beats, chill hop, and relaxing background music',
    stations: ['lofi_girl', 'chillhop_radio']
  }
};
