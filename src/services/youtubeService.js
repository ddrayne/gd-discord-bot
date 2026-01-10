const { google } = require('googleapis');
const config = require('../config/config');
const { youtubeLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

const youtube = google.youtube({
  version: 'v3',
  auth: config.youtube.apiKey,
});

/**
 * Fetch video metadata from YouTube
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<{title: string, description: string, channelTitle: string, tags: string[]} | null>}
 */
async function getVideoMetadata(videoId) {
  return youtubeLimiter.schedule(async () => {
    try {
      const response = await youtube.videos.list({
        part: ['snippet'],
        id: [videoId],
      });

      if (!response.data.items || response.data.items.length === 0) {
        logger.warn(`Video not found: ${videoId}`);
        return null;
      }

      const snippet = response.data.items[0].snippet;
      return {
        title: snippet.title || '',
        description: snippet.description || '',
        channelTitle: snippet.channelTitle || '',
        tags: snippet.tags || [],
      };
    } catch (error) {
      logger.error(`YouTube API error for video ${videoId}:`, error);
      throw error;
    }
  });
}

module.exports = {
  getVideoMetadata,
};
