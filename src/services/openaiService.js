const OpenAI = require('openai');
const { z } = require('zod');
const config = require('../config/config');
const { openaiLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Schema for structured output
const LevelIdResponseSchema = z.object({
  levelId: z.string().nullable().describe('The Geometry Dash level ID if found, or null if not found'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the extraction'),
  reasoning: z.string().describe('Brief explanation of how the ID was determined'),
});

/**
 * Use OpenAI to extract a Geometry Dash level ID from video metadata
 * @param {string} title - Video title
 * @param {string} description - Video description (will be truncated if too long)
 * @param {string} channelTitle - Channel name
 * @returns {Promise<{levelId: string|null, confidence: 'high'|'medium'|'low', reasoning: string}>}
 */
async function extractLevelIdWithAI(title, description, channelTitle) {
  return openaiLimiter.schedule(async () => {
    try {
      // Truncate description to avoid token limits
      const truncatedDesc = description.length > 2000
        ? description.slice(0, 2000) + '...'
        : description;

      const prompt = `Analyze this YouTube video metadata to extract a Geometry Dash level ID.

Title: ${title}
Channel: ${channelTitle}
Description: ${truncatedDesc}

Geometry Dash level IDs are typically 6-9 digit numbers. Look for:
- Explicit mentions like "ID: 12345678" or "Level ID: 12345678"
- Numbers in parentheses that could be IDs
- Context clues that suggest a number is a level ID
- The level name mentioned alongside an ID

If you cannot find a level ID with reasonable confidence, return null for levelId.`;

      const response = await openai.responses.parse({
        model: config.openai.model,
        input: [
          {
            role: 'system',
            content: 'You are an expert at extracting Geometry Dash level IDs from YouTube video metadata. Be precise and only return IDs you are confident about.',
          },
          { role: 'user', content: prompt },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'level_id_extraction',
            schema: {
              type: 'object',
              properties: {
                levelId: {
                  type: ['string', 'null'],
                  description: 'The Geometry Dash level ID if found, or null if not found',
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Confidence level of the extraction',
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of how the ID was determined',
                },
              },
              required: ['levelId', 'confidence', 'reasoning'],
              additionalProperties: false,
            },
            strict: true,
          },
        },
      });

      const parsed = LevelIdResponseSchema.parse(JSON.parse(response.output_text));
      return parsed;
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw error;
    }
  });
}

module.exports = {
  extractLevelIdWithAI,
};
