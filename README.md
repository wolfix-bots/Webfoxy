# 🦊 Foxy Bot — Deployment Guide

A WhatsApp bot powered by Baileys. Follow the guide for your platform below.

---

## 📋 Before You Start

You need one thing regardless of platform:

- **Session ID** — your `FOXY-BOT:` or `WOLF-BOT:` session string

Everything else is handled automatically on startup.

---

## 🖥️ Platforms

- [Replit](#-replit)
- [Heroku](#-heroku)
- [Railway](#-railway)
- [VPS / Ubuntu Server](#-vps--ubuntu-server)
- [Windows (Local)](#-windows-local)
- [Termux (Android)](#-termux-android)

---

## ☁️ Replit

1. Go to [replit.com](https://replit.com) and create a new **Node.js** Repl
2. Upload the bot files — drag and drop the zip or use the file panel to upload and extract
3. Open the **Secrets** tab (🔒 icon in the left sidebar) and add:
   ```
   Key: SESSION_ID
   Value: your-session-string
   ```
4. Open the **Shell** tab and run:
   ```bash
   npm install
   ```
5. Click **Run** — the bot will connect automatically

> 💡 To keep it online 24/7 on Replit, upgrade to a paid plan or use an uptime monitor like UptimeRobot to ping your Repl URL every 5 minutes.

---

## 🟣 Heroku

1. Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and log in:
   ```bash
   heroku login
   ```

2. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```

3. Set your session ID as a config var:
   ```bash
   heroku config:set SESSION_ID="your-session-string"
   ```

4. Add a `Procfile` in the bot folder (create it if it doesn't exist):
   ```
   worker: node index.js
   ```

5. Initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "deploy"
   heroku git:remote -a your-app-name
   git push heroku main
   ```

6. Scale the worker dyno:
   ```bash
   heroku ps:scale worker=1
   ```

7. Check logs:
   ```bash
   heroku logs --tail
   ```

> ⚠️ Make sure to use a **worker** dyno, not a **web** dyno — the bot doesn't serve web traffic on Heroku.

---

## 🚄 Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub Repo** (push your bot to a private GitHub repo first)
   — or use **New Project → Empty Project → Add Service → GitHub Repo**
3. In your service settings, go to **Variables** and add:
   ```
   SESSION_ID = your-session-string
   ```
4. Go to **Settings → Deploy** and set the start command to:
   ```
   node index.js
   ```
5. Click **Deploy** — Railway will install dependencies and start the bot automatically

> 💡 Railway gives you $5 free credit per month which is enough to run the bot continuously.

---

## 🐧 VPS / Ubuntu Server

Tested on Ubuntu 20.04 / 22.04.

### 1. Connect to your server
```bash
ssh root@your-server-ip
```

### 2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should be v18 or higher
```

### 3. Upload the bot files
From your local machine (run this locally):
```bash
scp foxy-bot.zip root@your-server-ip:/root/
```

Then on the server:
```bash
cd /root
unzip foxy-bot.zip
cd foxy-bot
```

### 4. Create your `.env` file
```bash
nano .env
```
Add this line:
```
SESSION_ID=your-session-string
```
Save with `Ctrl+X → Y → Enter`

### 5. Install dependencies
```bash
npm install
```

### 6. Run with PM2 (keeps bot alive after disconnect)
```bash
npm install -g pm2
pm2 start index.js --name foxy-bot
pm2 save
pm2 startup   # follow the command it prints to auto-start on reboot
```

### Useful PM2 commands
```bash
pm2 logs foxy-bot       # view live logs
pm2 restart foxy-bot    # restart the bot
pm2 stop foxy-bot       # stop the bot
pm2 delete foxy-bot     # remove from PM2
```

---

## 🪟 Windows (Local)

1. Install [Node.js 18+](https://nodejs.org) — download the LTS installer and run it

2. Extract the bot zip to a folder, e.g. `C:\foxy-bot`

3. Create a `.env` file in the bot folder:
   ```
   SESSION_ID=your-session-string
   ```

4. Open **Command Prompt** or **PowerShell** in that folder:
   ```bash
   cd C:\foxy-bot
   npm install
   node index.js
   ```

5. The bot will start and connect automatically

> 💡 To keep it running in the background on Windows, use [PM2](https://pm2.keymetrics.io/):
> ```bash
> npm install -g pm2
> pm2 start index.js --name foxy-bot
> ```

---

## 📱 Termux (Android)

1. Install [Termux](https://f-droid.org/en/packages/com.termux/) from F-Droid (not Play Store)

2. Update packages and install Node.js:
   ```bash
   pkg update && pkg upgrade
   pkg install nodejs git unzip
   node --version   # should be v18+
   ```

3. Copy the bot zip to your phone, then in Termux:
   ```bash
   cp /sdcard/foxy-bot.zip ~/
   cd ~
   unzip foxy-bot.zip
   cd foxy-bot
   ```
   > If you can't access `/sdcard`, run `termux-setup-storage` first

4. Create your `.env` file:
   ```bash
   nano .env
   ```
   Add:
   ```
   SESSION_ID=your-session-string
   ```
   Save with `Ctrl+X → Y → Enter`

5. Install and start:
   ```bash
   npm install
   node index.js
   ```

6. To keep it running when Termux is in the background, install Termux:Boot from F-Droid and use:
   ```bash
   npm install -g pm2
   pm2 start index.js --name foxy-bot
   ```

---

## ⚙️ Optional `.env` Settings

| Variable | Default | Description |
|---|---|---|
| `SESSION_ID` | *(required)* | Your WhatsApp session string |
| `BOT_NAME` | `FOXY BOT` | Name shown in menus |
| `PREFIX` | `.` | Command prefix |
| `OWNER_NUMBER` | *(auto-detected)* | Your number with country code |
| `WEB_PORT` | `3000` | Port for the status web page |

---

## 🌐 Status Page

Once the bot is running, open your browser and go to:
```
http://localhost:3000
```
You'll see a live status page showing connection state, uptime, commands loaded, and more. It auto-refreshes every 10 seconds.

On a VPS, replace `localhost` with your server's IP address. Make sure port `3000` is open in your firewall:
```bash
sudo ufw allow 3000
```

---

## ❓ Troubleshooting

| Problem | Fix |
|---|---|
| `Cannot find module` | Run `npm install` again |
| Bot connects then immediately drops | Your session ID may be expired — get a new one |
| Commands not responding | Check your prefix in `.env` (default is `.`) |
| Status page not loading | Make sure port 3000 is not blocked by a firewall |
| `node: command not found` | Install Node.js 18+ for your platform |
