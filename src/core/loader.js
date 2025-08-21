import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from '../utils/logger.js';
import { getClient } from './registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📂 Loading commands...');

getClient().then(async (client) => {
  try {
    const commandsDir = path.join(__dirname, '..', 'commands');
    console.log(`📁 Commands directory: ${commandsDir}`);
    
    if (!fs.existsSync(commandsDir)) {
      console.error('❌ Commands directory does not exist!');
      return;
    }

    const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith('.js'));
    console.log(`📄 Found ${files.length} command files:`, files);

    const slashDefs = [];
    for (const f of files) {
      try {
        console.log(`⚡ Loading command file: ${f}`);
        const filePath = path.join(commandsDir, f);
        const mod = await import(filePath);
        
        if (!mod?.data || !mod?.execute) {
          console.error(`❌ Invalid command file ${f}: missing data or execute`);
          continue;
        }
        
        const commandName = mod.data.name;
        console.log(`✅ Loaded command: ${commandName}`);
        
        client.commands.set(commandName, mod);
        slashDefs.push(mod.data.toJSON());
      } catch (error) {
        console.error(`❌ Error loading command file ${f}:`, error);
      }
    }

    console.log(`📋 Total commands loaded: ${slashDefs.length}`);
    console.log(`🎯 Command names: ${slashDefs.map(cmd => cmd.name).join(', ')}`);
    
    client._pendingSlash = slashDefs;
    console.log('✅ Commands ready for registration');
  } catch (error) {
    console.error('❌ Error in command loader:', error);
  }
}).catch((error) => {
  console.error('❌ Failed to get client in loader:', error);
});
