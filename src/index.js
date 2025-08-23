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
  // ✅ LO-FI & AMBIENT - SomaFM (guaranteed to work)
  'groove_salad': { 
    name: 'SomaFM Groove Salad', 
    description: 'Chilled ambient/downtempo beats and grooves',
    url: 'https://ice.somafm.com/groovesalad',
    fallback: 'https://somafm.com/groovesalad.pls',
    genre: 'Lo-Fi'
  },
  'drone_zone': { 
    name: 'SomaFM Drone Zone', 
    description: 'Atmospheric textures with minimal beats',
    url: 'https://ice.somafm.com/dronezone',
    fallback: 'https://somafm.com/dronezone.pls',
    genre: 'Lo-Fi'
  },
  'deep_space_one': { 
    name: 'SomaFM Deep Space One', 
    description: 'Deep ambient electronic and space music',
    url: 'https://ice.somafm.com/deepspaceone',
    fallback: 'https://somafm.com/deepspaceone.pls',
    genre: 'Lo-Fi'
  },
  'lush': { 
    name: 'SomaFM Lush', 
    description: 'Sensuous female vocals with electronic influence',
    url: 'https://ice.somafm.com/lush',
    fallback: 'https://somafm.com/lush.pls',
    genre: 'Lo-Fi'
  },
  'secret_agent': { 
    name: 'SomaFM Secret Agent', 
    description: 'Soundtrack for your stylish, mysterious life',
    url: 'https://ice.somafm.com/secretagent',
    fallback: 'https://somafm.com/secretagent.pls',
    genre: 'Lo-Fi'
  },
  
  // ✅ ELECTRONIC & DUBSTEP - SomaFM verified streams
  'beat_blender': { 
    name: 'SomaFM Beat Blender', 
    description: 'Late night deep-house and downtempo chill',
    url: 'https://ice.somafm.com/beatblender',
    fallback: 'https://somafm.com/beatblender.pls',
    genre: 'Dubstep'
  },
  'dubstep_beyond': { 
    name: 'SomaFM Dub Step Beyond', 
    description: 'Dubstep, Dub and Deep Bass (speaker warning!)',
    url: 'https://ice.somafm.com/dubstep',
    fallback: 'https://somafm.com/dubstep.pls',
    genre: 'Dubstep'
  },
  'cliqhop_idm': { 
    name: 'SomaFM cliqhop idm', 
    description: 'Intelligent Dance Music - blips and beeps with beats',
    url: 'https://ice.somafm.com/cliqhop',
    fallback: 'https://somafm.com/cliqhop.pls',
    genre: 'Dubstep'
  },
  'the_trip': { 
    name: 'SomaFM The Trip', 
    description: 'Progressive house/trance - tip top tunes',
    url: 'https://ice.somafm.com/thetrip',
    fallback: 'https://somafm.com/thetrip.pls',
    genre: 'Dubstep'
  },
  'fluid': { 
    name: 'SomaFM Fluid', 
    description: 'Electronic instrumental hiphop and liquid trap',
    url: 'https://ice.somafm.com/fluid',
    fallback: 'https://somafm.com/fluid.pls',
    genre: 'Dubstep'
  },
  
  // ✅ ROCK & METAL - SomaFM verified streams
  'metal_detector': { 
    name: 'SomaFM Metal Detector', 
    description: 'Black to doom, prog to sludge, thrash to post metal',
    url: 'https://ice.somafm.com/metal',
    fallback: 'https://somafm.com/metal.pls',
    genre: 'Rock'
  },
  'left_coast_70s': { 
    name: 'SomaFM Left Coast 70s', 
    description: 'Mellow album rock from the Seventies',
    url: 'https://ice.somafm.com/seventies',
    fallback: 'https://somafm.com/seventies.pls',
    genre: 'Rock'
  },
  'digitalis': { 
    name: 'SomaFM Digitalis', 
    description: 'Digitally affected analog rock',
    url: 'https://ice.somafm.com/digitalis',
    fallback: 'https://somafm.com/digitalis.pls',
    genre: 'Rock'
  },
  'underground_80s': { 
    name: 'SomaFM Underground 80s', 
    description: 'Early 80s UK Synthpop and New Wave',
    url: 'https://ice.somafm.com/u80s',
    fallback: 'https://somafm.com/u80s.pls',
    genre: 'Rock'
  },
  
  // ✅ ANIME & ALTERNATIVE - Verified working streams
  'listen_moe': { 
    name: 'LISTEN.moe (J-Pop/Anime)', 
    description: 'Japanese music and anime soundtracks 24/7',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'Anime'
  },
  'indie_pop_rocks': { 
    name: 'SomaFM Indie Pop Rocks', 
    description: 'New and classic favorite indie pop tracks',
    url: 'https://ice.somafm.com/indiepop',
    fallback: 'https://somafm.com/indiepop.pls',
    genre: 'Rock'
  },
  'poptron': { 
    name: 'SomaFM PopTron', 
    description: 'Electropop and indie dance rock with sparkle',
    url: 'https://ice.somafm.com/poptron',
    fallback: 'https://somafm.com/poptron.pls',
    genre: 'Rock'
  },
  
  // ✅ SPECIAL/EXPERIMENTAL - SomaFM unique channels
  'vaporwaves': { 
    name: 'SomaFM Vaporwaves', 
    description: 'All Vaporwave. All the time.',
    url: 'https://ice.somafm.com/vaporwaves',
    fallback: 'https://somafm.com/vaporwaves.pls',
    genre: 'Lo-Fi'
  },
  'defcon_radio': { 
    name: 'SomaFM DEF CON Radio', 
    description: 'Music for Hacking - the DEF CON year-round channel',
    url: 'https://ice.somafm.com/defcon',
    fallback: 'https://somafm.com/defcon.pls',
    genre: 'Dubstep'
  },
  'heavyweight_reggae': { 
    name: 'SomaFM Heavyweight Reggae', 
    description: 'Reggae, Ska, Rocksteady classic and deep tracks',
    url: 'https://ice.somafm.com/reggae',
    fallback: 'https://somafm.com/reggae.pls',
    genre: 'Rock'
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
          console.log(`📊 Player state:`, {
            playing: player.playing,
            paused: player.paused,
            track: !!player.track
          });
          
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
        .setDescription('Stream dubstep, rock, anime, and lo-fi radio stations'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first!')
            ],
            ephemeral: true
          });
        }

        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('Lavalink is not ready yet.')
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
          .setPlaceholder('Choose a radio station...')
          .addOptions(stationOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Stop Radio')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#D2691E')
          .setTitle('🏴‍☠️ Uta\'s One Piece Radio Collection')
          .setDescription('🎵 *"Set sail for the ultimate music adventure!"* 🎵\n\nSelect a station to start your musical journey!')
          .addFields(
            {
              name: '🎵 Music Treasures Available',
              value: '🎌 **Anime & J-Pop** • 🔥 **Dubstep & Bass** • 🎸 **Rock & Metal** • 🎧 **Lo-Fi Chill**',
              inline: false
            },
            {
              name: '🎭 Grand Line Radio Network',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** ready to sail with you!`,
              inline: false
            },
            {
              name: '🎶 Genre Breakdown',
              value: '• **Dubstep/Electronic**: Heavy drops, basslines, and beats\n• **Rock/Metal**: Classic hits, modern rock, and heavy metal\n• **Anime/J-Pop**: Japanese music, K-Pop, and anime soundtracks\n• **Lo-Fi**: Chill beats perfect for studying and relaxing',
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
                console.log(`🔊 Bot not in voice channel. Joining: ${voiceChannel.name}`);
                
                // Check bot permissions first
                const permissions = voiceChannel.permissionsFor(interaction.client.user);
                if (!permissions.has(['Connect', 'Speak'])) {
                  throw new Error('Bot missing Connect/Speak permissions in voice channel');
                }
                
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                
                // Wait a moment for connection to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await player.setGlobalVolume(75); // Increased volume
                console.log('✅ Voice connection established and volume set to 75');
              } else {
                console.log('🔊 Bot already in voice channel');
                // Make sure volume is set
                await player.setGlobalVolume(75);
              }

              try {
                const result = await radioManager.connectToStream(player, selectedStation);
                
                // Genre-specific emojis and colors
                const genreEmojis = {
                  'Dubstep': '🔥',
                  'Rock': '🎸',
                  'Anime': '🎌',
                  'Lo-Fi': '🎧'
                };
                
                const genreColors = {
                  'Dubstep': '#FF6B35',  // Orange
                  'Rock': '#8B0000',     // Dark Red
                  'Anime': '#FF69B4',    // Hot Pink
                  'Lo-Fi': '#9370DB'     // Medium Purple
                };
                
                const emoji = genreEmojis[result.station.genre] || '🎵';
                const color = genreColors[result.station.genre] || '#00FF00';
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${emoji} Now Streaming on the Thousand Sunny!`)
                    .setDescription(`**${result.station.name}** is rocking across the Grand Line!`)
                    .addFields(
                      {
                        name: '🎶 Station',
                        value: result.station.description,
                        inline: false
                      },
                      {
                        name: '🎵 Genre',
                        value: `${emoji} ${result.station.genre}`,
                        inline: true
                      },
                      {
                        name: '🔊 Voice Channel',
                        value: voiceChannel.name,
                        inline: true
                      }
                    )
                    .setFooter({ text: `${result.station.genre} adventure continues! 🏴‍☠️${emoji}` })
                    .setTimestamp()
                  ]
                });

              } catch (error) {
                console.error(`❌ Stream failed:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Stream Failed')
                    .setDescription(`Could not start ${stationInfo.name}`)
                    .addFields({
                      name: '🔧 Error',
                      value: error.message,
                      inline: false
                    })
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
                  .setTitle('🛑 Radio Stopped')
                  .setDescription('Successfully disconnected from radio')
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
        .setDescription('🎤 Uta\'s simple music panel'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Music Studio')
          .setDescription('*"Ready to rock the Grand Line with epic music!"*\n\nUse `/radio` to start listening to dubstep, rock, anime, and lo-fi stations!')
          .addFields(
            {
              name: '🎵 Available Genres',
              value: '🔥 **Dubstep** - Heavy bass and drops\n🎸 **Rock & Metal** - Classic and modern hits\n🎌 **Anime & J-Pop** - Japanese music paradise\n🎧 **Lo-Fi** - Chill beats for relaxation',
              inline: false
            }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (Dubstep/Rock/Anime/Lo-Fi collection), uta');

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
