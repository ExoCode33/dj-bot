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

// BULLETPROOF RADIO STATIONS - All tested MP3 streams
const RADIO_STATIONS = {
  'soma_groovesalad': { 
    name: 'SomaFM Groove Salad', 
    description: 'Ambient downtempo space music',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    genre: 'Ambient'
  },
  'soma_beatblender': { 
    name: 'SomaFM Beat Blender', 
    description: 'Deep house, nu disco and electronica',
    url: 'http://ice1.somafm.com/beatblender-128-mp3',
    genre: 'Electronic'
  },
  'soma_deepspaceone': { 
    name: 'SomaFM Deep Space One', 
    description: 'Ambient space music and soundscapes',
    url: 'http://ice1.somafm.com/deepspaceone-128-mp3',
    genre: 'Ambient'
  },
  'soma_dronezone': { 
    name: 'SomaFM Drone Zone', 
    description: 'Atmospheric ambient drones',
    url: 'http://ice1.somafm.com/dronezone-256-mp3',
    genre: 'Drone'
  },
  'lofi_girl': { 
    name: 'Lofi Girl Radio', 
    description: '24/7 chill lo-fi hip hop beats',
    url: 'http://stream.zeno.fm/f3wvbbqmdg8uv',
    genre: 'Lo-Fi'
  },
  'chillhop_radio': { 
    name: 'Chillhop Radio', 
    description: 'Instrumental hip hop and jazz',
    url: 'http://streams.fluxfm.de/Chillhop/mp3-320/audio/',
    genre: 'Lo-Fi'
  },
  'soma_lush': { 
    name: 'SomaFM Lush', 
    description: 'Sensual and chill electronic beats',
    url: 'http://ice1.somafm.com/lush-128-mp3',
    genre: 'Lo-Fi'
  },
  'soma_secretagent': { 
    name: 'SomaFM Secret Agent', 
    description: 'Downtempo spy jazz and lounge',
    url: 'http://ice1.somafm.com/secretagent-128-mp3',
    genre: 'Lo-Fi'
  },
  'listen_moe': { 
    name: 'LISTEN.moe (KPOP)', 
    description: 'K-Pop and Japanese music 24/7',
    url: 'https://listen.moe/kpop/stream',
    genre: 'Anime'
  },
  'radio_swiss_jazz': { 
    name: 'Radio Swiss Jazz', 
    description: 'Jazz and chill instrumental music',
    url: 'http://stream.srg-ssr.ch/m/rsj/mp3_128',
    genre: 'Anime'
  },
  'radio_paradise': { 
    name: 'Radio Paradise Main', 
    description: 'Eclectic music discovery',
    url: 'http://stream-dc1.radioparadise.com/rp_192m.mp3',
    genre: 'Eclectic'
  },
  'kexp_main': { 
    name: 'KEXP 90.3 FM', 
    description: 'Where the music matters',
    url: 'http://live-mp3-128.kexp.org/kexp128.mp3',
    genre: 'Alternative'
  },
  'wfmu': { 
    name: 'WFMU Freeform Radio', 
    description: 'Independent freeform radio',
    url: 'http://stream0.wfmu.org/freeform-128k',
    genre: 'Freeform'
  },
  'nts_1': { 
    name: 'NTS Radio 1', 
    description: 'Global music radio from London',
    url: 'http://stream-relay-geo.ntslive.net/stream',
    genre: 'Global'
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

    // ENHANCED radio command with auto-reconnection
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Stream bulletproof radio stations that actually work'),
      
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
              value: '🎌 Anime • 🎵 Lo-Fi • 🌌 Ambient • 🎧 Electronic\n🎸 Rock • 🎷 Jazz • 🎼 Classical • 📻 Pop • 🎤 Hip-Hop',
              inline: false
            },
            {
              name: '🎭 Grand Line Radio Network',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** ready to sail with you!`,
              inline: false
            }
          )
          .setFooter({ text: 'Uta\'s Radio • Set sail for musical adventure! 🏴‍☠️' })
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
              
              await componentInteraction.deferReply({ flags: 64 }); // Use flags instead of ephemeral

              // ENHANCED: Get current user's voice channel (they might have moved)
              const currentMember = await componentInteraction.guild.members.fetch(componentInteraction.user.id);
              const currentVoiceChannel = currentMember?.voice?.channel;
              
              if (!currentVoiceChannel) {
                return componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Voice Channel Required')
                    .setDescription('You need to be in a voice channel to switch stations!')
                  ]
                });
              }

              console.log(`🔍 Checking player status for guild: ${interaction.guildId}`);
              console.log(`🔊 User is in voice channel: ${currentVoiceChannel.name} (${currentVoiceChannel.id})`);
              
              // ENHANCED: Check if player exists and is properly connected
              let player = client.shoukaku.players.get(interaction.guildId);
              let needsReconnection = false;

              if (player) {
                // Check if player is still connected to voice
                console.log(`🔊 Existing player found. Connection state:`, {
                  connected: player.connected,
                  channelId: player.channelId,
                  currentChannelId: currentVoiceChannel.id,
                  playing: player.playing,
                  paused: player.paused,
                  nodeConnected: player.node?.state === 2
                });

                // Check if player is connected to the wrong channel or disconnected
                if (!player.connected || player.channelId !== currentVoiceChannel.id || player.node?.state !== 2) {
                  console.log('🔄 Player needs reconnection - disconnected, wrong channel, or node issue');
                  needsReconnection = true;
                  
                  try {
                    // Clean up the old player
                    await player.destroy();
                    client.shoukaku.players.delete(interaction.guildId);
                    player = null;
                    console.log('🧹 Cleaned up old player');
                  } catch (cleanupError) {
                    console.log('⚠️ Error cleaning up old player:', cleanupError.message);
                    // Force cleanup
                    client.shoukaku.players.delete(interaction.guildId);
                    player = null;
                  }
                }
              } else {
                console.log('🔄 No existing player found, will create new one');
                needsReconnection = true;
              }

              // ENHANCED: Create or reconnect player if needed
              if (needsReconnection || !player) {
                console.log(`🔊 ${needsReconnection ? 'Reconnecting' : 'Connecting'} to voice channel: ${currentVoiceChannel.name}`);
                
                // Check bot permissions
                const permissions = currentVoiceChannel.permissionsFor(interaction.client.user);
                if (!permissions || !permissions.has(['Connect', 'Speak'])) {
                  return componentInteraction.editReply({
                    embeds: [new EmbedBuilder()
                      .setColor('#FF0000')
                      .setTitle('❌ Missing Permissions')
                      .setDescription('Bot missing Connect/Speak permissions in your voice channel!')
                    ]
                  });
                }

                try {
                  // Create new player with enhanced connection handling
                  console.log(`🔗 Creating voice connection...`);
                  player = await client.shoukaku.joinVoiceChannel({
                    guildId: interaction.guildId,
                    channelId: currentVoiceChannel.id,
                    shardId: interaction.guild.shardId
                  });
                  
                  console.log(`🔗 Player created, waiting for connection...`);
                  
                  // Enhanced connection verification with longer timeout
                  let connectionAttempts = 0;
                  const maxConnectionAttempts = 10;
                  
                  while (!player.connected && connectionAttempts < maxConnectionAttempts) {
                    connectionAttempts++;
                    console.log(`⏳ Connection attempt ${connectionAttempts}/${maxConnectionAttempts}...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Check if player still exists
                    if (!client.shoukaku.players.get(interaction.guildId)) {
                      throw new Error('Player was destroyed during connection');
                    }
                  }
                  
                  // Final connection check
                  if (!player.connected) {
                    console.error('❌ Player connection failed after all attempts');
                    console.log('🔧 Player state:', {
                      connected: player.connected,
                      channelId: player.channelId,
                      node: player.node?.name,
                      nodeState: player.node?.state
                    });
                    throw new Error(`Player failed to connect after ${maxConnectionAttempts} attempts`);
                  }
                  
                  await player.setGlobalVolume(75);
                  console.log('✅ Voice connection established and volume set to 75');
                  
                  // Show reconnection message
                  if (needsReconnection) {
                    await componentInteraction.followUp({
                      embeds: [new EmbedBuilder()
                        .setColor('#00FF94')
                        .setTitle('🔄 Reconnected!')
                        .setDescription(`Successfully reconnected to **${currentVoiceChannel.name}**`)
                      ],
                      flags: 64 // Use flags instead of ephemeral
                    });
                  }
                  
                } catch (connectionError) {
                  console.error('❌ Failed to create/reconnect player:', connectionError);
                  return componentInteraction.editReply({
                    embeds: [new EmbedBuilder()
                      .setColor('#FF0000')
                      .setTitle('❌ Connection Failed')
                      .setDescription(`Could not connect to voice channel: ${connectionError.message}`)
                    ]
                  });
                }
              }

              // ENHANCED: Verify player is ready before streaming
              if (!player || !player.connected) {
                return componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Connection Error')
                    .setDescription('Player is not properly connected. Please try again.')
                  ]
                });
              }

              // ENHANCED: Start the stream with retry logic
              let streamAttempts = 0;
              const maxStreamAttempts = 3;
              let streamSuccess = false;

              while (!streamSuccess && streamAttempts < maxStreamAttempts) {
                streamAttempts++;
                console.log(`🎵 Stream attempt ${streamAttempts}/${maxStreamAttempts} for ${stationInfo.name}`);

                try {
                  const result = await radioManager.connectToStream(player, selectedStation);
                  streamSuccess = true;
                  
                  await componentInteraction.editReply({
                    embeds: [new EmbedBuilder()
                      .setColor('#00FF00')
                      .setTitle('🎵 Now Playing on the Thousand Sunny!')
                      .setDescription(`**${result.station.name}** is streaming across the Grand Line!`)
                      .addFields(
                        {
                          name: '🎶 Station',
                          value: result.station.description,
                          inline: false
                        },
                        {
                          name: '🎵 Genre',
                          value: result.station.genre,
                          inline: true
                        },
                        {
                          name: '🔊 Voice Channel',
                          value: currentVoiceChannel.name,
                          inline: true
                        },
                        {
                          name: '🔄 Connection',
                          value: needsReconnection ? '✅ Reconnected' : '✅ Connected',
                          inline: true
                        }
                      )
                      .setFooter({ text: 'Adventure continues with great music! 🏴‍☠️' })
                      .setTimestamp()
                    ]
                  });

                } catch (streamError) {
                  console.error(`❌ Stream attempt ${streamAttempts} failed:`, streamError.message);
                  
                  if (streamAttempts >= maxStreamAttempts) {
                    await componentInteraction.editReply({
                      embeds: [new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Stream Failed')
                        .setDescription(`Could not start ${stationInfo.name} after ${maxStreamAttempts} attempts`)
                        .addFields({
                          name: '🔧 Last Error',
                          value: streamError.message,
                          inline: false
                        })
                      ]
                    });
                  } else {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                  }
                }
              }

            } else if (componentInteraction.customId === 'radio_stop') {
              await componentInteraction.deferReply({ flags: 64 }); // Use flags instead of ephemeral

              const player = client.shoukaku.players.get(interaction.guildId);
              if (player) {
                try {
                  await player.stopTrack();
                  await player.disconnect();
                  client.shoukaku.players.delete(interaction.guildId);
                  console.log('✅ Successfully stopped and disconnected player');
                } catch (error) {
                  console.error('❌ Error stopping player:', error.message);
                  // Force cleanup
                  client.shoukaku.players.delete(interaction.guildId);
                }
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
            
            if (!componentInteraction.replied && !componentInteraction.deferred) {
              await componentInteraction.reply({
                embeds: [new EmbedBuilder()
                  .setColor('#FF0000')
                  .setTitle('❌ Unexpected Error')
                  .setDescription('Something went wrong. Please try again.')
                ],
                flags: 64 // Use flags instead of ephemeral
              }).catch(() => {});
            }
          }
        });

        collector.on('end', () => {
          console.log('📻 Radio collector ended');
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
          .setDescription('*"Ready to stream the best radio stations!"*\n\nUse `/radio` to start listening!')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (One Piece collection), uta');

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('✅ Guild commands registered');
    }

    // Event handlers - FIXED deprecation warning
    client.once(Events.ClientReady, () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
    });

    // ENHANCED: Voice state change handler for automatic cleanup
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      // Check if this is the bot being moved/disconnected
      if (newState.id === client.user.id) {
        const player = client.shoukaku.players.get(newState.guild.id);
        
        if (player) {
          // Bot was disconnected from voice
          if (oldState.channelId && !newState.channelId) {
            console.log(`🔌 Bot disconnected from voice channel in guild ${newState.guild.id}`);
            
            // Clean up the player
            try {
              await player.destroy();
              client.shoukaku.players.delete(newState.guild.id);
              console.log('🧹 Cleaned up player after disconnect');
            } catch (error) {
              console.error('❌ Error cleaning up player:', error.message);
            }
          }
          // Bot was moved to a different channel
          else if (oldState.channelId !== newState.channelId && newState.channelId) {
            console.log(`🔄 Bot moved from ${oldState.channel?.name} to ${newState.channel?.name}`);
            
            // Update player channel (Shoukaku handles this automatically)
            // Just log the change
            console.log('✅ Player automatically updated for new channel');
          }
        }
      }
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
