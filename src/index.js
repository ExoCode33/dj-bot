import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - ENHANCED VERSION');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;

// Health server - MUST start first for Railway
const server = http.createServer((req, res) => {
  console.log(`📡 Health request: ${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      commands: global.commandsLoaded || 0
    }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Uta DJ Bot</title></head>
        <body>
          <h1>🎤 Uta DJ Bot</h1>
          <p>Status: Running</p>
          <p>Discord: ${global.discordReady ? 'Connected' : 'Disconnected'}</p>
          <p>Lavalink: ${global.lavalinkReady ? 'Connected' : 'Disconnected'}</p>
          <p>Commands: ${global.commandsLoaded || 0}</p>
          <p><a href="/health">Health Check JSON</a></p>
        </body>
      </html>
    `);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Health server running on 0.0.0.0:${port}`);
});

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  // Don't exit - keep health server running
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  // Don't exit - keep health server running
});

// DI.FM channels configuration
const DIFM_CHANNELS = {
  'trance': { name: 'Trance', description: 'Uplifting and euphoric trance music', category: 'Popular' },
  'house': { name: 'House', description: 'Classic and modern house beats', category: 'Popular' },
  'techno': { name: 'Techno', description: 'Underground techno sounds', category: 'Popular' },
  'progressive': { name: 'Progressive', description: 'Progressive electronic music', category: 'Popular' },
  'dubstep': { name: 'Dubstep', description: 'Heavy bass and electronic drops', category: 'Popular' },
  'drumandbass': { name: 'Drum & Bass', description: 'Fast breakbeats and bass', category: 'Popular' },
  'deephouse': { name: 'Deep House', description: 'Deep and soulful house music', category: 'House' },
  'ambient': { name: 'Ambient', description: 'Atmospheric soundscapes', category: 'Chill' },
  'chillout': { name: 'Chillout', description: 'Relaxing ambient electronic', category: 'Chill' }
};

// DI.FM Manager Class
class DiFMManager {
  constructor() {
    this.apiKey = process.env.DIFM_API_KEY;
    console.log('🎵 DI.FM Manager initialized with API key:', this.apiKey ? 'YES' : 'NO');
  }

  async getStreamUrls(channelKey) {
    if (this.apiKey) {
      return [
        `http://prem1.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
        `http://prem2.di.fm:80/${channelKey}?listen_key=${this.apiKey}`,
        `http://pub1.di.fm/di_${channelKey}`,
        `http://pub2.di.fm/di_${channelKey}`,
        `http://pub7.di.fm/di_${channelKey}`
      ];
    } else {
      return [
        `http://pub1.di.fm/di_${channelKey}`,
        `http://pub2.di.fm/di_${channelKey}`,
        `http://pub7.di.fm/di_${channelKey}`
      ];
    }
  }

  async connectToStream(player, channelKey) {
    console.log(`🎵 Connecting to DI.FM channel: ${channelKey}`);
    
    const streamUrls = await this.getStreamUrls(channelKey);
    
    for (let i = 0; i < streamUrls.length; i++) {
      const streamUrl = streamUrls[i];
      console.log(`🔄 Trying stream URL ${i + 1}/${streamUrls.length}: ${streamUrl}`);
      
      try {
        const result = await player.node.rest.resolve(streamUrl);
        console.log(`📊 Result:`, {
          loadType: result?.loadType,
          hasData: !!result?.data,
          hasTrack: !!result?.tracks?.length
        });
        
        if (result?.data || (result?.tracks && result.tracks.length > 0)) {
          const track = result.data || result.tracks[0];
          await player.playTrack({ 
            track: track.encoded || track.track,
            options: { noReplace: false }
          });
          
          console.log(`✅ Successfully started DI.FM stream: ${channelKey}`);
          return { success: true, url: streamUrl, isPremium: streamUrl.includes('listen_key') };
        }
      } catch (urlError) {
        console.log(`❌ Failed to load ${streamUrl}:`, urlError.message);
        continue;
      }
    }
    
    throw new Error('All stream URLs failed to load');
  }
}

// Start Discord bot after health server is stable
setTimeout(async () => {
  try {
    console.log('🤖 Starting Discord bot...');
    
    // Check required environment variables
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing DISCORD_TOKEN or CLIENT_ID');
      console.log('⚠️ Health server will continue running...');
      return;
    }

    // Dynamic imports with error handling
    let discord, shoukaku;
    
    try {
      console.log('📦 Loading Discord.js...');
      discord = await import('discord.js');
      console.log('✅ Discord.js loaded');
    } catch (discordError) {
      console.error('❌ Failed to load Discord.js:', discordError.message);
      return;
    }

    try {
      console.log('📦 Loading Shoukaku...');
      shoukaku = await import('shoukaku');
      console.log('✅ Shoukaku loaded');
    } catch (shoukakuError) {
      console.error('❌ Failed to load Shoukaku:', shoukakuError.message);
      console.log('⚠️ Continuing without Lavalink...');
    }

    // Create Discord client
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

    // Setup Lavalink if available
    if (shoukaku && process.env.LAVALINK_URL) {
      try {
        console.log('🎵 Setting up Lavalink...');
        const nodes = [{
          name: process.env.LAVALINK_NAME || 'railway-node',
          url: process.env.LAVALINK_URL,
          auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
          secure: process.env.LAVALINK_SECURE === 'true'
        }];

        client.shoukaku = new shoukaku.Shoukaku(new shoukaku.Connectors.DiscordJS(client), nodes, {
          resume: true,
          resumeKey: 'uta-bot-enhanced',
          resumeTimeout: 60,
          reconnectTries: 10,
          reconnectInterval: 2000,
          restTimeout: 120000
        });

        client.shoukaku.on('ready', (name) => {
          console.log(`✅ Lavalink "${name}" ready`);
          global.lavalinkReady = true;
        });

        client.shoukaku.on('error', (name, error) => {
          console.error(`❌ Lavalink "${name}" error:`, error.message);
          global.lavalinkReady = false;
        });

        client.shoukaku.on('disconnect', (name, reason) => {
          console.warn(`⚠️ Lavalink "${name}" disconnected:`, reason);
          global.lavalinkReady = false;
        });

        console.log('✅ Lavalink configured');
      } catch (lavalinkError) {
        console.error('❌ Lavalink setup failed:', lavalinkError.message);
      }
    }

    // Initialize DI.FM Manager
    const difmManager = new DiFMManager();

    // Enhanced radio command with DI.FM streaming
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Stream DI.FM electronic music channels')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Browse channels by category')
            .setRequired(false)
            .addChoices(
              { name: 'Popular', value: 'Popular' },
              { name: 'House Music', value: 'House' },
              { name: 'Chill & Ambient', value: 'Chill' }
            )
        ),
      
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        // Check voice channel
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Channel Required')
              .setDescription('You need to be in a voice channel!')
            ],
            ephemeral: true
          });
        }

        // Check Lavalink
        if (!client.shoukaku || !global.lavalinkReady) {
          return interaction.reply({
            embeds: [new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Music Service Offline')
              .setDescription('Lavalink is not connected. Please try again later.')
            ],
            ephemeral: true
          });
        }

        const category = interaction.options.getString('category') || 'Popular';
        const channelOptions = Object.entries(DIFM_CHANNELS)
          .filter(([_, channel]) => channel.category === category)
          .slice(0, 25)
          .map(([key, channel]) => ({
            label: channel.name,
            description: channel.description,
            value: key
          }));

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('difm_select')
          .setPlaceholder('Choose a DI.FM channel...')
          .addOptions(channelOptions);

        const stopButton = new ButtonBuilder()
          .setCustomId('difm_stop')
          .setLabel('Stop Radio')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🛑');

        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('📻 DI.FM Electronic Music Radio')
          .setDescription('Select a channel to start streaming!')
          .addFields(
            {
              name: '🎵 Available Categories',
              value: 'Popular • House • Chill & Ambient',
              inline: false
            },
            {
              name: process.env.DIFM_API_KEY ? '✅ Premium Access' : '🆓 Free Access',
              value: process.env.DIFM_API_KEY 
                ? 'Premium DI.FM subscription active!' 
                : 'Using free streams',
              inline: false
            }
          )
          .setFooter({ text: 'DI.FM - Addictive Electronic Music' })
          .setTimestamp();

        const message = await interaction.reply({
          embeds: [embed],
          components: [
            new ActionRowBuilder().addComponents(selectMenu),
            new ActionRowBuilder().addComponents(stopButton)
          ]
        });

        // Component collector
        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (componentInteraction) => {
          try {
            if (componentInteraction.customId === 'difm_select') {
              const selectedChannel = componentInteraction.values[0];
              const channelInfo = DIFM_CHANNELS[selectedChannel];
              
              await componentInteraction.deferReply({ ephemeral: true });

              // Get or create player
              let player = client.shoukaku.players.get(interaction.guildId);
              
              if (!player) {
                player = await client.shoukaku.joinVoiceChannel({
                  guildId: interaction.guildId,
                  channelId: voiceChannel.id,
                  shardId: interaction.guild.shardId
                });
                await player.setGlobalVolume(35);
              }

              try {
                const result = await difmManager.connectToStream(player, selectedChannel);
                
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('📻 DI.FM Playing')
                    .setDescription(`🎵 **${channelInfo.name}** is now playing!`)
                    .addFields(
                      {
                        name: '🎶 Description',
                        value: channelInfo.description,
                        inline: false
                      },
                      {
                        name: result.isPremium ? '💎 Premium Stream' : '🆓 Free Stream',
                        value: result.isPremium ? 'High quality audio' : 'Standard quality',
                        inline: true
                      }
                    )
                    .setTimestamp()
                  ]
                });

              } catch (error) {
                await componentInteraction.editReply({
                  embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Stream Failed')
                    .setDescription(`Failed to start ${channelInfo.name}. Please try another channel.`)
                  ]
                });
              }

            } else if (componentInteraction.customId === 'difm_stop') {
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
                  .setDescription('DI.FM radio has been disconnected')
                ]
              });
            }
          } catch (error) {
            console.error('❌ Radio interaction error:', error);
          }
        });
      }
    };

    // Enhanced Uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('🎤 Open Uta\'s music control panel'),
      
      async execute(interaction) {
        console.log('🎤 Uta command executed');
        
        const player = client.shoukaku.players.get(interaction.guildId);
        const isPlaying = player?.playing || false;
        const isPaused = player?.paused || false;
        const currentTrack = player?.track?.info;

        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta\'s Music Studio')
          .setDescription('*"The world\'s greatest diva at your service!"*')
          .setTimestamp();

        if (currentTrack) {
          embed.addFields(
            {
              name: '🎵 Now Playing',
              value: `**${currentTrack.title}**\n*by ${currentTrack.author}*`,
              inline: false
            },
            {
              name: '🎭 Status',
              value: isPaused ? '⏸️ Paused' : '▶️ Playing',
              inline: true
            }
          );
        } else {
          embed.addFields({
            name: '🎵 Current Performance',
            value: '🌙 *Uta is taking a break...*\n\nUse `/radio` to start streaming!',
            inline: false
          });
        }

        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('uta_play_pause')
            .setLabel(isPaused ? 'Resume' : (isPlaying ? 'Pause' : 'Play'))
            .setStyle(ButtonStyle.Primary)
            .setEmoji(isPaused ? '▶️' : (isPlaying ? '⏸️' : '▶️'))
            .setDisabled(!isPlaying && !isPaused),
          new ButtonBuilder()
            .setCustomId('uta_stop')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⏹️')
            .setDisabled(!isPlaying && !isPaused)
        );

        await interaction.reply({
          embeds: [embed],
          components: [buttons]
        });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);
    global.commandsLoaded = 2;

    console.log('✅ Commands loaded: radio (enhanced), uta (enhanced)');

    // Register slash commands
    try {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      const commands = [radioCommand.data.toJSON(), utaCommand.data.toJSON()];
      
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅ Guild commands registered');
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('✅ Global commands registered');
      }
    } catch (regError) {
      console.error('❌ Command registration failed:', regError.message);
    }

    // Event handlers
    client.once(Events.ClientReady, () => {
      console.log(`🎉 Discord ready! Logged in as ${client.user.tag}`);
      console.log(`🏢 Guilds: ${client.guilds.cache.size}`);
      global.discordReady = true;
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isChatInputCommand()) return;
      
      console.log(`🎯 Command: /${interaction.commandName} from ${interaction.user.tag}`);
      
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
        console.log(`✅ Command /${interaction.commandName} executed`);
      } catch (error) {
        console.error(`❌ Command error:`, error.message);
        
        const content = 'There was an error executing this command!';
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply({ content, ephemeral: true });
        } else {
          await interaction.reply({ content, ephemeral: true });
        }
      }
    });

    client.on('error', (error) => {
      console.error('❌ Discord error:', error.message);
      global.discordReady = false;
    });

    // Login to Discord
    console.log('🔑 Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
    console.error('📋 Stack:', error.stack);
    console.log('⚠️ Health server continues running...');
  }
}, 1000);

console.log('🎬 Enhanced bot initialization started');
