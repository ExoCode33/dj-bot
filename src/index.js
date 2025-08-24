import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS } from './config/stations.js';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - HARD BASS EDITION');
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

    // Updated radio command with HARD BASS focus
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('🔊 Stream HARD BASS DROP music and electronic beats'),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('Join a voice channel first to experience the BASS DROP! 🔊')
            ],
            ephemeral: true
          });
        }

        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('The BASS system is down. Try again in a moment! ⚡')
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
          .setPlaceholder('Choose your BASS ADVENTURE...')
          .addOptions(stationOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('radio_stop')
          .setLabel('STOP BASS')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔊');

        const embed = new EmbedBuilder()
          .setColor('#FF0040')
          .setTitle('🔊 UTA\'S HARD BASS DROP COLLECTION')
          .setDescription('💀 *"Ready to DESTROY your speakers with the HARDEST drops!"* 💀\n\nFrom BRUTAL dubstep to CRUSHING hardstyle - feel the BASS!')
          .addFields(
            {
              name: '💀 HARD BASS GENRES',
              value: '🔥 **DUBSTEP** • ⚡ **HARDSTYLE** • 💣 **D&B** • 🌀 **TRAP** • 🔊 **TECHNO** • 💀 **HARDCORE** • 🎌 **ANIME** • 🎧 **LO-FI**',
              inline: false
            },
            {
              name: '🎭 BASS DROP ARSENAL',
              value: `**${Object.keys(RADIO_STATIONS).length} stations** loaded with BRUTAL drops and CRUSHING bass!`,
              inline: false
            },
            {
              name: '🔊 WARNING: HEAVY BASS',
              value: '• 💀 **HARD DROPS** that will shake your soul\n• ⚡ **HIGH ENERGY** electronic mayhem\n• 🔊 **BRUTAL BASS** that hits HARD\n• 💣 **CRUSHING BEATS** for true bass heads',
              inline: false
            }
          )
          .setFooter({ text: 'Uta\'s BASS ARSENAL • PREPARE FOR IMPACT! 💀🔊' })
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
                console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
                
                // Check bot permissions first
                const permissions = voiceChannel.permissionsFor(interaction.client.user);
                if (!permissions.has(['Connect', 'Speak'])) {
                  throw new Error('Uta needs Connect/Speak permissions for the BASS DROP!');
                }
                
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                
                // Wait a moment for connection to stabilize
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                await player.setGlobalVolume(85); // Higher volume for BASS
                console.log('✅ Uta connected and BASS volume set to 85');
              } else {
                console.log('🔊 Uta already DROPPING BASS');
                await player.setGlobalVolume(85); // Ensure high volume for bass
              }

              try {
                const result = await radioManager.connectToStream(player, selectedStation);
                
                // SUCCESS: Show BASS success message then auto-dismiss
                await componentInteraction.editReply({
                  content: `🔊 BASS DROP INITIATED! Playing ${stationInfo.name}`,
                  ephemeral: true
                });
                
                // Auto-dismiss after 3 seconds
                setTimeout(async () => {
                  try {
                    await componentInteraction.deleteReply();
                  } catch (err) {
                    // Ignore errors if already dismissed
                  }
                }, 3000);
                
              } catch (error) {
                console.error(`❌ BASS DROP FAILED:`, error);
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('💀 BASS DROP FAILED!')
                    .setDescription(`Couldn't connect to ${stationInfo.name} - BASS system malfunction!`)
                    .addFields(
                      {
                        name: '🔧 Error Details',
                        value: error.message,
                        inline: false
                      },
                      {
                        name: '💡 Try Another BASS Station',
                        value: 'Some radio streams may have temporary issues. Try another station for your BASS FIX!',
                        inline: false
                      }
                    )
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
                  .setTitle('🔊 BASS SYSTEM SHUTDOWN!')
                  .setDescription('Uta has stopped the BASS DROP and the speakers are safe... for now! 💀')
                  .addFields({
                    name: '🎵 BASS SESSION COMPLETE',
                    value: 'The HARD BASS adventure is paused. Ready to DROP more BASS whenever you are!',
                    inline: false
                  })
                  .setFooter({ text: 'Until the next BASS DROP! 💀🔊' })
                ]
              });
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };

    // Updated Uta command with BASS focus
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('💀 Uta\'s HARD BASS music panel'),
      
      async execute(interaction) {
        const embed = new EmbedBuilder()
          .setColor('#FF0040')
          .setTitle('💀 UTA\'S BASS STUDIO - HARD DROPS ONLY')
          .setDescription('*"Ready to ANNIHILATE your ears with the HARDEST bass drops!"* 🔊\n\nUse `/radio` to access the ULTIMATE BASS collection with BRUTAL drops!')
          .addFields(
            {
              name: '💀 HARD BASS ARSENAL',
              value: '🔥 **DUBSTEP** - BRUTAL drops that crush souls\n⚡ **HARDSTYLE** - Epic vocals with CRUSHING drops\n💣 **D&B/NEUROFUNK** - HIGH-ENERGY with BRUTAL bass',
              inline: false
            },
            {
              name: '🌍 GLOBAL BASS DOMINATION',
              value: '🇷🇺 **Radio Record** - Russian BASS powerhouse\n💀 **HARDCORE/GABBER** - BRUTAL European bass\n🎌 **J-POP/K-POP** - For recovery between BASS sessions',
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

    console.log(`✅ Commands loaded: radio (HARD BASS with ${Object.keys(RADIO_STATIONS).length} stations), uta`);

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

console.log('🔊 HARD BASS radio bot initialization started');
