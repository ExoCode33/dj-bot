import 'dotenv/config';
import http from 'node:http';
import { RADIO_STATIONS, MUSIC_CATEGORIES } from './config/stations.js';

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

    // Updated radio command with two-dropdown system
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
          try {
            if (componentInteraction.customId === 'category_select') {
              await handleCategorySelection(componentInteraction, interaction, radioManager);
            } else if (componentInteraction.customId === 'station_select') {
              await handleStationSelection(componentInteraction, interaction, radioManager);
            } else if (componentInteraction.customId === 'radio_stop') {
              await handleStopRadio(componentInteraction, interaction);
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };    // Handler functions for the two-dropdown system
    async function handleCategorySelection(componentInteraction, originalInteraction, radioManager) {
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
    }

    async function handleStationSelection(componentInteraction, originalInteraction, radioManager) {
      const selectedStation = componentInteraction.values[0];
      const stationInfo = RADIO_STATIONS[selectedStation];
      
      console.log(`🎵 User selected station: ${selectedStation}`);
      
      await componentInteraction.deferReply({ ephemeral: true });

      const voiceChannel = originalInteraction.member?.voice?.channel;
      if (!voiceChannel) {
        return componentInteraction.editReply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Voice Channel Required')
            .setDescription('You need to be in a voice channel!')
          ]
        });
      }

      // Get or create player
      let player = client.shoukaku.players.get(originalInteraction.guildId);
      
      if (!player) {
        console.log(`🔊 Uta joining voice channel: ${voiceChannel.name}`);
        
        const permissions = voiceChannel.permissionsFor(originalInteraction.client.user);
        if (!permissions.has(['Connect', 'Speak'])) {
          throw new Error('Uta needs Connect/Speak permissions!');
        }
        
        player = await client.shoukaku.joinVoiceChannel({
          guildId: originalInteraction.guildId,
          channelId: voiceChannel.id,
          shardId: originalInteraction.guild.shardId
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
        
        // SUCCESS
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
    }

    async function handleBackToCategories(componentInteraction, originalInteraction) {
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
    }
      await componentInteraction.deferReply({ ephemeral: true });

      const player = client.shoukaku.players.get(originalInteraction.guildId);
      if (player) {
        await player.stopTrack();
        await player.destroy();
        client.shoukaku.players.delete(originalInteraction.guildId);
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
