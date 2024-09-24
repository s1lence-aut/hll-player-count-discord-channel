import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { createLogger, format, transports } from 'winston';
import config from './config.js';

dotenv.config();

// Initialize logger
const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level}: ${message}`;
    })
  ),
  transports: [new transports.Console()],
});

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Function to fetch game state from RCON API
async function getGameState(url, token) {
  try {
    const response = await fetch(`${url}/api/get_status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const contentType = response.headers.get("content-type");
    const responseText = await response.text();

    logger.debug(`Raw response from ${url}:`);
    logger.debug(`Status: ${response.status}`);
    logger.debug(`Content-Type: ${contentType}`);
    logger.debug(`Body: ${responseText}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (contentType && contentType.includes("application/json")) {
      const data = JSON.parse(responseText);
      if (data && data.result && data.result.current_players !== undefined) {
        return {
          num_players: parseInt(data.result.current_players, 10),
          max_players: parseInt(data.result.max_players, 10),
          server_name: data.result.name,
          map_name: data.result.map.pretty_name
        };
      } else {
        logger.error(`Invalid game state data structure for ${url}`);
        logger.error(`Received data: ${JSON.stringify(data)}`);
        return null;
      }
    } else {
      logger.error(`Unexpected content type from ${url}: ${contentType}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error fetching game state from ${url}: ${error.message}`);
    return null;
  }
}

// Function to check player count for a given server
async function checkPlayerCount(apiUrl) {
  try {
    const gameState = await getGameState(apiUrl, config.API_TOKEN);
    if (gameState && gameState.num_players != null) {
      logger.debug(`Server ${apiUrl} - Player count: ${gameState.num_players}`);
      logger.debug(`Server name: ${gameState.server_name}`);
      logger.debug(`Current map: ${gameState.map_name}`);
      return gameState;
    } else {
      logger.error(`Invalid game state data for ${apiUrl}: ${JSON.stringify(gameState)}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error communicating with RCON API for ${apiUrl}: ${error}`);
    return null;
  }
}

// Function to update Discord channel status
async function updateChannelStatus() {
  for (const [apiUrl, channels] of config.RCON_DISCORD_MAPPING) {
    try {
      const gameState = await checkPlayerCount(apiUrl);
      if (gameState === null) {
        logger.error(`Failed to retrieve game state for ${apiUrl}`);
        continue;
      }

      const { num_players } = gameState;
      const statusSymbol = num_players <= config.FLAG_YELLOW ? '🔴' :
        num_players <= config.FLAG_GREEN ? '🟡' : '🟢';

      for (const { channelId, suffix } of channels) {
        const newName = `${statusSymbol} - ${num_players} ${suffix}`;
        try {
          const channel = await client.channels.fetch(channelId);
          if (!channel) {
            logger.error(`Channel with ID ${channelId} not found`);
            continue;
          }

          if (channel.name !== newName) {
            await channel.setName(newName);
            logger.info(`Channel name for '${suffix}' updated to: ${newName}`);
          } else {
            logger.debug(`Channel name for '${suffix}' is already up to date: ${newName}`);
          }
        } catch (error) {
          if (error.code === 10003) {
            logger.error(`Channel with ID ${channelId} not found. It may have been deleted.`);
          } else if (error.code === 50013) {
            logger.error(`Bot lacks permissions to update channel ${channelId}`);
          } else {
            logger.error(`Error updating channel ${channelId}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error processing ${apiUrl}: ${error.message}`);
    }
  }
}

// Event handler for when the bot is ready
client.once('ready', () => {
  logger.info(`${client.user.tag} is logged in.`);
  startUpdateInterval();
});

// Function to start the update interval
function startUpdateInterval() {
  const intervalId = setInterval(async () => {
    try {
      await updateChannelStatus();
    } catch (error) {
      logger.error(`An error occurred: ${error}`);
      // If there's an error, clear the interval and restart it
      clearInterval(intervalId);
      logger.info('Restarting update interval due to error.');
      startUpdateInterval();
    }
  }, config.UPDATE_INTERVAL_SECONDS * 1000);
}

// Login to Discord
client.login(config.DISCORD_TOKEN).then(() => {
  logger.info('Bot is logging in...');
}).catch(error => {
  logger.error('Error during login:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});
