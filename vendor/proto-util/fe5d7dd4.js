import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for custom menu image (now in commands/media/)
const MEDIA_DIR = path.join(__dirname, '..', 'media');
const IMAGE_PATH = path.join(MEDIA_DIR, 'foxybot.jpg');
const GIF_PATH = path.join(MEDIA_DIR, 'foxybot.gif');
const DEFAULT_IMAGE_URL = 'https://i.ibb.co/b5Jx5Trp/63a1f423d038.jpg';

function getCurrentDateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneShort = timezone.split('/').pop() || timezone;

    return {
        time: `${formattedHours}:${minutes} ${ampm}`,
        date: `${dayName}, ${monthName} ${date}, ${year}`,
        timezone: timezoneShort,
        full: `${formattedHours}:${minutes} ${ampm} | ${dayName}, ${monthName} ${date} | ${timezoneShort}`
    };
}

function getSystemInfo(startTime) {
    const mem = process.memoryUsage();
    const usedMB = Math.round(mem.rss / 1024 / 1024);
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedSysMem = totalMem - freeMem;
    const totalGB = (totalMem / (1024 * 1024 * 1024)).toFixed(0);
    const ramPercent = Math.round((usedSysMem / totalMem) * 100);
    const filledBlocks = Math.round(ramPercent / 10);
    const emptyBlocks = 10 - filledBlocks;
    const ramBar = '\u2588'.repeat(filledBlocks) + '\u2591'.repeat(emptyBlocks);

    let platform = 'Unknown';
    if (process.env.REPL_ID || process.env.REPLIT_DEV_DOMAIN) {
        platform = 'Replit';
    } else if (process.env.RAILWAY_ENVIRONMENT) {
        platform = 'Railway';
    } else if (process.env.RENDER) {
        platform = 'Render';
    } else if (process.env.HEROKU_APP_NAME) {
        platform = 'Heroku';
    } else if (process.env.VERCEL) {
        platform = 'Vercel';
    } else {
        const p = os.platform();
        if (p === 'win32') platform = 'Windows';
        else if (p === 'darwin') platform = 'macOS';
        else if (p === 'linux') platform = 'Linux';
        else if (p === 'android') platform = 'Android';
        else platform = p;
    }

    let uptimeStr = '';
    if (startTime) {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        const days = Math.floor(diff / 86400);
        const hrs = Math.floor((diff % 86400) / 3600);
        const mins = Math.floor((diff % 3600) / 60);
        const secs = diff % 60;
        if (days > 0) uptimeStr += `${days}d `;
        if (hrs > 0) uptimeStr += `${hrs}h `;
        uptimeStr += `${mins}m ${secs}s`;
    } else {
        const upSec = Math.floor(process.uptime());
        const mins = Math.floor(upSec / 60);
        const secs = upSec % 60;
        uptimeStr = `${mins}m ${secs}s`;
    }

    return { usedMB, totalGB, ramPercent, ramBar, platform, uptimeStr };
}

// Load bot name from config
function getBotName() {
    try {
        const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            return config.botName || 'Foxy Bot';
        }
    } catch (error) {
        console.error('Error loading bot name:', error);
    }
    return 'Foxy Bot';
}

// ===== ALL COMMANDS BY CATEGORY =====
const COMMANDS = {
    // AI Commands
    ai: [
        'ascii', 'claude', 'cohere', 'deepseek', 'flux', 'foxy',
        'gemini', 'gpt', 'instagram', 'llama', 'mistral', 'perplexity',
        'sticker', 'teacher', 'topdf'
    ],

    // Downloader Commands
    downloaders: [
        '7c', 'mp4', 'play', 'playdoc', 'removebg', 'shazam', 'trailer'
    ],

    // Automation Commands
    automation: [
        'autoreact', 'autoread', 'autorecording',
        'autostatus', 'autotyping', 'autorecordtype',
        'autoviewstatus', 'autoreactstatus'
    ],

    // Games Commands
    games: [
        '8ball', 'fact', 'flip', 'hangman', 'hug', 'joke',
        'quote', 'roll', 'slap', 'tictactoe', 'tod', 'trivia'
    ],

    // Fun Commands
    fun: [
        'attp', 'compliment', 'meme', 'take', 'truthdetect'
    ],

    // Group Commands
    group: [
        'add', 'antilink', 'antibadword', 'antispam', 'demote', 'gcs',
        'groupinfo', 'hidetag', 'kick', 'listadmins', 'mute', 'promote',
        'resetwarn', 'setdesc', 'setgname', 'setgpp', 'setwarn',
        'tagall', 'togstatus', 'unmute', 'warn', 'warnings'
    ],

    // Tools Commands
    tools: [
        'antidelete', 'calc', 'define', 'getpp', 'imgbb', 'logo',
        'lyrics', 'qr', 'room', 'setpp', 'story', 'time',
        'timer', 'toimg', 'tosticker', 'translate', 'tts',
        'vv', 'vv2', 'weather'
    ],

    // Text Effect Commands
    text: [
        'comictext', 'cyberpunk', 'glasstext', 'glitchtext',
        'gradienttext', 'metallictext', 'stonetext', 'vintagetext'
    ],

    // General Commands
    general: [
        'alive', 'bible', 'goodmorning', 'goodnight', 'ping', 'quran', 'uptime'
    ],

    // Owner Commands
    owner: [
        'clean', 'mode', 'ownerreact', 'setbotname', 'setmenuimage',
        'setprefix', 'ultimatefix'
    ]
};

const READMORE = '\u200E'.repeat(4001);

function buildMenuCaption(prefix, version, context, timeInfo, sysInfo, isOwner, ownerNumber, mode) {
    const ownerDisplay = ownerNumber ? `+${ownerNumber}` : 'Not Set!';
    const botName = getBotName();
    
    // Count total commands (remove duplicates)
    const allCommands = new Set();
    for (const cat in COMMANDS) {
        COMMANDS[cat].forEach(cmd => allCommands.add(cmd));
    }
    const totalCommands = allCommands.size;

    return `╭━━━〔🦊 *${botName.toUpperCase()}* 〕━━━╮
┃
┃ *Version:* ${version}
┃ *Time:* ${timeInfo.full}
┃ *Prefix:* ${prefix}
┃ *Mode:* ${mode}
┃ *Owner:* ${ownerDisplay}
┃ *Uptime:* ${sysInfo.uptimeStr}
┃ *RAM:* ${sysInfo.ramBar} ${sysInfo.ramPercent}%
┃ *Host:* ${sysInfo.platform}
┃
┃ *Total Commands:* ${totalCommands}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯
${READMORE}
╭━━━〔🤖 *AI COMMANDS* 〕━━━╮
┃
${COMMANDS.ai.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔📥 *DOWNLOADERS* 〕━━━╮
┃
${COMMANDS.downloaders.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔⚡ *AUTOMATION* 〕━━━╮
┃
${COMMANDS.automation.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔🎲 *GAMES* 〕━━━╮
┃
${COMMANDS.games.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔🎮 *FUN COMMANDS* 〕━━━╮
┃
${COMMANDS.fun.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔👥 *GROUP COMMANDS* 〕━━━╮
┃
${COMMANDS.group.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔🛠️ *TOOLS* 〕━━━╮
┃
${COMMANDS.tools.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔✍️ *TEXT EFFECTS* 〕━━━╮
┃
${COMMANDS.text.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔📊 *GENERAL* 〕━━━╮
┃
${COMMANDS.general.map(cmd => `┃ • ${prefix}${cmd}`).join('\n')}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔👑 *OWNER COMMANDS* 〕━━━╮
┃
${isOwner ? COMMANDS.owner.map(cmd => `┃ • ${prefix}${cmd}`).join('\n') : '┃ • [Owner Only]'}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔💡 *INFO* 〕━━━╮
┃
┃ • Type ${prefix}help <command>
┃ • Total: ${totalCommands} commands
┃ • Mode: ${mode}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`;
}

// Function to get menu media (from commands/media/)
async function getMenuMedia() {
    try {
        if (fs.existsSync(GIF_PATH)) {
            console.log('🦊 Using custom menu GIF from:', GIF_PATH);
            const buffer = fs.readFileSync(GIF_PATH);
            return { buffer, type: 'gif' };
        }
        
        if (fs.existsSync(IMAGE_PATH)) {
            console.log('🦊 Using custom menu image from:', IMAGE_PATH);
            const buffer = fs.readFileSync(IMAGE_PATH);
            return { buffer, type: 'image' };
        }
        
        console.log('🦊 Using default menu image from URL');
        const response = await axios.get(DEFAULT_IMAGE_URL, {
            responseType: 'arraybuffer',
            timeout: 15000,
        });
        return { buffer: Buffer.from(response.data), type: 'image' };
    } catch (err) {
        console.error('❌ Failed to load menu media:', err.message);
        return null;
    }
}

export default {
    name: 'menu',
    alias: ['help', 'cmd', 'commands', 'start', 'foxymenu', 'all'],
    category: 'general',
    description: 'Show all available commands',
    ownerOnly: false,

    async execute(sock, msg, args, prefix, context) {
        const chatId = msg.key.remoteJid;
        const isOwner = context?.isOwner || false;
        const version = '2.0.0';
        const timeInfo = getCurrentDateTime();
        const botName = getBotName();

        // Load config
        const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');
        let config = { prefix: '.', mode: 'public', ownerNumber: '', botName: 'Foxy Bot' };
        try {
            if (fs.existsSync(CONFIG_FILE)) {
                config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            }
        } catch {}

        const startTime = context?.startTime || null;
        const sysInfo = getSystemInfo(startTime);

        // Send loading message
        await sock.sendMessage(chatId, {
            text: `🦊 Loading ${botName} menu...`
        }, { quoted: msg });

        // Speed test
        const speedStart = Date.now();
        const speedEnd = Date.now();
        sysInfo.speed = speedEnd - speedStart;

        // Build caption
        const caption = buildMenuCaption(
            prefix, version, context, timeInfo, sysInfo, 
            isOwner, config.ownerNumber, config.mode
        );

        try {
            const menuMedia = await getMenuMedia();

            if (menuMedia) {
                if (menuMedia.type === 'gif') {
                    await sock.sendMessage(chatId, {
                        video: menuMedia.buffer,
                        caption: caption,
                        gifPlayback: true,
                        mimetype: 'video/mp4'
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(chatId, {
                        image: menuMedia.buffer,
                        caption: caption,
                        mimetype: 'image/jpeg'
                    }, { quoted: msg });
                }
            } else {
                await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
            }
        } catch (error) {
            console.error('❌ Menu send error:', error);
            await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
        }
    }
};