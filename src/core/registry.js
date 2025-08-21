import { REST, Routes } from 'discord.js';
import { cfg } from '../config/index.js';
import { log } from '../utils/logger.js';

let _clientResolve;
const _clientPromise = new Promise((res) => (_clientResolve = res));

export const setClient = (client) => _clientResolve(client);
export const getClient = () => _clientPromise;

export async function registerSlash(client) {
  setClient(client);

  // Wait a bit for commands to load
  await new Promise(resolve => setTimeout(resolve, 100));

  const rest = new REST({ version: '10' }).setToken(cfg.discord.token);
  const body = client._pendingSlash || [];

  console.log(`🚀 Registering ${body.length} commands...`);
  console.log(`📝 Commands to register: ${body.map(cmd => cmd.name).join(', ')}`);

  if (body.length === 0) {
    console.error('❌ No commands found to register!');
    return;
  }

  try {
    if (cfg.discord.guildId) {
      console.log(`🎯 Registering to guild: ${cfg.discord.guildId}`);
      await rest.put(Routes.applicationGuildCommands(cfg.discord.clientId, cfg.discord.guildId), { body });
      log.info('Registered GUILD commands.');
    } else {
      console.log('🌍 Registering global commands...');
      await rest.put(Routes.applicationCommands(cfg.discord.clientId), { body });
      log.info('Registered GLOBAL commands.');
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
    throw error;
  }
}
