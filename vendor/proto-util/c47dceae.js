// setwarn — set the max warnings before auto-kick (admin only)
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
        console.error('⚠️ setwarn save error:', e.message);
    }
}

function getKey(jid) { return jid.replace(/@.+/, ''); }

module.exports = {
    name: 'setwarn',
    alias: ['maxwarn', 'warnlimit', 'warnmax'],
    category: 'group',
    description: 'Set max warnings before auto-kick for this group (admin only)',
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

        const num = parseInt(args[0]);
        if (!num || num < 1 || num > 20) {
            return await sock.sendMessage(chatId, {
                text: `❌ Provide a number between 1–20.\n\nExample: ${PREFIX}setwarn 5`
            }, { quoted: m });
        }

        const db  = loadWarns();
        const gid = getKey(chatId);
        if (!db[gid]) db[gid] = {};

        for (const uid in db[gid]) {
            if (uid !== '__settings') db[gid][uid].max = num;
        }
        db[gid].__settings = { defaultMax: num };
        saveWarns(db);

        await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
        return await sock.sendMessage(chatId, {
            text: `✅ Max warnings set to *${num}*.\nMembers will be kicked after ${num} warning(s).`
        }, { quoted: m });
    }
};
