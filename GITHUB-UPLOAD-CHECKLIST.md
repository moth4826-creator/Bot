# What to Upload to GitHub for Railway

## ✅ Files to Upload

Copy these files to your GitHub repository:

```
your-bot/
├── index.js                    ✅ Main bot code
├── package.json                ✅ Dependencies
├── Procfile                    ✅ Tells Railway how to start bot
├── .gitignore                  ✅ Prevents uploading secrets
├── config.example.json         ✅ Example config (safe to share)
├── ecosystem.config.js         ✅ PM2 config (optional, for local use)
├── start-bot.bat               ✅ Windows launcher (optional)
├── README.md                   ✅ Documentation
├── RAILWAY-SETUP.md            ✅ Deployment guide
├── QUICK-START.md              ✅ Local setup guide
└── GITHUB-UPLOAD-CHECKLIST.md  ✅ This file
```

**Note:** `ecosystem.config.js` and `start-bot.bat` are only used for running locally on your computer. Railway doesn't use them, but it's safe to upload them!

## ❌ Files to NOT Upload (Already in .gitignore)

These files should stay on your computer only:

```
❌ config.json          (contains your bot token - SECRET!)
❌ node_modules/        (too large, auto-installed)
❌ logs/                (not needed)
❌ .pm2/                (not needed)
```

---

## Quick Setup Commands

### Option 1: Upload to New GitHub Repo

```bash
# In your bot folder, run:
git init
git add .
git commit -m "Initial commit - Discord ticket bot"

# Create a new repository on GitHub.com, then run:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git branch -M main
git push -u origin main
```

### Option 2: If You Already Have a GitHub Repo

```bash
git add .
git commit -m "Add Discord ticket bot"
git push
```

---

## After Uploading to GitHub

1. Go to [Railway.app](https://railway.app/)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables (see RAILWAY-SETUP.md)
5. Your bot will be live! 🎉

---

## Important Security Note

⚠️ **NEVER upload config.json to GitHub!**

Your bot token is like a password - if someone gets it, they can control your bot.

The `.gitignore` file prevents this automatically, but always double-check:
- ✅ config.json is listed in `.gitignore`
- ✅ Your GitHub repo does NOT show config.json
- ✅ Use environment variables on Railway instead

---

## Need Help?

See `RAILWAY-SETUP.md` for full deployment instructions!
