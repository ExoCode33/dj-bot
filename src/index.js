import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - HARD BASS EDITION WITH PERSISTENT RADIO');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";

// Health server - MUST start first
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      radioChannel: RADIO_CHANNEL_ID,
      version: '2.0.0'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta DJ Bot with Persistent Radio is running! 🔊💀');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
  console.log(`🔗 Health check: http://0.0.0.0:${port}/health`);
});

// Error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Radio Categories for organized selection
const RADIO_CATEGORIES = {
  'hard_bass': {
    name: '💀 HARD BASS & DROPS',
    description: 'BRUTAL drops and CRUSHING bass',
    stations: ['iloveradio_hardstyle', 'bass_radio_1', 'dubstep_beyond', 'hardstyle_fm', 'electronic_pioneer']
  },
  'electronic': {
    name: '⚡ ELECTRONIC & TECHNO',
    description: 'Electronic beats and techno vibes',
    stations: ['somafm_beatblender', 'somafm_groovesalad', 'bigfm_electro', 'iloveradio_dance', 'iloveradio_clubsounds']
  },
  'ambient_chill': {
    name: '🌙 AMBIENT & CHILL',
    description: 'Relaxing and atmospheric sounds',
    stations: ['somafm_dronezone', 'somafm_deepspaceone', 'lofi_girl', 'poolsuite_fm']
  },
  'anime_jpop': {
    name: '🎌 ANIME & J-POP',
    description: 'Japanese music and anime soundtracks',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  },
  'hits_popular': {
    name: '🎵 HITS & POPULAR',
    description: 'Chart toppers and popular music',
    stations: ['z100_nyc', 'hiphop_nation', 'rock_antenne']
  }
};

// Simple Radio Manager
class SimpleRadioManager {
  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) throw new Error('Station not found');

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
    const urlsToTry = [station.url];
    if (station.fallback) urlsToTry.push(station.fallback);
    
    for (const url of urlsToTry) {
      try {
        console.log(`🔄 Trying URL: ${url}`);
        const result = await player.node.rest.resolve(url);
        
        if (result.loadType === 'track' && result.data) {
          await player.playTrack({ track: { encoded: result.data.encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({ track: { encoded: result.tracks[0].encoded } });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return { success: true, station, url };
        }
      } catch (error) {
        console.error(`❌ URL failed: ${url} - ${error.message}`);
      }
    }
    
    throw new Error(`All stream URLs failed for ${station.name}`);
  }
}

// Global variables for initialization state
global.discordReady = false;
global.lavalinkReady = false;

// Start Discord bot safely
async function startDiscordBot() {
  try {
    console.log('🤖 Starting Discord bot initialization...');
    
    // Check required environment variables
    if (!process.env.DISCORD_TOKEN) {
      console.error('❌ DISCORD_TOKEN is required!');
      return;
    }
    if (!process.env.CLIENT_ID) {
      console.error('❌ CLIENT_ID is required!');
      return;
    }

    console.log('🔄 Loading Discord.js and Shoukaku...');
    
    // Dynamic imports
    const discord = await import('discord.js');
    const shoukaku = await import('shoukaku');
    
    console.log('✅ Libraries loaded successfully');

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
    
    // Create Discord client
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages
      ]
    });

    client.commands = new Collection();

    // Setup Lavalink if configured
    if (process.env.LAVALINK_URL) {
      console.log('🎵 Setting up Lavalink connection...');
      
      const nodes = [{
        name: process.env.LAVALINK_NAME || 'railway-node',
        url: process.env.LAVALINK_URL,
        auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
        secure: process.env.LAVALINK_SECURE === 'true'
      }];

      client.shoukaku = new shoukaku.Shoukaku(new shoukaku.Connectors.DiscordJS(client), nodes, {
        resume: true,
        resumeKey: 'uta-bot-persistent-radio',
        resumeTimeout: 60,
        reconnectTries: 10,
        reconnectInterval: 5000,
        restTimeout: 60000
      });

      client.shoukaku.on('ready', (name) => {
        console.log(`✅ Lavalink "${name}" ready and operational`);
        global.lavalinkReady = true;
      });

      client.shoukaku.on('error', (name, error) => {
        console.error(`❌ Lavalink "${name}" error:`, error.message);
        global.lavalinkReady = false;
      });

      client.shoukaku.on('disconnect', (name, reason) => {
        console.warn(`⚠️ Lavalink "${name}" disconnected: ${reason}`);
        global.lavalinkReady = false;
      });

      console.log('✅ Lavalink configured');
    } else {
      console.warn('⚠️ No Lavalink URL provided - music features disabled');
    }

    // Initialize radio manager
    const radioManager = new SimpleRadioManager();
    let persistentMessage = null;

    // Persistent Radio Functions
    async function createPersistentRadioEmbed() {
      return new EmbedBuilder()
        .setColor('#FF0040')
        .setTitle('🔊 UTA\'S PERSISTENT BASS RADIO STATION')
        .setDescription('💀 *"24/7 HARD BASS DROPS - Always ready to DESTROY your speakers!"* 🔊\n\n**Choose a category, then select your station for MAXIMUM BASS!**')
        .addFields(
          {
            name: '💀 AVAILABLE CATEGORIES',
            value: Object.values(RADIO_CATEGORIES).map(cat => 
              `${cat.name} - ${cat.description}`
            ).join('\n'),
            inline: false
          },
          {
            name: '🎵 HOW TO USE',
            value: '1️⃣ Select a **category** from the first dropdown\n2️⃣ Choose your **station** from the second dropdown\n3️⃣ Hit **▶️ PLAY** to start the BASS DROP!\n4️⃣ Use **⏹️ STOP** to end the session',
            inline: false
          },
          {
            name: '⚠️ BASS WARNING',
            value: '🔊 **HIGH VOLUME** optimized for bass heads\n💀 **SPEAKER DAMAGE** possible at maximum settings\n⚡ **BRUTAL DROPS** that will shake your house',
            inline: false
          }
        )
        .setFooter({ 
          text: 'UTA\'S ETERNAL BASS STATION • Always On • Always HARD 💀🔊',
          iconURL: client.user?.displayAvatarURL() 
        })
        .setTimestamp();
    }

    async function createPersistentRadioComponents() {
      // Category selector
      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_category_select')
        .setPlaceholder('🎯 Select a BASS category...')
        .addOptions(
          Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
            label: category.name,
            description: category.description,
            value: key,
            emoji: category.name.split(' ')[0]
          }))
        );

      // Station selector (initially disabled)
      const stationSelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_station_select')
        .setPlaceholder('🎵 First select a category above...')
        .addOptions([{
          label: 'Please select a category first',
          description: 'Choose from the dropdown above',
          value: 'placeholder'
        }])
        .setDisabled(true);

      // Control buttons
      const playButton = new ButtonBuilder()
        .setCustomId('persistent_play')
        .setLabel('▶️ BASS DROP')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔊');

      const stopButton = new ButtonBuilder()
        .setCustomId('persistent_stop')
        .setLabel('⏹️ STOP BASS')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛑');

      const statusButton = new ButtonBuilder()
        .setCustomId('persistent_status')
        .setLabel('📊 STATUS')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📡');

      return [
        new ActionRowBuilder().addComponents(categorySelect),
        new ActionRowBuilder().addComponents(stationSelect),
        new ActionRowBuilder().addComponents(playButton, stopButton, statusButton)
      ];
    }

    async function initializePersistentRadio() {
      try {
        console.log(`🎵 Initializing persistent radio in channel ${RADIO_CHANNEL_ID}...`);
        
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID).catch(err => {
          console.error(`❌ Could not fetch radio channel: ${err.message}`);
          return null;
        });
        
        if (!channel) {
          console.error(`❌ Radio channel ${RADIO_CHANNEL_ID} not found!`);
          return;
        }

        console.log(`🎵 Found radio channel: #${channel.name}`);

        // Clear existing messages
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          if (messages.size > 0) {
            console.log(`🧹 Deleting ${messages.size} existing messages from radio channel`);
            await channel.bulkDelete(messages).catch(err => {
              console.warn(`⚠️ Could not bulk delete: ${err.message}`);
            });
          }
        } catch (error) {
          console.warn(`⚠️ Could not clear radio channel: ${error.message}`);
        }

        // Create the persistent radio embed
        const embed = await createPersistentRadioEmbed();
        const components = await createPersistentRadioComponents();

        persistentMessage = await channel.send({
          embeds: [embed],
          components: components
        });

        console.log(`✅ Persistent radio embed created with ID: ${persistentMessage.id}`);

      } catch (error) {
        console.error(`❌ Failed to initialize persistent radio: ${error.message}`);
        console.error('Stack:', error.stack);
      }
    }

    // Setup commands
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🔊 Stream HARD BASS DROP music'),
      
      async execute(interaction) {
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('🔊 UTA\'S RADIO COMMAND')
            .setDescription(`💀 **Persistent Radio Available!**\n\nCheck out <#${RADIO_CHANNEL_ID}> for the **24/7 BASS STATION** with persistent controls!\n\n*This command redirects you to the persistent radio interface.*`)
            .addFields({
              name: '🎵 Persistent Radio Benefits',
              value: '• Always available\n• No command cooldowns\n• Better station organization\n• Easier to use',
              inline: false
            })
          ],
          ephemeral: true
        });
      }
    };

    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('💀 Uta\'s HARD BASS music info'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF0040')
          .setTitle('💀 UTA\'S BASS STUDIO - HARD DROPS ONLY')
          .setDescription(`*"Ready to ANNIHILATE your ears with the HARDEST bass drops!"* 🔊\n\n**🎵 Persistent Radio Station: <#${RADIO_CHANNEL_ID}>**`)
          .addFields(
            {
              name: '💀 PERSISTENT BASS STATION',
              value: `Visit <#${RADIO_CHANNEL_ID}> for:\n• 24/7 availability\n• ${Object.keys(RADIO_CATEGORIES).length} categories\n• ${Object.keys(RADIO_STATIONS).length} BASS stations\n• Easy dropdown controls`,
              inline: false
            },
            {
              name: '🔊 BASS CATEGORIES',
              value: Object.values(RADIO_CATEGORIES).map(cat => 
                cat.name.replace(/💀|⚡|🌙|🎌|🎵/g, '').trim()
              ).join(' • '),
              inline: false
            },
            {
              name: '💀 UTA\'S BASS PROMISE',
              value: '• 🔊 **MAXIMUM BASS** that will shake your house\n• ⚡ **CRUSHING DROPS** and BRUTAL beats\n• 💀 **HIGH VOLUME** optimized for BASS HEADS\n• 🎭 **SPEAKER DESTRUCTION** is guaranteed',
              inline: false
            }
          )
          .setFooter({ text: 'BASS QUEEN ready to DESTROY! 💀🔊' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio, uta');

    // Persistent radio interaction handler
    async function handlePersistentInteraction(interaction) {
      try {
        // Only handle interactions from the persistent radio message
        if (!persistentMessage || interaction.message?.id !== persistentMessage.id) return;
        
        if (interaction.customId === 'persistent_category_select') {
          const selectedCategory = interaction.values[0];
          const category = RADIO_CATEGORIES[selectedCategory];
          
          const stationOptions = category.stations
            .filter(stationKey => RADIO_STATIONS[stationKey])
            .map(stationKey => {
              const station = RADIO_STATIONS[stationKey];
              return {
                label: station.name,
                description: `${station.description} (${station.genre})`,
                value: stationKey
              };
            });

          const newStationSelect = new StringSelectMenuBuilder()
            .setCustomId('persistent_station_select')
            .setPlaceholder(`🎵 Choose from ${category.name}...`)
            .addOptions(stationOptions)
            .setDisabled(false);

          const components = interaction.message.components.map((row, index) => {
            if (index === 1) {
              return new ActionRowBuilder().addComponents(newStationSelect);
            }
            return ActionRowBuilder.from(row);
          });

          await interaction.update({ components });
          interaction.message._selectedCategory = selectedCategory;

        } else if (interaction.customId === 'persistent_station_select') {
          const selectedStation = interaction.values[0];
          const station = RADIO_STATIONS[selectedStation];
          
          interaction.message._selectedStation = selectedStation;
          
          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#00FF94')
              .setTitle('🎵 Station Selected!')
              .setDescription(`**${station.name}** is ready to drop BASS!\n\n*${station.description}*\n\n➡️ **Click "▶️ BASS DROP" to start the mayhem!**`)
              .addFields({
                name: '🎶 Genre',
                value: station.genre,
                inline: true
              })
            ],
            ephemeral: true
          });

        } else if (interaction.customId === 'persistent_play') {
          const selectedStation = interaction.message._selectedStation;
          if (!selectedStation) {
            return interaction.reply({
              content: '❌ Please select a station first using the dropdowns above!',
              ephemeral: true
            });
          }

          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) {
            return interaction.reply({
              content: '❌ You need to be in a voice channel to experience the BASS DROP! 🔊',
              ephemeral: true
            });
          }

          if (!client.shoukaku || !global.lavalinkReady) {
            return interaction.reply({
              content: '❌ Music service is offline. Try again in a moment!',
              ephemeral: true
            });
          }

          await interaction.deferReply({ ephemeral: true });

          try {
            // Check for existing player and clean up if needed
            let player = client.shoukaku.players.get(interaction.guildId);
            
            if (player) {
              const currentVoiceChannel = interaction.guild.channels.cache.get(player.voiceId);
              if (!currentVoiceChannel || !currentVoiceChannel.members.has(client.user.id)) {
                console.log('🧹 Cleaning up disconnected player...');
                await player.destroy().catch(() => {});
                client.shoukaku.players.delete(interaction.guildId);
                player = null;
              }
            }
            
            if (!player) {
              console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
              
              const permissions = voiceChannel.permissionsFor(client.user);
              if (!permissions.has(['Connect', 'Speak'])) {
                throw new Error('Missing Connect/Speak permissions for voice channel');
              }
              
              player = await client.shoukaku.joinVoiceChannel({
                guildId: interaction.guildId,
                channelId: voiceChannel.id,
                shardId: interaction.guild.shardId
              });
              
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('✅ Voice connection established');
            }
            
            await player.setGlobalVolume(85);

            await radioManager.connectToStream(player, selectedStation);
            const station = RADIO_STATIONS[selectedStation];

            await interaction.editReply({
              embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🔊 BASS DROP INITIATED!')
                .setDescription(`💀 **${station.name}** is now DESTROYING speakers in **${voiceChannel.name}**!`)
                .addFields(
                  {
                    name: '🎵 Now Playing',
                    value: `**${station.name}**\n*${station.description}*`,
                    inline: false
                  },
                  {
                    name: '🔊 Bass Level',
                    value: '**MAXIMUM DESTRUCTION** (Volume: 85%)',
                    inline: true
                  }
                )
                .setFooter({ text: 'BASS DROP SUCCESSFUL • Speakers may not survive 💀🔊' })
              ]
            });

          } catch (error) {
            console.error(`❌ Persistent play failed:`, error);
            await interaction.editReply({
              content: `❌ Failed to start BASS DROP: ${error.message}`,
            });
          }

        } else if (interaction.customId === 'persistent_stop') {
          await interaction.deferReply({ ephemeral: true });

          const player = client.shoukaku.players.get(interaction.guildId);
          if (player) {
            try {
              await player.stopTrack();
              await player.destroy();
              client.shoukaku.players.delete(interaction.guildId);
            } catch (error) {
              console.error('⚠️ Error during player cleanup:', error.message);
              client.shoukaku.players.delete(interaction.guildId);
            }
          }

          await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('🛑 BASS SYSTEM SHUTDOWN!')
              .setDescription('Uta has stopped the BASS DROP and your speakers are safe... for now! 💀')
              .setFooter({ text: 'Until the next BASS DROP! 💀🔊' })
            ]
          });

        } else if (interaction.customId === 'persistent_status') {
          const player = client.shoukaku.players.get(interaction.guildId);
          const nodes = Array.from(client.shoukaku.nodes.values());
          const connectedNodes = nodes.filter(node => node.state === 2);

          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#0099FF')
              .setTitle('📊 UTA BASS SYSTEM STATUS')
              .addFields(
                {
                  name: '🎵 Music Player',
                  value: player ? 
                    `✅ **ACTIVE** in ${interaction.guild.channels.cache.get(player.voiceId)?.name || 'Unknown Channel'}\n🔊 Volume: ${player.volume || 'Unknown'}%\n▶️ Playing: ${player.playing ? 'Yes' : 'No'}` : 
                    '❌ **OFFLINE** - No active session',
                  inline: false
                },
                {
                  name: '📡 Lavalink Nodes',
                  value: `${connectedNodes.length}/${nodes.length} nodes online\n${connectedNodes.map(n => `✅ ${n.name}`).join('\n') || '❌ No nodes connected'}`,
                  inline: false
                },
                {
                  name: '⚡ System Health',
                  value: [
                    `Discord: ${global.discordReady ? '✅ Ready' : '❌ Not Ready'}`,
                    `Lavalink: ${global.lavalinkReady ? '✅ Connected' : '❌ Disconnected'}`,
                    `Uptime: ${Math.floor(process.uptime())} seconds`
                  ].join('\n'),
                  inline: false
                }
              )
              .setTimestamp()
            ],
            ephemeral: true
          });
        }

      } catch (error) {
        console.error(`❌ Persistent interaction error: ${error.message}`);
        
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true
          }).catch(() => {});
        }
      }
    }

    // Register slash commands
    console.log('🚀 Registering slash commands...');
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    try {
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Guild commands registered');
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Global commands registered');
      }
    } catch (error) {
      console.error('❌ Failed to register commands:', error.message);
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
      
      // Initialize persistent radio after a delay
      setTimeout(() => {
        initializePersistentRadio();
      }, 3000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (command) {
            await command.execute(interaction);
          }
        } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
          await handlePersistentInteraction(interaction);
        }
      } catch (error) {
        console.error('❌ Interaction error:', error.message);
      }
    });

    // Login to Discord
    console.log('🔑 Logging into Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Start the bot after health server is ready
setTimeout(() => {
  startDiscordBot();
}, 2000);

console.log('🔊 PERSISTENT BASS radio bot initialization started');
