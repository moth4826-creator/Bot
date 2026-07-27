# Railway Deployment Guide

## Files to Upload to GitHub

Upload these files to your GitHub repository:

✅ **UPLOAD THESE:**
- `index.js`
- `package.json`
- `Procfile`
- `README.md`
- `config.example.json`
- `.gitignore`
- `RAILWAY-SETUP.md` (this file)

❌ **DO NOT UPLOAD:**
- `config.json` (contains your bot token - keep it secret!)
- `node_modules/` (automatically installed)
- `logs/`
- `.pm2/`

---

## Step-by-Step Railway Setup

### 1. Prepare Your GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit - Discord ticket bot"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Railway

1. **Go to [Railway.app](https://railway.app/)**
2. **Sign up/Login** with your GitHub account
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your bot repository**
6. Railway will automatically detect it as a Node.js project

### 3. Configure Environment Variables

After deployment starts, click on your project, then:

1. Go to **"Variables"** tab
2. Add these environment variables:

| Variable Name | Value | Where to get it |
|--------------|-------|-----------------|
| `DISCORD_TOKEN` | Your bot token | [Discord Developer Portal](https://discord.com/developers/applications) → Your App → Bot → Reset Token |
| `CLIENT_ID` | Your application ID | Discord Developer Portal → Your App → General Information → Application ID |
| `GUILD_ID` | Your Discord server ID | Right-click your server → Copy Server ID (enable Developer Mode in Discord settings) |
| `REQUIRED_ROLE_NAME` | `oHBaBYILOVeITEMS` | (Already set as default) |
| `TICKET_CATEGORY_ID` | Your category ID (optional) | Right-click category → Copy ID |

**To add variables:**
- Click **"New Variable"**
- Enter variable name (e.g., `DISCORD_TOKEN`)
- Paste your value
- Click **"Add"**
- Repeat for all variables

### 4. Deploy Settings

Railway will automatically:
- Install dependencies (`npm install`)
- Start your bot using the `Procfile`

You don't need to configure anything else!

### 5. Check Deployment

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. View **"Deploy Logs"** to see if bot started successfully
4. Look for: `✅ Bot is ready! Logged in as YourBotName#1234`

### 6. Bot is Now Live! 🎉

Your bot is now running 24/7 on Railway's servers. It will:
- ✅ Auto-restart if it crashes
- ✅ Stay online even when your computer is off
- ✅ Auto-deploy when you push to GitHub

---

## Updating Your Bot

Whenever you want to update your bot:

```bash
# Make your changes to index.js or other files
git add .
git commit -m "Description of changes"
git push
```

Railway will automatically detect the changes and redeploy!

---

## Railway Free Tier Limits

Railway free tier includes:
- ✅ $5 free credit per month
- ✅ 500 hours execution time
- ✅ Enough for a small Discord bot

**Important:** Free tier requires credit card verification (no charge unless you exceed free limits)

---

## Troubleshooting

### Bot shows offline?
1. Check Railway logs for errors
2. Verify all environment variables are set correctly
3. Make sure bot token is valid

### "Invalid token" error?
- Regenerate your bot token in Discord Developer Portal
- Update `DISCORD_TOKEN` variable in Railway

### Commands not working?
- Make sure you invited the bot with proper permissions
- Check that `GUILD_ID` matches your Discord server

### Need to see logs?
Go to Railway → Your Project → View Logs

---

## Alternative: Get GitHub Repository Ready (Quick Commands)

```bash
# If starting fresh:
git init
echo "node_modules/" >> .gitignore
echo "config.json" >> .gitignore
echo "logs/" >> .gitignore
git add .
git commit -m "Initial commit"

# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

---

## Support

- Railway Docs: https://docs.railway.app/
- Discord.js Guide: https://discordjs.guide/
- Need help? Check Railway logs first!
