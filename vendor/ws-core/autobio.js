// autobio.js — Auto Bio Command
// Formats: default, detailed, realtime, live-clock, minimal, wolf-style, professional, always-on
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = './data/autobio.json';
let _timer = null;
let _sock = null;
let _updateCount = 0;

const FORMATS = {
    'default':      (n,t,d) => `🦊 ${n} is online | ⌚ ${t} | 📅 ${d}`,
    'detailed':     (n,t,d) => `🐾 ${n}\n📶 Status: Online ✅\n⌚ Time: ${t}\n📅 Date: ${d}`,
    'realtime':     (n,t,d) => `⚡ ${n} | 🟢 Active Now | 🕒 ${t} | 📅 ${d}`,
    'live-clock':   (n,t,d) => `🕒 ${t} | 📅 ${d} | 🦊 ${n}`,
    'minimal':      (n,t,d) => `${n} • ${t}`,
    'wolf-style':   (n,t,d) => `🐺 ${n} is online | ⌚ ${t} | 📅 ${d}`,
    'professional': (n,t,d) => `${n} | 🟢 Available | ${t} · ${d}`,
    'always-on':    (n,t,d) => `🟢 Always Online | 🦊 ${n} | ⌚ ${t}`,
};

const DEFAULTS = {
    enabled: false,
    format: 'default',
    intervalMin: 1,
    updateCount: 0,
    weather: null,
};

function loadConfig() {
    try {
        fs.mkdirSync('./data', { recursive: true });
        if (fs.existsSync(CONFIG_FILE)) {
            return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
        }
    } catch {}
    return { ...DEFAULTS };
}

function saveConfig(cfg) {
    try {
        fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
    } catch {}
}

function getOwnerName() {
    try {
        const o = JSON.parse(fs.readFileSync('./utils/owner.json', 'utf8'));
        return o.name || o.ownername || o.OWNER_NAME || 'Foxy';
    } catch { return 'Foxy'; }
}

function getTimeDate() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const date = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return { time, date };
}

function buildBio(cfg) {
    const name = getOwnerName();
    const { time, date } = getTimeDate();
    const fn = FORMATS[cfg.format] || FORMATS['default'];
    let bio = fn(name, time, date);
    if (cfg.weather) {
        bio += ` | 🌤️ ${cfg.weather}`;
    }
    return bio;
}

function startTimer(sock) {
    stopTimer();
    _sock = sock;
    const cfg = loadConfig();
    if (!cfg.enabled) return;
    const ms = (cfg.intervalMin || 1) * 60 * 1000;

    _timer = setInterval(async () => {
        try {
            const c = loadConfig();
            if (!c.enabled) { stopTimer(); return; }
            const bio = buildBio(c);
            await _sock.updateProfileStatus(bio);
            c.updateCount = (c.updateCount || 0) + 1;
            saveConfig(c);
            _updateCount = c.updateCount;
        } catch (e) {
            console.log(`🦊 AutoBio update failed: ${e.message}`);
        }
    }, ms);
    console.log(`🦊 AutoBio timer started: every ${cfg.intervalMin} min`);
}

function stopTimer() {
    if (_timer) { clearInterval(_timer); _timer = null; }
}

// Auto-start if enabled when module loads
setTimeout(() => {
    const cfg = loadConfig();
    if (cfg.enabled && _sock) startTimer(_sock);
}, 3000);

export default {
    name: 'autobio',
    alias: ['autobio', 'bio', 'setbio'],
    category: 'automation',
    desc: 'Auto update WhatsApp bio on a timer',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const sub = (args[0] || '').toLowerCase();
        let cfg = loadConfig();

        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });

        /* ── Help / status ── */
        if (!sub || sub === 'status' || sub === 'info') {
            return reply(
`╭─⌈ 🤖 *AUTO BIO* ⌋
├─⊷ *Status:* ${cfg.enabled ? '✅ ON' : '❌ OFF'} | *Format:* ${cfg.format}
├─⊷ *Interval:* ${cfg.intervalMin}min | *Updates:* ${cfg.updateCount}
│
├─⊷ *${PREFIX}autobio on/off*
│  └⊷ Toggle auto bio
├─⊷ *${PREFIX}autobio format <name>*
│  └⊷ default, detailed, realtime, live-clock
│     minimal, wolf-style, professional, always-on
├─⊷ *${PREFIX}autobio interval <min>*
│  └⊷ Set update interval (minutes)
├─⊷ *${PREFIX}autobio test*
│  └⊷ Test bio update now
├─⊷ *${PREFIX}autobio weather <text>*
│  └⊷ Add weather to bio (e.g: 28°C ☀️ Nairobi)
├─⊷ *${PREFIX}autobio weather off*
│  └⊷ Remove weather from bio
╰⊷ 🦊 Powered by Foxy Tech`);
        }

        /* ── ON ── */
        if (sub === 'on' || sub === 'enable' || sub === 'start') {
            cfg.enabled = true;
            saveConfig(cfg);
            startTimer(sock);
            const bio = buildBio(cfg);
            try { await sock.updateProfileStatus(bio); cfg.updateCount++; saveConfig(cfg); } catch {}
            return reply(
`✅ *Auto Bio ENABLED!*

📄 *Current Bio:*
\`\`\`${bio}\`\`\`

📊 *Update Count:* ${cfg.updateCount}
⏱️ *Interval:* every ${cfg.intervalMin} min
🎨 *Format:* ${cfg.format}`);
        }

        /* ── OFF ── */
        if (sub === 'off' || sub === 'disable' || sub === 'stop') {
            cfg.enabled = false;
            saveConfig(cfg);
            stopTimer();
            return reply('❌ *Auto Bio DISABLED!*\n\nYour bio will no longer auto-update.');
        }

        /* ── FORMAT ── */
        if (sub === 'format') {
            const fmt = args[1]?.toLowerCase();
            if (!fmt || !FORMATS[fmt]) {
                const list = Object.keys(FORMATS).join('\n• ');
                return reply(`🎨 *Available formats:*\n• ${list}\n\n*Usage:* ${PREFIX}autobio format <name>`);
            }
            cfg.format = fmt;
            saveConfig(cfg);
            const preview = buildBio(cfg);
            if (cfg.enabled) startTimer(sock);
            return reply(`✅ *Format set to:* ${fmt}\n\n📄 *Preview:*\n\`\`\`${preview}\`\`\``);
        }

        /* ── INTERVAL ── */
        if (sub === 'interval') {
            const min = parseInt(args[1]);
            if (isNaN(min) || min < 1) return reply(`❌ Usage: ${PREFIX}autobio interval <minutes>\n*Min:* 1 minute`);
            cfg.intervalMin = min;
            saveConfig(cfg);
            if (cfg.enabled) startTimer(sock);
            return reply(`✅ *Interval set to:* ${min} minute${min > 1 ? 's' : ''}`);
        }

        /* ── TEST ── */
        if (sub === 'test') {
            try {
                const bio = buildBio(cfg);
                await sock.updateProfileStatus(bio);
                cfg.updateCount++;
                saveConfig(cfg);
                return reply(
`✅ *Bio Updated Successfully!*

📄 *New Bio:*
\`\`\`${bio}\`\`\`

📊 *Update Count:* ${cfg.updateCount}
🕒 *Updated At:* ${getTimeDate().time}`);
            } catch (e) {
                return reply(`❌ Bio update failed: ${e.message}`);
            }
        }

        /* ── WEATHER ── */
        if (sub === 'weather') {
            const val = args.slice(1).join(' ');
            if (!val || val.toLowerCase() === 'off') {
                cfg.weather = null;
                saveConfig(cfg);
                return reply('✅ Weather removed from bio.');
            }
            cfg.weather = val;
            saveConfig(cfg);
            return reply(`✅ *Weather added to bio:* ${val}\n\n📄 *Preview:*\n\`\`\`${buildBio(cfg)}\`\`\``);
        }

        return reply(`❓ Unknown subcommand. Use *${PREFIX}autobio* for help.`);
    }
};
