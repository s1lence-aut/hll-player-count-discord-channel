# Discord Bot for HLL Server Player Count

This Discord bot updates channel names with real-time player counts from Hell Let Loose servers using CRCON API.
It provides visual indicators based on the number of players online and supports multiple servers.

## Features

- Real-time updates of Discord channel names with HLL server player counts
- Visual indicators (🔴, 🟡, 🟢) based on player count thresholds
- Support for multiple HLL servers and Discord channels
- Configurable update intervals and player count thresholds
- Automatic updates every 5 minutes (configurable)

## Setup

### Prerequisites

- Node.js (v18 or newer)
- npm (Node Package Manager)
- A Discord bot token
- HLL CRCON API credentials for fetching player data

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/s1lence-aut/hll-player-count-discord-channel.git
   cd hll-player-count-discord-channel

2. Generate a .env File
EXAMPLE:

   ```bash
   DISCORD_TOKEN=your_discord_bot_token
   API_TOKEN=your_rcon_api_token
   FLAG_YELLOW=5
   FLAG_GREEN=10
   UPDATE_INTERVAL_SECONDS=300
   
3. Adjust the values in the config.js
   
### File Format

This project uses ES Modules and is structured with the `.mjs` file extension.