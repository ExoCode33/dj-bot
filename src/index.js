import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS, MUSIC_CATEGORIES } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - PERSISTENT RADIO PANEL');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;

// Configuration
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || ''; // Set this in your .env file

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
          await player.playTrack({
            track: {
              encoded: result.data.encoded
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name} with ${url}`);
          return { success: true, station, url };
          
        } else if (result.tracks && result.tracks.length > 0) {
          await player.playTrack({
            track: {
              encoded: result.tracks[0].encoded
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`✅ Successfully started ${station.name} with ${url}`);
          return { success: true, station, url };
          
        } else if (result.loadType === 'playlist' && result.data?.tracks?.length > 0) {
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

    // Function to create/update the persistent radio panel
    async function createPersistentRadioPanel(client) {
      if (!RADIO_CHANNEL_ID) {
        console.log('⚠️ No RADIO_CHANNEL_ID set - radio panel will not be persistent');
        return;
      }

      try {
        const channel = await client.channels.fetch(RADIO_CHANNEL_ID);
        if (!channel) {
          console.error(`❌ Could not find channel with ID: ${RADIO_CHANNEL_ID}`);
          return;
        }

        // Create category selection dropdown
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
          .setTitle('🎵 UTA\'S MUSIC COLLECTION - PERSISTENT PANEL')
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
      }
    }

    // Global collector for persistent panel
    async function setupPersistentCollector(client, message) {
      const collector = message.createMessageComponentCollector({ 
        time: 0 // Permanent collector - never expires
      });

      collector.on('collect', async (componentInteraction) => {
        try {
          console.log(`🎛️ Persistent panel interaction: ${componentInteraction.customId}`);
          
          if (componentInteraction.customId === 'category_select') {
            const selectedCategory = componentInteraction.values[0];
            const categoryInfo = MUSIC_CATEGORIES[selectedCategory];
            
            console.log(`🎵 User selected category: ${selectedCategory}`);
            
            // Get stations for this category
            const categoryStations = Object.entries(RADIO_STATIONS)
              .filter(([key, station]) => station.category === selectedCategory)
              .map(([key, station]) => ({
                label: station.name,
                description: `${station.description} (${station.genre})`,
                value: key
              }));

            if (categoryStations.length === 0) {
              // Silent failure - just update back to categories
              return;
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
            
            // Check voice channel silently
            const voiceChannel = componentInteraction.member?.voice?.channel;
            if (!voiceChannel) {
              // Silent failure - no message
              return;
            }

            // Get or create player
            let player = client.shoukaku.players.get(componentInteraction.guildId);
            
            if (!player) {
              console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
              
              const permissions = voiceChannel.permissionsFor(client.user);
              if (!permissions.has(['Connect', 'Speak'])) {
                // Silent failure - no message
                return;
              }
              
              player = await client.shoukaku.joinVoiceChannel({
                guildId: componentInteraction.guildId,
                channelId: voiceChannel.id,
                shardId: componentInteraction.guild.shardId
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
              
              // SUCCESS - Show brief message then delete
              const successReply = await componentInteraction.reply({
                content: `🎵 **${stationInfo.name}** started!`,
                ephemeral: false
              });
              
              // Delete after 2 seconds
              setTimeout(async () => {
                try {
                  await successReply.delete();
                } catch (error) {
                  // Ignore deletion errors
                }
              }, 2000);
              
            } catch (error) {
              console.error(`❌ Stream failed:`, error);
              // Silent failure - no error message shown to user
            }

          } else if (componentInteraction.customId === 'back_to_categories') {
            console.log('🔙 User clicked back to categories');
            
            // Recreate the original category selection interface
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
              .setTitle('🎵 UTA\'S MUSIC COLLECTION - PERSISTENT PANEL')
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
              .setFooter({ text: 'Uta\'s Persistent Music Panel • Always Available! 🎵✨' })
              .setTimestamp();

            await componentInteraction.update({
              embeds: [embed],
              components: [
                new ActionRowBuilder().addComponents(categorySelectMenu),
                new ActionRowBuilder().addComponents(stopButton)
              ]
            });

          } else if (componentInteraction.customId === 'radio_stop') {
            const player = client.shoukaku.players.get(componentInteraction.guildId);
            if (player) {
              await player.stopTrack();
              await player.destroy();
              client.shoukaku.players.delete(componentInteraction.guildId);
            }

            // Brief stop message then delete
            const stopReply = await componentInteraction.reply({
              content: '🛑 **Music stopped!**',
              ephemeral: false
            });
            
            // Delete after 2 seconds
            setTimeout(async () => {
              try {
                await stopReply.delete();
              } catch (error) {
                // Ignore deletion errors
              }
            }, 2000);
          }

        } catch (error) {
          console.error('❌ Persistent panel interaction error:', error);
          // Silent failure - no error message to user
        }
      });

      collector.on('end', (collected, reason) => {
        console.log(`⚠️ Persistent collector ended: ${reason}`);
        // Recreate the collector if it ends for any reason
        if (reason !== 'messageDelete') {
          setTimeout(() => {
            setupPersistentCollector(client, message);
          }, 5000);
        }
      });

      console.log('✅ Persistent radio panel collector setup complete');
    }

    // Simplified radio command - just creates/updates the persistent panel
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🎵 Create/update the persistent radio panel'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        if (RADIO_CHANNEL_ID) {
          // Create the persistent panel
          await createPersistentRadioPanel(interaction.client);
          
          // Reply and delete quickly
          const reply = await interaction.reply({
            content: '✅ **Radio panel created/updated!**',
            ephemeral: false
          });
          
          setTimeout(async () => {
            try {
              await reply.delete();
            } catch (error) {
              // Ignore deletion errors
            }
          }, 2000);
          
        } else {
          // Temporary panel in current channel
          const voiceChannel = interaction.member?.voice?.channel;
          if (!voiceChannel) {
            const reply = await interaction.reply({
              content: '❌ **Join a voice channel first!**',
              ephemeral: false
            });
            
            setTimeout(async () => {
              try {
                await reply.delete();
              } catch (error) {
                // Ignore deletion errors
              }
            }, 3000);
            return;
          }

          if (!client.shoukaku || !global.lavalinkReady) {
            const reply = await interaction.reply({
              content: '❌ **Music service offline!**',
              ephemeral: false
            });
            
            setTimeout(async () => {
              try {
                await reply.delete();
              } catch (error) {
                // Ignore deletion errors
              }
            }, 3000);
            return;
          }

          // Create category selection dropdown
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
            // Same logic as persistent panel but with temporary collector
            // ... (keeping the same interaction logic but simplified)
          });
        }
      }
    };value: 'Lo-fi beats, ambient, downtempo, study music',
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
            
            // Try to respond to prevent "interaction failed"
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
      
      // Create persistent radio panel if channel ID is set
      if (RADIO_CHANNEL_ID) {
        console.log('🎵 Setting up persistent radio panel...');
        const message = await createPersistentRadioPanel(client);
        if (message) {
          await setupPersistentCollector(client, message);
        }
      }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      console.log(`📨 Interaction received: ${interaction.type}`);
      
      if (!interaction.isChatInputCommand()) return;
      
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
        
        // Try to respond if we haven't already
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

console.log('🎵 Category-based music radio bot initialization started');
