import { Shoukaku, Connectors } from 'shoukaku';
import { cfg } from '../../config/index.js';
import { log } from '../../utils/logger.js';

export function initLavalink(client) {
  const nodes = [
    { name: cfg.lavalink.name, url: cfg.lavalink.url, auth: cfg.lavalink.auth, secure: cfg.lavalink.secure }
  ];

  const shoukaku = new Shoukaku(new Connectors.DiscordJS(client), nodes, {
    resume: true,
    reconnectTries: 3,
    restTimeout: 10000
  });

  shoukaku.on('ready', (name) => log.info(`Lavalink node "${name}" ready`));
  return shoukaku;
}
