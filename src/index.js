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

// BULLETPROOF RADIO STATIONS - Focused on Lo-Fi, Anime, Dubstep & Rock
const RADIO_STATIONS = {
  'lofi_girl': { 
    name: 'Lofi Girl Radio', 
    description: '24/7 chill lo-fi hip hop beats',
    url: 'http://stream.zeno.fm/f3wvbbqmdg8uv',
    genre: 'Lo-Fi'
  },
  'listen_moe': { 
    name: 'LISTEN.moe (KPOP)', 
    description: 'K-Pop and Japanese music 24/7',
    url: 'https://listen.moe/kpop/stream',
    genre: 'Anime'
  },
  'dubstep_fm': { 
    name: 'Dubstep FM', 
    description: 'Heavy bass drops and electronic madness',
    url: 'http://radio.dubstep.fm:8000/dubstep256.mp3',
    genre: 'Dubstep'
  },
  'bass_radio': { 
    name: 'BassDrive Radio', 
    description: 'Drum & Bass and dubstep 24/7',
    url: 'http://bassdrive.com:8000/stream',
    genre: 'Dubstep'
  },
  'hardstyle_radio': { 
    name: 'HardstyleRadio.nl', 
    description: 'Hardstyle and hard dance music',
    url: 'http://stream.hardstyleradio.nl:8000/stream',
    genre: 'Dubstep'
  },
  'rock_antenne': { 
    name: 'Rock Antenne', 
    description: 'Classic and modern rock hits',
    url: 'http://mp3channels.webradio.rockantenne.de/rockantenne',
    genre: 'Rock'
  },
  'planet_rock': { 
    name: 'Planet Rock', 
    description: 'The greatest rock and guitar music',
    url: 'http://tx.sharp-stream.com/icecast.php?i=planetrock.mp3',
    genre: 'Rock'
  },
  'absolute_rock': { 
    name: 'Absolute Radio Rock', 
    description: 'Non-stop rock music 24/7',
    url: 'http://icy-e-bab-04-cr.sharp-stream.com/absoluteradiorock.mp3',
    genre: 'Rock'
  },
  'classic_rock_florida': { 
    name: 'Classic Rock Florida', 
    description: 'The best classic rock hits',
    url: 'http://198.58.98.83:8258/stream',
    genre: 'Rock'
  },
  'metal_radio': { 
    name: 'Metal Radio', 
    description: 'Heavy metal and hard rock',
    url: 'http://149.56.147.197:8071/stream',
    genre: 'Rock'
  },
  'rockradio_com': { 
    name: 'RockRadio.com Classic Rock', 
    description: 'Classic rock legends and hits',
    url: 'http://sc-classicrock.1.fm:8200/',
    genre: 'Rock'
  },
  'dnbradio': { 
    name: 'DnB Radio', 
    description: 'Drum & Bass and electronic beats',
    url: 'http://www.dnbradio.com:8000/dnbradio_main.mp3',
    genre: 'Dubstep'
  },
  'bassport_fm': { 
    name: 'Bassport FM', 
    description: 'UK garage, drum & bass, and dubstep',
    url: 'http://bassport.org:8000/stream',
    genre: 'Dubstep'
  },
  'radio_caprice_rock': { 
    name: 'Radio Caprice Rock', 
    description: 'Alternative and indie rock station',
    url: 'http://79.111.14.76:8000/rock',
    genre: 'Rock'
  },
  'anime_radio': { 
    name: 'AnimeRadio.su', 
    description: 'Anime music and J-Pop 24/7',
    url: 'http://animeradio.su:8000/stream',
    genre: 'Anime'
  },
  'jpop_project_radio': { 
    name: 'J-Pop Project Radio', 
    description: 'Japanese pop and anime music',
    url: 'http://streamingv2.shoutcast.com/jpop-project-radio',
    genre: 'Anime'
  },
  'chillstep_radio': { 
    name: 'Chillstep Radio', 
    description: 'Melodic dubstep and chillstep vibes',
    url: 'http://hyades.shoutca.st:8043/stream',
    genre: 'Dubstep'
  },
  'lofi_hip_hop_radio': { 
    name: 'LoFi Hip Hop Radio', 
    description: 'Chill beats to study and relax',
    url: 'http://streams.fluxfm.de/Chillhop/mp3-320/audio/',
    genre: 'Lo-Fi'
  },
  'chill_lofi_radio': { 
    name: 'Chill LoFi Radio', 
    description: 'Relaxing lo-fi beats and jazz',
    url: 'http://radio.streemlion.com:2199/tunein/chilllofi.pls',
    genre: 'Lo-Fi'
  }
};

// Simple Radio Manager
class SimpleRadioManager {
  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) {
      throw new Error('Station not found');
    }

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    try {
      // Simple resolve and play
      const result = await player.node.rest.resolve(station.url);
      console.log(`📊 Stream result:`, {
        loadType: result?.loadType,
        hasData: !!result?.data,
        hasTrack: !!result?.tracks?.length,
        exception: result?.exception?.message || 'none',
        dataKeys: result?.data ? Object.keys(result.data) : 'no data',
        encoded: !!result?.data?.encoded
      });
      
      // Handle different response types - CORRECTED PLAYTRACK METHOD
      if (result.loadType === 'track' && result.data) {
        // Use the correct Lavalink v4 playTrack syntax
        console.log(`🎵 Attempting to play track with encoded data...`);
        
        await player.playTrack({
          track: {
            encoded: result.data.encoded
          }
        });
        
        // Wait and check if track started
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`📊 Player state after playTrack:`, {
          playing: player.playing,
          paused: player.paused,
          track: !!player.track,
          position: player.position,
          volume: player.volume
        });
        
        console.log(`✅ Successfully started ${station.name}`);
        return { success: true, station };
        
      } else if (result.tracks && result.tracks.length > 0) {
        console.log(`🎵 Attempting to play from tracks array...`);
        
        await player.playTrack({
          track: {
            encoded: result.tracks[0].encoded
          }
        });
        
        // Wait and check if track started
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`📊 Player state after playTrack:`, {
          playing: player.playing,
          paused: player.paused,
          track: !!player.track,
          position: player.position,
          volume: player.volume
        });
        
        console.log(`✅ Successfully started ${station.name}`);
        return { success: true, station };
        
      } else if (result.loadType === 'playlist' && result.data?.tracks?.length > 0) {
        console.log(`🎵 Attempting to play from playlist...`);
        
        await player.playTrack({
          track: {
            encoded: result.data.tracks[0].encoded
          }
        });
        
        // Wait and check if track started
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`📊 Player state after playTrack:`, {
          playing: player.playing,
          paused: player.paused,
          track: !!player.track,
          position: player.position,
          volume: player.volume
        });
        
        console.log(`✅ Successfully started ${station.name}`);
        return { success: true, station };
      }
      
      throw new Error(`No playable track found. LoadType: ${result.loadType}, Data: ${JSON.stringify(result.data)}`);
      
      
    } catch (error) {
      console.error(`❌ Failed to connect to ${station.name}:`, error.message);
      throw new Error(`Stream failed: ${error.message}`);
    }
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
                await player.disconnect();
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
