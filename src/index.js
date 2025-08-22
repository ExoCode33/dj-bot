import 'dotenv/config';
import http from 'node:http';

console.log('🚀 STARTING UTA DJ BOT - SIMPLE MUSIC PLAYER');
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
      service: 'uta-dj-bot-simple',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Uta DJ Bot - Simple Music Player');
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
      ModalBuilder,
      TextInputBuilder,
      TextInputStyle,
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
        resumeKey: 'uta-bot-simple',
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

    // Simple play command
    const playCommand = {
      data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or SoundCloud')
        .addStringOption(option =>
          option.setName('query')
            .setDescription('Song name or URL')
            .setRequired(true)
        ),
      
      async execute(interaction) {
        console.log('🎵 Play command executed');
        
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

        const query = interaction.options.getString('query');
        await interaction.deferReply();

        try {
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

          // Search for the song
          console.log(`🔍 Searching for: ${query}`);
          let result;
          
          // Try different search methods
          if (query.includes('youtube.com') || query.includes('youtu.be')) {
            result = await player.node.rest.resolve(query);
          } else if (query.includes('soundcloud.com')) {
            result = await player.node.rest.resolve(query);
          } else {
            // Search by name
            result = await player.node.rest.resolve(`ytsearch:${query}`);
          }

          console.log(`📊 Search result:`, {
            loadType: result?.loadType,
            hasData: !!result?.data,
            hasTrack: !!result?.tracks?.length,
            exception: result?.exception?.message || 'none'
          });

          let track = null;
          let trackInfo = null;

          if (result.loadType === 'search' && result.data?.length > 0) {
            track = result.data[0].encoded;
            trackInfo = result.data[0].info;
          } else if (result.loadType === 'track' && result.data) {
            track = result.data.encoded;
            trackInfo = result.data.info;
          } else if (result.tracks && result.tracks.length > 0) {
            track = result.tracks[0].encoded;
            trackInfo = result.tracks[0].info;
          }

          if (!track) {
            return interaction.editReply({
              embeds: [new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ No Results Found')
                .setDescription(`Could not find "${query}"`)
                .addFields({
                  name: '💡 Try These',
                  value: '• Use more specific search terms\n• Try a direct YouTube/SoundCloud URL\n• Check spelling',
                  inline: false
                })
              ]
            });
          }

          // Play the track
          await player.playTrack({ 
            track: track,
            options: { noReplace: false }
          });

          await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('🎵 Now Playing!')
              .setDescription(`**${trackInfo.title}**`)
              .addFields(
                {
                  name: '👤 Artist',
                  value: trackInfo.author || 'Unknown',
                  inline: true
                },
                {
                  name: '⏱️ Duration',
                  value: formatDuration(trackInfo.length),
                  inline: true
                },
                {
                  name: '🔊 Channel',
                  value: voiceChannel.name,
                  inline: true
                }
              )
              .setThumbnail(trackInfo.artworkUrl)
              .setFooter({ text: 'Enjoy the music! 🎧' })
              .setTimestamp()
            ]
          });

          console.log(`✅ Successfully playing: ${trackInfo.title}`);

        } catch (error) {
          console.error(`❌ Play command failed:`, error);
          await interaction.editReply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Playback Failed')
              .setDescription('Failed to play the requested song')
              .addFields({
                name: '🔧 Error',
                value: error.message,
                inline: false
              })
            ]
          });
        }
      }
    };

    // Stop command
    const stopCommand = {
      data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop music and disconnect from voice channel'),
      
      async execute(interaction) {
        const player = client.shoukaku.players.get(interaction.guildId);
        
        if (!player) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Not Playing')
              .setDescription('No music is currently playing')
            ],
            ephemeral: true
          });
        }

        await player.stopTrack();
        await player.disconnect();
        client.shoukaku.players.delete(interaction.guildId);

        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🛑 Music Stopped')
            .setDescription('Disconnected from voice channel')
          ]
        });
      }
    };

    // Simple Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Uta\'s simple music panel'),
      
      async execute(interaction) {
        const player = client.shoukaku.players.get(interaction.guildId);
        const isPlaying = player?.playing || false;
        
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Simple Music Player')
          .setDescription('*"Let me play your favorite songs!"*')
          .addFields(
            {
              name: '🎵 Commands',
              value: '• `/play <song name or URL>` - Play a song\n• `/stop` - Stop music and disconnect',
              inline: false
            },
            {
              name: '🎭 Status',
              value: isPlaying ? '▶️ Music is playing' : '⏹️ Not playing',
              inline: false
            }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('play', playCommand);
    client.commands.set('stop', stopCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: play, stop, uta');

    // Register slash commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    const commands = [playCommand.data.toJSON(), stopCommand.data.toJSON(), utaCommand.data.toJSON()];
    
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

function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Live';
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

console.log('🎬 Simple music bot initialization started');
