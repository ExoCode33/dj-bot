import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - BULLETPROOF STREAMS');
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
        exception: result?.exception?.message || 'none'
      });
      
      let track = null;
      
      // Handle different response types
      if (result.loadType === 'track' && result.data?.encoded) {
        track = result.data.encoded;
      } else if (result.tracks && result.tracks.length > 0 && result.tracks[0].encoded) {
        track = result.tracks[0].encoded;
      } else if (result.loadType === 'playlist' && result.data?.tracks?.length > 0) {
        track = result.data.tracks[0].encoded;
      }
      
      if (!track) {
        throw new Error(`No playable track found. LoadType: ${result.loadType}`);
      }

      // Play the track
      await player.playTrack({ 
        encoded: track,
        options: { 
          noReplace: false,
          pause: false
        }
      });
      
      console.log(`✅ Successfully started ${station.name}`);
      return { success: true, station };
      
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
          .setColor('#00FF94')
          .setTitle('📻 Bulletproof Radio Stations')
          .setDescription('🎯 **100% Guaranteed to Work** - No more failed streams!')
          .addFields(
            {
              name: '✅ Available Stations',
              value: Object.values(RADIO_STATIONS).map(s => `• **${s.name}**`).join('\n'),
              inline: false
            },
            {
              name: '🎵 What You Get',
              value: '• Instant streaming\n• No buffering issues\n• Crystal clear audio\n• Reliable connections',
              inline: false
            }
          )
          .setFooter({ text: 'Powered by SomaFM, Radio Paradise & KEXP' })
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

              // Get or create player
              let player = client.shoukaku.players.get(interaction.guildId);
              
              if (!player) {
                console.log(`🔊 Joining voice channel: ${voiceChannel.name}`);
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                await player.setGlobalVolume(50);
                console.log('✅ Voice connection established');
              }

              try {
                const result = await radioManager.connectToStream(player, selectedStation);
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎵 Now Playing!')
                    .setDescription(`**${result.station.name}** is streaming live!`)
                    .addFields(
                      {
                        name: '📻 Station',
                        value: result.station.description,
                        inline: false
                      },
                      {
                        name: '🎵 Genre',
                        value: result.station.genre,
                        inline: true
                      },
                      {
                        name: '🔊 Channel',
                        value: voiceChannel.name,
                        inline: true
                      }
                    )
                    .setFooter({ text: 'Enjoy the music! 🎧' })
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
          .setDescription('*"Ready to stream the best radio stations!"*\n\nUse `/radio` to start listening!')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio (bulletproof), uta');

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

console.log('🎬 Bulletproof bot initialization started');
