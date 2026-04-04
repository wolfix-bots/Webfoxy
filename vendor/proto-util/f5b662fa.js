// warn — issue a warning to a group member (admin only)
const fs   = require('fs');
const path = require('path');

const WARN_FILE = path.join(process.cwd(), 'utils', 'warnings.json');

function loadWarns() {
    try {
        if (fs.existsSync(WARN_FILE)) return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8'));
    } catch {}
    return {};
}

function saveWarns(data) {
    try {
        fs.mkdirSync(path.dirname(WARN_FILE), { recursive: true });
        fs.writeFileSync(WARN_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('⚠️ warn save error:', e.message);
    }
}

function getKey(jid) { return jid.replace(/@.+/, ''); }

module.exports = {
    name: 'warn',
    alias: ['w', 'strike'],
    category: 'group',
    description: 'Warn a member (admin only). Kicks on max warns.',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: m });
        }

        let isAdmin = false;
        try {
            const meta    = await sock.groupMetadata(chatId);
            const senderN = m.key.participant || m.key.remoteJid;
            isAdmin = meta.participants.some(
                p => p.id === senderN && (p.admin === 'admin' || p.admin === 'superadmin')
            );
        } catch {}

        if (!isAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: m });
        }

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target    = mentioned && mentioned[0];

        if (!target) {
            return await sock.sendMessage(chatId, {
                text: `❌ Tag someone to warn.\n\nExample: ${PREFIX}warn @user`
            }, { quoted: m });
        }

        const db      = loadWarns();
        const gid     = getKey(chatId);
        const uid     = getKey(target);

        if (!db[gid]) db[gid] = {};
        const maxDefault = db[gid]?.__settings?.defaultMax || 3;
        if (!db[gid][uid]) db[gid][uid] = { count: 0, max: maxDefault };

        db[gid][uid].count += 1;
        const { count, max } = db[gid][uid];
        saveWarns(db);

        if (count >= max) {
            db[gid][uid].count = 0;
            saveWarns(db);
            try { await sock.groupParticipantsUpdate(chatId, [target], 'remove'); } catch {}
            return await sock.sendMessage(chatId, {
                text:
`┌─⧭ *⚡ MAX WARNS — KICKED* ⧭─┐
│
├─⧭ *User:* @${uid}
├─⧭ *Warns:* ${max}/${max}
├─⧭ *Action:* Kicked 🥾
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
        }

        const bar = '⚠️'.repeat(count) + '▪️'.repeat(max - count);
        return await sock.sendMessage(chatId, {
            text:
`┌─⧭ *⚠️ WARNING ISSUED* ⧭─┐
│
├─⧭ *User:* @${uid}
├─⧭ *Warns:* ${count}/${max}
├─⧭ *Meter:* ${bar}
│
${count >= max - 1 ? '├─⧭ 🚨 *One more warn = KICK*\n│\n' : ''}└─⧭🦊`,
            mentions: [target]
        }, { quoted: m });
    }
};
