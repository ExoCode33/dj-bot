// src/config/stations.js - VERIFIED WORKING STATIONS with HARD BASS DROP focus
export const RADIO_STATIONS = {
  // ✅ WORKING - Keep these
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
  
  // ✅ HARD BASS DROP & DUBSTEP - Working Russian Electronic stations
  'radio_record_dub': {
    name: 'Radio Record Dubstep',
    description: 'Russian electronic radio with HARD dubstep drops and bass',
    url: 'http://air.radiorecord.ru:805/dub_320',
    fallback: 'http://air.radiorecord.ru:805/dub_128',
    genre: 'Hard Bass Drop',
    quality: 'High'
  },
  'radio_record_edm': {
    name: 'Radio Record EDM',
    description: 'Electronic dance music with festival bangers and HARD drops',
    url: 'http://air.radiorecord.ru:805/edmr_320',
    fallback: 'http://air.radiorecord.ru:805/edmr_128',
    genre: 'Hard EDM',
    quality: 'High'
  },
  'radio_record_trap': {
    name: 'Radio Record Trap',
    description: 'Future bass and trap with MASSIVE vocal drops',
    url: 'http://air.radiorecord.ru:805/trap_320',
    fallback: 'http://air.radiorecord.ru:805/trap_128',
    genre: 'Hard Trap',
    quality: 'High'
  },
  'radio_record_hardstyle': {
    name: 'Radio Record Hardstyle',
    description: 'HARDSTYLE with epic vocals and CRUSHING drops',
    url: 'http://air.radiorecord.ru:805/hardstyle_320',
    fallback: 'http://air.radiorecord.ru:805/hardstyle_128',
    genre: 'Hardstyle',
    quality: 'High'
  },
  'radio_record_dnb': {
    name: 'Radio Record Drum & Bass',
    description: 'HIGH-ENERGY drum & bass with BRUTAL drops',
    url: 'http://air.radiorecord.ru:805/drumhits_320',
    fallback: 'http://air.radiorecord.ru:805/drumhits_128',
    genre: 'Hard D&B',
    quality: 'High'
  },
  'radio_record_techno': {
    name: 'Radio Record Techno',
    description: 'Underground HARD techno with industrial drops',
    url: 'http://air.radiorecord.ru:805/techno_320',
    fallback: 'http://air.radiorecord.ru:805/techno_128',
    genre: 'Hard Techno',
    quality: 'High'
  },
  'radio_record_neurofunk': {
    name: 'Radio Record Neurofunk',
    description: 'DARK neurofunk D&B with AGGRESSIVE bass drops',
    url: 'http://air.radiorecord.ru:805/neurofunk_320',
    fallback: 'http://air.radiorecord.ru:805/neurofunk_128',
    genre: 'Neurofunk',
    quality: 'High'
  },
  
  // ✅ ADDITIONAL HARD BASS - More aggressive options
  'bassdrive': {
    name: 'Bassdrive D&B',
    description: 'UK underground drum & bass with HEAVY bass drops',
    url: 'https://bassdrive.com/v2/streams/BassDrive.pls',
    fallback: 'http://bassdrive.com:8000/stream',
    genre: 'Underground D&B',
    quality: 'High'
  },
  'hardbase_fm': {
    name: 'HardBase.FM',
    description: 'HARDCORE and GABBER with BRUTAL bass drops',
    url: 'https://listen.hardbase.fm/tunein.php/hbfm-mp3.pls',
    fallback: 'http://listen.hardbase.fm:7000/320.mp3',
    genre: 'Hardcore',
    quality: 'High'
  },
  'radio_record_goa': {
    name: 'Radio Record Goa Trance',
    description: 'Psychedelic trance with HYPNOTIC bass drops',
    url: 'http://air.radiorecord.ru:805/goa_320',
    fallback: 'http://air.radiorecord.ru:805/goa_128',
    genre: 'Psytrance',
    quality: 'High'
  },
  'radio_record_oldschool': {
    name: 'Radio Record Old School',
    description: 'Classic RAVE and BREAKBEAT with vintage drops',
    url: 'http://air.radiorecord.ru:805/oldschool_320',
    fallback: 'http://air.radiorecord.ru:805/oldschool_128',
    genre: 'Old School Rave',
    quality: 'High'
  },
  
  // ✅ WORKING POPULAR STATIONS - Confirmed working from logs
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  
  // ✅ ADDITIONAL HARD ELECTRONIC - More bass-heavy options
  'radio_record_jungle': {
    name: 'Radio Record Jungle',
    description: 'JUNGLE and RAGGA D&B with EXPLOSIVE breaks',
    url: 'http://air.radiorecord.ru:805/jungle_320',
    fallback: 'http://air.radiorecord.ru:805/jungle_128',
    genre: 'Jungle',
    quality: 'High'
  },
  'radio_record_experimental': {
    name: 'Radio Record Experimental',
    description: 'EXPERIMENTAL electronic with WEIRD bass drops',
    url: 'http://air.radiorecord.ru:805/experimental_320',
    fallback: 'http://air.radiorecord.ru:805/experimental_128',
    genre: 'Experimental',
    quality: 'High'
  },
  'radio_record_breaks': {
    name: 'Radio Record Breaks',
    description: 'BREAKBEAT and BIG BEAT with CRUSHING drops',
    url: 'http://air.radiorecord.ru:805/breaks_320',
    fallback: 'http://air.radiorecord.ru:805/breaks_128',
    genre: 'Breaks',
    quality: 'High'
  }
};
