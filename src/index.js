import { readEnvBool, readEnvNum } from './env.js';

export const cfg = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || ''
  },
  lavalink: {
    // Primary (your Railway instance)
    primary: {
      name: process.env.LAVALINK_NAME || 'railway-node',
      url: process.env.LAVALINK_URL || 'localhost:2333',
      auth: process.env.LAVALINK_AUTH || 'youshallnotpass',
      secure: readEnvBool('LAVALINK_SECURE', false)
    },
    // Backup public instances (if your Railway fails)
    backup: [
      {
        name: 'lavalink-public-1',
        url: 'lavalink.devz.cloud:80',
        auth: 'Devz',
        secure: false
      },
      {
        name: 'lavalink-public-2', 
        url: 'lava.link:80',
        auth: 'lava',
        secure: false
      }
    ]
  },
  uta: {
    authorizedRoleId: process.env.AUTHORIZED_ROLE_ID || '',
    defaultVolume: readEnvNum('DEFAULT_VOLUME', 35)
  }
};
