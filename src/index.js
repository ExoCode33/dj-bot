import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// PRIORITY: Start health server immediately
console.log('🚀 STARTING UTA DJ BOT - World\'s Greatest Diva Edition');
console.log('📅 Time:', new Date().toISOString());
console.log('🎯 PORT:', process.env.PORT || 3000);

const port = process.env.PORT || 3000;
const RADIO_CHANNEL_ID = process.env.RADIO_CHANNEL_ID || "1408960645826871407";
const DEFAULT_VOLUME = parseInt(process.env.DEFAULT_VOLUME) || 35;

// NEW: Auto-connect and auto-play variables - FIXED
const AUTO_CONNECT_CHANNEL_ID = process.env.AUTO_CONNECT_CHANNEL_ID && process.env.AUTO_CONNECT_CHANNEL_ID !== 'false' ? process.env.AUTO_CONNECT_CHANNEL_ID : null;
const AUTO_START_STATION = process.env.AUTO_START_STATION && process.env.AUTO_START_STATION !== 'false' ? process.env.AUTO_START_STATION : null;

console.log(`🔊 Default volume set to: ${DEFAULT_VOLUME}%`);
console.log(`📻 Auto-connect channel: ${AUTO_CONNECT_CHANNEL_ID || 'Disabled'}`);
console.log(`🎵 Auto-start station: ${AUTO_START_STATION || 'Disabled'}`);

// Get current directory for loading commands
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global variables
global.discordReady = false;
global.lavalinkReady = false;

// Health server - MUST start first and stay simple
const server = http.createServer((req, res) => {
  console.log(`📡 Health check: ${req.url}`);
  
  if (req.url === '/health') {
    const nodes = global.lavalinkReady && client?.shoukaku?.nodes ? 
      Array.from(client.shoukaku.nodes.entries()).reduce((acc, [name, node]) => {
        acc[name] = {
          state: node.state,
          stateText: ['DISCONNECTED', 'CONNECTING', 'CONNECTED', 'RECONNECTING'][node.state] || 'UNKNOWN'
        };
        return acc;
      }, {}) : {};
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'uta-dj-bot',
      discord: global.discordReady || false,
      lavalink: global.lavalinkReady || false,
      nodes: nodes,
      defaultVolume: DEFAULT_VOLUME,
      autoConnect: !!AUTO_CONNECT_CHANNEL_ID,
      autoStart: !!AUTO_START_STATION,
      version: '2.0.7'
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

// Command loader function - only loads actual slash commands
async function loadSlashCommands(client) {
  console.log('📂 Loading slash commands...');
  
  const commandsDir = path.join(__dirname, 'commands');
  console.log(`📁 Commands directory: ${commandsDir}`);
  
  if (!fs.existsSync(commandsDir)) {
    console.warn('⚠️ Commands directory does not exist - no slash commands will be loaded');
    return [];
  }

  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
  console.log(`📄 Found ${files.length} command files:`, files);

  const commands = [];
  for (const file of files) {
    try {
      console.log(`⚡ Loading command file: ${file}`);
      const filePath = path.join(commandsDir, file);
      const command = await import(filePath);
      
      if (!command?.data || !command?.execute) {
        console.error(`❌ Invalid command file ${file}: missing data or execute`);
        continue;
      }
      
      const commandName = command.data.name;
      console.log(`✅ Loaded slash command: ${commandName}`);
      
      client.commands.set(commandName, command);
      commands.push(command.data.toJSON());
    } catch (error) {
      console.error(`❌ Error loading command file ${file}:`, error);
    }
  }

  console.log(`📋 Total slash commands loaded: ${commands.length}`);
  if (commands.length > 0) {
    console.log(`🎯 Slash command names: ${commands.map(cmd => cmd.name).join(', ')}`);
  }
  
  return commands;
}

// Start Discord bot
async function startDiscordBot() {
  try {
    console.log('🤖 Starting Discord bot...');
    
    if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
      console.error('❌ Missing required environment variables');
      return;
    }

    // Dynamic imports - FIXED PATHS
    const discord = await import('discord.js');
    const shoukaku = await import('shoukaku');
    
    // Import our custom modules with correct relative paths
    const { SimpleRadioManager } = await import('./features/radio/manager.js');
    const { RadioInteractionHandler } = await import('./features/radio/interactions.js');
    const { RadioUI } = await import('./features/radio/ui.js');
    
    // Import bot commands (not slash commands) - FIXED: Only radioCommand
    const { radioCommand } = await import('./bot/commands.js');
    
    console.log('✅ Libraries and modules loaded');

    const { 
      Client, 
      GatewayIntentBits, 
      Collection, 
      Events, 
      REST, 
      Routes,
      AttachmentBuilder
    } = discord;
    
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates, 
        GatewayIntentBits.GuildMessages
      ]
    });

    client.commands = new Collection();

    // Load actual slash commands from /commands directory
    const slashCommands = await loadSlashCommands(client);
    
    // Add bot-specific commands (only /radio redirect)
    client.commands.set('radio', radioCommand);
    
    // Combine all commands for registration - FIXED: Removed utaCommand
    const allCommands = [
      ...slashCommands,
      radioCommand.data.toJSON()
    ];

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

    // Initialize managers and handlers
    const radioManager = new SimpleRadioManager(client);
    const currentlyPlaying = new Map(); // Track what's playing per guild
    let persistentMessage = null;

    // Update persistent message function
    async function updatePersistentMessage() {
      if (persistentMessage) {
        try {
          const embed = await RadioUI.createPersistentRadioEmbed(client, currentlyPlaying);
          const components = await RadioUI.createPersistentRadioComponents(persistentMessage.guildId, currentlyPlaying);
          
          // Check if banner exists and attach it
          const bannerPath = path.join(process.cwd(), 'images', 'uta-banner.gif');
          let files = [];
          
          if (fs.existsSync(bannerPath)) {
            const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'uta-banner.gif' });
            files.push(bannerAttachment);
          }
          
          await persistentMessage.edit({
            embeds: [embed],
            components: components,
            files: files
          });
        } catch (error) {
          console.warn('⚠️ Failed to update persistent message:', error.message);
        }
      }
    }

    // Initialize radio interaction handler
    const radioInteractionHandler = new RadioInteractionHandler(
      client, 
      radioManager, 
      currentlyPlaying, 
      updatePersistentMessage
    );

    // Initialize auto-play function - NEW FEATURE
    async function initializeAutoPlay() {
      try {
        console.log('🤖 Initializing auto-connect and auto-play...');
        
        // Import stations to find the station key
        const { RADIO_STATIONS } = await import('./config/stations.js');
        
        // Find station by name
        let stationKey = null;
        for (const [key, station] of Object.entries(RADIO_STATIONS)) {
          if (station.name === AUTO_START_STATION) {
            stationKey = key;
            break;
          }
        }
        
        if (!stationKey) {
          console.error(`❌ Auto-start station not found: "${AUTO_START_STATION}"`);
          console.log('Available stations:', Object.values(RADIO_STATIONS).map(s => s.name).join(', '));
          return;
        }
        
        // Get the voice channel
        const voiceChannel = await client.channels.fetch(AUTO_CONNECT_CHANNEL_ID);
        if (!voiceChannel || voiceChannel.type !== 2) { // 2 = GUILD_VOICE
          console.error(`❌ Auto-connect voice channel not found or invalid: ${AUTO_CONNECT_CHANNEL_ID}`);
          return;
        }
        
        console.log(`🎤 Auto-connecting to voice channel: #${voiceChannel.name}`);
        console.log(`🎵 Auto-starting station: ${RADIO_STATIONS[stationKey].name}`);
        
        // Use radio manager to start playing
        const result = await radioManager.switchToStation(
          voiceChannel.guild.id,
          stationKey,
          voiceChannel.id
        );
        
        // Track what's playing
        currentlyPlaying.set(voiceChannel.guild.id, {
          stationKey: stationKey,
          stationName: RADIO_STATIONS[stationKey].name,
          voiceChannelId: voiceChannel.id,
          startedAt: Date.now()
        });
        
        console.log(`✅ Auto-play started successfully!`);
        console.log(`🎧 Playing "${RADIO_STATIONS[stationKey].name}" in #${voiceChannel.name}`);
        
      } catch (error) {
        console.error('❌ Auto-play initialization failed:', error.message);
        console.log('💡 Falling back to regular radio channel setup...');
        
        // Fall back to regular radio setup
        setTimeout(() => {
          initializePersistentRadio();
        }, 2000);
      }
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

        // Create embed and components
        const embed = await RadioUI.createPersistentRadioEmbed(client, currentlyPlaying);
        const components = await RadioUI.createPersistentRadioComponents(channel.guildId, currentlyPlaying);

        // Create banner attachment
        const bannerPath = path.join(process.cwd(), 'images', 'uta-banner.gif');
        let files = [];
        
        if (fs.existsSync(bannerPath)) {
          const bannerAttachment = new AttachmentBuilder(bannerPath, { name: 'uta-banner.gif' });
          files.push(bannerAttachment);
          console.log('✅ Banner attachment created');
        } else {
          console.warn('⚠️ Banner file not found at:', bannerPath);
          console.warn('⚠️ Make sure your file is named: images/uta-banner.gif');
          console.warn('⚠️ Banner will not be displayed');
        }

        // Send message with banner
        persistentMessage = await channel.send({
          embeds: [embed],
          components: components,
          files: files
        });

        console.log(`✅ Persistent radio created: ${persistentMessage.id}`);

      } catch (error) {
        console.error(`❌ Failed to initialize radio: ${error.message}`);
      }
    }

    // Register all commands
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    try {
      console.log(`📝 Registering ${allCommands.length} total commands...`);
      console.log(`🎯 Commands: ${allCommands.map(cmd => cmd.name).join(', ')}`);
      
      if (process.env.GUILD_ID) {
        await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: allCommands });
        console.log('✅ Guild commands registered');
      } else {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: allCommands });
        console.log('✅ Global commands registered');
      }
    } catch (error) {
      console.error('❌ Command registration failed:', error.message);
    }

    // Event handlers
    client.once(Events.ClientReady, async () => {
      console.log(`🎉 Discord ready: ${client.user.tag}`);
      global.discordReady = true;
      
      // NEW: Check for auto-connect and auto-play
      if (AUTO_CONNECT_CHANNEL_ID && AUTO_START_STATION) {
        console.log('🚀 Auto-connect and auto-play enabled - skipping radio channel setup');
        setTimeout(() => {
          initializeAutoPlay();
        }, 3000);
      } else {
        setTimeout(() => {
          initializePersistentRadio();
        }, 3000);
      }
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.commands.get(interaction.commandName);
          if (command) {
            await command.execute(interaction);
          }
        } else if (interaction.isStringSelectMenu() || interaction.isButton()) {
          await radioInteractionHandler.handle(interaction, persistentMessage);
        }
      } catch (error) {
        console.error('❌ Interaction error:', error.message);
      }
    });

    // Enhanced voice state update handler to clean up disconnected players
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      try {
        // Check if the bot was disconnected from a voice channel
        if (oldState.member?.id === client.user.id && oldState.channelId && !newState.channelId) {
          console.log(`🔌 Bot disconnected from voice channel in guild ${oldState.guild.id}`);
          
          // Clean up player and tracking
          const player = client.shoukaku.players.get(oldState.guild.id);
          if (player) {
            try {
              await player.destroy();
              client.shoukaku.players.delete(oldState.guild.id);
            } catch (error) {
              console.warn('⚠️ Error cleaning up disconnected player:', error.message);
              client.shoukaku.players.delete(oldState.guild.id);
            }
          }
          
          // Remove from tracking
          currentlyPlaying.delete(oldState.guild.id);
          
          // Update persistent message
          await updatePersistentMessage();
        }
      } catch (error) {
        console.error('❌ Voice state update error:', error.message);
      }
    });

    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Discord login initiated');

  } catch (error) {
    console.error('💥 Bot startup failed:', error.message);
    console.error('Full error:', error);
  }
}

// Start the bot
setTimeout(() => {
  startDiscordBot();
}, 2000);

console.log('🎤 Uta DJ Bot initialization started');
