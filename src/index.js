import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - ONE PIECE RADIO');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;

// Health server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta DJ Bot is running!');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});

// Import radio stations from separate config
const RADIO_STATIONS = {
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
const GENRE_CATEGORIES = {
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

// Simple Radio Manager for One Piece themed bot
class OneRadioManager {
  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) {
      throw new Error('Station not found');
    }

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    // Try main URL first, then fallback
    const urlsToTry = [station.url];
    if (station.fallback) {
      urlsToTry.push(station.fallback);
    }
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔄 Trying URL: ${url}`);
        
        let result;
        // Special handling for YouTube URLs (convert to search)
        if (url.includes('youtube.com/watch')) {
          const videoId = url.split('v=')[1]?.split('&')[0];
          if (videoId) {
            console.log(`🎥 YouTube video detected: ${videoId}`);
            result = await player.node.rest.resolve(`ytsearch:lofi girl study beats`);
          }
        } else {
          result = await player.node.rest.resolve(url);
        }
        
        console.log(`📊 Stream result for ${url}:`, {
          loadType: result?.loadType,
          hasData: !!result?.data,
          hasTrack: !!result?.tracks?.length,
          exception: result?.exception?.message || 'none'
        });
        
        // Handle different response types
        if (result.loadType === 'track' && result.data) {
          console.log(`🎵 Playing track with encoded data...`);
          
          await player.playTrack({
            track: {
              encoded: result.data.encoded
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name} with ${url}`);
          return { success: true, station, url };
          
        } else if (result.tracks && result.tracks.length > 0) {
          console.log(`🎵 Playing from tracks array...`);
          
          await player.playTrack({
            track: {
              encoded: result.tracks[0].encoded
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name} with ${url}`);
          return { success: true, station, url };
          
        } else if (result.loadType === 'playlist' && result.data?.tracks?.length > 0) {
          console.log(`🎵 Playing from playlist...`);
          
          await player.playTrack({
            track: {
              encoded: result.data.tracks[0].encoded
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name} with ${url}`);
          return { success: true, station, url };
        } else {
          console.log(`❌ URL failed: ${url} - LoadType: ${result.loadType}`);
          if (result.exception) {
            console.log(`   Exception: ${result.exception.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }
}

// Start Discord bot
setTimeout(async () => {
  try {
    console.log('🤖 Starting Discord bot...');
    
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
      return;
    }

    // Load libraries
    const discord = await import('discord.js');
    const shoukaku = await import('shoukaku');
    console.log('✅ Libraries loaded');

    const { 
      Client, 
      GatewayIntentBits, 
      Collection, 
      Events, 
      SlashCommandBuilder, 
      EmbedBuilder, 
      ActionRowBuilder,
      ButtonBuilder,
      ButtonStyle,
      StringSelectMenuBuilder,
      REST, 
      Routes 
    } = discord;
    
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
    });

    client.commands = new Collection();

    // Setup Lavalink
    if (process.env.LAVALINK_URL) {
      const nodes = [{
        name: process.env.LAVALINK_NAME || 'railway-node',
        url: process.env.LAVALINK_URL,
        auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
        secure: process.env.LAVALINK_SECURE === 'true'
      }];

      client.shoukaku = new shoukaku.Shoukaku(new shoukaku.Connectors.DiscordJS(client), nodes, {
        resume: true,
        resumeKey: 'uta-bot-one-piece',
        resumeTimeout: 60,
        reconnectTries: 5,
        reconnectInterval: 3000,
        restTimeout: 60000
      });

      client.shoukaku.on('ready', (name) => {
        console.log(`✅ Lavalink "${name}" ready`);
        global.lavalinkReady = true;
      });

      client.shoukaku.on('error', (name, error) => {
        console.error(`❌ Lavalink "${name}" error:`, error.message);
        global.lavalinkReady = false;
      });

      console.log('✅ Lavalink configured');
    }

    const radioManager = new OneRadioManager();

    // One Piece themed radio command
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🏴‍☠️ Stream the Grand Line\'s finest music collection'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first to set sail on the musical Grand Line!')
            ],
            ephemeral: true
          });
        }

        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('The Thousand Sunny\'s sound system is down. Try again in a moment!')
            ],
            ephemeral: true
          });
        }

        const stationOptions = Object.entries(RADIO_STATIONS).map(([key, station]) => {
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

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('radio_select')
          .setPlaceholder('Choose your Grand Line adventure...')
          .addOptions(stationOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Drop Anchor')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('⚓');

        const embed = new EmbedBuilder()
          .setColor('#D2691E')
          .setTitle('🏴‍☠️ Uta\'s One Piece Radio Collection')
          .setDescription('🎵 *"Set sail for the ultimate musical adventure on the Grand Line!"* 🎵\n\nChoose your musical treasure and begin the journey!')
          .addFields(
            {
              name: '🏴‍☠️ Musical Treasures Available',
              value: '🎧 **Lo-Fi Chill** • 🎌 **Anime & K-Pop** • 🎪 **Festival EDM** • 🔥 **Bass Drops** • 💎 **Chart Hits** • 🌊 **Trap/Future Bass** • ⚡ **Hardstyle**',
              inline: false
            },
            {
              name: '🎭 Grand Line Radio Network',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** ready to sail with real artists and trendy songs!`,
              inline: false
            },
            {
              name: '🎵 Music Features',
              value: '• 🎤 **Stations with lyrics** for sing-alongs\n• 👑 **Premium quality** streams\n• 🎨 **Real artists** - no copyright-free music\n• 🔥 **Trendy hits** and festival bangers',
              inline: false
            }
          )
          .setFooter({ text: 'Uta\'s Radio • Rock the Grand Line! 🏴‍☠️🎸' })
          .setTimestamp();

        const message = await interaction.reply({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(stopButton)
          ]
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (componentInteraction) => {
          try {
            if (componentInteraction.customId === 'radio_select') {
              const selectedStation = componentInteraction.values[0];
              const stationInfo = RADIO_STATIONS[selectedStation];
              
              await componentInteraction.deferReply({ ephemeral: true });

              // Get or create player with better error handling
              let player = client.shoukaku.players.get(interaction.guildId);
              
              if (!player) {
                console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
                
                // Check bot permissions first
                const permissions = voiceChannel.permissionsFor(interaction.client.user);
                if (!permissions.has(['Connect', 'Speak'])) {
                  throw new Error('Uta needs Connect/Speak permissions to perform!');
                }
                
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                
                // Wait a moment for connection to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await player.setGlobalVolume(75);
                console.log('✅ Uta connected and volume set to 75');
              } else {
                console.log('🔊 Uta already performing');
                await player.setGlobalVolume(75);
              }

              try {
                const result = await radioManager.connectToStream(player, selectedStation);
                
                // Genre-specific styling
                const genreData = GENRE_CATEGORIES[result.station.genre];
                const emoji = genreData ? genreData.emoji : '🎵';
                const color = genreData ? genreData.color : '#D2691E';
                const qualityBadge = result.station.quality === 'Premium' ? '👑 PREMIUM' : '⭐ HIGH QUALITY';
                const lyricsInfo = result.station.hasLyrics ? '🎤 With Lyrics' : '🎵 Instrumental';
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${emoji} Now Sailing the Musical Grand Line!`)
                    .setDescription(`**${result.station.name}** is now streaming on the Thousand Sunny!`)
                    .addFields(
                      {
                        name: '🎶 Station Details',
                        value: result.station.description,
                        inline: false
                      },
                      {
                        name: '🎵 Genre',
                        value: `${emoji} ${result.station.genre}`,
                        inline: true
                      },
                      {
                        name: '💎 Quality',
                        value: qualityBadge,
                        inline: true
                      },
                      {
                        name: '🎤 Content',
                        value: lyricsInfo,
                        inline: true
                      },
                      {
                        name: '🔊 Broadcasting to',
                        value: `📡 ${voiceChannel.name}`,
                        inline: true
                      },
                      {
                        name: '🎨 Featured Artists',
                        value: result.station.artists ? result.station.artists.slice(0, 3).join(', ') : 'Various Artists',
                        inline: true
                      }
                    )
                    .setFooter({ text: `${result.station.genre} adventure continues on the Grand Line! 🏴‍☠️${emoji}` })
                    .setTimestamp()
                  ]
                });

              } catch (error) {
                console.error(`❌ Stream failed:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Navigation Failed!')
                    .setDescription(`Couldn't reach ${stationInfo.name} on the Grand Line`)
                    .addFields(
                      {
                        name: '🗺️ Error Details',
                        value: error.message,
                        inline: false
                      },
                      {
                        name: '🧭 Suggested Actions',
                        value: 'Try another station or check if the Grand Line routes are clear. Some treasure islands may have restrictions!',
                        inline: false
                      }
                    )
                  ]
                });
              }

            } else if (componentInteraction.customId === 'radio_stop') {
              await componentInteraction.deferReply({ ephemeral: true });

              const player = client.shoukaku.players.get(interaction.guildId);
              if (player) {
                await player.stopTrack();
                await player.destroy();
                client.shoukaku.players.delete(interaction.guildId);
              }

              await componentInteraction.editReply({
                embeds: [new EmbedBuilder()
                  .setColor('#00FF00')
                  .setTitle('⚓ Anchor Dropped!')
                  .setDescription('Uta has finished her performance and the Thousand Sunny has docked safely! 🚢')
                  .addFields({
                    name: '🏴‍☠️ Thanks for sailing!',
                    value: 'The musical adventure continues whenever you\'re ready to set sail again!',
                    inline: false
                  })
                  .setFooter({ text: 'Until the next adventure on the Grand Line! 🏴‍☠️✨' })
                ]
              });
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };

    // One Piece themed Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Uta\'s One Piece music panel'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Music Studio - One Piece Radio')
          .setDescription('*"Ready to rock the Grand Line with the world\'s greatest songs!"* 🏴‍☠️\n\nUse `/radio` to access the ultimate music collection with real artists and trendy hits!')
          .addFields(
            {
              name: '🏴‍☠️ Musical Treasures',
              value: '👑 **Tomorrowland One World Radio** - Official festival experience with top DJs\n🎧 **Lofi Girl Radio** - The legendary study companion\n🎌 **LISTEN.moe** - Japanese and Korean music paradise',
              inline: false
            },
            {
              name: '🎵 Grand Line Genres',
              value: '🔥 **Bass Drops & Dubstep** - Heavy drops with vocal tracks\n💎 **Mainstream EDM** - Chart-topping hits with real artists\n🌊 **Trap/Future Bass** - Trendy vocals and future sounds\n⚡ **Hardstyle** - Epic vocals with massive drops',
              inline: false
            },
            {
              name: '🎭 Uta\'s Promise',
              value: '• 🎤 **Real artists with lyrics** - no copyright-free music\n• 🔥 **Trendy hits** from top charts\n• 👑 **Premium quality** streams\n• 🏴‍☠️ **One Piece adventure** theme',
              inline: false
            }
          )
          .setFooter({ text: 'The Grand Line\'s #1 Songstress is ready to perform! 🏴‍☠️🎤' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (One Piece themed with real artists), uta');

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('✅ Guild commands registered');
    }

    // Event handlers
    client.once(Events.ClientReady, () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
        console.log(`✅ Command /${interaction.commandName} executed`);
      } catch (error) {
        console.error(`❌ Command error:`, error.message);
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}, 1000);

console.log('🎬 One Piece radio bot with real artists initialization started');
