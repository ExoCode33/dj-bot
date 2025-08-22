import 'dotenv/config';
import http from 'node:http';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT');
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

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  // Don't exit - keep health server running
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
  // Don't exit - keep health server running
});

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
    const { Client, GatewayIntentBits, Collection, Events, SlashCommandBuilder, EmbedBuilder, REST, Routes } = discord;
    
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
          resumeKey: 'uta-bot-simple',
          resumeTimeout: 30,
          reconnectTries: 3,
          reconnectInterval: 2000
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
      } catch (lavalinkError) {
        console.error('❌ Lavalink setup failed:', lavalinkError.message);
      }
    }

    // Simple radio command
    const radioCommand = {
      data: new SlashCommandBuilder()
        .setName('radio')
        .setDescription('Test radio command'),
      async execute(interaction) {
        console.log('🎵 Radio command executed');
        
        const embed = new EmbedBuilder()
          .setColor('#FF6B35')
          .setTitle('📻 Radio Test')
          .setDescription('Radio command is working!')
          .addFields(
            { name: 'Status', value: 'Command loaded successfully', inline: true },
            { name: 'Lavalink', value: global.lavalinkReady ? 'Connected' : 'Disconnected', inline: true }
          );

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Simple uta command
    const utaCommand = {
      data: new SlashCommandBuilder()
        .setName('uta')
        .setDescription('Test uta command'),
      async execute(interaction) {
        console.log('🎤 Uta command executed');
        
        const embed = new EmbedBuilder()
          .setColor('#FF6B9D')
          .setTitle('🎤 Uta Test')
          .setDescription('Uta command is working!')
          .addFields(
            { name: 'Status', value: 'Command loaded successfully', inline: true },
            { name: 'Voice Channel', value: interaction.member?.voice?.channel?.name || 'Not connected', inline: true }
          );

        await interaction.reply({ embeds: [embed] });
      }
    };

    // Register commands
    client.commands.set('radio', radioCommand);
    client.commands.set('uta', utaCommand);

    console.log('✅ Commands loaded: radio, uta');

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

console.log('🎬 Bot initialization started');
