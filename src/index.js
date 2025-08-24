import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - World\'s Greatest Diva Edition');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

console.log(`🔊 Default volume set to: ${DEFAULT_VOLUME}%`);

// RADIO_STATIONS defined inline to avoid import issues
const RADIO_STATIONS = {
  'lofi_girl': { 
    name: 'Lofi Girl - Study Beats', 
    description: 'The legendary 24/7 lofi hip hop beats to relax/study to',
    url: 'https://streams.ilovemusic.de/iloveradio17.mp3',
    fallback: 'http://streaming.radionomy.com/LoFi-Hip-Hop',
    genre: 'Lo-Fi',
    quality: 'Premium'
  },
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
  'z100_nyc': {
    name: 'Z100 New York',
    description: 'NYC\'s #1 hit music station - Pop, dance, and chart toppers',
    url: 'https://n35a-e2.revma.ihrhls.com/zc181',
    fallback: 'http://playerservices.streamtheworld.com/api/livestream-redirect/Z100AAC.aac',
    genre: 'Pop Hits',
    quality: 'High'
  },
  'somafm_groovesalad': {
    name: 'SomaFM Groove Salad',
    description: 'Ambient downtempo with electronic elements',
    url: 'http://ice1.somafm.com/groovesalad-256-mp3',
    fallback: 'http://ice2.somafm.com/groovesalad-256-mp3',
    genre: 'Ambient Electronic',
    quality: 'High'
  },
  'somafm_dronezone': {
    name: 'SomaFM Drone Zone',
    description: 'Deep ambient electronic soundscapes',
    url: 'http://ice1.somafm.com/dronezone-256-mp3',
    fallback: 'http://ice2.somafm.com/dronezone-256-mp3',
    genre: 'Ambient',
    quality: 'High'
  },
  'somafm_beatblender': {
    name: 'SomaFM Beat Blender',
    description: 'Downtempo, trip-hop, and electronic beats',
    url: 'http://ice1.somafm.com/beatblender-128-mp3',
    fallback: 'http://ice2.somafm.com/beatblender-128-mp3',
    genre: 'Electronic Beats',
    quality: 'High'
  },
  'iloveradio_dance': {
    name: 'ILoveRadio Dance',
    description: 'Dance hits and electronic music',
    url: 'https://streams.ilovemusic.de/iloveradio2.mp3',
    fallback: 'https://streams.ilovemusic.de/iloveradio2.aac',
    genre: 'Dance',
    quality: 'High'
  },
  'hiphop_nation': {
    name: 'Hip-Hop Nation',
    description: 'Latest hip-hop and rap hits with powerful beats',
    url: 'http://streaming.radionomy.com/Hip-Hop-Nation',
    fallback: 'http://streaming.radionomy.com/Rap-And-RnB-Hits',
    genre: 'Hip-Hop',
    quality: 'High'
  },
  'rock_antenne': {
    name: 'Rock Antenne',
    description: 'German rock station with powerful guitars',
    url: 'http://mp3channels.webradio.antenne.de/rockantenne',
    fallback: 'http://mp3channels.webradio.antenne.de/rockantenne-heavy-metal',
    genre: 'Rock',
    quality: 'High'
  }
};

console.log(`📻 Loaded ${Object.keys(RADIO_STATIONS).length} radio stations`);

// Health server - MUST start first and stay simple
const server = http.createServer((req, res) => {
  console.log(`📡 Health check: ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      defaultVolume: DEFAULT_VOLUME,
      version: '2.0.2'
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta\'s Music Studio is online! 🎤✨');
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
    stations: ['somafm_beatblender', 'somafm_groovesalad', 'iloveradio_dance']
  },
  'chill_ambient': {
    name: '🌸 Chill & Ambient',
    description: 'Relaxing sounds for Uta\'s softer moments',
    stations: ['somafm_dronezone', 'lofi_girl']
  },
  'anime_jpop': {
    name: '🎌 Anime & J-Pop',
    description: 'Japanese music that Uta would love',
    stations: ['listen_moe_jpop', 'listen_moe_kpop']
  },
  'rock_alternative': {
    name: '🎸 Rock & Alternative',
    description: 'Rock music for Uta\'s powerful performances',
    stations: ['rock_antenne']
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

// Global variables
global.discordReady = false;
global.lavalinkReady = false;

// Start Discord bot
async function startDiscordBot() {
  try {
    console.log('🤖 Starting Discord bot...');
    
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing required environment variables');
      return;
    }

    // Dynamic imports
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
      intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages
      ]
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
        resumeKey: 'uta-bot-persistent-radio',
        resumeTimeout: 60,
        reconnectTries: 10,
        reconnectInterval: 5000,
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
    let persistentMessage = null;

    // Persistent Radio Functions - Uta themed but simple
    async function createPersistentRadioEmbed() {
      return new EmbedBuilder()
        .setColor('#FF6B9D')
        .setTitle('🎤 Uta\'s Concert Hall')
        .setDescription('*"Welcome to my world! I\'m here to sing beautiful music for everyone!"*\n\n🎵 Choose a music style and let me perform for you!')
        .addFields(
          {
            name: '🎶 Music Styles Available',
            value: Object.values(RADIO_CATEGORIES).map(cat => 
              `${cat.name} - ${cat.description}`
            ).join('\n'),
            inline: false
          },
          {
            name: '✨ How to Request',
            value: '1️⃣ Pick a **music style**\n2️⃣ Choose your **station**\n3️⃣ Press **▶️ Play**\n4️⃣ Use **⏸️ Stop** when done',
            inline: false
          }
        )
        .setFooter({ 
          text: 'Uta\'s Concert Hall • World\'s Greatest Diva ✨',
          iconURL: client.user?.displayAvatarURL() 
        })
        .setTimestamp();
    }

    async function createPersistentRadioComponents() {
      const categorySelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_category_select')
        .setPlaceholder('🎵 What music style would you like?')
        .addOptions(
          Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
            label: category.name,
            description: category.description,
            value: key
          }))
        );

      const stationSelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_station_select')
        .setPlaceholder('🎤 Choose a music style first...')
        .addOptions([{
          label: 'Select music style above',
          description: 'Pick from the menu above',
          value: 'placeholder'
        }])
        .setDisabled(true);

      const playButton = new ButtonBuilder()
        .setCustomId('persistent_play')
        .setLabel('▶️ Play')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎤');

      const stopButton = new ButtonBuilder()
        .setCustomId('persistent_stop')
        .setLabel('⏸️ Stop')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('✨');

      const statusButton = new ButtonBuilder()
        .setCustomId('persistent_status')
        .setLabel('📊 Status')
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
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
        if (!channel) {
          console.error(`❌ Radio channel not found: ${RADIO_CHANNEL_ID}`);
          return;
        }

        console.log(`🎵 Initializing radio in #${channel.name}`);

        // Clear messages
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          if (messages.size > 0) {
            await channel.bulkDelete(messages);
          }
        } catch (error) {
          console.warn(`⚠️ Could not clear channel: ${error.message}`);
        }

        // Create embed
        const embed = await createPersistentRadioEmbed();
        const components = await createPersistentRadioComponents();

        persistentMessage = await channel.send({
          embeds: [embed],
          components: components
        });

        console.log(`✅ Persistent radio created: ${persistentMessage.id}`);

      } catch (error) {
        console.error(`❌ Failed to initialize radio: ${error.message}`);
      }
    }

    // Commands
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎤 Visit Uta\'s Concert Hall'),
      
      async execute(interaction) {
        await interaction.reply({
          content: `🎤 *"Come visit my concert hall!"*\n\nI'm waiting for you at <#${RADIO_CHANNEL_ID}> to sing beautiful music together! ✨`,
          ephemeral: true
        });
      }
    };

    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('💕 About Uta, the world\'s greatest diva'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Hi! I\'m Uta!')
          .setDescription(`*"I want to make everyone happy through music!"*\n\n**Visit my concert hall: <#${RADIO_CHANNEL_ID}>**`)
          .addFields(
            {
              name: '✨ About Me',
              value: `🌟 World's beloved diva\n🎭 Daughter of Red-Haired Shanks\n🎵 Uta Uta no Mi user\n💕 Voice that touches hearts`,
              inline: false
            },
            {
              name: '🎵 My Concert Hall',
              value: `• ${Object.keys(RADIO_CATEGORIES).length} music styles\n• ${Object.keys(RADIO_STATIONS).length} radio stations\n• Beautiful performances just for you!`,
              inline: false
            }
          )
          .setFooter({ text: 'With love, Uta ♪ Let\'s make music together! 💕' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    // Interaction handler
    async function handlePersistentInteraction(interaction) {
      try {
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
                description: station.description,
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
            content: `🎵 *"${station.name} ready!"*`,
            ephemeral: true
          });

          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {}
          }, 3000);

        } else if (interaction.customId === 'persistent_play') {
          const selectedStation = interaction.message._selectedStation;
          if (!selectedStation) {
            return interaction.reply({
              content: '*"Please choose a song first!"* 💕',
              ephemeral: true
            });
          }

          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) {
            return interaction.reply({
              content: '*"Join a voice channel so I can sing for you!"* 🎤',
              ephemeral: true
            });
          }

          if (!client.shoukaku || !global.lavalinkReady) {
            return interaction.reply({
              content: '*"My voice isn\'t ready yet..."* ✨',
              ephemeral: true
            });
          }

          await interaction.reply({
            content: '*"Starting my performance!"*',
            ephemeral: true
          });

          try {
            let player = client.shoukaku.players.get(interaction.guildId);
            
            // If player exists, check if it's still connected properly
            if (player) {
              console.log('🔍 Existing player found, checking connection...');
              const currentVC = interaction.guild.channels.cache.get(player.voiceId);
              const botInChannel = currentVC?.members.has(client.user.id);
              
              console.log(`Player voice channel: ${currentVC?.name || 'Unknown'}`);
              console.log(`Bot in channel: ${botInChannel}`);
              console.log(`Requested channel: ${voiceChannel.name}`);
              
              // If player is in wrong channel or disconnected, clean it up
              if (!currentVC || !botInChannel || currentVC.id !== voiceChannel.id) {
                console.log('🧹 Cleaning up stale player...');
                try {
                  await player.destroy();
                } catch (destroyError) {
                  console.warn('⚠️ Error destroying player:', destroyError.message);
                }
                client.shoukaku.players.delete(interaction.guildId);
                player = null;
              }
            }
            
            // Create new player if needed
            if (!player) {
              console.log(`🔊 Creating new voice connection to: ${voiceChannel.name}`);
              
              // Check permissions
              const permissions = voiceChannel.permissionsFor(client.user);
              if (!permissions.has(['Connect', 'Speak'])) {
                throw new Error('Missing permissions for voice channel');
              }
              
              player = await client.shoukaku.joinVoiceChannel({
                guildId: interaction.guildId,
                channelId: voiceChannel.id,
                shardId: interaction.guild.shardId
              });
              
              console.log('✅ New voice connection created');
              await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
              console.log('✅ Using existing player');
            }
            
            await player.setGlobalVolume(DEFAULT_VOLUME);
            console.log(`🔊 Volume set to ${DEFAULT_VOLUME}%`);
            
            await radioManager.connectToStream(player, selectedStation);
            const station = RADIO_STATIONS[selectedStation];

            await interaction.editReply({
              content: `🎤 *"Now singing ${station.name}!"* (${DEFAULT_VOLUME}%)`
            });

            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 4000);

          } catch (error) {
            console.error('❌ Play failed:', error);
            await interaction.editReply({
              content: `*"Something went wrong... ${error.message}"*`
            });
            
            // Auto-delete error after 5 seconds
            setTimeout(async () => {
              try {
                await interaction.deleteReply();
              } catch (err) {}
            }, 5000);
          }

        } else if (interaction.customId === 'persistent_stop') {
          const player = client.shoukaku.players.get(interaction.guildId);
          
          await interaction.reply({
            content: '*"Thank you for listening!"* 🎭',
            ephemeral: true
          });

          if (player) {
            try {
              await player.stopTrack();
              await player.destroy();
              client.shoukaku.players.delete(interaction.guildId);
            } catch (error) {
              client.shoukaku.players.delete(interaction.guildId);
            }
          }

          setTimeout(async () => {
            try {
              await interaction.deleteReply();
            } catch (err) {}
          }, 3000);

        } else if (interaction.customId === 'persistent_status') {
          const player = client.shoukaku.players.get(interaction.guildId);

          await interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF6B9D')
              .setTitle('🌟 Uta\'s Status')
              .addFields(
                {
                  name: '🎤 Current Performance',
                  value: player ? 
                    `🎵 Singing in ${interaction.guild.channels.cache.get(player.voiceId)?.name}\n🔊 Volume: ${DEFAULT_VOLUME}%` : 
                    '✨ Ready to sing!',
                  inline: false
                },
                {
                  name: '💖 System Status',
                  value: `Discord: ${global.discordReady ? '✅ Ready' : '❌ Loading'}\nAudio: ${global.lavalinkReady ? '✅ Ready' : '❌ Loading'}`,
                  inline: false
                }
              )
              .setTimestamp()
            ],
            ephemeral: true
          });
        }

      } catch (error) {
        console.error('❌ Interaction error:', error);
      }
    }

    // Register commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    try {
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Commands registered');
      }
    } catch (error) {
      console.error('❌ Command registration failed:', error.message);
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready: ${client.user.tag}`);
      global.discordReady = true;
      
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

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}

// Start the bot
setTimeout(() => {
  startDiscordBot();
}, 2000);

console.log('🎤 Uta DJ Bot initialization started');
