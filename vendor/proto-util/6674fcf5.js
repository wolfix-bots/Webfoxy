// warnings — view warn counts for group members
import fs from 'fs';
import path from 'path';

const WARN_FILE = path.join(process.cwd(), 'utils', 'warnings.json');

function loadWarns() {
    try {
        if (fs.existsSync(WARN_FILE)) return JSON.parse(fs.readFileSync(WARN_FILE, 'utf-8'));
    } catch {}
    return {};
}

function getKey(jid) { return jid.replace(/@.+/, ''); }

export default {
    name: 'warnings',
    alias: ['warnlist', 'warns', 'warncount'],
    category: 'group',
    description: 'View warnings for a user or all warned members in the group',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '❌ Group only command.' }, { quoted: m });
        }

        const db  = loadWarns();
        const gid = getKey(chatId);

        if (!db[gid] || Object.keys(db[gid]).length === 0) {
            return await sock.sendMessage(chatId, { text: '✅ No warnings recorded in this group.' }, { quoted: m });
        }

        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target    = mentioned && mentioned[0];

        if (target) {
            const uid  = getKey(target);
            const info = db[gid][uid];
            if (!info || info.count === 0) {
                return await sock.sendMessage(chatId, {
                    text: `✅ @${uid} has no warnings.`,
                    mentions: [target]
                }, { quoted: m });
            }
            const bar = '⚠️'.repeat(info.count) + '▪️'.repeat(info.max - info.count);
            return await sock.sendMessage(chatId, {
                text:
`┌─⧭ *📋 WARNINGS* ⧭─┐
│
├─⧭ *User:* @${uid}
├─⧭ *Warns:* ${info.count}/${info.max}
├─⧭ *Meter:* ${bar}
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
        }

        let lines = '';
        let total = 0;
        for (const [uid, info] of Object.entries(db[gid])) {
            if (uid === '__settings') continue;
            if (info.count > 0) {
                lines += `┃ ⚠️ +${uid} — ${info.count}/${info.max} warns\n`;
                total++;
            }
        }

        if (total === 0) {
            return await sock.sendMessage(chatId, { text: '✅ No active warnings in this group.' }, { quoted: m });
        }

        return await sock.sendMessage(chatId, {
            text:
`╭━━━〔⚠️ *GROUP WARNINGS* 〕━━━╮
┃
${lines}┃
┃ *Total warned:* ${total} member(s)
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m });
    }
};
