import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - HARD BASS EDITION WITH PERSISTENT RADIO');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";

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
      lavalink: global.lavalinkReady || false,
      radioChannel: RADIO_CHANNEL_ID
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

// Persistent Radio Embed Manager
class PersistentRadioManager {
  constructor(client) {
    this.client = client;
    this.radioChannelId = RADIO_CHANNEL_ID;
    this.persistentMessage = null;
  }

  async initializePersistentRadio() {
    try {
      const channel = await this.client.channels.fetch(this.radioChannelId);
      if (!channel) {
        console.error(`❌ Radio channel ${this.radioChannelId} not found!`);
        return;
      }

      console.log(`🎵 Initializing persistent radio in #${channel.name}`);

      // Clear existing messages in the radio channel
      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
          console.log(`🧹 Deleting ${messages.size} existing messages from radio channel`);
          await channel.bulkDelete(messages);
        }
      } catch (error) {
        console.warn(`⚠️ Could not clear radio channel: ${error.message}`);
      }

      // Create the persistent radio embed
      const embed = await this.createPersistentRadioEmbed();
      const components = await this.createPersistentRadioComponents();

      this.persistentMessage = await channel.send({
        embeds: [embed],
        components: components
      });

      console.log(`✅ Persistent radio embed created with ID: ${this.persistentMessage.id}`);

      // Set up persistent event listener
      this.setupPersistentInteractionHandler();

    } catch (error) {
      console.error(`❌ Failed to initialize persistent radio: ${error.message}`);
    }
  }

  async createPersistentRadioEmbed() {
    const discord = await import('discord.js');
    const { EmbedBuilder } = discord;
    
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
        iconURL: this.client.user?.displayAvatarURL() 
      })
      .setTimestamp();
  }

  async createPersistentRadioComponents() {
    const discord = await import('discord.js');
    const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = discord;

    // Category selector
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_category_select')
      .setPlaceholder('🎯 Select a BASS category...')
      .addOptions(
        Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.name.split(' ')[0] // Get the emoji
        }))
      );

    // Station selector (initially disabled)
    const stationSelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_station_select')
      .setPlaceholder('🎵 First select a category above...')
      .addOptions([
        {
          label: 'Please select a category first',
          description: 'Choose from the dropdown above',
          value: 'placeholder'
        }
      ])
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

  setupPersistentInteractionHandler() {
    this.client.on('interactionCreate', async (interaction) => {
      // Only handle interactions from the persistent radio message
      if (interaction.message?.id !== this.persistentMessage?.id) return;
      
      try {
        await this.handlePersistentInteraction(interaction);
      } catch (error) {
        console.error(`❌ Persistent radio interaction error: ${error.message}`);
        
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true
          }).catch(() => {});
        }
      }
    });
  }

  async handlePersistentInteraction(interaction) {
    const discord = await import('discord.js');
    const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = discord;

    if (interaction.customId === 'persistent_category_select') {
      const selectedCategory = interaction.values[0];
      const category = RADIO_CATEGORIES[selectedCategory];
      
      // Update station selector with category stations
      const stationOptions = category.stations
        .filter(stationKey => RADIO_STATIONS[stationKey]) // Ensure station exists
        .map(stationKey => {
          const station = RADIO_STATIONS[stationKey];
          return {
            label: station.name,
            description: `${station.description} (${station.genre})`,
            value: stationKey
          };
        });

      if (stationOptions.length === 0) {
        return interaction.reply({
          content: `❌ No stations available for ${category.name}`,
          ephemeral: true
        });
      }

      const newStationSelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_station_select')
        .setPlaceholder(`🎵 Choose from ${category.name}...`)
        .addOptions(stationOptions)
        .setDisabled(false);

      // Update the message with new station options
      const components = interaction.message.components.map((row, index) => {
        if (index === 1) { // Station selector row
          return new ActionRowBuilder().addComponents(newStationSelect);
        }
        return ActionRowBuilder.from(row);
      });

      await interaction.update({ components });

      // Store selected category for later use
      interaction.message._selectedCategory = selectedCategory;

    } else if (interaction.customId === 'persistent_station_select') {
      const selectedStation = interaction.values[0];
      const station = RADIO_STATIONS[selectedStation];
      
      // Store selected station for play button
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
      await this.handlePersistentPlay(interaction);

    } else if (interaction.customId === 'persistent_stop') {
      await this.handlePersistentStop(interaction);

    } else if (interaction.customId === 'persistent_status') {
      await this.handlePersistentStatus(interaction);
    }
  }

  async handlePersistentPlay(interaction) {
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

    if (!this.client.shoukaku || !global.lavalinkReady) {
      return interaction.reply({
        content: '❌ Music service is offline. Try again in a moment!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Get or create player
      let player = this.client.shoukaku.players.get(interaction.guildId);
      
      if (!player) {
        console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
        
        player = await this.client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await player.setGlobalVolume(85); // High volume for BASS
      }

      const radioManager = new SimpleRadioManager();
      const result = await radioManager.connectToStream(player, selectedStation);
      const station = RADIO_STATIONS[selectedStation];

      await interaction.editReply({
        embeds: [new (require('discord.js')).EmbedBuilder()
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
            },
            {
              name: '📡 Stream Quality',
              value: station.quality || 'High',
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
  }

  async handlePersistentStop(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const player = this.client.shoukaku.players.get(interaction.guildId);
    if (player) {
      try {
        console.log('🛑 Stopping player and cleaning up...');
        await player.stopTrack();
        await player.destroy();
        this.client.shoukaku.players.delete(interaction.guildId);
        console.log('✅ Player cleanup completed');
      } catch (error) {
        console.error('⚠️ Error during player cleanup:', error.message);
        // Force remove from players map even if destroy fails
        this.client.shoukaku.players.delete(interaction.guildId);
      }
    }

    // Import Discord.js for EmbedBuilder
    const discord = await import('discord.js');
    const { EmbedBuilder } = discord;

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🛑 BASS SYSTEM SHUTDOWN!')
        .setDescription('Uta has stopped the BASS DROP and your speakers are safe... for now! 💀')
        .addFields({
          name: '🎵 Session Complete',
          value: 'The HARD BASS adventure has ended. Ready for the next BASS DROP whenever you are!',
          inline: false
        })
        .setFooter({ text: 'Until the next BASS DROP! 💀🔊' })
      ]
    });
  }

  async handlePersistentStatus(interaction) {
    const player = this.client.shoukaku.players.get(interaction.guildId);
    const nodes = Array.from(this.client.shoukaku.nodes.values());
    const connectedNodes = nodes.filter(node => node.state === 2);

    // Import Discord.js for EmbedBuilder
    const discord = await import('discord.js');
    const { EmbedBuilder } = discord;

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
            name: '🎛️ Available Stations',
            value: `${Object.keys(RADIO_STATIONS).length} BASS stations loaded\n${Object.keys(RADIO_CATEGORIES).length} categories available`,
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
        .setFooter({ text: 'System Status • Refreshed Now' })
        .setTimestamp()
      ],
      ephemeral: true
    });
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
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
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

    // Initialize Persistent Radio Manager
    const persistentRadio = new PersistentRadioManager(client);

    const radioManager = new SimpleRadioManager();

    // Updated radio command (still available for non-persistent use)
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🔊 Stream HARD BASS DROP music (temporary session)'),
      
      async execute(interaction) {
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('🔊 UTA\'S RADIO COMMAND')
            .setDescription(`💀 **Persistent Radio Available!**\n\nCheck out <#${RADIO_CHANNEL_ID}> for the **24/7 BASS STATION** with persistent controls!\n\n*This command still works for temporary sessions, but the persistent radio offers a better experience!*`)
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

    // Updated Uta command
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

    console.log(`✅ Commands loaded: radio, uta`);
    console.log(`📡 Persistent radio will be created in channel: ${RADIO_CHANNEL_ID}`);

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('✅ Guild commands registered');
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
      
      // Initialize persistent radio after bot is ready
      setTimeout(() => {
        persistentRadio.initializePersistentRadio();
      }, 2000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Command error for /${interaction.commandName}:`, error.message);
        
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `❌ Command failed: ${error.message}`,
              ephemeral: true
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              content: `❌ Command failed: ${error.message}`
            });
          }
        } catch (replyError) {
          console.error(`❌ Failed to send error reply:`, replyError.message);
        }
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}, 1000);

console.log('🔊 PERSISTENT BASS radio bot initialization started');

// MULTI-GUILD/MULTI-CHANNEL SUPPORT ANSWER:
// 
// YES, you can play music in multiple channels simultaneously with ONE bot using ONE token:
// 
// 1. **Single Bot, Multiple Guilds**: ✅ WORKS
//    - One bot can join multiple servers and play different music in each
//    - Each guild gets its own player instance (client.shoukaku.players.get(guildId))
//    - No issues with this approach
// 
// 2. **Single Bot, Multiple Channels in SAME Guild**: ❌ LIMITATION
//    - Discord bots can only be in ONE voice channel per guild at a time
//    - This is a Discord API limitation, not a Lavalink limitation
//    - You CANNOT have the same bot play in two channels of the same server
// 
// 3. **Solutions for Same-Guild Multi-Channel**:
//    - Use TWO separate bots with different tokens
//    - Each bot can join one voice channel in the same guild
//    - Both bots can share the same Lavalink server
// 
// 4. **Code Implementation for Multi-Bot**:
//    - Create two separate .env files or use different environment variables
//    - Deploy two instances of this same code with different DISCORD_TOKEN
//    - Set different RADIO_CHANNEL_ID for each bot
//    - Both can connect to the same LAVALINK_URL
// 
// Example multi-bot setup:
// Bot 1: DISCORD_TOKEN=token1, RADIO_CHANNEL_ID=channel1, CLIENT_ID=app1
// Bot 2: DISCORD_TOKEN=token2, RADIO_CHANNEL_ID=channel2, CLIENT_ID=app2
// Both: LAVALINK_URL=same-lavalink-server
// 
// This allows:
// - Bot 1 plays in Voice Channel A with persistent controls in Text Channel 1  
// - Bot 2 plays in Voice Channel B with persistent controls in Text Channel 2
// - Same guild, different voice channels, simultaneous playback
// - Each bot maintains its own player state and controlsimport 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - HARD BASS EDITION WITH PERSISTENT RADIO');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";

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
      lavalink: global.lavalinkReady || false,
      radioChannel: RADIO_CHANNEL_ID
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

// Persistent Radio Embed Manager
class PersistentRadioManager {
  constructor(client) {
    this.client = client;
    this.radioChannelId = RADIO_CHANNEL_ID;
    this.persistentMessage = null;
  }

  async initializePersistentRadio() {
    try {
      const channel = await this.client.channels.fetch(this.radioChannelId);
      if (!channel) {
        console.error(`❌ Radio channel ${this.radioChannelId} not found!`);
        return;
      }

      console.log(`🎵 Initializing persistent radio in #${channel.name}`);

      // Clear existing messages in the radio channel
      try {
        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
          console.log(`🧹 Deleting ${messages.size} existing messages from radio channel`);
          await channel.bulkDelete(messages);
        }
      } catch (error) {
        console.warn(`⚠️ Could not clear radio channel: ${error.message}`);
      }

      // Create the persistent radio embed
      const embed = await this.createPersistentRadioEmbed();
      const components = await this.createPersistentRadioComponents();

      this.persistentMessage = await channel.send({
        embeds: [embed],
        components: components
      });

      console.log(`✅ Persistent radio embed created with ID: ${this.persistentMessage.id}`);

      // Set up persistent event listener
      this.setupPersistentInteractionHandler();

    } catch (error) {
      console.error(`❌ Failed to initialize persistent radio: ${error.message}`);
    }
  }

  async createPersistentRadioEmbed() {
    const discord = await import('discord.js');
    const { EmbedBuilder } = discord;
    
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
        iconURL: this.client.user?.displayAvatarURL() 
      })
      .setTimestamp();
  }

  async createPersistentRadioComponents() {
    const discord = await import('discord.js');
    const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = discord;

    // Category selector
    const categorySelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_category_select')
      .setPlaceholder('🎯 Select a BASS category...')
      .addOptions(
        Object.entries(RADIO_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.name.split(' ')[0] // Get the emoji
        }))
      );

    // Station selector (initially disabled)
    const stationSelect = new StringSelectMenuBuilder()
      .setCustomId('persistent_station_select')
      .setPlaceholder('🎵 First select a category above...')
      .addOptions([
        {
          label: 'Please select a category first',
          description: 'Choose from the dropdown above',
          value: 'placeholder'
        }
      ])
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

  setupPersistentInteractionHandler() {
    this.client.on('interactionCreate', async (interaction) => {
      // Only handle interactions from the persistent radio message
      if (interaction.message?.id !== this.persistentMessage?.id) return;
      
      try {
        await this.handlePersistentInteraction(interaction);
      } catch (error) {
        console.error(`❌ Persistent radio interaction error: ${error.message}`);
        
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: `❌ Error: ${error.message}`,
            ephemeral: true
          }).catch(() => {});
        }
      }
    });
  }

  async handlePersistentInteraction(interaction) {
    const discord = await import('discord.js');
    const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = discord;

    if (interaction.customId === 'persistent_category_select') {
      const selectedCategory = interaction.values[0];
      const category = RADIO_CATEGORIES[selectedCategory];
      
      // Update station selector with category stations
      const stationOptions = category.stations
        .filter(stationKey => RADIO_STATIONS[stationKey]) // Ensure station exists
        .map(stationKey => {
          const station = RADIO_STATIONS[stationKey];
          return {
            label: station.name,
            description: `${station.description} (${station.genre})`,
            value: stationKey
          };
        });

      if (stationOptions.length === 0) {
        return interaction.reply({
          content: `❌ No stations available for ${category.name}`,
          ephemeral: true
        });
      }

      const newStationSelect = new StringSelectMenuBuilder()
        .setCustomId('persistent_station_select')
        .setPlaceholder(`🎵 Choose from ${category.name}...`)
        .addOptions(stationOptions)
        .setDisabled(false);

      // Update the message with new station options
      const components = interaction.message.components.map((row, index) => {
        if (index === 1) { // Station selector row
          return new ActionRowBuilder().addComponents(newStationSelect);
        }
        return ActionRowBuilder.from(row);
      });

      await interaction.update({ components });

      // Store selected category for later use
      interaction.message._selectedCategory = selectedCategory;

    } else if (interaction.customId === 'persistent_station_select') {
      const selectedStation = interaction.values[0];
      const station = RADIO_STATIONS[selectedStation];
      
      // Store selected station for play button
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
      await this.handlePersistentPlay(interaction);

    } else if (interaction.customId === 'persistent_stop') {
      await this.handlePersistentStop(interaction);

    } else if (interaction.customId === 'persistent_status') {
      await this.handlePersistentStatus(interaction);
    }
  }

  async handlePersistentPlay(interaction) {
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

    if (!this.client.shoukaku || !global.lavalinkReady) {
      return interaction.reply({
        content: '❌ Music service is offline. Try again in a moment!',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Get or create player
      let player = this.client.shoukaku.players.get(interaction.guildId);
      
      if (!player) {
        console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
        
        player = await this.client.shoukaku.joinVoiceChannel({
          guildId: interaction.guildId,
          channelId: voiceChannel.id,
          shardId: interaction.guild.shardId
        });
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        await player.setGlobalVolume(85); // High volume for BASS
      }

      const radioManager = new SimpleRadioManager();
      const result = await radioManager.connectToStream(player, selectedStation);
      const station = RADIO_STATIONS[selectedStation];

      await interaction.editReply({
        embeds: [new (require('discord.js')).EmbedBuilder()
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
            },
            {
              name: '📡 Stream Quality',
              value: station.quality || 'High',
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
  }

  async handlePersistentStop(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const player = this.client.shoukaku.players.get(interaction.guildId);
    if (player) {
      await player.stopTrack();
      await player.destroy();
      this.client.shoukaku.players.delete(interaction.guildId);
    }

    await interaction.editReply({
      embeds: [new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🛑 BASS SYSTEM SHUTDOWN!')
        .setDescription('Uta has stopped the BASS DROP and your speakers are safe... for now! 💀')
        .addFields({
          name: '🎵 Session Complete',
          value: 'The HARD BASS adventure has ended. Ready for the next BASS DROP whenever you are!',
          inline: false
        })
        .setFooter({ text: 'Until the next BASS DROP! 💀🔊' })
      ]
    });
  }

  async handlePersistentStatus(interaction) {
    const player = this.client.shoukaku.players.get(interaction.guildId);
    const nodes = Array.from(this.client.shoukaku.nodes.values());
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
            name: '🎛️ Available Stations',
            value: `${Object.keys(RADIO_STATIONS).length} BASS stations loaded\n${Object.keys(RADIO_CATEGORIES).length} categories available`,
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
        .setFooter({ text: 'System Status • Refreshed Now' })
        .setTimestamp()
      ],
      ephemeral: true
    });
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
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages]
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

    // Initialize Persistent Radio Manager
    const persistentRadio = new PersistentRadioManager(client);

    const radioManager = new SimpleRadioManager();

    // Updated radio command (still available for non-persistent use)
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🔊 Stream HARD BASS DROP music (temporary session)'),
      
      async execute(interaction) {
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle('🔊 UTA\'S RADIO COMMAND')
            .setDescription(`💀 **Persistent Radio Available!**\n\nCheck out <#${RADIO_CHANNEL_ID}> for the **24/7 BASS STATION** with persistent controls!\n\n*This command still works for temporary sessions, but the persistent radio offers a better experience!*`)
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

    // Updated Uta command
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

    console.log(`✅ Commands loaded: radio, uta`);
    console.log(`📡 Persistent radio will be created in channel: ${RADIO_CHANNEL_ID}`);

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
    
    if (process.env.GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
      console.log('✅ Guild commands registered');
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      global.discordReady = true;
      
      // Initialize persistent radio after bot is ready
      setTimeout(() => {
        persistentRadio.initializePersistentRadio();
      }, 2000);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Command error for /${interaction.commandName}:`, error.message);
        
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
              content: `❌ Command failed: ${error.message}`,
              ephemeral: true
            });
          } else if (interaction.deferred) {
            await interaction.editReply({
              content: `❌ Command failed: ${error.message}`
            });
          }
        } catch (replyError) {
          console.error(`❌ Failed to send error reply:`, replyError.message);
        }
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}, 1000);

console.log('🔊 PERSISTENT BASS radio bot initialization started');

// MULTI-GUILD/MULTI-CHANNEL SUPPORT ANSWER:
// 
// YES, you can play music in multiple channels simultaneously with ONE bot using ONE token:
// 
// 1. **Single Bot, Multiple Guilds**: ✅ WORKS
//    - One bot can join multiple servers and play different music in each
//    - Each guild gets its own player instance (client.shoukaku.players.get(guildId))
//    - No issues with this approach
// 
// 2. **Single Bot, Multiple Channels in SAME Guild**: ❌ LIMITATION
//    - Discord bots can only be in ONE voice channel per guild at a time
//    - This is a Discord API limitation, not a Lavalink limitation
//    - You CANNOT have the same bot play in two channels of the same server
// 
// 3. **Solutions for Same-Guild Multi-Channel**:
//    - Use TWO separate bots with different tokens
//    - Each bot can join one voice channel in the same guild
//    - Both bots can share the same Lavalink server
// 
// 4. **Code Implementation for Multi-Bot**:
//    - Create two separate .env files or use different environment variables
//    - Deploy two instances of this same code with different DISCORD_TOKEN
//    - Set different RADIO_CHANNEL_ID for each bot
//    - Both can connect to the same LAVALINK_URL
// 
// Example multi-bot setup:
// Bot 1: DISCORD_TOKEN=token1, RADIO_CHANNEL_ID=channel1, CLIENT_ID=app1
// Bot 2: DISCORD_TOKEN=token2, RADIO_CHANNEL_ID=channel2, CLIENT_ID=app2
// Both: LAVALINK_URL=same-lavalink-server
// 
// This allows:
// - Bot 1 plays in Voice Channel A with persistent controls in Text Channel 1  
// - Bot 2 plays in Voice Channel B with persistent controls in Text Channel 2
// - Same guild, different voice channels, simultaneous playback
// - Each bot maintains its own player state and controls
