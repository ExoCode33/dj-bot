// src/config/stations.js
export const RADIO_STATIONS = {
  // ✅ LO-FI & CHILL - WORKING
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi'
  },
  'poolsuite_fm': { 
    name: 'Poolsuite FM', 
    description: 'Summer vibes and yacht rock for chill sessions',
    url: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi'
  },
  
  // ✅ ANIME & J-POP - KEEP AS REQUESTED
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'Anime'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop music with trendy K-Pop hits',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'Anime'
  },
  
  // ✅ BASS DROP & DUBSTEP - WORKING ALTERNATIVES (NO MORE BROKEN DI.FM)
  'radio_record_dub': {
    name: 'Radio Record Dubstep',
    description: 'Russian electronic radio with heavy dubstep and bass drops',
    url: 'http://air.radiorecord.ru:805/dub_320',
    fallback: 'http://air.radiorecord.ru:805/dub_128',
    genre: 'Bass Drop'
  },
  'radio_record_edm': {
    name: 'Radio Record EDM',
    description: 'Electronic dance music with festival bangers and drops',
    url: 'http://air.radiorecord.ru:805/edmr_320',
    fallback: 'http://air.radiorecord.ru:805/edmr_128',
    genre: 'Festival EDM'
  },
  'radio_record_trap': {
    name: 'Radio Record Trap',
    description: 'Future bass and trap with vocal drops',
    url: 'http://air.radiorecord.ru:805/trap_320',
    fallback: 'http://air.radiorecord.ru:805/trap_128',
    genre: 'Trap'
  },
  'radio_record_hardstyle': {
    name: 'Radio Record Hardstyle',
    description: 'Hardstyle with epic vocals and massive drops',
    url: 'http://air.radiorecord.ru:805/hardstyle_320',
    fallback: 'http://air.radiorecord.ru:805/hardstyle_128',
    genre: 'Hardstyle'
  },
  'radio_record_dnb': {
    name: 'Radio Record Drum & Bass',
    description: 'High-energy drum & bass with vocal tracks',
    url: 'http://air.radiorecord.ru:805/drumhits_320',
    fallback: 'http://air.radiorecord.ru:805/drumhits_128',
    genre: 'Bass Drop'
  },
  
  // ✅ MAINSTREAM EDM - WORKING
  'nts_radio': {
    name: 'NTS Radio Electronic',
    description: 'Cutting-edge electronic music with trendy artists',
    url: 'https://stream-relay-geo.ntslive.net/stream2',
    fallback: 'https://stream-relay-geo.ntslive.net/stream',
    genre: 'Mainstream EDM'
  }
};
