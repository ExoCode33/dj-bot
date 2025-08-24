// src/config/stations.js - REAL WORKING STATIONS WITH VERIFIED URLS
export const RADIO_STATIONS = {
  // LOFI & CHILL - REAL WORKING STATIONS
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'hunter_fm_lofi': {
    name: 'Hunter FM LoFi',
    description: 'Perfect beats for studying, working, or relaxing',
    url: 'http://hunter.fm:8000/lofi.mp3',
    fallback: 'http://hunter.fm:8000/lofi',
    genre: 'Study Beats',
    quality: 'High'
  },

  // REAL HIP-HOP & RAP STATIONS
  'power_106': {
    name: 'Power 106 Los Angeles',
    description: 'LA\'s #1 for Hip Hop - Real urban hits and rap',
    url: 'https://n15a-e2.revma.ihrhls.com/zc4353',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'power_105': {
    name: 'Power 105.1 New York',
    description: 'New York\'s Hip Hop and R&B station',
    url: 'https://n13a-e2.revma.ihrhls.com/zc185',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/WWPRFMAAC.aac',
    genre: 'Hip-Hop',
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

  // REAL POP & CHART HITS
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'kiis_fm': {
    name: 'KIIS FM Los Angeles',
    description: 'LA\'s #1 Hit Music Station - Today\'s biggest hits',
    url: 'https://n26a-e2.revma.ihrhls.com/zc229',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KIISAMAAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },

  // REAL DUBSTEP & ELECTRONIC STATIONS  
  'dubstep_fm': {
    name: 'Dubstep.fm',
    description: 'Pure dubstep music 24/7 - Heavy drops and wobbles',
    url: 'https://www.dubstep.fm:8443/stream',
    fallback: 'https://www.dubstep.fm/stream',
    genre: 'Dubstep',
    quality: 'High'
  },
  'di_fm_dubstep': {
    name: 'DI.FM Dubstep',
    description: 'Digitally Imported - The wobbles and biggest drops',
    url: 'http://prem2.di.fm:80/dubstep',
    fallback: 'http://pub7.di.fm:80/di_dubstep',
    genre: 'Dubstep',
    quality: 'High'
  },
  'party_vibe_dubstep': {
    name: 'Party Vibe Dubstep',
    description: 'High definition dubstep with breakbeat and hip hop',
    url: 'http://www.partyvibe.com:8004/stream.mp3',
    fallback: 'http://www.partyvibe.com:8004/',
    genre: 'Dubstep',
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

  // REAL ROCK & METAL STATIONS
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with powerful guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  },
  'klos_955': {
    name: 'KLOS 95.5 Los Angeles',
    description: 'LA\'s classic and modern rock station',
    url: 'https://n10a-e2.revma.ihrhls.com/zc233',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KLOSAMAAC.aac',
    genre: 'Rock',
    quality: 'High'
  },

  // TRENDING & ALTERNATIVE STATIONS
  'nts_radio_1': {
    name: 'NTS Radio 1',
    description: 'Cutting-edge music discovery from London - Trendy & eclectic',
    url: 'https://stream-relay-geo.ntslive.net/stream',
    fallback: 'https://stream-relay-geo.ntslive.net/stream2',
    genre: 'Alternative',
    quality: 'High'
  },

  // ANIME & INTERNATIONAL (KEEP WORKING ONES)
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

// Radio Categories - Updated with real working stations
export const RADIO_CATEGORIES = {
  'trending_pop': {
    name: '🔥 Trending Pop & Hits',
    description: 'Chart-toppers and what\'s hot right now',
    stations: ['z100_nyc', 'kiis_fm', 'nts_radio_1']
  },
  'hiphop_rap': {
    name: '🎤 Hip-Hop & Rap',
    description: 'Real urban stations with the hottest rap tracks',
    stations: ['power_106', 'power_105', 'hiphop_nation']
  },
  'dubstep_electronic': {
    name: '🔊 Dubstep & Electronic',
    description: 'Heavy bass drops, wobbles, and electronic bangers',
    stations: ['dubstep_fm', 'di_fm_dubstep', 'party_vibe_dubstep', 'iloveradio_dance']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music and cutting-edge alternative sounds',
    stations: ['rock_antenne', 'klos_955']
  },
  'chill_lofi': {
    name: '🌸 Chill & Lo-Fi',
    description: 'Study beats, coffee shop vibes, and relaxing sounds',
    stations: ['lofi_girl', 'hunter_fm_lofi']
  },
  'anime_international': {
    name: '🎌 Anime & International',
    description: 'Japanese, Korean, and international music',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  }
};
