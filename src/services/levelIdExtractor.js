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
 * @property {'regex'|'ai'|'name_search'} [stage] - Which extraction stage found the ID
 * @property {'high'|'medium'|'low'} [aiConfidence] - AI confidence (if AI stage)
 * @property {string} [aiReasoning] - AI reasoning (if AI stage)
 * @property {string[]} [searchedNames] - Level names searched (if name search stage)
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

  if (regexIds.length > 0) {
    logger.debug(`Found ${regexIds.length} potential IDs via regex: ${regexIds.join(', ')}`);
  } else {
    logger.debug('No potential IDs found via regex patterns');
  }

  for (const id of regexIds) {
    try {
      logger.debug(`Validating potential ID: ${id}`);
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
      } else {
        logger.debug(`ID ${id} is not a valid level`);
      }
    } catch (error) {
      logger.warn(`Failed to validate ID ${id}:`, error.message);
    }
  }

  // Stage 2: OpenAI extraction
  logger.info('Stage 2: Attempting AI extraction...');
  let aiResult = null;
  try {
    aiResult = await openaiService.extractLevelIdWithAI(
      metadata.title,
      metadata.description,
      metadata.channelTitle
    );

    logger.debug(`AI extraction result - ID: ${aiResult.levelId || 'none'}, Names: [${aiResult.levelNames.join(', ')}], Confidence: ${aiResult.confidence}`);
    logger.debug(`AI reasoning: ${aiResult.reasoning}`);

    if (aiResult.levelId && aiResult.confidence !== 'low') {
      // Skip if we already tried this ID in regex stage
      if (!regexIds.includes(aiResult.levelId)) {
        logger.debug(`Validating AI-extracted ID: ${aiResult.levelId}`);
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
        } else {
          logger.debug(`AI-extracted ID ${aiResult.levelId} is not valid`);
        }
      } else {
        logger.debug(`AI-extracted ID ${aiResult.levelId} already tried in regex stage`);
      }
    }
  } catch (error) {
    logger.warn('AI extraction failed:', error.message);
  }

  // Stage 3: Level name search
  if (aiResult && aiResult.levelNames && aiResult.levelNames.length > 0 && aiResult.confidence !== 'low') {
    logger.info(`Stage 3: Attempting level name search for: [${aiResult.levelNames.join(', ')}]`);
    logger.debug(`Searching with ${aiResult.levelNames.length} name(s), will try variations if needed`);
    try {
      const levelInfo = await gdbrowserService.searchLevelByNameWithFallback(aiResult.levelNames);
      if (levelInfo) {
        logger.info(`Stage 3 success: Found level "${levelInfo.name}" (ID: ${levelInfo.id}) by name search`);
        return {
          success: true,
          levelId: levelInfo.id,
          levelInfo,
          stage: 'name_search',
          aiConfidence: aiResult.confidence,
          aiReasoning: aiResult.reasoning,
          searchedNames: aiResult.levelNames,
          metadata,
        };
      } else {
        logger.debug('Name search exhausted all variations without finding a match');
      }
    } catch (error) {
      logger.warn(`Level name search error:`, error.message);
    }
  } else if (aiResult && aiResult.levelNames && aiResult.levelNames.length > 0) {
    logger.debug(`Skipping name search: AI confidence is low (${aiResult.confidence})`);
  } else if (aiResult) {
    logger.debug('Skipping name search: No level names extracted by AI');
  }

  // No level ID found after all stages
  logger.info(`No valid level ID found for video ${videoId} after trying all extraction methods`);
  logger.debug(`Summary - Regex IDs tried: ${regexIds.length}, AI extracted: ${aiResult ? `ID=${aiResult.levelId || 'none'}, Names=[${aiResult.levelNames.join(', ')}]` : 'failed'}`);
  return {
    success: false,
    error: 'NO_LEVEL_ID_FOUND',
    metadata,
  };
}

module.exports = {
  extractAndValidateLevelId,
};
