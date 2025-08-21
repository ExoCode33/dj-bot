import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../utils/logger.js';
import { getClient } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const client = await getClient();

  const commandsDir = path.join(__dirname, '..', 'commands');
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));

  const slashDefs = [];
  for (const f of files) {
    const mod = await import(path.join(commandsDir, f));
    if (!mod?.data || !mod?.execute) continue;
    client.commands.set(mod.data.name, mod);
    slashDefs.push(mod.data.toJSON());
  }

  client._pendingSlash = slashDefs;
})();
