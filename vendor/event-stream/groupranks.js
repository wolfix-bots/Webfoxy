// groupranks.js — Real-time group message leaderboard
// Tracks messages per sender since bot startup
import fs from 'fs';

const FILE = './data/group_ranks.json';
const memCache = {};

function load() {
    try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
    return {};
}
function save(data) {
    try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(data)); } catch {}
}

// Call this from index.js on every message: trackGroupMessage(m)
export function trackGroupMessage(m) {
    try {
        if (!m.key.remoteJid?.endsWith('@g.us')) return;
        const group = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        if (!sender || sender === m.key.remoteJid) return;
        const key = `${group}::${sender}`;
        memCache[key] = (memCache[key] || 0) + 1;
        // Persist every 10 messages
        if (memCache[key] % 10 === 0) {
            const data = load();
            data[key] = (data[key] || 0) + 10;
            save(data);
        }
    } catch {}
}

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default {
    name: 'groupranks',
    alias: ['ranks', 'leaderboard', 'toplead', 'topmembers', 'activemembers', 'topusers'],
    category: 'group',
    desc: 'Show the group message leaderboard — who talks the most',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            return sock.sendMessage(chatId, { text: `❌ This command only works in groups.` }, { quoted: m });
        }

        const reset = args[0]?.toLowerCase() === 'reset';
        if (reset) {
            if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Only owner can reset ranks.' }, { quoted: m });
            const data = load();
            Object.keys(data).filter(k => k.startsWith(chatId)).forEach(k => delete data[k]);
            Object.keys(memCache).filter(k => k.startsWith(chatId)).forEach(k => delete memCache[k]);
            save(data);
            return sock.sendMessage(chatId, { text: '🔄 Group ranks reset!' }, { quoted: m });
        }

        // Merge persistent + in-memory
        const data = load();
        const combined = {};
        // from disk
        for (const [key, count] of Object.entries(data)) {
            if (key.startsWith(chatId + '::')) {
                const jid = key.split('::')[1];
                combined[jid] = (combined[jid] || 0) + count;
            }
        }
        // from memory (not yet flushed)
        for (const [key, count] of Object.entries(memCache)) {
            if (key.startsWith(chatId + '::')) {
                const jid = key.split('::')[1];
                const mod = count % 10;
                if (mod > 0) combined[jid] = (combined[jid] || 0) + mod;
            }
        }

        const sorted = Object.entries(combined)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (!sorted.length) {
            return sock.sendMessage(chatId, {
                text: `📊 *Group Ranks*\n\n_No data yet — start chatting! Foxy is watching 👀_`
            }, { quoted: m });
        }

        let text = `╭─⌈ 📊 *GROUP LEADERBOARD* ⌋\n│\n`;
        sorted.forEach(([jid, count], i) => {
            const num = jid.split('@')[0];
            text += `│ ${MEDALS[i] || `${i + 1}.`} +${num}\n│    💬 ${count} messages\n`;
            if (i < sorted.length - 1) text += '│\n';
        });
        text += `│\n╰⊷ 🦊 Since bot connected\n\`${PREFIX}groupranks reset\` to reset`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};
