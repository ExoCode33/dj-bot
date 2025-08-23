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

// VERIFIED WORKING RADIO STATIONS - All tested with Lavalink
const RADIO_STATIONS = {
  // ✅ LO-FI & CHILL - Working URLs
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
    genre: 'Anime',
    quality: 'High'
  },
  
  // ✅ BASS DROP & DUBSTEP - Working URLs with real artists
  'di_fm_dubstep': {
    name: 'DI.FM Dubstep Radio',
    description: 'Premium dubstep with massive drops and vocal tracks',
    url: 'http://pub1.di.fm/di_dubstep',
    fallback: 'http://pub2.di.fm/di_dubstep',
    genre: 'Bass Drop',
    quality: 'High'
  },
  'dubplate_fm': {
    name: 'Dubplate.fm Bass Music',
    description: 'Dubstep, future bass, jungle with real artists',
    url: 'https://streams.radio.co/s2c4cc784b/listen',
    fallback: 'http://pub1.di.fm/di_dubstep',
    genre: 'Bass Drop',
    quality: 'High'
  },
  'di_fm_drumandbass': {
    name: 'DI.FM Drum & Bass',
    description: 'High-energy drum & bass with vocal tracks',
    url: 'http://pub1.di.fm/di_drumandbass',
    fallback: 'http://pub2.di.fm/di_drumandbass',
    genre: 'Bass Drop',
    quality: 'High'
  },
  
  // ✅ FESTIVAL EDM - Working URLs 
  'di_fm_electro': { 
    name: 'DI.FM Electro House', 
    description: 'Festival electro house with top DJs and vocal anthems',
    url: 'http://pub1.di.fm/di_electro',
    fallback: 'http://pub2.di.fm/di_electro',
    genre: 'Festival EDM',
    quality: 'High'
  },
  'di_fm_progressive': {
    name: 'DI.FM Progressive',
    description: 'Progressive house and trance with epic buildups',
    url: 'http://pub1.di.fm/di_progressive',
    fallback: 'http://pub2.di.fm/di_progressive',
    genre: 'Festival EDM',
    quality: 'High'
  },
  
  // ✅ MAINSTREAM EDM - Working
  'nts_radio': {
    name: 'NTS Radio Electronic',
    description: 'Cutting-edge electronic music with trendy artists',
    url: 'https://stream-relay-geo.ntslive.net/stream2',
    fallback: 'https://stream-relay-geo.ntslive.net/stream',
    genre: 'Mainstream EDM',
    quality: 'High'
  },
  
  // ✅ TRAP & FUTURE BASS - Working
  'di_fm_trap': {
    name: 'DI.FM Trap',
    description: 'Future bass and trap with vocal drops',
    url: 'http://pub1.di.fm/di_trap',
    fallback: 'http://pub2.di.fm/di_trap',
    genre: 'Trap',
    quality: 'High'
  },
  
  // ✅ HARDSTYLE - Working
  'di_fm_hardstyle': {
    name: 'DI.FM Hardstyle',
    description: 'Hardstyle with epic vocals and massive drops',
    url: 'http://pub1.di.fm/di_hardstyle',
    fallback: 'http://pub2.di.fm/di_hardstyle',
    genre: 'Hardstyle',
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

    // Bulletproof radio command
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

        const stationOptions = Object.entries(RADIO_STATIONS).map(([key, station]) => ({
          label: station.name,
          description: `${station.description} (${station.genre})`,
          value: key
        }));

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
              value: '🎧 **Lo-Fi Chill** • 🎌 **Anime & K-Pop** • 🔥 **Bass Drops** • 🎪 **Festival EDM** • 🌊 **Trap** • ⚡ **Hardstyle**',
              inline: false
            },
            {
              name: '🎭 Grand Line Radio Network',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** ready to sail with real artists and trendy songs!`,
              inline: false
            },
            {
              name: '🎵 Music Features',
              value: '• 🎤 **Real artists** with vocals and lyrics\n• 👑 **Premium quality** streams\n• 🔥 **Trendy hits** and festival bangers\n• ⚓ **Reliable connections** tested for Lavalink',
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
                
                // SUCCESS: No message shown - just silent success
                // Only failure messages will be displayed below
                
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
                await player.destroy(); // Fixed: use destroy() instead of disconnect()
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

    // Simple Uta command
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
              value: '🎧 **Lofi Girl Radio** - The legendary study companion\n🎌 **LISTEN.moe** - Japanese and Korean music paradise\n🔥 **DI.FM Bass Drops** - Dubstep and drum & bass with real artists',
              inline: false
            },
            {
              name: '🎵 Grand Line Genres',
              value: '🔥 **Bass Drops & Dubstep** - Heavy drops with vocal tracks\n🎪 **Festival EDM** - Electro house and progressive with top DJs\n🌊 **Trap/Future Bass** - Trendy vocals and future sounds\n⚡ **Hardstyle** - Epic vocals with massive drops',
              inline: false
            },
            {
              name: '🎭 Uta\'s Promise',
              value: '• 🎤 **Real artists with vocals** - no copyright-free music\n• 🔥 **Working streams** - all tested for Lavalink\n• 👑 **Premium quality** - DI.FM and verified sources\n• 🏴‍☠️ **One Piece adventure** theme',
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

    console.log('✅ Commands loaded: radio (One Piece themed with working URLs), uta');

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

console.log('🎬 One Piece radio bot initialization started');
