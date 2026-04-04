// addsudo — owner-only; gives users sudo access (owner-level privileges)
// Sudos CANNOT addsudo — enforced by hard inner check
import fs from 'fs';
import path from 'path';

const SUDO_FILE = path.join(process.cwd(), 'utils', 'sudo.json');

function loadSudo() {
    try {
        if (fs.existsSync(SUDO_FILE)) return JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8'));
    } catch {}
    return [];
}

function saveSudo(list) {
    try {
        fs.mkdirSync(path.dirname(SUDO_FILE), { recursive: true });
        fs.writeFileSync(SUDO_FILE, JSON.stringify(list, null, 2));
    } catch (e) {
        console.error('sudo save error:', e.message);
    }
}

export default {
    name: 'addsudo',
    alias: ['sudoadd', 'setsudo'],
    category: 'owner',
    description: 'Give a user sudo (owner-level) access. Owner only — sudos cannot use this.',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;

        // Hard check — ONLY the actual owner can add sudo, not sudo users
        if (!jidManager.isOwner(m)) {
            return await sock.sendMessage(chatId, {
                react: { text: '👑', key: m.key }
            });
        }

        // Get target from mention or raw number
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        let targetJid   = mentioned && mentioned[0];
        let targetNum   = targetJid ? targetJid.replace(/@.+/, '') : null;

        if (!targetNum && args[0]) {
            targetNum = args[0].replace(/[^0-9]/g, '');
            targetJid = targetNum ? `${targetNum}@s.whatsapp.net` : null;
        }

        if (!targetNum) {
            return await sock.sendMessage(chatId, {
                text:
`┌─⧭ *ADD SUDO* 👥 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}addsudo @user
│ • ${PREFIX}addsudo 254712345678
│
├─⧭ *What sudo gets:*
│ • Use owner-only commands
│ • Bypass silent/private mode
│ • Cannot add more sudos
│
└─⧭🦊`
            }, { quoted: m });
        }

        const list = loadSudo();

        if (list.some(n => String(n).replace(/[^0-9]/g, '') === targetNum)) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ +${targetNum} is already a sudo user.`
            }, { quoted: m });
        }

        list.push(targetNum);
        saveSudo(list);

        await sock.sendMessage(chatId, { react: { text: '✅', key: m.key } });
        return await sock.sendMessage(chatId, {
            text:
`┌─⧭ *SUDO ADDED* ✅ ⧭─┐
│
├─⧭ *User:* +${targetNum}
├─⧭ *Access:* Owner-level commands
├─⧭ *Silent bypass:* Enabled
├─⧭ *Can addsudo:* ❌ No
│
└─⧭🦊`,
            mentions: targetJid ? [targetJid] : []
        }, { quoted: m });
    }
};
