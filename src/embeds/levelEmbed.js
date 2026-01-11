const { EmbedBuilder } = require('discord.js');

// Difficulty color mapping
const DIFFICULTY_COLORS = {
  'NA': 0x808080,
  'Auto': 0xFFFF00,
  'Easy': 0x00FF00,
  'Normal': 0x00FFFF,
  'Hard': 0xFF8000,
  'Harder': 0xFF0000,
  'Insane': 0xFF00FF,
  'Easy Demon': 0xBF0000,
  'Medium Demon': 0xBF0000,
  'Hard Demon': 0xBF0000,
  'Insane Demon': 0xBF0000,
  'Extreme Demon': 0xBF0000,
};

/**
 * Format large numbers with K/M suffixes
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

/**
 * Create a rich embed for a Geometry Dash level
 * @param {Object} levelInfo - Level data from GDBrowser
 * @param {Object} metadata - YouTube video metadata
 * @param {'regex'|'ai'|'name_search'} stage - Which extraction stage found the level
 * @returns {EmbedBuilder}
 */
function createLevelEmbed(levelInfo, metadata, stage) {
  const difficulty = levelInfo.difficulty || 'NA';
  const color = DIFFICULTY_COLORS[difficulty] || 0x7289DA;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(levelInfo.name || 'Unknown Level')
    .setURL(`https://gdbrowser.com/${levelInfo.id}`)
    .setThumbnail(`https://gdbrowser.com/icon/${encodeURIComponent(levelInfo.author || 'unknown')}`)
    .addFields(
      { name: 'Creator', value: levelInfo.author || 'Unknown', inline: true },
      { name: 'Difficulty', value: difficulty, inline: true },
      { name: 'Stars', value: String(levelInfo.stars || 0), inline: true },
      { name: 'Downloads', value: formatNumber(levelInfo.downloads), inline: true },
      { name: 'Likes', value: formatNumber(levelInfo.likes), inline: true },
      { name: 'Length', value: levelInfo.length || 'Unknown', inline: true },
    )
    .setFooter({
      text: `ID: ${levelInfo.id} | Found via ${stage === 'ai' ? 'AI analysis' : stage === 'name_search' ? 'level name search' : 'pattern matching'}`,
    })
    .setTimestamp();

  // Add description if available (truncate if too long)
  if (levelInfo.description) {
    const desc = levelInfo.description.length > 200
      ? levelInfo.description.slice(0, 200) + '...'
      : levelInfo.description;
    embed.setDescription(desc);
  }

  // Add song info if available
  if (levelInfo.songName) {
    embed.addFields({
      name: 'Song',
      value: `${levelInfo.songName}${levelInfo.songAuthor ? ` by ${levelInfo.songAuthor}` : ''}`,
      inline: false,
    });
  }

  // Add video title for context
  if (metadata?.title) {
    embed.setAuthor({
      name: metadata.title.length > 100
        ? metadata.title.slice(0, 100) + '...'
        : metadata.title,
    });
  }

  return embed;
}

/**
 * Create an error embed for when level extraction fails
 * @param {'VIDEO_NOT_FOUND'|'NO_LEVEL_ID_FOUND'} errorType
 * @param {string} [videoTitle] - Video title if available
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(errorType, videoTitle) {
  const embed = new EmbedBuilder()
    .setColor(0xFF5555)
    .setTitle('Level Not Found')
    .setTimestamp();

  switch (errorType) {
    case 'VIDEO_NOT_FOUND':
      embed.setDescription('Could not retrieve video information from YouTube. The video may be private or deleted.');
      break;
    case 'NO_LEVEL_ID_FOUND':
      embed.setDescription(
        videoTitle
          ? `Could not find a valid Geometry Dash level ID in "${videoTitle}".\n\nTip: Try sharing the level ID directly!`
          : 'Could not find a valid Geometry Dash level ID in this video.\n\nTip: Try sharing the level ID directly!'
      );
      break;
    default:
      embed.setDescription('An unexpected error occurred while searching for the level.');
  }

  return embed;
}

module.exports = {
  createLevelEmbed,
  createErrorEmbed,
  formatNumber,
};
