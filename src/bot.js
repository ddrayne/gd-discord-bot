const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('./config/config');
const { handleMessage } = require('./handlers/messageHandler');
const logger = require('./utils/logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  logger.info(`Bot is ready! Logged in as ${c.user.tag}`);
  logger.info(`Serving ${c.guilds.cache.size} guild(s)`);
});

client.on(Events.MessageCreate, handleMessage);

client.on(Events.Error, (error) => {
  logger.error('Discord client error:', error);
});

client.on(Events.Warn, (warning) => {
  logger.warn('Discord client warning:', warning);
});

/**
 * Start the Discord bot
 */
async function start() {
  try {
    logger.info('Starting bot...');
    await client.login(config.discord.token);
  } catch (error) {
    logger.error('Failed to login:', error);
    process.exit(1);
  }
}

module.exports = { client, start };
