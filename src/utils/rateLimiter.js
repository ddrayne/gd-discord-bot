const Bottleneck = require('bottleneck');
const config = require('../config/config');

// YouTube API limiter
const youtubeLimiter = new Bottleneck({
  reservoir: config.rateLimits.youtube,
  reservoirRefreshAmount: config.rateLimits.youtube,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 5,
});

// OpenAI API limiter
const openaiLimiter = new Bottleneck({
  reservoir: config.rateLimits.openai,
  reservoirRefreshAmount: config.rateLimits.openai,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 3,
});

// GDBrowser API limiter (conservative to respect their servers)
const gdbrowserLimiter = new Bottleneck({
  reservoir: config.rateLimits.gdbrowser,
  reservoirRefreshAmount: config.rateLimits.gdbrowser,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 2,
  minTime: 2000, // At least 2 seconds between requests
});

module.exports = {
  youtubeLimiter,
  openaiLimiter,
  gdbrowserLimiter,
};
