require('dotenv').config();

module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
  },
  youtube: {
    apiKey: process.env.YOUTUBE_API_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
  gdbrowser: {
    baseUrl: process.env.GDBROWSER_BASE_URL || 'https://gdbrowser.com/api',
  },
  rateLimits: {
    youtube: parseInt(process.env.YOUTUBE_RATE_LIMIT_PER_MINUTE) || 50,
    openai: parseInt(process.env.OPENAI_RATE_LIMIT_PER_MINUTE) || 20,
    gdbrowser: parseInt(process.env.GDBROWSER_RATE_LIMIT_PER_MINUTE) || 30,
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};
