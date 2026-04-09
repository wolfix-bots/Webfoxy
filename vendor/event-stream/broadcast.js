// broadcast.js — Send a message/media to ALL groups the bot is in
// Usage: .broadcast <message>  |  reply to image + .broadcast [caption]
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'broadcast',
    alias: ['bcast', 'sendall', 'allgroups', 'groupbroadcast'],
    category: 'group',
    desc: 'Send a message or media to ALL groups the bot is in (⚠️ use carefully)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const message = args.join(' ');
        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage;
        const quotedType = quotedMsg ? Object.keys(quotedMsg)[0] : null;
        const directImg = m.message?.imageMessage;

        if (!message && !quotedMsg && !directImg) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📢 *BROADCAST* ⌋
│
├─⊷ Sends a message to ALL groups
│
├─⊷ *Text:*
│  \`${PREFIX}broadcast Hello everyone!\`
│
├─⊷ *Image (reply to it):*
│  \`${PREFIX}broadcast [optional caption]\`
│
├─⊷ ⚠️ Use responsibly — sends to ALL groups
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '🔄 Fetching all groups...' }, { quoted: m });

        let groups = [];
        try {
            const all = await sock.groupFetchAllParticipating();
            groups = Object.keys(all);
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed to fetch groups: ${e.message}` }, { quoted: m });
        }

        if (!groups.length) return sock.sendMessage(chatId, { text: '📭 Bot is not in any groups.' }, { quoted: m });

        await sock.sendMessage(chatId, {
            text: `📡 *Broadcasting to ${groups.length} groups...*\n\n⏳ This may take a moment.`
        }, { quoted: m });

        // Prepare media buffer if needed
        let imageBuffer = null;
        if (quotedType === 'imageMessage') {
            const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
            const chunks = []; for await (const c of stream) chunks.push(c);
            imageBuffer = Buffer.concat(chunks);
        } else if (directImg) {
            const stream = await downloadContentFromMessage(directImg, 'image');
            const chunks = []; for await (const c of stream) chunks.push(c);
            imageBuffer = Buffer.concat(chunks);
        }

        let sent = 0, failed = 0;
        for (const jid of groups) {
            try {
                if (imageBuffer) {
                    await sock.sendMessage(jid, { image: imageBuffer, caption: message || '' });
                } else {
                    await sock.sendMessage(jid, { text: message });
                }
                sent++;
            } catch { failed++; }
            await new Promise(r => setTimeout(r, 600)); // 600ms delay per group to avoid ban
        }

        await sock.sendMessage(chatId, {
            text:
`✅ *Broadcast Complete!*

📊 *Results:*
├─ ✅ Sent: ${sent} groups
├─ ❌ Failed: ${failed} groups
╰─ 📦 Total: ${groups.length} groups`
        }, { quoted: m });
    }
};
