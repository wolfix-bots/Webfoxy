// tostatus.js — Post to your personal WhatsApp status
// Usage: .tostatus <message>   |   reply to image/video + .tostatus [caption]
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'tostatus',
    alias: ['mystatus', 'poststatus', 'statuspost', 'setstatus'],
    category: 'automation',
    desc: 'Post text or media to your personal WhatsApp status',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const message = args.join(' ');
        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage;
        const quotedType = quotedMsg ? Object.keys(quotedMsg)[0] : null;
        const directImage = m.message?.imageMessage;
        const directVideo = m.message?.videoMessage;

        if (!message && !quotedMsg && !directImage && !directVideo) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📡 *TOSTATUS* ⌋
│
├─⊷ Post to your personal WhatsApp status
│
├─⊷ *Text status:*
│  \`${PREFIX}tostatus Hello world!\`
│
├─⊷ *Image/Video status:*
│  Reply to media + \`${PREFIX}tostatus [caption]\`
│
├─⊷ *Group post:*
│  \`${PREFIX}togstatus <groupJid> <message>\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        try {
            /* ── Quoted image ── */
            if (quotedType === 'imageMessage') {
                const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage('status@broadcast', { image: Buffer.concat(chunks), caption: message || '' });
                return sock.sendMessage(chatId, { text: `✅ *Image Status Posted!*\n📝 Caption: ${message || '(none)'}` }, { quoted: m });
            }

            /* ── Quoted video ── */
            if (quotedType === 'videoMessage') {
                const stream = await downloadContentFromMessage(quotedMsg.videoMessage, 'video');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage('status@broadcast', { video: Buffer.concat(chunks), caption: message || '', gifPlayback: false });
                return sock.sendMessage(chatId, { text: `✅ *Video Status Posted!*\n📝 Caption: ${message || '(none)'}` }, { quoted: m });
            }

            /* ── Direct image in message ── */
            if (directImage) {
                const stream = await downloadContentFromMessage(directImage, 'image');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage('status@broadcast', { image: Buffer.concat(chunks), caption: message || '' });
                return sock.sendMessage(chatId, { text: `✅ *Image Status Posted!*` }, { quoted: m });
            }

            /* ── Direct video ── */
            if (directVideo) {
                const stream = await downloadContentFromMessage(directVideo, 'video');
                const chunks = []; for await (const c of stream) chunks.push(c);
                await sock.sendMessage('status@broadcast', { video: Buffer.concat(chunks), caption: message || '', gifPlayback: false });
                return sock.sendMessage(chatId, { text: `✅ *Video Status Posted!*` }, { quoted: m });
            }

            /* ── Text status ── */
            await sock.sendMessage('status@broadcast', { text: message });
            return sock.sendMessage(chatId, {
                text: `✅ *Status Posted!*\n\n📝 *Content:*\n${message}`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: m });
        }
    }
};
