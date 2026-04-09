// schedule.js — Schedule a message to send after a delay
// Usage: .schedule 5m Hello! | .schedule 2h Good night @jid
import fs from 'fs';

const FILE = './data/scheduled_msgs.json';
const activeTimers = new Map();

function load() {
    try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
    return [];
}
function save(arr) {
    try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(arr, null, 2)); } catch {}
}
function parseDelay(str) {
    const m = str.match(/^(\d+)(s|m|h|d)$/i);
    if (!m) return null;
    return parseInt(m[1]) * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2].toLowerCase()];
}
function timeLeft(ms) {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    if (ms < 86400000) return `${(ms / 3600000).toFixed(1)}h`;
    return `${(ms / 86400000).toFixed(1)}d`;
}

function armTimer(sock, entry) {
    const delay = entry.sendAt - Date.now();
    if (delay <= 0) return;
    const t = setTimeout(async () => {
        try {
            await sock.sendMessage(entry.targetJid, { text: `⏰ *Scheduled Message*\n\n${entry.message}` });
        } catch {}
        const current = load().filter(s => s.id !== entry.id);
        save(current);
        activeTimers.delete(entry.id);
    }, delay);
    activeTimers.set(entry.id, t);
}

// Re-arm schedules on module load (bot restart)
setTimeout(() => {
    if (!global._schedSock) return;
    load().filter(s => s.sendAt > Date.now()).forEach(s => armTimer(global._schedSock, s));
}, 3000);

export default {
    name: 'schedule',
    alias: ['sched', 'later', 'remind'],
    category: 'automation',
    desc: 'Schedule a message to be sent after a delay',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });
        global._schedSock = sock;

        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });
        const sub = args[0]?.toLowerCase();

        if (!sub || sub === 'list' || sub === 'pending') {
            const pending = load().filter(s => s.sendAt > Date.now());
            if (!pending.length) return reply(
`📋 *No scheduled messages*

*Usage:*
\`${PREFIX}schedule 5m Hello!\` — send in 5 min
\`${PREFIX}schedule 2h Wake up!\` — send in 2 hrs
\`${PREFIX}schedule 30s Test\` — send in 30 sec

*Time formats:* s · m · h · d`);

            let text = `📋 *Scheduled Messages (${pending.length})*\n\n`;
            pending.forEach((s, i) => {
                text += `*${i + 1}.* ID: \`${s.id}\`\n`;
                text += `   ⏰ In: *${timeLeft(s.sendAt - Date.now())}*\n`;
                text += `   💬 ${s.message.slice(0, 60)}...\n\n`;
            });
            text += `\`${PREFIX}schedule cancel <id>\` to cancel`;
            return reply(text);
        }

        if (sub === 'cancel' || sub === 'stop') {
            const id = args[1];
            if (!id) return reply(`❌ Usage: \`${PREFIX}schedule cancel <id>\``);
            const arr = load();
            if (!arr.find(s => s.id === id)) return reply(`❌ ID \`${id}\` not found.`);
            const t = activeTimers.get(id);
            if (t) { clearTimeout(t); activeTimers.delete(id); }
            save(arr.filter(s => s.id !== id));
            return reply(`✅ Schedule \`${id}\` cancelled.`);
        }

        if (sub === 'clear') {
            activeTimers.forEach(t => clearTimeout(t));
            activeTimers.clear();
            save([]);
            return reply(`🗑️ All scheduled messages cleared.`);
        }

        const delay = parseDelay(args[0]);
        if (!delay) return reply(`❌ Invalid time. Use: \`30s\` \`5m\` \`2h\` \`1d\``);
        if (delay < 5000) return reply(`❌ Minimum: 5 seconds.`);
        if (delay > 7 * 86400000) return reply(`❌ Maximum: 7 days.`);

        const message = args.slice(1).join(' ');
        if (!message) return reply(`❌ Provide a message! Example: \`${PREFIX}schedule 5m Hello!\``);

        const id = Date.now().toString(36).toUpperCase().slice(-5);
        const entry = { id, message, targetJid: chatId, sendAt: Date.now() + delay };
        const arr = load();
        arr.push(entry);
        save(arr);
        armTimer(sock, entry);

        return reply(
`✅ *Message Scheduled!*

🆔 ID: \`${id}\`
⏰ Sends in: *${timeLeft(delay)}*
💬 Message: ${message.slice(0, 80)}

Use \`${PREFIX}schedule cancel ${id}\` to cancel.`);
    }
};
