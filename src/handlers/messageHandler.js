const { extractVideoIds } = require('../utils/youtubeParser');
const { extractAndValidateLevelId } = require('../services/levelIdExtractor');
const { createLevelEmbed, createErrorEmbed } = require('../embeds/levelEmbed');
const logger = require('../utils/logger');

// Maximum videos to process per message (prevent spam)
const MAX_VIDEOS_PER_MESSAGE = 3;

/**
 * Handle incoming Discord messages
 * Detects YouTube links and extracts GD level information
 * @param {import('discord.js').Message} message
 */
async function handleMessage(message) {
  // Ignore bot messages
  if (message.author.bot) return;

  // Extract YouTube video IDs from the message
  const videoIds = extractVideoIds(message.content);

  if (videoIds.length === 0) return;

  logger.info(`Processing ${videoIds.length} YouTube link(s) from ${message.author.tag}`);

  // Limit videos to process
  const videosToProcess = videoIds.slice(0, MAX_VIDEOS_PER_MESSAGE);

  for (const videoId of videosToProcess) {
    try {
      // Show typing indicator while processing
      await message.channel.sendTyping();

      const result = await extractAndValidateLevelId(videoId);

      if (result.success) {
        const embed = createLevelEmbed(
          result.levelInfo,
          result.metadata,
          result.stage
        );
        await message.reply({ embeds: [embed] });
        logger.info(`Successfully found level ${result.levelId} for video ${videoId}`);
      } else {
        // Silent failure for auto-detection (don't spam "not found" messages)
        // Only log, don't reply
        logger.info(`No level ID found for video ${videoId}: ${result.error}`);
      }
    } catch (error) {
      logger.error(`Error processing video ${videoId}:`, error);
      // Don't reply with error to avoid spam on transient failures
    }
  }

  // Warn if we skipped some videos
  if (videoIds.length > MAX_VIDEOS_PER_MESSAGE) {
    logger.debug(`Skipped ${videoIds.length - MAX_VIDEOS_PER_MESSAGE} videos (limit reached)`);
  }
}

module.exports = {
  handleMessage,
};
