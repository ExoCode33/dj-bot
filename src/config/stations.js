// src/config/stations.js - UPDATED WITH MODERN STATIONS
export const RADIO_STATIONS = {
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
    description: 'Korean pop music with BlackPink, BTS, NewJeans, and trending K-Pop',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'exclusively_bts': {
    name: 'Exclusively BTS',
    description: 'K-Pop station featuring BTS and other popular Korean artists',
    url: 'https://streaming.exclusive.radio/er/bts/icecast.audio',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'K-Pop',
    quality: 'High'
  },
  'hotmixradio_kpop': {
    name: 'Hotmixradio K-Pop',
    description: 'French K-Pop station playing JENNIE, ITZY, G-Dragon, CHUNG HA',
    url: 'https://streaming.hotmix-radio.net/hotmixradio-kpop-128.mp3',
    fallback: 'https://listen.moe/kpop/stream',
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
  'capital_london': {
    name: 'Capital London',
    description: 'UK\'s No.1 Hit Music Station - Pop hits and chart music',
    url: 'https://media-ssl.musicradio.com/CapitalMP3',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles',
    description: 'LA\'s hit music station with Olivia Rodrigo, Taylor Swift, Dua Lipa',
    url: 'https://n3ba-e2.revma.ihrhls.com/zc185',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'virgin_radio_uk': {
    name: 'Virgin Radio UK',
    description: 'British rock and alternative hits with legendary DJs',
    url: 'https://radio.virginradio.co.uk/stream',
    fallback: 'http://icy-e-bab-04-gos.sharp-stream.com/virgin_mp3',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'bbc_radio1': {
    name: 'BBC Radio 1',
    description: 'UK\'s premier youth station with chart hits and new music',
    url: 'https://stream.live.vc.bbcmedia.co.uk/bbc_radio_one',
    fallback: 'https://media-ssl.musicradio.com/CapitalMP3',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'power_106_la': {
    name: 'Power 106 Los Angeles',
    description: 'LA\'s hip-hop and R&B station with Drake, Kendrick Lamar, SZA',
    url: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    fallback: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  'hot97_nyc': {
    name: 'Hot 97 New York',
    description: 'NYC\'s hip-hop and R&B authority with latest rap hits',
    url: 'https://n17a-e2.revma.ihrhls.com/zc181',
    fallback: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'Electronic dance music and house beats',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'Electronic/Dance',
    quality: 'High'
  },
  'radio_fx_dance': {
    name: 'Radio FX Dance',
    description: 'Non-stop electronic dance music with EDM and house',
    url: 'https://radiofx.live/dance.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    genre: 'Electronic/Dance',
    quality: 'High'
  },
  'nrj_france': {
    name: 'NRJ France',
    description: 'French pop and international hits station',
    url: 'https://cdn.nrjaudio.fm/audio1/fr/30001/mp3_128.mp3',
    fallback: 'https://media-ssl.musicradio.com/CapitalMP3',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'alternative_rock_radio': {
    name: 'Alternative Rock Radio',
    description: 'Modern alternative and indie rock music',
    url: 'https://streaming.live365.com/a73197',
    fallback: 'https://radio.virginradio.co.uk/stream',
    genre: 'Alternative Rock',
    quality: 'High'
  },
  'chill_hop_radio': {
    name: 'ChillHop Radio',
    description: '24/7 chill hop beats for studying and relaxing',
    url: 'https://streams.fluxfm.de/chillhop/mp3-320',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Chill/Lo-Fi',
    quality: 'High'
  },
  'indie_pop_rocks': {
    name: 'Indie Pop Rocks',
    description: 'Indie pop and alternative music with Arctic Monkeys, Tame Impala',
    url: 'https://streaming.live365.com/a05765',
    fallback: 'https://streaming.live365.com/a73197',
    genre: 'Indie Pop',
    quality: 'High'
  },
  'trap_nation_radio': {
    name: 'Trap Nation Radio',
    description: 'Trap beats and modern hip-hop with heavy bass',
    url: 'https://streaming.live365.com/a89577',
    fallback: 'https://n3ba-e2.revma.ihrhls.com/zc5805',
    genre: 'Trap/Hip-Hop',
    quality: 'High'
  },
  'latin_hits_radio': {
    name: 'Latin Hits Radio',
    description: 'Reggaeton and Latin pop with Bad Bunny, Rosalía, Karol G',
    url: 'https://streaming.live365.com/a36251',
    fallback: 'https://n35a-e2.revma.ihrhls.com/zc181',
    genre: 'Latin/Reggaeton',
    quality: 'High'
  }
};

// Radio Categories - Updated with modern music preferences
export const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Today\'s biggest hits and trending pop music',
    stations: ['z100_nyc', 'capital_london', 'kiis_fm_la', 'bbc_radio1', 'nrj_france']
  },
  'kpop_jpop': {
    name: '🎌 K-Pop & J-Pop',
    description: 'Korean and Japanese music with BTS, NewJeans, and anime hits',
    stations: ['listen_moe_kpop', 'exclusively_bts', 'hotmixradio_kpop', 'listen_moe_jpop']
  },
  'hiphop_rnb': {
    name: '🎤 Hip-Hop & R&B',
    description: 'Latest rap, hip-hop, and R&B with Drake, Kendrick, SZA',
    stations: ['power_106_la', 'hot97_nyc', 'trap_nation_radio']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'EDM, house, and electronic beats for the party',
    stations: ['iloveradio_dance', 'radio_fx_dance']
  },
  'alternative_indie': {
    name: '🎸 Alternative & Indie',
    description: 'Alternative rock, indie pop, and modern rock',
    stations: ['virgin_radio_uk', 'alternative_rock_radio', 'indie_pop_rocks']
  },
  'chill_ambient': {
    name: '🌸 Chill & Lo-Fi',
    description: 'Relaxing beats for studying and chilling',
    stations: ['lofi_girl', 'chill_hop_radio']
  },
  'latin_reggaeton': {
    name: '🌶️ Latin & Reggaeton',
    description: 'Latin hits and reggaeton with Bad Bunny and Rosalía',
    stations: ['latin_hits_radio']
  }
};
