import dotenv from 'dotenv';
dotenv.config();

const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  UPDATE_INTERVAL_SECONDS: parseInt(process.env.UPDATE_INTERVAL_SECONDS, 10) || 300,
  API_TOKEN: process.env.API_TOKEN,
  FLAG_YELLOW: parseInt(process.env.FLAG_YELLOW, 10) || 5,
  FLAG_GREEN: parseInt(process.env.FLAG_GREEN, 10) || 10,
  RCON_DISCORD_MAPPING: new Map([
    ['http://your-server-1-ip:port', [
      { channelId: 'your-channel-id-1', suffix: ' - Server 1' },
      { channelId: 'your-channel-id-2', suffix: ' - Server 1 Chat' }
    ]],
    ['http://your-server-2-ip:port', [
      { channelId: 'your-channel-id-3', suffix: ' - Server 2' },
      { channelId: 'your-channel-id-4', suffix: ' - Server 2 Chat' }
    ]]
  ])
};

// Validate required environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'API_TOKEN', 'FLAG_YELLOW', 'FLAG_GREEN'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;