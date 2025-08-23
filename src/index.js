import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - EDM & LOFI COLLECTION');
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

// ✅ CURATED HIGH-QUALITY RADIO STATIONS - Only the best working streams
const RADIO_STATIONS = {
  // 🎧 LO-FI COLLECTIONS
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The original 24/7 lofi hip hop beats to relax/study to',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    fallback: 'https://ice.somafm.com/groovesalad',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
  'groove_salad': { 
    name: 'SomaFM Groove Salad', 
    description: 'Chilled ambient/downtempo beats and grooves',
    url: 'https://ice.somafm.com/groovesalad',
    fallback: 'https://somafm.com/groovesalad.pls',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  'drone_zone': { 
    name: 'SomaFM Drone Zone', 
    description: 'Atmospheric textures with minimal beats',
    url: 'https://ice.somafm.com/dronezone',
    fallback: 'https://somafm.com/dronezone.pls',
    genre: 'Lo-Fi',
    quality: 'High'
  },
  
  // 🎌 ANIME & J-POP
  'listen_moe': { 
    name: 'LISTEN.moe (J-Pop/Anime)', 
    description: 'Japanese music and anime soundtracks 24/7',
    url: 'https://listen.moe/stream',
    fallback: 'https://listen.moe/kpop/stream',
    genre: 'Anime',
    quality: 'High'
  },
  'listen_moe_kpop': { 
    name: 'LISTEN.moe K-Pop', 
    description: 'Korean pop music and K-Pop hits 24/7',
    url: 'https://listen.moe/kpop/stream',
    fallback: 'https://listen.moe/stream',
    genre: 'Anime',
    quality: 'High'
  },
  
  // 🎪 TOMORROWLAND & EDM FESTIVAL VIBES
  'one_world_radio': { 
    name: 'Tomorrowland One World Radio', 
    description: 'Official Tomorrowland radio - the sound of the festival 24/7',
    url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/OWR.mp3',
    fallback: 'https://21293.live.streamtheworld.com/OWR.mp3',
    genre: 'EDM',
    quality: 'Premium'
  },
  'tomorrowland_anthems': { 
    name: 'Tomorrowland Anthems', 
    description: 'The biggest EDM anthems from Tomorrowland festivals',
    url: 'https://22113.live.streamtheworld.com/TOMORROWLANDANTHEMS.mp3',
    fallback: 'https://ice.somafm.com/thetrip',
    genre: 'EDM',
    quality: 'High'
  },
  
  // 🔥 ADDITIONAL EDM/ELECTRONIC
  'beat_blender': { 
    name: 'SomaFM Beat Blender', 
    description: 'Late night deep-house and downtempo chill',
    url: 'https://ice.somafm.com/beatblender',
    fallback: 'https://somafm.com/beatblender.pls',
    genre: 'EDM',
    quality: 'High'
  },
  'the_trip': { 
    name: 'SomaFM The Trip', 
    description: 'Progressive house/trance - tip top tunes',
    url: 'https://ice.somafm.com/thetrip',
    fallback: 'https://somafm.com/thetrip.pls',
    genre: 'EDM',
    quality: 'High'
  }
};

// Enhanced Radio Manager with festival-focused UI
class FestivalRadioManager {
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
        resumeKey: 'uta-bot-festival-radio',
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

    const radioManager = new FestivalRadioManager();

    // Enhanced radio command with festival theming
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎪 Stream Tomorrowland EDM, Lofi Girl study beats, and anime music'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first to start the festival!')
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

        // Organize stations by genre for better UX
        const stationsByGenre = {
          'EDM': Object.entries(RADIO_STATIONS).filter(([_, station]) => station.genre === 'EDM'),
          'Lo-Fi': Object.entries(RADIO_STATIONS).filter(([_, station]) => station.genre === 'Lo-Fi'),
          'Anime': Object.entries(RADIO_STATIONS).filter(([_, station]) => station.genre === 'Anime')
        };

        const stationOptions = Object.entries(RADIO_STATIONS).map(([key, station]) => {
          const qualityEmoji = station.quality === 'Premium' ? '👑' : '⭐';
          return {
            label: `${qualityEmoji} ${station.name}`,
            description: `${station.description} (${station.genre})`,
            value: key
          };
        });

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('radio_select')
          .setPlaceholder('Choose your festival experience...')
          .addOptions(stationOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('End Festival')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('🎪 Uta\'s Festival Radio Collection')
          .setDescription('🎵 *"Welcome to the ultimate music festival experience!"* 🎵\n\nChoose your vibe and let the festival begin!')
          .addFields(
            {
              name: '👑 Premium Stations',
              value: `🎪 **Tomorrowland One World Radio** - Official festival sound\n🎧 **Lofi Girl Study Beats** - The legendary study companion`,
              inline: false
            },
            {
              name: '🎵 Genre Collection',
              value: `🔥 **EDM/Electronic** (${stationsByGenre.EDM.length} stations) - Festival anthems and dance floor hits\n🎧 **Lo-Fi/Chill** (${stationsByGenre['Lo-Fi'].length} stations) - Perfect for studying and relaxing\n🎌 **Anime/J-Pop** (${stationsByGenre.Anime.length} stations) - Japanese music and K-Pop`,
              inline: false
            },
            {
              name: '🎭 Festival Experience',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** ready to transport you to music paradise!`,
              inline: false
            }
          )
          .setFooter({ text: 'Uta\'s Festival Radio • The beat never stops! 🎪🎵' })
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
                
                await player.setGlobalVolume(75);
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
                  'EDM': '🔥',
                  'Lo-Fi': '🎧',
                  'Anime': '🎌'
                };
                
                const genreColors = {
                  'EDM': '#FF6B35',     // Orange
                  'Lo-Fi': '#9370DB',   // Purple
                  'Anime': '#FF69B4'    // Pink
                };
                
                const emoji = genreEmojis[result.station.genre] || '🎵';
                const color = genreColors[result.station.genre] || '#00FF00';
                const qualityBadge = result.station.quality === 'Premium' ? '👑 PREMIUM' : '⭐ HIGH QUALITY';
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor(color)
                    .setTitle(`${emoji} Festival Experience Started!`)
                    .setDescription(`**${result.station.name}** is now streaming live!`)
                    .addFields(
                      {
                        name: '🎶 Station Info',
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
                        name: '🔊 Voice Channel',
                        value: voiceChannel.name,
                        inline: true
                      }
                    )
                    .setFooter({ text: `${result.station.genre} festival continues! 🎪${emoji}` })
                    .setTimestamp()
                  ]
                });

              } catch (error) {
                console.error(`❌ Stream failed:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Festival Connection Failed')
                    .setDescription(`Could not start ${stationInfo.name}`)
                    .addFields({
                      name: '🔧 Error Details',
                      value: error.message,
                      inline: false
                    },
                    {
                      name: '💡 Troubleshooting',
                      value: 'Try another station or check your connection. Some premium stations may have regional restrictions.',
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
                await player.destroy();
                client.shoukaku.players.delete(interaction.guildId);
              }

              await componentInteraction.editReply({
                embeds: [new EmbedBuilder()
                  .setColor('#00FF00')
                  .setTitle('🛑 Festival Ended')
                  .setDescription('Thanks for joining the festival! The music lives on in your heart 💖')
                  .setFooter({ text: 'Until next time... 🎪✨' })
                ]
              });
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };

    // Enhanced Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Uta\'s festival music panel'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Festival Music Studio')
          .setDescription('*"Ready to rock the ultimate music festival!"* 🎪\n\nUse `/radio` to access premium Tomorrowland EDM, legendary Lofi Girl beats, and amazing anime music!')
          .addFields(
            {
              name: '🎵 Featured Collections',
              value: '👑 **Tomorrowland One World Radio** - Official festival experience\n🎧 **Lofi Girl Study Beats** - The iconic study companion\n🎌 **Japanese Music Paradise** - Anime soundtracks and J-Pop hits',
              inline: false
            },
            {
              name: '🎪 Festival Genres',
              value: '🔥 **EDM/Electronic** - Dance floor anthems and festival vibes\n🎧 **Lo-Fi/Chill** - Perfect background music for any activity\n🎌 **Anime/J-Pop** - High-energy Japanese music collection',
              inline: false
            }
          )
          .setFooter({ text: 'The festival never ends with Uta! 🎭✨' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (Festival Collection), uta');

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

console.log('🎬 Festival radio bot initialization started');
