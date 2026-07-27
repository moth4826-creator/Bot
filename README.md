# Discord Ticket Bot - Purchase System

A Discord bot that manages a ticket system for purchasing Discord usernames, Roblox accounts, and Robux.

## Features

- `/panel` command restricted to users with the "oHBaBYILOVeITEMS" role
- Ticket creation with dropdown menu
- Private tickets visible only to the ticket creator and staff
- "Selling" button that displays available items in separate embeds (Discord items and Roblox items)
- "Buying" and "Close Ticket" buttons
- Automatic permission management

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure the Bot**
   Edit `config.json` and fill in your details:
   - `token`: Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications)
   - `clientId`: Your bot's application ID
   - `guildId`: Your Discord server ID
   - `requiredRoleName`: Already set to "oHBaBYILOVeITEMS"
   - `ticketCategoryId`: (Optional) The category ID where tickets should be created

3. **Get Your Bot Token**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application or select existing one
   - Go to "Bot" section
   - Click "Reset Token" and copy it to `config.json`
   - Enable these intents under "Privileged Gateway Intents":
     - Presence Intent
     - Server Members Intent
     - Message Content Intent

4. **Invite Your Bot**
   Use this URL (replace CLIENT_ID with your bot's client ID):
   ```
   https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=8&scope=bot%20applications.commands
   ```

5. **Run the Bot (Choose One Method)**

   ### Method 1: PM2 (Recommended - Auto-restart & Always Running)
   Start the bot to run 24/7 with auto-restart on crashes:
   ```bash
   npm run pm2
   ```

   Useful PM2 commands:
   ```bash
   npm run logs      # View bot logs in real-time
   npm run stop      # Stop the bot
   npm run restart   # Restart the bot
   npm run monitor   # Monitor bot resources
   pm2 list          # List all running processes
   pm2 startup       # Enable PM2 to start on system boot
   pm2 save          # Save current process list
   ```

   ### Method 2: Simple Start (Stops when terminal closes)
   ```bash
   npm start
   ```

## Usage

1. **Create the Panel**
   - Use `/panel` command (only users with "oHBaBYILOVeITEMS" role can use this)
   - This creates the ticket panel with dropdown menu

2. **Open a Ticket**
   - Click the dropdown and select "Purchase"
   - A private ticket channel will be created

3. **In the Ticket**
   - Click "Selling" to see all available items (Discord and Roblox sections)
   - Click "Buying" if you want to purchase
   - Click "Close Ticket" to close the ticket (5 second delay)

## Permissions

- Only users with the "oHBaBYILOVeITEMS" role can:
  - Use the `/panel` command
  - See and interact with ticket channels (as staff)

- Ticket creators can:
  - View their own ticket
  - Send messages in their ticket
  - Close their ticket

## Notes

- Users cannot create multiple tickets at once
- Tickets are automatically deleted after clicking "Close Ticket"
- All selling information is displayed in separate embeds for Discord and Roblox items
