import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { initLavalink } from '../features/music/lavalink.js';

export function createClient() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
  });

  client.commands = new Collection();
  client.shoukaku = initLavalink(client);

  return client;
}
