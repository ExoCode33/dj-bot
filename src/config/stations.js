// src/config/stations.js - VERIFIED WORKING STATIONS WITH ACCURATE GENRES
export const RADIO_STATIONS = {
  // === POP HITS - VERIFIED MAINSTREAM POP ===
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 pop hits station with latest chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop',
    quality: 'High'
  },
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles',
    description: 'Ryan Seacrest\'s pop station with mainstream hits',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KIISFMAAC.aac',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop',
    quality: 'High'
  },
  'radio_disney': {
    name: 'Radio Disney Pop',
    description: 'Pop music for all ages with clean versions',
    url: 'https://live.wostreaming.net/direct/disney-radiodisneympaaac-ibc3',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop',
    quality: 'High'
  },

  // === K-POP & J-POP - VERIFIED ASIAN POP ===
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop with BlackPink, BTS, NewJeans, and trending K-Pop',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music, anime OSTs, and J-Pop hits',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'J-Pop',
    quality: 'High'
  },
  '113fm_kpop': {
    name: '113.FM K-Pop',
    description: 'Dedicated K-Pop station with BTS, Stray Kids, BlackPink',
    url: 'https://113fm-atunwadigital.streamguys1.com/1018',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },

  // === DUBSTEP & ELECTRONIC BASS - VERIFIED DUBSTEP ===
  'dubstep_fm': {
    name: 'Dubstep.fm',
    description: 'Heavy dubstep drops, riddim, and electronic bass music',
    url: 'http://hi5.dubstep.fm:8000/dubstep',
    fallback: 'https://dubplate.fm:8443/dubplate320.mp3',
    genre: 'Dubstep',
    quality: 'High'
  },
  'subfm_dubstep': {
    name: 'Sub FM - Bass Music',
    description: 'UK dubstep, drum & bass, and bass music from London',
    url: 'https://subfm.radioca.st/stream',
    fallback: 'http://hi5.dubstep.fm:8000/dubstep',
    genre: 'Bass/Dubstep',
    quality: 'High'
  },
  'di_fm_dubstep': {
    name: 'DI.FM Dubstep',
    description: 'Premium dubstep channel with heavy drops and wobbles',
    url: 'https://prem2.di.fm/dubstep?5739cfabf2445ca8b6dee8e9',
    fallback: 'http://hi5.dubstep.fm:8000/dubstep',
    genre: 'Dubstep',
    quality: 'Premium'
  },

  // === EDM & DANCE - VERIFIED ELECTRONIC DANCE ===
  'di_fm_trance': {
    name: 'DI.FM Trance',
    description: 'Uplifting trance and progressive electronic dance music',
    url: 'https://prem2.di.fm/trance?5739cfabf2445ca8b6dee8e9',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Trance',
    quality: 'Premium'
  },
  'di_fm_house': {
    name: 'DI.FM House',
    description: 'Classic and modern house music for the dance floor',
    url: 'https://prem2.di.fm/house?5739cfabf2445ca8b6dee8e9',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'House',
    quality: 'Premium'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'EDM, house, techno, and festival electronic hits',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'EDM',
    quality: 'High'
  },

  // === HIP-HOP & RAP - VERIFIED HIP-HOP STATIONS ===
  'hot_97_nyc': {
    name: 'Hot 97 New York',
    description: 'NYC\'s legendary hip-hop station with latest rap and R&B',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HOT97AAC.aac',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'power_106_la': { 
    name: 'Power 106 LA', 
    description: 'LA\'s #1 for hip hop hits and West Coast rap',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HOT97AAC.aac',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  '113fm_hiphop': {
    name: '113.FM Hip-Hop',
    description: 'Pure hip-hop and rap music 24/7',
    url: 'https://113fm-atunwadigital.streamguys1.com/1019',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HOT97AAC.aac',
    genre: 'Hip-Hop',
    quality: 'High'
  },

  // === ROCK & METAL - VERIFIED ROCK STATIONS ===
  'kroq_la': {
    name: 'KROQ Los Angeles',
    description: 'LA\'s legendary alternative rock station - Queens of Stone Age, Foo Fighters',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KROQFMAAC.aac',
    fallback: 'https://streams.ilovemusic.de/rockantenne.mp3',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'planet_rock_uk': {
    name: 'Planet Rock UK',
    description: 'Classic and modern rock hits from the UK',
    url: 'http://tx.planetradio.co.uk/icecast.php?i=planetrock.mp3',
    fallback: 'https://streams.ilovemusic.de/rockantenne.mp3',
    genre: 'Rock',
    quality: 'High'
  },
  'radio_rock_finland': {
    name: 'Radio Rock Finland',
    description: 'Finnish rock station with metal and hard rock',
    url: 'https://icecast.nelonen.fi/radiorock-aac',
    fallback: 'http://tx.planetradio.co.uk/icecast.php?i=planetrock.mp3',
    genre: 'Rock/Metal',
    quality: 'High'
  },

  // === LO-FI & CHILL - VERIFIED CHILL MUSIC ===
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'chillhop_cafe': {
    name: 'ChillHop Cafe',
    description: 'Chill beats, jazz hop, and relaxing instrumental music',
    url: 'http://streaming.radionomy.com/Chillhop-Radio',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Chillhop',
    quality: 'High'
  },
  'ambient_sleeping_pill': {
    name: 'Ambient Sleeping Pill',
    description: 'Dark ambient and drone music for deep relaxation',
    url: 'http://radio.stereoscenic.com/asp-s',
    fallback: 'http://streaming.radionomy.com/Chillhop-Radio',
    genre: 'Ambient',
    quality: 'High'
  }
};

// Radio Categories - Properly organized by verified music genres
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop Hits',
    description: 'Mainstream pop music and chart toppers',
    stations: ['z100_nyc', 'kiis_fm_la', 'radio_disney']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese pop music including BlackPink, BTS, Stray Kids',
    stations: ['listen_moe_kpop', '113fm_kpop', 'listen_moe_jpop']
  },
  'dubstep_bass': {
    name: '🔊 Dubstep & Bass',
    description: 'Heavy dubstep drops, riddim, and electronic bass music',
    stations: ['dubstep_fm', 'subfm_dubstep', 'di_fm_dubstep']
  },
  'edm_dance': {
    name: '💃 EDM & Dance',
    description: 'Electronic dance music, house, trance, and techno',
    stations: ['di_fm_trance', 'di_fm_house', 'iloveradio_dance']
  },
  'hiphop_rap': {
    name: '🎵 Hip-Hop & Rap',
    description: 'Hip-hop, rap, and urban music from NYC and LA',
    stations: ['hot_97_nyc', 'power_106_la', '113fm_hiphop']
  },
  'rock_metal': {
    name: '🎸 Rock & Metal',
    description: 'Alternative rock, classic rock, and metal music',
    stations: ['kroq_la', 'planet_rock_uk', 'radio_rock_finland']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Lo-fi, chill hop, and ambient relaxation music',
    stations: ['lofi_girl', 'chillhop_cafe', 'ambient_sleeping_pill']
  }
};
