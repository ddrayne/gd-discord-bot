// Regex pattern for various YouTube URL formats:
// - https://www.youtube.com/watch?v=VIDEO_ID
// - https://youtu.be/VIDEO_ID
// - https://www.youtube.com/embed/VIDEO_ID
// - https://youtube.com/shorts/VIDEO_ID
// - https://m.youtube.com/watch?v=VIDEO_ID

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi;

/**
 * Extract YouTube video IDs from text
 * @param {string} text - Text to search for YouTube URLs
 * @returns {string[]} - Array of unique video IDs found
 */
function extractVideoIds(text) {
  const matches = [];
  let match;
  // Reset regex state
  YOUTUBE_REGEX.lastIndex = 0;
  while ((match = YOUTUBE_REGEX.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return [...new Set(matches)]; // Deduplicate
}

/**
 * Check if a string contains a YouTube URL
 * @param {string} text - Text to check
 * @returns {boolean}
 */
function containsYouTubeUrl(text) {
  YOUTUBE_REGEX.lastIndex = 0;
  return YOUTUBE_REGEX.test(text);
}

module.exports = {
  extractVideoIds,
  containsYouTubeUrl,
};
