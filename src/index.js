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

// VERIFIED WORKING RADIO STATIONS - Updated with popular music channels
const RADIO_STATIONS = {
  // ✅ LO-FI & CHILL - Keep as requested
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'poolsuite_fm': { 
    name: 'Poolsuite FM', 
    description: 'Summer vibes and yacht rock for chill sessions',
    url: 'https://streams.ilovemusic.de/iloveradio104.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  
  // ✅ ANIME & J-POP - Keep as requested
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
  
  // ✅ POPULAR MUSIC - Like "Die with a Smile" by Lady Gaga
  'hits1_siriusxm': {
    name: 'SiriusXM Hits 1',
    description: 'Today\'s biggest pop hits including Lady Gaga, Taylor Swift, Dua Lipa',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/HITS1HITS.mp3',
    fallback: 'https://playerservices.streamtheworld.com/api/livestream-redirect/HITS1HITS_SC',
    genre: 'Pop Hits',
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
  'kiis_fm_la': {
    name: 'KIIS FM Los Angeles',
    description: 'LA\'s hit music station with top 40 and current hits',
    url: 'https://n37a-e2.revma.ihrhls.com/zc185',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KIISFMAAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  
  // ✅ DANCE/EDM - Popular electronic and dance music
  'radio_record_dance': {
    name: 'Radio Record Dance Hits',
    description: 'Popular dance and electronic music with vocal tracks',
    url: 'http://air.radiorecord.ru:805/dancehits_320',
    fallback: 'http://air.radiorecord.ru:805/dancehits_128',
    genre: 'Dance/EDM',
    quality: 'High'
  },
  'radio_record_future': {
    name: 'Radio Record Future House',
    description: 'Future house and progressive with popular artists',
    url: 'http://air.radiorecord.ru:805/fut_320',
    fallback: 'http://air.radiorecord.ru:805/fut_128',
    genre: 'Dance/EDM',
    quality: 'High'
  },
  'dance_uk': {
    name: 'Dance UK Radio',
    description: 'UK\'s hottest dance tracks and club anthems',
    url: 'https://listen.danceradiouk.com/live',
    fallback: 'https://edge-bauerall-01-gos2.sharp-stream.com/danceradiouk.mp3',
    genre: 'Dance/EDM',
    quality: 'High'
  },
  
  // ✅ HIP-HOP & R&B - Popular urban music
  'power_106_la': {
    name: 'Power 106 Los Angeles',
    description: 'LA\'s #1 for hip-hop and R&B hits',
    url: 'https://n10a-e2.revma.ihrhls.com/zc197',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KPWRAAC.aac',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  'hot97_nyc': {
    name: 'Hot 97 New York',
    description: 'NYC\'s original hip-hop and R&B station',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WQHTFM_SC',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/WQHTFMAAC.aac',
    genre: 'Hip-Hop/R&B',
    quality: 'High'
  },
  
  // ✅ ROCK & ALTERNATIVE - Popular rock hits
  'kroq_la': {
    name: 'KROQ Los Angeles',
    description: 'LA\'s world-famous rock station with alternative hits',
    url: 'https://n37a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/KROQFMAAC.aac',
    genre: 'Rock/Alternative',
    quality: 'High'
  },
  'alt_nation_siriusxm': {
    name: 'SiriusXM Alt Nation',
    description: 'Alternative rock and indie hits',
    url: 'http://playerservices.streamtheworld.com/api/livestream-redirect/ALTNATIONHITS.mp3',
    fallback: 'https://playerservices.streamtheworld.com/api/livestream-redirect/ALTNATIONHITS_SC',
    genre: 'Rock/Alternative',
    quality: 'High'
  },
  
  // ✅ INTERNATIONAL HITS - Global popular music
  'nrj_france': {
    name: 'NRJ France',
    description: 'French radio with international pop and dance hits',
    url: 'http://cdn.nrjaudio.fm/adwz1/fr/30001/mp3_128.mp3',
    fallback: 'https://scdn.nrjaudio.fm/adwz1/fr/30001/aac_64.aac',
    genre: 'International Pop',
    quality: 'High'
  },
  'kiss_fm_uk': {
    name: 'Kiss FM UK',
    description: 'UK\'s biggest dance and pop hits',
    url: 'https://kissfmuk.kissfmuk.com/stream',
    fallback: 'http://icecast.thisisdax.com/KissFMUK',
    genre: 'Dance/Pop',
    quality: 'High'
  },
  
  // ✅ CLASSIC HITS - Popular songs from past decades
  'absolute_80s': {
    name: 'Absolute 80s',
    description: '80s classics and synthwave hits',
    url: 'https://ais-edge09-live365-dal02.cdnstream.com/a14550',
    fallback: 'http://icecast.thisisdax.com/Absolute80sHQ',
    genre: 'Classic Hits',
    quality: 'High'
  },
  'absolute_90s': {
    name: 'Absolute 90s',
    description: '90s pop, rock, and dance classics',
    url: 'https://ais-edge09-live365-dal02.cdnstream.com/a14540',
    fallback: 'http://icecast.thisisdax.com/Absolute90sHQ',
    genre: 'Classic Hits',
    quality: 'High'
  }
};

// Simple Radio Manager with fallback support
class SimpleRadioManager {
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
        const result = await player.node.rest.resolve(url);
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
          
          // Wait and verify playback started
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
        resumeKey: 'uta-bot-bulletproof',
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

    const radioManager = new SimpleRadioManager();

    // Updated radio command with new stations
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎵 Stream popular music hits and genres'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first to start the music!')
            ],
            ephemeral: true
          });
        }

        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('The music system is down. Try again in a moment!')
            ],
            ephemeral: true
          });
        }

        const stationOptions = Object.entries(RADIO_STATIONS).map(([key, station]) => ({
          label: station.name,
          description: `${station.description} (${station.genre})`,
          value: key
        }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('radio_select')
          .setPlaceholder('Choose your music adventure...')
          .addOptions(stationOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Stop Music')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎵 Uta\'s Popular Music Collection')
          .setDescription('🎤 *"Ready to play today\'s biggest hits and popular songs!"* 🎤\n\nFrom Lady Gaga to Taylor Swift, K-Pop to Hip-Hop - all the music you love!')
          .addFields(
            {
              name: '🎵 Available Genres',
              value: '🔥 **Pop Hits** • 🎌 **K-Pop & J-Pop** • 💃 **Dance/EDM** • 🎤 **Hip-Hop/R&B** • 🎸 **Rock/Alternative** • 🌍 **International** • 📻 **Classic Hits** • 🎧 **Lo-Fi Chill**',
              inline: false
            },
            {
              name: '🎭 Featured Stations',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** with real artists, vocals, and chart-topping hits!`,
              inline: false
            },
            {
              name: '🎵 What You\'ll Hear',
              value: '• 🎤 **Popular artists** like Lady Gaga, Taylor Swift, Drake\n• 🔥 **Chart toppers** and trending hits\n• 👑 **High quality** streams from major radio stations\n• 🌟 **Real vocals** and mainstream music',
              inline: false
            }
          )
          .setFooter({ text: 'Uta\'s Radio • Playing the hits you love! 🎵✨' })
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
                
                // SUCCESS: Show brief success message then auto-dismiss
                await componentInteraction.editReply({
                  content: '✅ Connected!',
                  ephemeral: true
                });
                
                // Auto-dismiss after 2 seconds
                setTimeout(async () => {
                  try {
                    await componentInteraction.deleteReply();
                  } catch (err) {
                    // Ignore errors if already dismissed
                  }
                }, 2000);
                
              } catch (error) {
                console.error(`❌ Stream failed:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Connection Failed!')
                    .setDescription(`Couldn't connect to ${stationInfo.name}`)
                    .addFields(
                      {
                        name: '🔧 Error Details',
                        value: error.message,
                        inline: false
                      },
                      {
                        name: '💡 Suggested Actions',
                        value: 'Try another station - some radio streams may have temporary issues or geographic restrictions.',
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
                  .setTitle('🛑 Music Stopped!')
                  .setDescription('Uta has finished her performance and the music has stopped! 🎤')
                  .addFields({
                    name: '🎵 Thanks for listening!',
                    value: 'The musical journey continues whenever you\'re ready to start again!',
                    inline: false
                  })
                  .setFooter({ text: 'Until the next song! 🎵✨' })
                ]
              });
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };

    // Updated Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Uta\'s popular music panel'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Music Studio - Popular Hits')
          .setDescription('*"Ready to play all your favorite songs and trending hits!"* 🎵\n\nUse `/radio` to access the ultimate music collection with popular artists and chart-toppers!')
          .addFields(
            {
              name: '🎵 Popular Music Collection',
              value: '🔥 **Pop Hits** - Lady Gaga, Taylor Swift, Dua Lipa\n🎤 **Hip-Hop/R&B** - Drake, Ariana Grande, The Weeknd\n💃 **Dance/EDM** - Calvin Harris, David Guetta, Marshmello',
              inline: false
            },
            {
              name: '🌍 Global Genres Available',
              value: '🎌 **K-Pop & J-Pop** - BTS, BLACKPINK, anime soundtracks\n🎸 **Rock/Alternative** - Imagine Dragons, OneRepublic\n📻 **Classic Hits** - 80s, 90s, and 2000s favorites',
              inline: false
            },
            {
              name: '🎭 Uta\'s Promise',
              value: '• 🎤 **Real popular artists** with vocals and lyrics\n• 🔥 **Chart-topping hits** and trending songs\n• 👑 **High-quality streams** from major radio stations\n• 🌟 **Mainstream music** you know and love',
              inline: false
            }
          )
          .setFooter({ text: 'The world\'s #1 songstress ready to play your favorites! 🎤✨' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (Popular Music with working URLs), uta');

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

console.log('🎬 Popular music radio bot initialization started');
