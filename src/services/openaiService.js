const OpenAI = require('openai');
const { z } = require('zod');
const config = require('../config/config');
const { openaiLimiter } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

const openai = new OpenAI({ apiKey: config.openai.apiKey });

// Schema for structured output
const LevelIdResponseSchema = z.object({
  levelId: z.string().nullable().describe('The Geometry Dash level ID if found, or null if not found'),
  levelNames: z.array(z.string()).describe('Array of Geometry Dash level names mentioned (can be multiple for mashups/collaborations), empty array if none found'),
  confidence: z.enum(['high', 'medium', 'low']).describe('Confidence level of the extraction'),
  reasoning: z.string().describe('Brief explanation of how the ID or names were determined'),
});

/**
 * Use OpenAI to extract a Geometry Dash level ID or names from video metadata
 * @param {string} title - Video title
 * @param {string} description - Video description (will be truncated if too long)
 * @param {string} channelTitle - Channel name
 * @returns {Promise<{levelId: string|null, levelNames: string[], confidence: 'high'|'medium'|'low', reasoning: string}>}
 */
async function extractLevelIdWithAI(title, description, channelTitle) {
  return openaiLimiter.schedule(async () => {
    try {
      // Truncate description to avoid token limits
      const truncatedDesc = description.length > 2000
        ? description.slice(0, 2000) + '...'
        : description;

      const prompt = `Analyze this YouTube video metadata to extract Geometry Dash level ID(s) and/or level name(s).

Title: ${title}
Channel: ${channelTitle}
Description: ${truncatedDesc}

Look for:
1. Level ID (6-9 digit numbers):
   - Explicit mentions like "ID: 12345678" or "Level ID: 12345678"
   - Numbers in parentheses that could be IDs
   - Context clues that suggest a number is a level ID

2. Level Names:
   - The name(s) of Geometry Dash level(s) mentioned (e.g., "Bloodbath", "Sonic Wave", "The Lost Existence", "Slaughterhouse")
   - Often in the title or description, may be in quotes or capitalized
   - IMPORTANT: If this is a MASHUP or COLLABORATION (indicated by "X", "&", "vs", "mashup", "collab", etc.), extract ALL individual level names
   - Examples:
     * "Sunshine X Slaughterhouse" → ["Sunshine", "Slaughterhouse"]
     * "Bloodbath & Cataclysm" → ["Bloodbath", "Cataclysm"]
     * "Tartarus vs Zodiac mashup" → ["Tartarus", "Zodiac"]
   - Ignore common prefixes/modifiers like "Beating", "100%", "All Coins", etc.
   - Return level names in order of prominence/likelihood

Return the level ID if found, and an array of level names (can be multiple for mashups). Return empty array if no names found with confidence.`;

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting Geometry Dash level IDs and names from YouTube video metadata. Be precise and only return information you are confident about.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'level_id_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                levelId: {
                  type: ['string', 'null'],
                  description: 'The Geometry Dash level ID if found, or null if not found',
                },
                levelNames: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'Array of Geometry Dash level names mentioned (can be multiple for mashups/collaborations), empty array if none found',
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Confidence level of the extraction',
                },
                reasoning: {
                  type: 'string',
                  description: 'Brief explanation of how the ID or names were determined',
                },
              },
              required: ['levelId', 'levelNames', 'confidence', 'reasoning'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const parsed = LevelIdResponseSchema.parse(JSON.parse(content));
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
