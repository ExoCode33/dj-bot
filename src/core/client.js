import { Client, GatewayIntentBits, Collection } from 'discord.js';

export function createClient() {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
  });

  client.commands = new Collection();

  import('./loader.js');
  return client;
}
