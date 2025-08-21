import { REST, Routes } from 'discord.js';
import { cfg } from '../config/index.js';
import { log } from '../utils/logger.js';

let _clientResolve;
const _clientPromise = new Promise((res) => (_clientResolve = res));

export const setClient = (client) => _clientResolve(client);
export const getClient = () => _clientPromise;

export async function registerSlash(client) {
  setClient(client);

  const rest = new REST({ version: '10' }).setToken(cfg.discord.token);
  const body = client._pendingSlash || [];

  if (cfg.discord.guildId) {
    await rest.put(Routes.applicationGuildCommands(cfg.discord.clientId, cfg.discord.guildId), { body });
    log.info('Registered GUILD commands.');
  } else {
    await rest.put(Routes.applicationCommands(cfg.discord.clientId), { body });
    log.info('Registered GLOBAL commands.');
  }
}
