// resetwarn — clear warnings for a tagged member (admin only)
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
        console.error('⚠️ resetwarn save error:', e.message);
    }
}

function getKey(jid) { return jid.replace(/@.+/, ''); }

module.exports = {
    name: 'resetwarn',
    alias: ['clearwarn', 'unwarn', 'removewarn'],
    category: 'group',
    description: 'Reset warnings for a tagged member (admin only)',
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
                text: `❌ Tag someone.\n\nExample: ${PREFIX}resetwarn @user`
            }, { quoted: m });
        }

        const db  = loadWarns();
        const gid = getKey(chatId);
        const uid = getKey(target);

        if (db[gid] && db[gid][uid]) {
            db[gid][uid].count = 0;
            saveWarns(db);
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
        return await sock.sendMessage(chatId, {
            text: `✅ Warnings cleared for @${uid}.`,
            mentions: [target]
        }, { quoted: m });
    }
};
