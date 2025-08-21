import { getClient } from '../core/registry.js';

const client = await getClient();

client.on('interactionCreate', async (i) => {
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
