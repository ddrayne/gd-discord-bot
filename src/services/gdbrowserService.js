const axios = require('axios');
const config = require('../config/config');
const { gdbrowserLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

/**
 * Fetch level information from GDBrowser API
 * @param {string} levelId - Geometry Dash level ID
 * @returns {Promise<Object|null>} - Level data or null if not found
 */
async function getLevelInfo(levelId) {
  return gdbrowserLimiter.schedule(async () => {
    try {
      const response = await axios.get(
        `${config.gdbrowser.baseUrl}/level/${levelId}`,
        { timeout: 10000 }
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === -1) {
        logger.debug(`Level not found: ${levelId}`);
        return null;
      }
      logger.error(`GDBrowser API error for level ${levelId}:`, error.message);
      throw error;
    }
  });
}

/**
 * Validate if a level ID exists in Geometry Dash
 * @param {string} levelId - Level ID to validate
 * @returns {Promise<boolean>}
 */
async function validateLevelId(levelId) {
  const levelInfo = await getLevelInfo(levelId);
  return levelInfo !== null;
}

/**
 * Fetch level info with retry logic for transient failures
 * @param {string} levelId - Level ID to fetch
 * @param {number} retries - Number of retries (default 3)
 * @returns {Promise<Object|null>}
 */
async function getLevelInfoWithRetry(levelId, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await getLevelInfo(levelId);
    } catch (error) {
      if (i === retries - 1) {
        logger.error(`Failed to fetch level ${levelId} after ${retries} attempts`);
        return null;
      }
      // Exponential backoff
      const delay = 1000 * Math.pow(2, i);
      logger.warn(`Retrying level fetch for ${levelId} in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return null;
}

/**
 * Search for a level by name
 * @param {string} levelName - Name of the level to search for
 * @returns {Promise<Object|null>} - First matching level or null if not found
 */
async function searchLevelByName(levelName) {
  return gdbrowserLimiter.schedule(async () => {
    try {
      const response = await axios.get(
        `${config.gdbrowser.baseUrl}/search/${encodeURIComponent(levelName)}`,
        { timeout: 10000 }
      );

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        logger.debug(`No levels found for name: ${levelName}`);
        return null;
      }

      // Return the first (most relevant) result
      const firstResult = response.data[0];
      logger.debug(`Found level "${firstResult.name}" (ID: ${firstResult.id}) for search: ${levelName}`);
      return firstResult;
    } catch (error) {
      if (error.response?.status === 404) {
        logger.debug(`No levels found for name: ${levelName}`);
        return null;
      }
      logger.error(`GDBrowser search error for "${levelName}":`, error.message);
      throw error;
    }
  });
}

/**
 * Generate name variations for fallback searches
 * @param {string} levelName - Original level name
 * @returns {string[]} - Array of name variations to try
 */
function generateNameVariations(levelName) {
  const variations = [];

  // Original name
  variations.push(levelName);

  // Remove common prefixes/suffixes
  const cleanedName = levelName
    .replace(/^(Beating|100%|All Coins?|Completed?|Verified?|)\s+/i, '')
    .replace(/\s+(Geometry Dash|GD|Level|Demon)$/i, '')
    .trim();

  if (cleanedName !== levelName) {
    variations.push(cleanedName);
  }

  // Try splitting on common separators (X, &, vs, etc.)
  const separators = [' X ', ' x ', ' & ', ' and ', ' vs ', ' VS ', ' - ', '|'];
  for (const sep of separators) {
    if (levelName.includes(sep)) {
      const parts = levelName.split(sep).map(p => p.trim());
      variations.push(...parts);
    }
  }

  // Remove duplicates while preserving order
  return [...new Set(variations)].filter(v => v.length > 0);
}

/**
 * Search for a level by name with fallback variations
 * Tries multiple name variations if the original search fails
 * @param {string[]} levelNames - Array of level names to search for
 * @returns {Promise<Object|null>} - First matching level or null if not found
 */
async function searchLevelByNameWithFallback(levelNames) {
  // Try each provided name first
  for (const name of levelNames) {
    try {
      const result = await searchLevelByName(name);
      if (result) {
        logger.info(`Found level "${result.name}" (ID: ${result.id}) using name: ${name}`);
        return result;
      }
    } catch (error) {
      logger.warn(`Search failed for "${name}":`, error.message);
    }
  }

  // If no exact matches, try variations
  logger.debug('Trying name variations for fallback search...');
  const allVariations = [];
  for (const name of levelNames) {
    const variations = generateNameVariations(name);
    allVariations.push(...variations);
  }

  // Remove duplicates and names we already tried
  const uniqueVariations = [...new Set(allVariations)]
    .filter(v => !levelNames.includes(v));

  for (const variation of uniqueVariations) {
    try {
      const result = await searchLevelByName(variation);
      if (result) {
        logger.info(`Found level "${result.name}" (ID: ${result.id}) using variation: ${variation}`);
        return result;
      }
    } catch (error) {
      logger.debug(`Variation search failed for "${variation}"`);
    }
  }

  logger.debug(`No levels found after trying ${levelNames.length} names and ${uniqueVariations.length} variations`);
  return null;
}

module.exports = {
  getLevelInfo,
  validateLevelId,
  getLevelInfoWithRetry,
  searchLevelByName,
  searchLevelByNameWithFallback,
};
