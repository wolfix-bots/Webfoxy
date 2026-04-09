// togstatus.js — Post a message or media directly to any group chat
// Works from ANY chat — private, group, wherever
// Usage: .togstatus <groupJid> <message>   |   reply to media + .togstatus <groupJid>
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'togstatus',
    alias: ['grouppost', 'sendgroup', 'postgroup'],
    category: 'group',
    desc: 'Post a message or media directly to any group (works from anywhere)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        if (!args.length) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📢 *TOGSTATUS* ⌋
│
├─⊷ Post a message or media to any group
│  from *anywhere* (private, group etc.)
│
├─⊷ *Text post:*
│  \`${PREFIX}togstatus <groupJid> <message>\`
│
├─⊷ *Media post (reply to image/video):*
│  \`${PREFIX}togstatus <groupJid>\`
│
├─⊷ *Get group JIDs:*
│  \`${PREFIX}fetchgroups\`
│
├─⊷ *Personal Status:*
│  \`${PREFIX}tostatus <message>\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const groupJid = args[0];
        if (!groupJid.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: `❌ First argument must be a group JID ending in *@g.us*\n\nUse \`${PREFIX}fetchgroups\` to list all group JIDs.`
            }, { quoted: m });
        }

        const message = args.slice(1).join(' ');

        // Detect quoted media in reply
        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage;
        const quotedType = quotedMsg ? Object.keys(quotedMsg)[0] : null;
        const directImage = m.message?.imageMessage;
        const directVideo = m.message?.videoMessage;

        try {
            let groupName = groupJid;
            try { const meta = await sock.groupMetadata(groupJid); groupName = meta.subject; } catch {}

            let sent = false;

            /* ── Quoted image ── */
            if (quotedType === 'imageMessage') {
                const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage(groupJid, { image: Buffer.concat(chunks), caption: message || '' });
                sent = true;
            }
            /* ── Quoted video ── */
            else if (quotedType === 'videoMessage') {
                const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage(groupJid, { video: Buffer.concat(chunks), caption: message || '', gifPlayback: false });
                sent = true;
            }
            /* ── Quoted sticker ── */
            else if (quotedType === 'stickerMessage') {
                const stream = await downloadContentFromMessage(quotedMsg.stickerMessage, 'sticker');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage(groupJid, { sticker: Buffer.concat(chunks) });
                sent = true;
            }
            /* ── Direct image in current message ── */
            else if (directImage) {
                const stream = await downloadContentFromMessage(directImage, 'image');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage(groupJid, { image: Buffer.concat(chunks), caption: message || '' });
                sent = true;
            }
            /* ── Direct video ── */
            else if (directVideo) {
                const stream = await downloadContentFromMessage(directVideo, 'video');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage(groupJid, { video: Buffer.concat(chunks), caption: message || '', gifPlayback: false });
                sent = true;
            }
            /* ── Plain text ── */
            else {
                if (!message) {
                    return sock.sendMessage(chatId, {
                        text: `❌ Provide a message, or reply to an image/video.\n\n*Usage:* \`${PREFIX}togstatus ${groupJid} Hello!\``
                    }, { quoted: m });
                }
                await sock.sendMessage(groupJid, { text: message });
                sent = true;
            }

            if (sent) {
                await sock.sendMessage(chatId, {
                    text: `✅ *Posted to Group!*\n\n👥 *Group:* ${groupName}\n📝 *Content:* ${message || '[Media]'}`
                }, { quoted: m });
            }

        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: m });
        }
    }
};
