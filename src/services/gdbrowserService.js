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

module.exports = {
  getLevelInfo,
  validateLevelId,
  getLevelInfoWithRetry,
};
