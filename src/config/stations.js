// src/config/stations.js
// Radio stations configuration - trendy music with real artists and lyrics

export const RADIO_STATIONS = {
  // 🎧 LO-FI COLLECTIONS (Study & Chill)
  'lofi_girl': { 
    name: 'Lofi Girl Radio', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi',
    quality: 'Premium',
    hasLyrics: false,
    artists: ['Various Lo-Fi Artists']
  },
  
  // 🎌 ANIME & J-POP (Real artists with lyrics)
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback.mp3',
    genre: 'Anime',
    quality: 'High',
    hasLyrics: true,
    artists: ['Various J-Pop Artists', 'Anime OST Artists']
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop music with trendy K-Pop hits and lyrics',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'Anime',
    quality: 'High',
    hasLyrics: true,
    artists: ['BTS', 'BLACKPINK', 'NewJeans', 'aespa', 'Various K-Pop Artists']
  },
  
  // 🎪 TOMORROWLAND & FESTIVAL EDM (Real artists with trendy songs)
  'one_world_radio': { 
    name: 'Tomorrowland One World Radio', 
    description: 'Official Tomorrowland radio with real DJ sets and festival anthems',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OWR.mp3',
    fallback: 'https://21293.live.streamtheworld.com/OWR.mp3',
    genre: 'Festival EDM',
    quality: 'Premium',
    hasLyrics: true,
    artists: ['Martin Garrix', 'David Guetta', 'Calvin Harris', 'Tiësto', 'Armin van Buuren']
  },
  
  // 🔥 BASS DROP & DUBSTEP (Trendy artists with lyrics)
  'bass_drive_radio': {
    name: 'Bass Drive - Drum & Bass Radio',
    description: 'Real drum & bass with trendy artists and vocal tracks',
    url: 'http://bassdrive.com/v2/streams/BassDrive.pls',
    fallback: 'http://chi.bassdrive.com:80/',
    genre: 'Bass Drop',
    quality: 'High',
    hasLyrics: true,
    artists: ['Netsky', 'Rudimental', 'Chase & Status', 'Sub Focus', 'Pendulum']
  },
  
  // 🎵 MAINSTREAM EDM (Chart hits with lyrics)
  'radio_fg': {
    name: 'Radio FG - Electronic Music',
    description: 'French electronic radio with mainstream EDM hits and vocals',
    url: 'http://radiofg.impek.com/fg.mp3',
    fallback: 'http://radiofg.impek.com/fg128.mp3',
    genre: 'Mainstream EDM',
    quality: 'High',
    hasLyrics: true,
    artists: ['Swedish House Mafia', 'The Chainsmokers', 'Marshmello', 'Skrillex', 'Diplo']
  },
  
  // 🌊 FUTURE BASS & TRAP (Trendy with vocals)
  'trap_nation': {
    name: 'Trap Nation Style Radio',
    description: 'Future bass and trap with trendy artists and vocal drops',
    url: 'https://streams.ilovemusic.de/iloveradio14.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    genre: 'Trap/Future Bass',
    quality: 'High',
    hasLyrics: true,
    artists: ['RL Grime', 'Flume', 'What So Not', 'San Holo', 'ODESZA']
  },
  
  // 🎤 HARDSTYLE (With vocals and drops)
  'q_dance_radio': {
    name: 'Q-Dance Hard Dance Radio',
    description: 'Hardstyle and hard dance with epic vocals and massive drops',
    url: 'https://streams.ilovemusic.de/iloveradio8.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio108.mp3',
    genre: 'Hardstyle',
    quality: 'High',
    hasLyrics: true,
    artists: ['Headhunterz', 'Wildstylez', 'Da Tweekaz', 'Brennan Heart', 'Coone']
  }
};

// Genre categories for UI organization
export const GENRE_CATEGORIES = {
  'Lo-Fi': {
    emoji: '🎧',
    color: '#9370DB',
    description: 'Perfect for studying and relaxing'
  },
  'Anime': {
    emoji: '🎌', 
    color: '#FF69B4',
    description: 'Japanese & Korean music with real artists'
  },
  'Festival EDM': {
    emoji: '🎪',
    color: '#FF6B35', 
    description: 'Official festival radio with top DJs'
  },
  'Bass Drop': {
    emoji: '🔥',
    color: '#FF1744',
    description: 'Heavy bass drops and drum & bass'
  },
  'Mainstream EDM': {
    emoji: '💎',
    color: '#00BCD4',
    description: 'Chart-topping EDM hits with vocals'
  },
  'Trap/Future Bass': {
    emoji: '🌊',
    color: '#4CAF50',
    description: 'Trendy trap and future bass'
  },
  'Hardstyle': {
    emoji: '⚡',
    color: '#FFC107',
    description: 'Hard dance with epic vocals'
  }
};

// Helper functions
export function getStationsByGenre() {
  const genres = {};
  for (const genre of Object.keys(GENRE_CATEGORIES)) {
    genres[genre] = Object.entries(RADIO_STATIONS).filter(([_, station]) => station.genre === genre);
  }
  return genres;
}

export function getStationOptions() {
  return Object.entries(RADIO_STATIONS).map(([key, station]) => {
    const qualityEmoji = station.quality === 'Premium' ? '👑' : '⭐';
    const genreData = GENRE_CATEGORIES[station.genre];
    const genreEmoji = genreData ? genreData.emoji : '🎵';
    const lyricsEmoji = station.hasLyrics ? '🎤' : '';
    
    return {
      label: `${qualityEmoji} ${genreEmoji} ${station.name} ${lyricsEmoji}`,
      description: station.description,
      value: key
    };
  });
}
