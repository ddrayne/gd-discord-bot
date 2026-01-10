const youtubeService = require('./youtubeService');
const openaiService = require('./openaiService');
const gdbrowserService = require('./gdbrowserService');
const { extractPotentialLevelIds } = require('../utils/regexPatterns');
const logger = require('../utils/logger');

/**
 * @typedef {Object} ExtractionResult
 * @property {boolean} success - Whether a valid level ID was found
 * @property {string} [levelId] - The found level ID
 * @property {Object} [levelInfo] - Level information from GDBrowser
 * @property {'regex'|'ai'} [stage] - Which extraction stage found the ID
 * @property {'high'|'medium'|'low'} [aiConfidence] - AI confidence (if AI stage)
 * @property {string} [aiReasoning] - AI reasoning (if AI stage)
 * @property {Object} [metadata] - YouTube video metadata
 * @property {'VIDEO_NOT_FOUND'|'NO_LEVEL_ID_FOUND'} [error] - Error type if failed
 */

/**
 * Multi-stage extraction pipeline to find and validate a GD level ID from a YouTube video
 * Stage 1: Regex pattern matching on video metadata
 * Stage 2: OpenAI analysis for intelligent extraction
 * Stage 3: Validation against GDBrowser API (runs after each stage)
 *
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<ExtractionResult>}
 */
async function extractAndValidateLevelId(videoId) {
  // Step 1: Get YouTube metadata
  logger.info(`Starting extraction for video: ${videoId}`);

  let metadata;
  try {
    metadata = await youtubeService.getVideoMetadata(videoId);
  } catch (error) {
    logger.error(`Failed to fetch YouTube metadata for ${videoId}:`, error);
    return { success: false, error: 'VIDEO_NOT_FOUND' };
  }

  if (!metadata) {
    return { success: false, error: 'VIDEO_NOT_FOUND' };
  }

  const combinedText = `${metadata.title} ${metadata.description} ${metadata.tags.join(' ')}`;

  // Stage 1: Regex extraction
  logger.info('Stage 1: Attempting regex extraction...');
  const regexIds = extractPotentialLevelIds(combinedText);
  logger.debug(`Found ${regexIds.length} potential IDs via regex: ${regexIds.join(', ')}`);

  for (const id of regexIds) {
    try {
      const levelInfo = await gdbrowserService.getLevelInfoWithRetry(id);
      if (levelInfo) {
        logger.info(`Stage 1 success: Found valid level ID ${id}`);
        return {
          success: true,
          levelId: id,
          levelInfo,
          stage: 'regex',
          metadata,
        };
      }
    } catch (error) {
      logger.warn(`Failed to validate ID ${id}:`, error.message);
    }
  }

  // Stage 2: OpenAI extraction
  logger.info('Stage 2: Attempting AI extraction...');
  try {
    const aiResult = await openaiService.extractLevelIdWithAI(
      metadata.title,
      metadata.description,
      metadata.channelTitle
    );

    logger.debug(`AI result: ${JSON.stringify(aiResult)}`);

    if (aiResult.levelId && aiResult.confidence !== 'low') {
      // Skip if we already tried this ID in regex stage
      if (!regexIds.includes(aiResult.levelId)) {
        const levelInfo = await gdbrowserService.getLevelInfoWithRetry(aiResult.levelId);
        if (levelInfo) {
          logger.info(`Stage 2 success: AI found valid level ID ${aiResult.levelId}`);
          return {
            success: true,
            levelId: aiResult.levelId,
            levelInfo,
            stage: 'ai',
            aiConfidence: aiResult.confidence,
            aiReasoning: aiResult.reasoning,
            metadata,
          };
        }
      }
    }
  } catch (error) {
    logger.warn('AI extraction failed:', error.message);
  }

  // No level ID found
  logger.info(`No valid level ID found for video: ${videoId}`);
  return {
    success: false,
    error: 'NO_LEVEL_ID_FOUND',
    metadata,
  };
}

module.exports = {
  extractAndValidateLevelId,
};
