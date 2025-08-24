import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - World\'s Greatest Diva Edition');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

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
    res.end('Uta\'s Music Studio is online! 🎤✨');
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

// Radio Categories - Uta themed
const RADIO_CATEGORIES = {
  'pop_hits': {
    name: '🎤 Pop & Chart Hits',
    description: 'Top hits perfect for Uta\'s performances',
    stations: ['z100_nyc', 'iloveradio_dance', 'hiphop_nation']
  },
  'electronic_dance': {
    name: '🎵 Electronic & Dance',
    description: 'Electronic beats for Uta\'s energetic shows',
    stations: ['somafm_beatblender', 'somafm_groovesalad', 'bigfm_electro', 'iloveradio_clubsounds', 'electronic_pioneer']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for Uta\'s softer moments',
    stations: ['somafm_dronezone', 'somafm_deepspaceone', 'lofi_girl', 'poolsuite_fm']
  },
  'anime_jpop': {
    name: '🎌 Anime & J-Pop',
    description: 'Japanese music that Uta would love',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for Uta\'s powerful performances',
    stations: ['rock_antenne', 'iloveradio_hardstyle', 'bass_radio_1']
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
        .setColor('#FF6B9D')
        .setTitle('🎤 Uta\'s Music Studio')
        .setDescription('*"Welcome to my concert hall! I\'m the world\'s greatest diva, ready to fill this place with beautiful music!"*\n\n✨ Choose a music style and station for Uta to perform!')
        .addFields(
          {
            name: '🎵 Available Music Styles',
            value: Object.values(RADIO_CATEGORIES).map(cat => 
              `${cat.name} - ${cat.description}`
            ).join('\n'),
            inline: false
          },
          {
            name: '🎭 How to Request a Performance',
            value: '1️⃣ Select a **music style** from the first menu\n2️⃣ Choose your **station** from the second menu\n3️⃣ Press **▶️ Play** to start Uta\'s performance\n4️⃣ Use **⏸️ Stop** when the show ends',
            inline: false
          },
          {
            name: '✨ About Uta',
            value: 'The world\'s most beloved diva with the power of the Uta Uta no Mi. Her voice can captivate anyone and create the most beautiful musical experiences!',
            inline: false
          }
        )
        .setFooter({ 
          text: 'Uta\'s Music Studio • World\'s Greatest Diva • Red Hair Pirates Legacy ✨',
          iconURL: client.user?.displayAvatarURL() 
        })
        .setTimestamp();
    }

    async function createPersistentRadioComponents() {
      // Category selector
      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_category_select')
        .setPlaceholder('🎵 Choose a music style for Uta...')
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
        .setPlaceholder('🎤 First select a music style above...')
        .addOptions([{
          label: 'Please select a music style first',
          description: 'Choose from the menu above',
          value: 'placeholder'
        }])
        .setDisabled(true);

      // Control buttons
      const playButton = new ButtonBuilder()
        .setCustomId('persistent_play')
        .setLabel('▶️ Start Performance')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎤');

      const stopButton = new ButtonBuilder()
        .setCustomId('persistent_stop')
        .setLabel('⏸️ End Performance')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✨');

      const statusButton = new ButtonBuilder()
        .setCustomId('persistent_status')
        .setLabel('📊 Studio Status')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎭');

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
        .setDescription('🎤 Access Uta\'s Music Studio'),
      
      async execute(interaction) {
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B9D')
            .setTitle('🎤 Uta\'s Music Studio')
            .setDescription(`*"My music studio is always open for you!"*\n\nVisit <#${RADIO_CHANNEL_ID}> to request performances and enjoy my beautiful music!`)
            .addFields({
              name: '✨ Studio Features',
              value: '• Always available for requests\n• Multiple music styles\n• High-quality audio streaming\n• Easy-to-use controls',
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
        .setDescription('🎭 Learn about Uta, the world\'s greatest diva'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta - World\'s Greatest Diva')
          .setDescription(`*"I want to create a world where everyone can be happy through music!"*\n\n**🎵 Visit Uta\'s Music Studio: <#${RADIO_CHANNEL_ID}>**`)
          .addFields(
            {
              name: '✨ About Uta',
              value: `🎭 Daughter of Red-Haired Shanks\n🎵 User of the Uta Uta no Mi (Song-Song Fruit)\n🌟 Beloved diva known worldwide\n🎤 Voice that can captivate anyone`,
              inline: false
            },
            {
              name: '🎵 Music Studio',
              value: `Visit <#${RADIO_CHANNEL_ID}> for:\n• ${Object.keys(RADIO_CATEGORIES).length} music styles\n• ${Object.keys(RADIO_STATIONS).length} radio stations\n• Beautiful performances by Uta`,
              inline: false
            },
            {
              name: '🎭 Uta\'s Dream',
              value: 'Creating a world where everyone can be happy and united through the power of beautiful music and songs.',
              inline: false
            }
          )
          .setFooter({ text: 'World\'s Greatest Diva • Red Hair Pirates Legacy ✨' })
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
          
          const reply = await interaction.reply({
            content: `🎵 **${station.name}** ready!`,
            ephemeral: true
          });

          // Auto-delete after 3 seconds
          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {
              // Ignore if already deleted
            }
          }, 3000);

        } else if (interaction.customId === 'persistent_play') {
          const selectedStation = interaction.message._selectedStation;
          if (!selectedStation) {
            return interaction.reply({
              content: '❌ Please select a station first!',
              ephemeral: true
            });
          }

          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) {
            return interaction.reply({
              content: '❌ Please join a voice channel so I can perform for you! 🎤',
              ephemeral: true
            });
          }

          if (!client.shoukaku || !global.lavalinkReady) {
            return interaction.reply({
              content: '❌ My sound system isn\'t ready yet. Please try again in a moment!',
              ephemeral: true
            });
          }

          const reply = await interaction.reply({
            content: '🎤 *Starting performance...*',
            ephemeral: true
          });

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
                throw new Error('Missing permissions for voice channel');
              }
              
              player = await client.shoukaku.joinVoiceChannel({
                guildId: interaction.guildId,
                channelId: voiceChannel.id,
                shardId: interaction.guild.shardId
              });
              
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('✅ Voice connection established');
            }
            
            await player.setGlobalVolume(DEFAULT_VOLUME);
            console.log(`🔊 Volume set to ${DEFAULT_VOLUME}%`);

            await radioManager.connectToStream(player, selectedStation);
            const station = RADIO_STATIONS[selectedStation];

            await interaction.editReply({
              content: `🎤 *Now performing ${station.name} at ${DEFAULT_VOLUME}% volume*`
            });

            // Auto-delete after 4 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {
                // Ignore if already deleted
              }
            }, 4000);

          } catch (error) {
            console.error(`❌ Persistent play failed:`, error);
            await interaction.editReply({
              content: `❌ Performance failed: ${error.message}`,
            });

            // Auto-delete error after 5 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {
                // Ignore if already deleted
              }
            }, 5000);
          }

        } else if (interaction.customId === 'persistent_stop') {
          const player = client.shoukaku.players.get(interaction.guildId);
          
          const reply = await interaction.reply({
            content: '🎤 *Performance ended*',
            ephemeral: true
          });

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

          // Auto-delete after 3 seconds
          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {
              // Ignore if already deleted
            }
          }, 3000);

        } else if (interaction.customId === 'persistent_status') {
          const player = client.shoukaku.players.get(interaction.guildId);
          const nodes = Array.from(client.shoukaku.nodes.values());
          const connectedNodes = nodes.filter(node => node.state === 2);

          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF6B9D')
              .setTitle('🎭 Uta\'s Studio Status')
              .addFields(
                {
                  name: '🎤 Current Performance',
                  value: player ? 
                    `🎵 **Active** in ${interaction.guild.channels.cache.get(player.voiceId)?.name || 'Unknown Channel'}\n🔊 Volume: ${DEFAULT_VOLUME}%\n▶️ Playing: ${player.playing ? 'Yes' : 'No'}` : 
                    '✨ **Ready** - No active performance',
                  inline: false
                },
                {
                  name: '🎵 Audio System',
                  value: `${connectedNodes.length}/${nodes.length} audio nodes online\n${connectedNodes.map(n => `✅ ${n.name}`).join('\n') || '❌ No nodes connected'}`,
                  inline: false
                },
                {
                  name: '✨ Studio Health',
                  value: [
                    `Discord: ${global.discordReady ? '✅ Ready' : '❌ Not Ready'}`,
                    `Audio System: ${global.lavalinkReady ? '✅ Connected' : '❌ Disconnected'}`,
                    `Uptime: ${Math.floor(process.uptime())} seconds`
                  ].join('\n'),
                  inline: false
                }
              )
              .setFooter({ text: 'Studio Status • World\'s Greatest Diva ✨' })
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

console.log('🎤 Uta\'s Music Studio initialization started');
) throw new Error('Station not found');

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
