// onlinespy.js — Get notified when a contact comes online
// Uses Baileys presence subscriptions — only works while bot is running
import fs from 'fs';

const FILE = './data/online_spies.json';
const spyMap = {}; // { targetJid: [watcherJid, ...] }

function load() {
    try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
    return {};
}
function save(data) {
    try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch {}
}

// Called from index.js presence.update event
// presence.update fires with { id: jid, presences: { jid: { lastKnownPresence: 'available'|'unavailable'|... } } }
export async function handlePresenceUpdate(sock, update) {
    try {
        const data = load();
        for (const [targetJid, presenceInfo] of Object.entries(update.presences || {})) {
            const status = presenceInfo.lastKnownPresence;
            if (status !== 'available') continue; // Only notify on "online"
            const watchers = data[targetJid];
            if (!watchers?.length) continue;
            const num = targetJid.split('@')[0];
            const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            for (const watcherJid of watchers) {
                await sock.sendMessage(watcherJid, {
                    text: `👁️ *Online Spy Alert!*\n\n📱 +${num} just came *online*\n🕐 Time: ${time}`
                }).catch(() => {});
            }
        }
    } catch {}
}

// Re-subscribe on startup
export async function resubscribeSpies(sock) {
    try {
        await new Promise(r => setTimeout(r, 5000)); // wait for connection
        const data = load();
        for (const jid of Object.keys(data)) {
            await sock.subscribePresence(jid).catch(() => {});
            await new Promise(r => setTimeout(r, 500));
        }
    } catch {}
}

export default {
    name: 'onlinespy',
    alias: ['spy', 'spyon', 'presencespy', 'onlinenotify', 'whenonline'],
    category: 'automation',
    desc: 'Get notified when a contact comes online on WhatsApp',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });
        const sub = args[0]?.toLowerCase();
        const data = load();

        if (!sub || sub === 'list' || sub === 'show') {
            const mySpies = Object.entries(data)
                .filter(([, watchers]) => watchers.includes(chatId))
                .map(([jid]) => jid);

            if (!mySpies.length) return reply(
`╭─⌈ 👁️ *ONLINE SPY* ⌋
│
├─⊷ Get notified when someone comes online
│
├─⊷ *Watch someone:*
│  \`${PREFIX}onlinespy 254712345678\`
│  \`${PREFIX}spy @mention\`
│
├─⊷ *Stop watching:*
│  \`${PREFIX}onlinespy stop 254712345678\`
│
├─⊷ *Your watch list:*
│  \`${PREFIX}onlinespy list\`
│
├─⊷ ⚠️ Requires bot to stay online
│
╰⊷ 🦊 Foxy`);

            let text = `👁️ *Your Spy List (${mySpies.length})*\n\n`;
            mySpies.forEach((jid, i) => {
                text += `${i + 1}. 📱 +${jid.split('@')[0]}\n`;
            });
            text += `\n\`${PREFIX}onlinespy stop <number>\` to stop`;
            return reply(text);
        }

        if (sub === 'stop' || sub === 'remove' || sub === 'unwatch') {
            const rawNum = args[1]?.replace(/[^0-9]/g, '');
            if (!rawNum) return reply(`❌ Usage: \`${PREFIX}onlinespy stop <number>\``);
            const jid = `${rawNum}@s.whatsapp.net`;
            if (!data[jid]?.includes(chatId)) return reply(`❌ You're not spying on +${rawNum}.`);
            data[jid] = data[jid].filter(w => w !== chatId);
            if (!data[jid].length) delete data[jid];
            save(data);
            return reply(`✅ Stopped spying on +${rawNum}.`);
        }

        if (sub === 'clear') {
            for (const jid of Object.keys(data)) {
                data[jid] = data[jid].filter(w => w !== chatId);
                if (!data[jid].length) delete data[jid];
            }
            save(data);
            return reply('🗑️ Spy list cleared.');
        }

        // Add new spy target
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        let targetJid = null;

        if (mentioned?.length) {
            targetJid = mentioned[0];
        } else {
            const rawNum = args[0]?.replace(/[^0-9]/g, '');
            if (rawNum?.length >= 7) targetJid = `${rawNum}@s.whatsapp.net`;
        }

        if (!targetJid) return reply(`❌ Provide a number or mention.\n*Usage:* \`${PREFIX}onlinespy 254712345678\``);

        const num = targetJid.split('@')[0];
        if (!data[targetJid]) data[targetJid] = [];
        if (data[targetJid].includes(chatId)) return reply(`❌ Already spying on +${num}.`);

        data[targetJid].push(chatId);
        save(data);

        // Subscribe to their presence
        try { await sock.subscribePresence(targetJid); } catch {}

        return reply(
`👁️ *Now spying on +${num}*

You'll get a message here whenever they come online.

⚠️ Only works while Foxy is running.
\`${PREFIX}onlinespy stop ${num}\` to stop`);
    }
};
