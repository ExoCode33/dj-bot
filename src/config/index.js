import { readEnvBool, readEnvNum } from './env.js';

export const cfg = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || ''
  },
  lavalink: {
    name: process.env.LAVALINK_NAME || 'railway',
    url: process.env.LAVALINK_URL || 'localhost:2333',
    auth: process.env.LAVALINK_AUTH || 'UtaUtaDj',
    secure: readEnvBool('LAVALINK_SECURE', true)
  },
  uta: {
    authorizedRoleId: process.env.AUTHORIZED_ROLE_ID || '',
    defaultVolume: readEnvNum('DEFAULT_VOLUME', 35)
  },
  difm: {
    apiKey: process.env.DIFM_API_KEY || ''
  }
};
