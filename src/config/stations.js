// src/config/stations.js - PROPERLY CATEGORIZED STATIONS
export const RADIO_STATIONS = {
  // === POP HITS ===
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
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Pop',
    quality: 'High'
  },
  'virgin_radio_uk': {
    name: 'Virgin Radio UK',
    description: 'British pop and contemporary hits',
    url: 'https://radio.virginradio.co.uk/stream',
    fallback: 'http://icy-e-bab-04-gos.sharp-stream.com/virgin_mp3',
    genre: 'Pop',
    quality: 'High'
  },

  // === K-POP & J-POP ===
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
  'kpop_way_radio': {
    name: 'K-Pop Way Radio',
    description: 'Dedicated K-Pop station with latest Korean hits',
    url: 'http://streaming.radionomy.com/K-Pop-Way-Radio',
    fallback: 'http://streaming.radionomy.com/Korea-Radio',
    genre: 'K-Pop',
    quality: 'High'
  },

  // === DUBSTEP & ELECTRONIC BASS ===
  'dubstep_fm': {
    name: 'Dubstep.fm',
    description: 'Heavy dubstep drops, riddim, and electronic bass music',
    url: 'http://hi5.dubstep.fm:8000/dubstep',
    fallback: 'http://streaming.radionomy.com/Dubstep-Music',
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
  'electro_swing': {
    name: 'Electro Swing Radio',
    description: 'Electronic music with swing and jazz influences',
    url: 'http://streaming.radionomy.com/Electro-Swing-Revolution',
    fallback: 'http://streaming.radionomy.com/ElectroSwing',
    genre: 'Electronic',
    quality: 'High'
  },

  // === EDM & DANCE ===
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'EDM, house, techno, and festival electronic hits',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'EDM',
    quality: 'High'
  },
  'dance_uk': {
    name: 'Dance UK Radio',
    description: 'UK dance music, house, and electronic dance hits',
    url: 'http://uk2.internet-radio.com:8024/live',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Dance',
    quality: 'High'
  },
  'ibiza_global_radio': {
    name: 'Ibiza Global Radio',
    description: 'Electronic dance music from the party island of Ibiza',
    url: 'http://37.59.32.115:6080/stream',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'EDM',
    quality: 'High'
  },

  // === HIP-HOP & RAP ===
  'hot_97_nyc': {
    name: 'Hot 97 New York',
    description: 'NYC\'s original hip-hop station with latest rap and R&B',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HOT97AAC.aac',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'power_106_la': { 
    name: 'Power 106 LA', 
    description: 'LA\'s #1 for hip hop hits and West Coast rap',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRFMAAC.aac',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'rap_fr': {
    name: 'Rap FR Radio',
    description: 'French rap and international hip-hop music',
    url: 'http://streaming.radionomy.com/Rap-FR',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Rap',
    quality: 'High'
  },

  // === ROCK & METAL ===
  'kroq_la': {
    name: 'KROQ Los Angeles',
    description: 'LA\'s legendary alternative rock station',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KROQFMAAC.aac',
    fallback: 'http://mp3channels.webradio.antenne.de/alternative',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'planet_rock': {
    name: 'Planet Rock UK',
    description: 'Classic and modern rock hits',
    url: 'http://tx.planetradio.co.uk/icecast.php?i=planetrock.mp3',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne',
    genre: 'Rock',
    quality: 'High'
  },
  'metal_radio': {
    name: 'Metal Radio',
    description: 'Heavy metal, death metal, and hardcore rock',
    url: 'http://streaming.radionomy.com/Metal-Radio',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Metal',
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
  },
  'ambient_sleeping_pill': {
    name: 'Ambient Sleeping Pill',
    description: 'Dark ambient and drone music for relaxation',
    url: 'http://radio.stereoscenic.com/asp-s',
    fallback: 'http://streaming.radionomy.com/Chillhop-Radio',
    genre: 'Ambient',
    quality: 'High'
  }
};

// Radio Categories - Properly organized by actual music genres
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop Hits',
    description: 'Mainstream pop music and chart toppers',
    stations: ['z100_nyc', 'kiis_fm_la', 'virgin_radio_uk']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese pop music',
    stations: ['listen_moe_kpop', 'kpop_way_radio', 'listen_moe_jpop']
  },
  'dubstep_bass': {
    name: '🔊 Dubstep & Bass',
    description: 'Heavy dubstep drops and electronic bass music',
    stations: ['dubstep_fm', 'bassport_fm', 'electro_swing']
  },
  'edm_dance': {
    name: '💃 EDM & Dance',
    description: 'Electronic dance music, house, and techno',
    stations: ['iloveradio_dance', 'dance_uk', 'ibiza_global_radio']
  },
  'hiphop_rap': {
    name: '🎵 Hip-Hop & Rap',
    description: 'Hip-hop, rap, and urban music',
    stations: ['hot_97_nyc', 'power_106_la', 'rap_fr']
  },
  'rock_metal': {
    name: '🎸 Rock & Metal',
    description: 'Rock, alternative, and metal music',
    stations: ['kroq_la', 'planet_rock', 'metal_radio']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Lo-fi, chill hop, and ambient relaxation music',
    stations: ['lofi_girl', 'chillhop_radio', 'ambient_sleeping_pill']
  }
};
