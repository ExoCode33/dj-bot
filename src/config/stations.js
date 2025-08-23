# --- BOT SERVICE (Node.js) ---
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id
GUILD_ID=your_test_guild_id   # optional for faster testing

# PERSISTENT RADIO PANEL
RADIO_CHANNEL_ID=your_radio_channel_id   # Channel where radio panel will be posted permanently

LAVALINK_NAME=railway-node
LAVALINK_URL=your-lavalink-service.up.railway.app:443
LAVALINK_AUTH=super_secure_password
LAVALINK_SECURE=true

AUTHORIZED_ROLE_ID=your_dj_role_id
DEFAULT_VOLUME=35

# --- LAVALINK SERVICE (Java) ---
SERVER_PORT=2333
LAVALINK_PASSWORD=super_secure_password

# Spotify Integration (Required for Spotify links)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_SP_DC=optional_spotify_sp_dc_cookie
SPOTIFY_COUNTRY_CODE=US

# Apple Music Integration (Optional)
APPLE_MUSIC_API_TOKEN=optional_apple_music_token
APPLE_MUSIC_COUNTRY_CODE=US

# Deezer Integration (Optional)
DEEZER_MASTER_KEY=optional_deezer_master_key

# YouTube Configuration (Optional - helps with anti-bot)
YOUTUBE_COUNTRY_CODE=US

# Java Memory Settings (Increased for better performance)
JAVA_TOOL_OPTIONS=-Xms256m -Xmx1024m -XX:+UseG1GC -XX:+UseStringDeduplication
export const RADIO_STATIONS = {
  // ✅ CONFIRMED WORKING - Keep these
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    category: 'chill',
    quality: 'Premium'
  },
  'poolsuite_fm': {
    name: 'Poolsuite FM',
    description: 'Summer vibes and yacht rock for chill sessions',
    url: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Chill',
    category: 'chill',
    quality: 'High'
  },
  'somafm_groovesalad': {
    name: 'SomaFM Groove Salad',
    description: 'Ambient downtempo with electronic elements',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    fallback: 'http://ice2.somafm.com/groovesalad-256-mp3',
    genre: 'Ambient Electronic',
    category: 'chill',
    quality: 'High'
  },
  'somafm_dronezone': {
    name: 'SomaFM Drone Zone',
    description: 'Deep ambient electronic soundscapes',
    url: 'http://ice1.somafm.com/dronezone-256-mp3',
    fallback: 'http://ice2.somafm.com/dronezone-256-mp3',
    genre: 'Ambient',
    category: 'chill',
    quality: 'High'
  },

  // ✅ K-POP & ASIAN MUSIC - Including BLACKPINK-style stations
  'listen_moe_jpop': { 
    name: 'LISTEN.moe J-Pop Radio', 
    description: 'Japanese music and anime soundtracks with real artists',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/fallback',
    genre: 'J-Pop',
    category: 'kpop',
    quality: 'High'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop Radio', 
    description: 'Korean pop music with trendy K-Pop hits',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'K-Pop',
    category: 'kpop',
    quality: 'High'
  },
  'kpop_starz': {
    name: 'K-Pop Starz Radio',
    description: 'BLACKPINK, BTS, TWICE, aespa and top K-Pop hits',
    url: 'http://streaming.radionomy.com/KPOP-STARZ',
    fallback: 'http://streaming.radionomy.com/K-Pop-Powerplay-Kawaii',
    genre: 'K-Pop Hits',
    category: 'kpop',
    quality: 'High'
  },
  'asia_dream_radio': {
    name: 'Asia DREAM Radio',
    description: 'K-Pop, J-Pop and C-Pop with BLACKPINK, NewJeans, IVE',
    url: 'http://streaming.radionomy.com/Asia-DREAM-Radio',
    fallback: 'http://streaming.radionomy.com/J-Pop-Powerplay-Kawaii',
    genre: 'Asian Pop',
    category: 'kpop',
    quality: 'High'
  },


  // ✅ ELECTRONIC & BASS DROP
  'iloveradio_hardstyle': {
    name: 'ILoveRadio Hardstyle',
    description: 'German hardstyle with CRUSHING drops',
    url: 'https://streams.ilovemusic.de/iloveradio21.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio21.aac',
    genre: 'Hardstyle',
    category: 'electronic',
    quality: 'High'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'Dance hits and electronic music',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'Dance',
    category: 'electronic',
    quality: 'High'
  },
  'iloveradio_clubsounds': {
    name: 'ILoveRadio Club Sounds',
    description: 'Club music and house beats',
    url: 'https://streams.ilovemusic.de/iloveradio16.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio16.aac',
    genre: 'Club Music',
    category: 'electronic',
    quality: 'High'
  },
  'bass_radio_1': {
    name: 'Bass Radio One',
    description: 'Heavy bass and electronic music',
    url: 'http://streaming.radionomy.com/Bass-Radio',
    fallback: 'http://streaming.radionomy.com/HardBass',
    genre: 'Bass Music',
    category: 'electronic',
    quality: 'High'
  },
  'electronic_pioneer': {
    name: 'Electronic Pioneer',
    description: 'Underground electronic with heavy drops',
    url: 'http://streaming.radionomy.com/Electronic-Pioneer',
    fallback: 'http://streaming.radionomy.com/ElectronicBeats',
    genre: 'Electronic',
    category: 'electronic',
    quality: 'High'
  },
  'dubstep_beyond': {
    name: 'Dubstep Beyond',
    description: 'Pure dubstep with MASSIVE bass drops',
    url: 'http://streaming.radionomy.com/Dubstep-Beyond',
    fallback: 'http://streaming.radionomy.com/DubstepFM',
    genre: 'Dubstep',
    category: 'electronic',
    quality: 'High'
  },
  'hardstyle_fm': {
    name: 'Hardstyle FM',
    description: 'Non-stop hardstyle with BRUTAL kicks',
    url: 'http://streaming.radionomy.com/HardstyleFM',
    fallback: 'http://streaming.radionomy.com/Hardstyle-Music',
    genre: 'Hardstyle',
    category: 'electronic',
    quality: 'High'
  },
  'somafm_beatblender': {
    name: 'SomaFM Beat Blender',
    description: 'Downtempo, trip-hop, and electronic beats',
    url: 'http://ice1.somafm.com/beatblender-128-mp3',
    fallback: 'http://ice2.somafm.com/beatblender-128-mp3',
    genre: 'Electronic Beats',
    category: 'electronic',
    quality: 'High'
  },

  // ✅ POP & MAINSTREAM
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    category: 'pop',
    quality: 'High'
  },
  'bigfm_electro': {
    name: 'BigFM Electro',
    description: 'German electronic music with heavy beats',
    url: 'http://streams.bigfm.de/bigfm-nitroxparty-128-mp3',
    fallback: 'http://streams.bigfm.de/bigfm-deutschland-128-mp3',
    genre: 'Electronic Pop',
    category: 'pop',
    quality: 'High'
  },

  // ✅ HIP-HOP & RAP
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with heavy bass',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    category: 'hiphop',
    quality: 'High'
  },

  // ✅ ROCK & ALTERNATIVE
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with heavy guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    category: 'rock',
    quality: 'High'
  },

  // ✅ SPACE & AMBIENT
  'somafm_deepspaceone': {
    name: 'SomaFM Deep Space One',
    description: 'Deep ambient electronic space music',
    url: 'http://ice1.somafm.com/deepspaceone-128-mp3',
    fallback: 'http://ice2.somafm.com/deepspaceone-128-mp3',
    genre: 'Space Electronic',
    category: 'chill',
    quality: 'High'
  }
};

// Category definitions for the dropdown system
export const MUSIC_CATEGORIES = {
  'kpop': {
    name: '🎌 K-Pop & Asian Hits',
    description: 'BLACKPINK, BTS, TWICE, NewJeans, anime music',
    emoji: '🎌'
  },
  'electronic': {
    name: '🔊 Electronic & Bass Drop', 
    description: 'Hardstyle, dubstep, house, techno with CRUSHING drops',
    emoji: '🔊'
  },
  'pop': {
    name: '🎵 Pop & Mainstream',
    description: 'Chart toppers, dance hits, popular music',
    emoji: '🎵'
  },
  'chill': {
    name: '🎧 Chill & Lo-Fi',
    description: 'Lo-fi beats, ambient, downtempo, study music',
    emoji: '🎧'
  },
  'hiphop': {
    name: '🎤 Hip-Hop & Rap',
    description: 'Latest hip-hop, rap, and R&B hits',
    emoji: '🎤'
  },
  'rock': {
    name: '🎸 Rock & Metal',
    description: 'Rock, metal, alternative with heavy guitars',
    emoji: '🎸'
  }
};
