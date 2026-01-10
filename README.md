# Geometry Dash Level ID Bot

A Discord bot that automatically detects YouTube links and extracts Geometry Dash level information. When someone shares a GD-related YouTube video, the bot finds the level ID and responds with detailed level information including creator, difficulty, stats, and more.

## Features

- **Auto-detection**: Automatically detects YouTube links in messages (supports youtube.com, youtu.be, shorts, embeds)
- **Multi-stage extraction**: Uses regex pattern matching + AI analysis to find level IDs
- **Rich embeds**: Displays level info with difficulty colors, stats, and song information
- **Rate limiting**: Built-in rate limiting to respect API quotas
- **Validation**: Validates all found IDs against GDBrowser to ensure accuracy

## How It Works

1. User posts a YouTube link in a Discord channel
2. Bot extracts the video ID and fetches metadata from YouTube
3. **Stage 1**: Regex patterns search for level IDs in title/description (e.g., "ID: 12345678")
4. **Stage 2**: If no ID found, OpenAI analyzes the metadata intelligently
5. **Stage 3**: Found IDs are validated against GDBrowser API
6. Bot replies with a rich embed containing level details

## Prerequisites

Before setting up the bot, you'll need:

- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A Discord account and a Discord server to test in
- API keys for Discord, YouTube, and OpenAI (setup instructions below)

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/discord-bot-gd.git
cd discord-bot-gd
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name (e.g., "GD Level Bot")
3. Go to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** and confirm
5. Under the bot's username, click **"Reset Token"** and copy the token
   - **Keep this token secret!** Anyone with it can control your bot
6. Scroll down to **"Privileged Gateway Intents"** and enable:
   - **Message Content Intent** (required to read message content)
7. Save your changes

### Step 4: Invite the Bot to Your Server

1. In the Developer Portal, go to **"OAuth2"** > **"URL Generator"**
2. Under **"Scopes"**, select:
   - `bot`
3. Under **"Bot Permissions"**, select:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
4. Copy the generated URL at the bottom
5. Open the URL in your browser and select a server to add the bot to

### Step 5: Get a YouTube Data API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Go to **"APIs & Services"** > **"Library"**
   - Search for "YouTube Data API v3"
   - Click on it and press **"Enable"**
4. Create credentials:
   - Go to **"APIs & Services"** > **"Credentials"**
   - Click **"Create Credentials"** > **"API Key"**
   - Copy the API key
5. (Optional) Restrict the API key:
   - Click on the API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3"
   - Save

### Step 6: Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Go to **"API Keys"** in the left sidebar
4. Click **"Create new secret key"**
5. Copy the key (you won't be able to see it again!)
6. Make sure you have credits/a payment method set up for API usage

### Step 7: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and fill in your API keys:
   ```env
   # Discord Configuration
   DISCORD_TOKEN=your_discord_bot_token_here

   # YouTube Data API
   YOUTUBE_API_KEY=your_youtube_api_key_here

   # OpenAI API
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini

   # GDBrowser API (no changes needed)
   GDBROWSER_BASE_URL=https://gdbrowser.com/api

   # Rate Limiting (requests per minute - adjust if needed)
   YOUTUBE_RATE_LIMIT_PER_MINUTE=50
   OPENAI_RATE_LIMIT_PER_MINUTE=20
   GDBROWSER_RATE_LIMIT_PER_MINUTE=30

   # Logging
   LOG_LEVEL=info
   ```

### Step 8: Start the Bot

```bash
npm start
```

You should see output like:
```
2024-01-15 12:00:00 [INFO]: Starting bot...
2024-01-15 12:00:01 [INFO]: Bot is ready! Logged in as GD Level Bot#1234
2024-01-15 12:00:01 [INFO]: Serving 1 guild(s)
```

### Step 9: Test the Bot

1. Go to your Discord server where the bot is added
2. Post a YouTube link to a Geometry Dash level video, for example:
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. If the video contains a GD level ID, the bot will reply with level information

## Configuration Options

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_TOKEN` | Your Discord bot token | Required |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | OpenAI model to use | `gpt-4o-mini` |
| `GDBROWSER_BASE_URL` | GDBrowser API base URL | `https://gdbrowser.com/api` |
| `YOUTUBE_RATE_LIMIT_PER_MINUTE` | YouTube API requests/min | `50` |
| `OPENAI_RATE_LIMIT_PER_MINUTE` | OpenAI API requests/min | `20` |
| `GDBROWSER_RATE_LIMIT_PER_MINUTE` | GDBrowser API requests/min | `30` |
| `LOG_LEVEL` | Logging level (error/warn/info/debug) | `info` |

## Project Structure

```
discord-bot-gd/
├── src/
│   ├── index.js                 # Application entry point
│   ├── bot.js                   # Discord client setup and events
│   ├── config/
│   │   └── config.js            # Environment configuration loader
│   ├── services/
│   │   ├── youtubeService.js    # YouTube Data API integration
│   │   ├── openaiService.js     # OpenAI GPT integration
│   │   ├── gdbrowserService.js  # GDBrowser API integration
│   │   └── levelIdExtractor.js  # Multi-stage extraction orchestrator
│   ├── utils/
│   │   ├── regexPatterns.js     # Level ID regex patterns
│   │   ├── youtubeParser.js     # YouTube URL parsing utilities
│   │   ├── rateLimiter.js       # API rate limiting (Bottleneck)
│   │   └── logger.js            # Winston logger configuration
│   ├── embeds/
│   │   └── levelEmbed.js        # Discord embed builders
│   └── handlers/
│       └── messageHandler.js    # Message event handler
├── .env                         # Environment variables (git-ignored)
├── .env.example                 # Example environment file
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Supported YouTube URL Formats

The bot recognizes these YouTube URL patterns:

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`
- `https://youtube.com/shorts/VIDEO_ID`

## Level ID Detection Patterns

The bot searches for level IDs using these patterns (in priority order):

1. Explicit mentions: `ID: 12345678`, `Level ID 12345678`, `id=12345678`
2. Parentheses: `(12345678)`
3. Hashtags: `#12345678`
4. Standalone 8-9 digit numbers

If regex patterns don't find an ID, OpenAI analyzes the video metadata to intelligently extract the level ID.

## Troubleshooting

### Bot doesn't respond to messages

1. **Check Message Content Intent**: Make sure you enabled "Message Content Intent" in the Discord Developer Portal
2. **Check bot permissions**: Ensure the bot has permission to read and send messages in the channel
3. **Check logs**: Run with `LOG_LEVEL=debug` to see detailed logs

### "Invalid Token" error

- Make sure you copied the full Discord bot token
- Regenerate the token in the Developer Portal if needed

### YouTube API errors

- Verify your API key is correct
- Check that YouTube Data API v3 is enabled in Google Cloud Console
- Check your API quota in Google Cloud Console (default is 10,000 units/day)

### OpenAI API errors

- Verify your API key is correct
- Ensure you have credits/billing set up on your OpenAI account
- Check rate limits on your OpenAI plan

### No level ID found

Not all GD videos contain level IDs in their metadata. The bot works best with videos that include:
- The level ID in the title (e.g., "Beating Bloodbath (ID: 10565740)")
- The level ID in the description
- Clear mentions of the level name that AI can identify

## API Usage & Costs

### YouTube Data API
- Free tier: 10,000 units/day
- Each video lookup costs ~1-3 units
- [Quota details](https://developers.google.com/youtube/v3/getting-started#quota)

### OpenAI API
- gpt-4o-mini: ~$0.15 per 1M input tokens
- Only used when regex extraction fails
- [Pricing details](https://openai.com/pricing)

### GDBrowser API
- Free, but please use responsibly
- The maintainer asks users not to abuse the API
- Built-in rate limiting helps prevent overuse

## Running in Production

For production deployments, consider:

1. **Process manager**: Use PM2 or similar to keep the bot running
   ```bash
   npm install -g pm2
   pm2 start src/index.js --name "gd-bot"
   ```

2. **Environment**: Set `LOG_LEVEL=warn` to reduce log noise

3. **Monitoring**: Set up health checks and alerting

4. **Hosting options**:
   - VPS (DigitalOcean, Linode, AWS EC2)
   - Container platforms (Railway, Render, Fly.io)
   - Always-on home server

## Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License - see package.json for details.

## Acknowledgments

- [GDBrowser](https://gdbrowser.com/) for the Geometry Dash level API
- [discord.js](https://discord.js.org/) for the Discord API wrapper
- [OpenAI](https://openai.com/) for AI-powered extraction
