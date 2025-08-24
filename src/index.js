import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS, MUSIC_CATEGORIES } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - PERSISTENT PANEL');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || '';

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

// Simple Radio Manager with fallback support
class SimpleRadioManager {
  async connectToStream(player, stationKey) {
    const station = RADIO_STATIONS[stationKey];
    if (!station) {
      throw new Error('Station not found');
    }

    console.log(`🎵 Connecting to ${station.name}: ${station.url}`);
    
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
    let permanentRadioMessage = null;

    // Function to create persistent radio panel
    async function createPersistentRadioPanel() {
      if (!RADIO_CHANNEL_ID) {
        console.log('⚠️ No RADIO_CHANNEL_ID set - persistent panel disabled');
        return null;
      }

      try {
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
        if (!channel) {
          console.error(`❌ Could not find channel with ID: ${RADIO_CHANNEL_ID}`);
          return null;
        }

        // Create category selection dropdown
        const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.emoji
        }));

        const categorySelectMenu = new StringSelectMenuBuilder()
          .setCustomId('persistent_category_select')
          .setPlaceholder('🎵 Choose a music category...')
          .addOptions(categoryOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('persistent_radio_stop')
          .setLabel('Stop Music')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎵 UTA\'S PERSISTENT MUSIC PANEL')
          .setDescription('🎤 *"Always ready to play your favorite music!"* 🎤\n\n**Step 1:** Choose your music category\n**Step 2:** Select your favorite station\n**Step 3:** Enjoy the music! 🎵')
          .addFields(
            {
              name: '🎌 K-Pop & Asian Hits',
              value: 'BLACKPINK, BTS, TWICE, NewJeans, anime music',
              inline: true
            },
            {
              name: '🔊 Electronic & Bass Drop', 
              value: 'Hardstyle, dubstep, house with CRUSHING drops',
              inline: true
            },
            {
              name: '🎵 Pop & Mainstream',
              value: 'Chart toppers, dance hits, popular music',
              inline: true
            },
            {
              name: '🎧 Chill & Lo-Fi',
              value: 'Lo-fi beats, ambient, downtempo, study music',
              inline: true
            },
            {
              name: '🎤 Hip-Hop & Rap',
              value: 'Latest hip-hop, rap, and R&B hits',
              inline: true
            },
            {
              name: '🎸 Rock & Metal',
              value: 'Rock, metal, alternative with heavy guitars',
              inline: true
            }
          )
          .setFooter({ text: 'Uta\'s Persistent Music Panel • Always Available! 🎵✨' })
          .setTimestamp();

        // Delete existing message if it exists
        if (permanentRadioMessage) {
          try {
            await permanentRadioMessage.delete();
          } catch (error) {
            console.log('⚠️ Could not delete old radio message:', error.message);
          }
        }

        // Send new persistent message
        permanentRadioMessage = await channel.send({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(categorySelectMenu),
            new ActionRowBuilder().addComponents(stopButton)
          ]
        });

        console.log(`✅ Persistent radio panel created in ${channel.name}`);
        return permanentRadioMessage;

      } catch (error) {
        console.error('❌ Failed to create persistent radio panel:', error.message);
        return null;
      }
    }

    // Regular radio command (working version from before)
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎵 Stream music by category with two-dropdown selection'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first to start the music! 🎵')
            ],
            ephemeral: true
          });
        }

        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('The music system is down. Try again in a moment! ⚡')
            ],
            ephemeral: true
          });
        }

        // If RADIO_CHANNEL_ID is set, create/update persistent panel
        if (RADIO_CHANNEL_ID) {
          await createPersistentRadioPanel();
          
          const reply = await interaction.reply({
            content: '✅ **Persistent radio panel updated!**',
            ephemeral: false
          });
          
          // Delete after 2 seconds
          setTimeout(async () => {
            try {
              await reply.delete();
            } catch (error) {
              // Ignore deletion errors
            }
          }, 2000);
          return;
        }

        // Regular temporary radio panel
        const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
          label: category.name,
          description: category.description,
          value: key,
          emoji: category.emoji
        }));

        const categorySelectMenu = new StringSelectMenuBuilder()
          .setCustomId('category_select')
          .setPlaceholder('🎵 Choose a music category...')
          .addOptions(categoryOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('Stop Music')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎵 UTA\'S MUSIC COLLECTION')
          .setDescription('🎤 *"Ready to play the perfect music for every mood!"* 🎤\n\n**Step 1:** Choose your music category\n**Step 2:** Select your favorite station\n**Step 3:** Enjoy the music! 🎵')
          .addFields(
            {
              name: '🎌 K-Pop & Asian Hits',
              value: 'BLACKPINK, BTS, TWICE, NewJeans, anime music',
              inline: true
            },
            {
              name: '🔊 Electronic & Bass Drop', 
              value: 'Hardstyle, dubstep, house with CRUSHING drops',
              inline: true
            },
            {
              name: '🎵 Pop & Mainstream',
              value: 'Chart toppers, dance hits, popular music',
              inline: true
            },
            {
              name: '🎧 Chill & Lo-Fi',
              value: 'Lo-fi beats, ambient, downtempo, study music',
              inline: true
            },
            {
              name: '🎤 Hip-Hop & Rap',
              value: 'Latest hip-hop, rap, and R&B hits',
              inline: true
            },
            {
              name: '🎸 Rock & Metal',
              value: 'Rock, metal, alternative with heavy guitars',
              inline: true
            }
          )
          .setFooter({ text: 'Uta\'s Music Collection • Choose your vibe! 🎵✨' })
          .setTimestamp();

        const message = await interaction.reply({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(categorySelectMenu),
            new ActionRowBuilder().addComponents(stopButton)
          ]
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (componentInteraction) => {
          try {
            console.log(`🎛️ Interaction: ${componentInteraction.customId}`);
            
            if (componentInteraction.customId === 'category_select') {
              const selectedCategory = componentInteraction.values[0];
              const categoryInfo = MUSIC_CATEGORIES[selectedCategory];
              
              console.log(`🎵 User selected category: ${selectedCategory}`);
              
              const categoryStations = Object.entries(RADIO_STATIONS)
                .filter(([key, station]) => station.category === selectedCategory)
                .map(([key, station]) => ({
                  label: station.name,
                  description: `${station.description} (${station.genre})`,
                  value: key
                }));

              if (categoryStations.length === 0) {
                return componentInteraction.reply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ No Stations Available')
                    .setDescription(`No stations found for ${categoryInfo.name}`)
                  ],
                  ephemeral: true
                });
              }

              const stationSelectMenu = new StringSelectMenuBuilder()
                .setCustomId('station_select')
                .setPlaceholder(`${categoryInfo.emoji} Choose your ${categoryInfo.name.split(' ')[1]} station...`)
                .addOptions(categoryStations);

              const backButton = new ButtonBuilder()
                .setCustomId('back_to_categories')
                .setLabel('← Back to Categories')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔙');

              const stopButton = new ButtonBuilder()
                .setCustomId('radio_stop')
                .setLabel('Stop Music')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛑');

              const embed = new EmbedBuilder()
                .setColor('#FF6B9D')
                .setTitle(`${categoryInfo.emoji} ${categoryInfo.name.toUpperCase()}`)
                .setDescription(`🎵 *"${categoryInfo.description}"*\n\n**Choose your station from ${categoryStations.length} available options:**`)
                .addFields(
                  categoryStations.slice(0, 10).map(station => ({
                    name: `🎵 ${station.label}`,
                    value: station.description,
                    inline: false
                  }))
                )
                .setFooter({ text: `Uta's ${categoryInfo.name} Collection • Select your vibe! ${categoryInfo.emoji}` })
                .setTimestamp();

              await componentInteraction.update({
                embeds: [embed],
                components: [
                  new ActionRowBuilder().addComponents(stationSelectMenu),
                  new ActionRowBuilder().addComponents(backButton, stopButton)
                ]
              });

            } else if (componentInteraction.customId === 'station_select') {
              const selectedStation = componentInteraction.values[0];
              const stationInfo = RADIO_STATIONS[selectedStation];
              
              console.log(`🎵 User selected station: ${selectedStation}`);
              
              await componentInteraction.deferReply({ ephemeral: true });

              let player = client.shoukaku.players.get(interaction.guildId);
              
              if (!player) {
                console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
                
                const permissions = voiceChannel.permissionsFor(interaction.client.user);
                if (!permissions.has(['Connect', 'Speak'])) {
                  throw new Error('Uta needs Connect/Speak permissions!');
                }
                
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
                await player.setGlobalVolume(85);
                console.log('✅ Uta connected and volume set to 85');
              } else {
                console.log('🔊 Uta already performing');
                await player.setGlobalVolume(85);
              }

              try {
                const result = await radioManager.connectToStream(player, selectedStation);
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#00FF94')
                    .setTitle('🎵 Now Playing!')
                    .setDescription(`✅ **${stationInfo.name}** is now playing in **${voiceChannel.name}**!`)
                    .addFields(
                      {
                        name: '🎶 Station Info',
                        value: stationInfo.description,
                        inline: false
                      },
                      {
                        name: '🎵 Genre',
                        value: stationInfo.genre,
                        inline: true
                      },
                      {
                        name: '🎧 Quality',
                        value: stationInfo.quality,
                        inline: true
                      }
                    )
                    .setFooter({ text: 'Enjoy the music! 🎵✨' })
                    .setTimestamp()
                  ]
                });
                
              } catch (error) {
                console.error(`❌ Stream failed:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Connection Failed!')
                    .setDescription(`Couldn't connect to ${stationInfo.name}`)
                    .addFields({
                      name: '🔧 Error Details',
                      value: error.message,
                      inline: false
                    })
                  ]
                });
              }

            } else if (componentInteraction.customId === 'back_to_categories') {
              console.log('🔙 User clicked back to categories');
              
              const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
                label: category.name,
                description: category.description,
                value: key,
                emoji: category.emoji
              }));

              const categorySelectMenu = new StringSelectMenuBuilder()
                .setCustomId('category_select')
                .setPlaceholder('🎵 Choose a music category...')
                .addOptions(categoryOptions);

              const stopButton = new ButtonBuilder()
                .setCustomId('radio_stop')
                .setLabel('Stop Music')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🛑');

              const embed = new EmbedBuilder()
                .setColor('#FF6B9D')
                .setTitle('🎵 UTA\'S MUSIC COLLECTION')
                .setDescription('🎤 *"Ready to play the perfect music for every mood!"* 🎤\n\n**Step 1:** Choose your music category\n**Step 2:** Select your favorite station\n**Step 3:** Enjoy the music! 🎵')
                .addFields(
                  {
                    name: '🎌 K-Pop & Asian Hits',
                    value: 'BLACKPINK, BTS, TWICE, NewJeans, anime music',
                    inline: true
                  },
                  {
                    name: '🔊 Electronic & Bass Drop', 
                    value: 'Hardstyle, dubstep, house with CRUSHING drops',
                    inline: true
                  },
                  {
                    name: '🎵 Pop & Mainstream',
                    value: 'Chart toppers, dance hits, popular music',
                    inline: true
                  },
                  {
                    name: '🎧 Chill & Lo-Fi',
                    value: 'Lo-fi beats, ambient, downtempo, study music',
                    inline: true
                  },
                  {
                    name: '🎤 Hip-Hop & Rap',
                    value: 'Latest hip-hop, rap, and R&B hits',
                    inline: true
                  },
                  {
                    name: '🎸 Rock & Metal',
                    value: 'Rock, metal, alternative with heavy guitars',
                    inline: true
                  }
                )
                .setFooter({ text: 'Uta\'s Music Collection • Choose your vibe! 🎵✨' })
                .setTimestamp();

              await componentInteraction.update({
                embeds: [embed],
                components: [
                  new ActionRowBuilder().addComponents(categorySelectMenu),
                  new ActionRowBuilder().addComponents(stopButton)
                ]
              });

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
                  .setTitle('🛑 Music Stopped!')
                  .setDescription('Uta has finished her performance and the music has stopped! 🎤')
                  .setFooter({ text: 'Until the next song! 🎵✨' })
                ]
              });
            }

          } catch (error) {
            console.error('❌ Radio interaction error:', error);
            
            try {
              if (!componentInteraction.replied && !componentInteraction.deferred) {
                await componentInteraction.reply({
                  content: '❌ Something went wrong. Please try again.',
                  ephemeral: true
                });
              }
            } catch (replyError) {
              console.error('❌ Failed to send error reply:', replyError.message);
            }
          }
        });
      }
    };

    // Simple Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Uta\'s music panel with categories'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 UTA\'S MUSIC STUDIO - CATEGORY SELECTION')
          .setDescription('*"Ready to play music from every genre and mood!"* 🎵\n\nUse `/radio` to access the ultimate music collection organized by categories!')
          .addFields(
            {
              name: '🎌 K-Pop & Asian Collection',
              value: '🔥 **BLACKPINK, BTS, TWICE** - Top Korean hits\n🎌 **LISTEN.moe** - Japanese and Korean music paradise\n🎵 **Asia DREAM** - K-Pop with NewJeans, IVE style',
              inline: false
            },
            {
              name: '🔊 Electronic & Bass Categories',
              value: '💀 **Hardstyle & Dubstep** - CRUSHING drops\n🎧 **SomaFM Electronic** - Ambient and downtempo\n💣 **ILoveRadio** - German electronic hits',
              inline: false
            },
            {
              name: '🎵 All Music Genres Available',
              value: '🎵 **Pop & Mainstream** - Chart toppers\n🎧 **Chill & Lo-Fi** - Study and relaxation\n🎤 **Hip-Hop & Rap** - Latest urban hits\n🎸 **Rock & Metal** - Heavy guitars',
              inline: false
            }
          )
          .setFooter({ text: 'The world\'s #1 songstress with organized music! 🎤✨' })
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log(`✅ Commands loaded: radio (Categories with ${Object.keys(RADIO_STATIONS).length} stations), uta`);

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
      
      // Create persistent panel if channel ID is set
      if (RADIO_CHANNEL_ID) {
        console.log('🎵 Setting up persistent radio panel...');
        setTimeout(() => {
          createPersistentRadioPanel();
        }, 3000);
      }
    });

    // Handle all interactions (including persistent panel)
    client.on(Events.InteractionCreate, async (interaction) => {
      console.log(`📨 Interaction received: ${interaction.type}`);
      
      if (interaction.isChatInputCommand()) {
        console.log(`🎯 Slash command: /${interaction.commandName}`);
        
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          console.error(`❌ Command not found: ${interaction.commandName}`);
          return;
        }

        try {
          console.log(`⚡ Executing command: /${interaction.commandName}`);
          await command.execute(interaction);
          console.log(`✅ Command /${interaction.commandName} executed successfully`);
        } catch (error) {
          console.error(`❌ Command error for /${interaction.commandName}:`, error.message);
          console.error(`❌ Full error:`, error);
          
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
      } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
        // Handle persistent panel interactions
        if (interaction.customId.startsWith('persistent_')) {
          console.log(`🎛️ Persistent panel interaction: ${interaction.customId}`);
          
          if (interaction.customId === 'persistent_category_select') {
            // Handle persistent category selection - similar to regular but with auto-delete messages
            const selectedCategory = interaction.values[0];
            const categoryInfo = MUSIC_CATEGORIES[selectedCategory];
            
            const categoryStations = Object.entries(RADIO_STATIONS)
              .filter(([key, station]) => station.category === selectedCategory)
              .map(([key, station]) => ({
                label: station.name,
                description: `${station.description} (${station.genre})`,
                value: key
              }));

            if (categoryStations.length === 0) return;

            const stationSelectMenu = new StringSelectMenuBuilder()
              .setCustomId('persistent_station_select')
              .setPlaceholder(`${categoryInfo.emoji} Choose station...`)
              .addOptions(categoryStations);

            const backButton = new ButtonBuilder()
              .setCustomId('persistent_back')
              .setLabel('← Back')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🔙');

            const stopButton = new ButtonBuilder()
              .setCustomId('persistent_radio_stop')
              .setLabel('Stop')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🛑');

            const embed = new EmbedBuilder()
              .setColor('#FF6B9D')
              .setTitle(`${categoryInfo.emoji} ${categoryInfo.name.toUpperCase()}`)
              .setDescription(`🎵 **${categoryInfo.description}**\n\nChoose from ${categoryStations.length} stations:`)
              .addFields(
                categoryStations.slice(0, 8).map(station => ({
                  name: `🎵 ${station.label}`,
                  value: station.description,
                  inline: false
                }))
              )
              .setFooter({ text: `Persistent ${categoryInfo.name} Panel ${categoryInfo.emoji}` })
              .setTimestamp();

            await interaction.update({
              embeds: [embed],
              components: [
                new ActionRowBuilder().addComponents(stationSelectMenu),
                new ActionRowBuilder().addComponents(backButton, stopButton)
              ]
            });

          } else if (interaction.customId === 'persistent_station_select') {
            // Handle persistent station selection with auto-delete message
            const selectedStation = interaction.values[0];
            const stationInfo = RADIO_STATIONS[selectedStation];
            
            const voiceChannel = interaction.member?.voice?.channel;
            if (!voiceChannel) return; // Silent failure

            let player = client.shoukaku.players.get(interaction.guildId);
            
            if (!player) {
              const permissions = voiceChannel.permissionsFor(client.user);
              if (!permissions.has(['Connect', 'Speak'])) return;
              
              player = await client.shoukaku.joinVoiceChannel({
                guildId: interaction.guildId,
                channelId: voiceChannel.id,
                shardId: interaction.guild.shardId
              });
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              await player.setGlobalVolume(85);
            } else {
              await player.setGlobalVolume(85);
            }

            try {
              await radioManager.connectToStream(player, selectedStation);
              
              const reply = await interaction.reply({
                content: `🎵 **${stationInfo.name}** started!`,
                ephemeral: false
              });
              
              setTimeout(async () => {
                try {
                  await reply.delete();
                } catch (e) {
                  // Ignore
                }
              }, 2000);
              
            } catch (error) {
              console.error('❌ Persistent stream failed:', error.message);
              // Silent failure
            }

          } else if (interaction.customId === 'persistent_back') {
            // Back to categories for persistent panel
            const categoryOptions = Object.entries(MUSIC_CATEGORIES).map(([key, category]) => ({
              label: category.name,
              description: category.description,
              value: key,
              emoji: category.emoji
            }));

            const categorySelectMenu = new StringSelectMenuBuilder()
              .setCustomId('persistent_category_select')
              .setPlaceholder('🎵 Choose a music category...')
              .addOptions(categoryOptions);

            const stopButton = new ButtonBuilder()
              .setCustomId('persistent_radio_stop')
              .setLabel('Stop Music')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🛑');

            const embed = new EmbedBuilder()
              .setColor('#FF6B9D')
              .setTitle('🎵 UTA\'S PERSISTENT MUSIC PANEL')
              .setDescription('🎤 *"Always ready to play your favorite music!"* 🎤\n\n**Step 1:** Choose your music category\n**Step 2:** Select your favorite station\n**Step 3:** Enjoy the music! 🎵')
              .addFields(
                { name: '🎌 K-Pop & Asian Hits', value: 'BLACKPINK, BTS, TWICE, NewJeans, anime music', inline: true },
                { name: '🔊 Electronic & Bass Drop', value: 'Hardstyle, dubstep, house with CRUSHING drops', inline: true },
                { name: '🎵 Pop & Mainstream', value: 'Chart toppers, dance hits, popular music', inline: true },
                { name: '🎧 Chill & Lo-Fi', value: 'Lo-fi beats, ambient, downtempo, study music', inline: true },
                { name: '🎤 Hip-Hop & Rap', value: 'Latest hip-hop, rap, and R&B hits', inline: true },
                { name: '🎸 Rock & Metal', value: 'Rock, metal, alternative with heavy guitars', inline: true }
              )
              .setFooter({ text: 'Uta\'s Persistent Music Panel • Always Available! 🎵✨' })
              .setTimestamp();

            await interaction.update({
              embeds: [embed],
              components: [
                new ActionRowBuilder().addComponents(categorySelectMenu),
                new ActionRowBuilder().addComponents(stopButton)
              ]
            });

          } else if (interaction.customId === 'persistent_radio_stop') {
            // Stop music from persistent panel
            const player = client.shoukaku.players.get(interaction.guildId);
            if (player) {
              await player.stopTrack();
              await player.destroy();
              client.shoukaku.players.delete(interaction.guildId);
            }

            const reply = await interaction.reply({
              content: '🛑 **Music stopped!**',
              ephemeral: false
            });
            
            setTimeout(async () => {
              try {
                await reply.delete();
              } catch (e) {
                // Ignore
              }
            }, 2000);
          }
        }
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
  }
}, 1000);

console.log('🎵 Full-featured music bot with persistent panel starting...');
