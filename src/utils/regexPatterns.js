// Geometry Dash level IDs are typically 6-9 digit numbers
// Common patterns in YouTube titles/descriptions:
// - "ID: 12345678"
// - "Level ID 12345678"
// - "(12345678)"
// - "#12345678"
// - Just the number standalone

/**
 * Priority-ordered patterns for extracting level IDs
 * Higher specificity patterns come first
 */
const LEVEL_ID_PATTERNS = [
  // Explicit ID mentions (highest confidence)
  /(?:level\s*)?id[:\s#=]*(\d{6,9})\b/gi,
  // Numbers in parentheses (common in video titles)
  /\((\d{6,9})\)/g,
  // Hashtag format
  /#(\d{6,9})\b/g,
  // Standalone 8-9 digit numbers (likely level IDs)
  /\b(\d{8,9})\b/g,
];

// Lower priority pattern for 6-7 digit IDs (more false positives possible)
const LOOSE_LEVEL_ID_PATTERN = /\b(\d{6,7})\b/g;

/**
 * Extract potential Geometry Dash level IDs from text
 * Uses multiple regex patterns in priority order
 * @param {string} text - Text to search for level IDs
 * @returns {string[]} - Array of potential level ID strings (ordered by confidence)
 */
function extractPotentialLevelIds(text) {
  const ids = [];
  const seen = new Set();

  // Try strict patterns first (higher confidence)
  for (const pattern of LEVEL_ID_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  // Try loose pattern for 6-7 digit IDs if no strict matches found
  if (ids.length === 0) {
    const regex = new RegExp(LOOSE_LEVEL_ID_PATTERN.source, LOOSE_LEVEL_ID_PATTERN.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const id = match[1];
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

module.exports = {
  extractPotentialLevelIds,
  LEVEL_ID_PATTERNS,
};
