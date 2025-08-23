// src/config/stations.js
// Radio stations configuration - WORKING URLs with real artists and lyrics

export const RADIO_STATIONS = {
  // 🎧 LO-FI COLLECTIONS (Study & Chill) - WORKING
  'lofi_girl': { 
    name: 'Lofi Girl Radio', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium',
    hasLyrics: false,
    artists: ['Various Lo-Fi Artists']
  },
  'poolsuite_fm': { 
    name: 'Poolsuite FM', 
    description: 'Summer vibes and yacht rock - premium chill music',
    url: 'https://poolsuite.net/api/v1/playlist/live',
    fallback: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    genre: 'Lo-Fi',
    quality: 'Premium',
    hasLyrics: true,
    artists: ['Hall & Oates', 'Fleetwood Mac', 'Various Yacht Rock Artists']
  },
  
  // 🎌 ANIME & J-POP (Real artists with lyrics) - WORKING
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
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
  
  // 🔥 BASS DROP & DUBSTEP (Trendy artists with lyrics) - WORKING URLS
  'dubplate_fm': {
    name: 'Dubplate.fm - Bass Music',
    description: 'Dubstep, future bass, jungle with real artists and vocal tracks',
    url: 'https://streams.radio.co/s2c4cc784b/listen',
    fallback: 'http://dubplate.fm:8000/dubplate',
    genre: 'Bass Drop',
    quality: 'High',
    hasLyrics: true,
    artists: ['Skrillex', 'Zomboy', 'Virtual Riot', 'Modestep', 'Flux Pavilion']
  },
  'di_fm_dubstep': {
    name: 'DI.FM Dubstep Radio',
    description: 'Premium dubstep with massive drops and vocal tracks',
    url: 'http://pub1.di.fm/di_dubstep',
    fallback: 'http://pub2.di.fm/di_dubstep',
    genre: 'Bass Drop',
    quality: 'High',
    hasLyrics: true,
    artists: ['Nero', 'Rusko', 'Caspa', 'Borgore', 'Doctor P']
  },
  
  // 🎪 FESTIVAL EDM (Real artists with trendy songs) - WORKING
  'di_fm_electro': { 
    name: 'DI.FM Electro House', 
    description: 'Festival electro house with top DJs and vocal anthems',
    url: 'http://pub1.di.fm/di_electro',
    fallback: 'http://pub2.di.fm/di_electro',
    genre: 'Festival EDM',
    quality: 'Premium',
    hasLyrics: true,
    artists: ['David Guetta', 'Swedish House Mafia', 'Deadmau5', 'AFROJACK', 'Steve Aoki']
  },
  'di_fm_progressive': {
    name: 'DI.FM Progressive',
    description: 'Progressive house and trance with epic buildups and drops',
    url: 'http://pub1.di.fm/di_progressive',
    fallback: 'http://pub2.di.fm/di_progressive',
    genre: 'Festival EDM',
    quality: 'High',
    hasLyrics: true,
    artists: ['Above & Beyond', 'Eric Prydz', 'Armin van Buuren', 'Paul van Dyk']
  },
  
  // 🎵 MAINSTREAM EDM (Chart hits with lyrics) - WORKING
  'nts_radio': {
    name: 'NTS Radio Electronic',
    description: 'Cutting-edge electronic music with trendy artists',
    url: 'https://stream-relay-geo.ntslive.net/stream2',
    fallback: 'https://stream-relay-geo.ntslive.net/stream',
    genre: 'Mainstream EDM',
    quality: 'Premium',
    hasLyrics: true,
    artists: ['Jamie xx', 'Four Tet', 'Disclosure', 'ODESZA', 'Porter Robinson']
  },
  
  // 🌊 FUTURE BASS & TRAP (Trendy with vocals) - WORKING
  'di_fm_trap': {
    name: 'DI.FM Trap',
    description: 'Future bass and trap with trendy artists and vocal drops',
    url: 'http://pub1.di.fm/di_trap',
    fallback: 'http://pub2.di.fm/di_trap',
    genre: 'Trap/Future Bass',
    quality: 'High',
    hasLyrics: true,
    artists: ['RL Grime', 'Flume', 'What So Not', 'San Holo', 'Ekali']
  },
  
  // 🎤 HARDSTYLE (With vocals and drops) - WORKING
  'di_fm_hardstyle': {
    name: 'DI.FM Hardstyle',
    description: 'Hardstyle and hard dance with epic vocals and massive drops',
    url: 'http://pub1.di.fm/di_hardstyle',
    fallback: 'http://pub2.di.fm/di_hardstyle',
    genre: 'Hardstyle',
    quality: 'High',
    hasLyrics: true,
    artists: ['Headhunterz', 'Wildstylez', 'Da Tweekaz', 'Brennan Heart', 'Coone']
  },
  
  // 🎶 BONUS: DRUM & BASS (High energy with vocals) - WORKING
  'di_fm_drumandbass': {
    name: 'DI.FM Drum & Bass',
    description: 'High-energy drum & bass with vocal tracks and liquid vibes',
    url: 'http://pub1.di.fm/di_drumandbass',
    fallback: 'http://pub2.di.fm/di_drumandbass',
    genre: 'Bass Drop',
    quality: 'High',
    hasLyrics: true,
    artists: ['Netsky', 'Sub Focus', 'Chase & Status', 'Pendulum', 'Rudimental']
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
