import { getClient } from '../core/registry.js';
import { Events } from 'discord.js';

const client = await getClient();

// ✅ FIXED: Use Events.InteractionCreate enum instead of string
client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = client.commands.get(i.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(i);
  } catch (e) {
    if (i.deferred || i.replied) await i.editReply('Something went wrong.');
    else await i.reply({ content: 'Something went wrong.', ephemeral: true });
  }
});
