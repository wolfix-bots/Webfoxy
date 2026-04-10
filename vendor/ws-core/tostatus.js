// tostatus.js — Post to your personal WhatsApp status
// Usage: .tostatus <message>   |   reply to image/video/audio + .tostatus [caption]
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

// Download with a hard 30-second timeout so the bot never freezes on large media
async function downloadToBuffer(msgContent, type) {
    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Download timed out after 30s')), 30000);
        try {
            const stream = await downloadContentFromMessage(msgContent, type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            clearTimeout(timer);
            resolve(Buffer.concat(chunks));
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });
}

export default {
    name: 'tostatus',
    alias: ['mystatus', 'poststatus', 'statuspost', 'setstatus'],
    category: 'automation',
    desc: 'Post text or media to your personal WhatsApp status',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = typeof extra?.isOwner === 'function' ? extra.isOwner() : (extra?.isOwner || false);
        if (!isOwner) {
            return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });
        }

        const textCaption = args.join(' ').trim();
        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage || null;
        const directImage = m.message?.imageMessage || null;
        const directVideo = m.message?.videoMessage || null;
        const directAudio = m.message?.audioMessage || null;

        const hasContent = textCaption || quotedMsg || directImage || directVideo || directAudio;

        if (!hasContent) {
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

        // Show a processing indicator
        const processing = await sock.sendMessage(chatId, {
            text: `🔄 Posting to your status...`
        }, { quoted: m });

        try {
            let posted = false;

            // --- Quoted image ---
            if (!posted && quotedMsg?.imageMessage) {
                const buf = await downloadToBuffer(quotedMsg.imageMessage, 'image');
                await sock.sendMessage('status@broadcast', { image: buf, caption: textCaption || '' });
                posted = true;
            }
            // --- Quoted video ---
            if (!posted && quotedMsg?.videoMessage) {
                const buf = await downloadToBuffer(quotedMsg.videoMessage, 'video');
                await sock.sendMessage('status@broadcast', { video: buf, caption: textCaption || '', gifPlayback: false });
                posted = true;
            }
            // --- Quoted audio ---
            if (!posted && quotedMsg?.audioMessage) {
                const buf = await downloadToBuffer(quotedMsg.audioMessage, 'audio');
                await sock.sendMessage('status@broadcast', {
                    audio: buf,
                    mimetype: quotedMsg.audioMessage.mimetype || 'audio/mpeg',
                    ptt: !!quotedMsg.audioMessage.ptt
                });
                posted = true;
            }
            // --- Quoted text ---
            if (!posted && (quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text)) {
                const base = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
                const finalText = textCaption ? `${base}\n\n${textCaption}` : base;
                await sock.sendMessage('status@broadcast', { text: finalText });
                posted = true;
            }
            // --- Direct image in the message ---
            if (!posted && directImage) {
                const buf = await downloadToBuffer(directImage, 'image');
                await sock.sendMessage('status@broadcast', { image: buf, caption: textCaption || '' });
                posted = true;
            }
            // --- Direct video ---
            if (!posted && directVideo) {
                const buf = await downloadToBuffer(directVideo, 'video');
                await sock.sendMessage('status@broadcast', { video: buf, caption: textCaption || '', gifPlayback: false });
                posted = true;
            }
            // --- Direct audio ---
            if (!posted && directAudio) {
                const buf = await downloadToBuffer(directAudio, 'audio');
                await sock.sendMessage('status@broadcast', {
                    audio: buf,
                    mimetype: directAudio.mimetype || 'audio/mpeg',
                    ptt: !!directAudio.ptt
                });
                posted = true;
            }
            // --- Plain text ---
            if (!posted && textCaption) {
                await sock.sendMessage('status@broadcast', { text: textCaption });
                posted = true;
            }

            await sock.sendMessage(chatId, { delete: processing.key }).catch(() => {});

            if (posted) {
                return sock.sendMessage(chatId, {
                    text: `✅ *Status Posted!*\n\n📡 Your WhatsApp status has been updated.${textCaption ? `\n📝 *Caption:* ${textCaption}` : ''}`
                }, { quoted: m });
            }

            return sock.sendMessage(chatId, { text: `❌ Nothing to post. Reply to a message or provide text.` }, { quoted: m });

        } catch (e) {
            await sock.sendMessage(chatId, { delete: processing.key }).catch(() => {});
            return sock.sendMessage(chatId, {
                text: `❌ *Failed to post status*\n\n_${e.message}_\n\nCommon causes:\n• Media too large\n• Unsupported format\n• Network issue — try again`
            }, { quoted: m });
        }
    }
};
