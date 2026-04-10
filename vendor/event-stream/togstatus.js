// togstatus.js — Post a message or media to a GROUP's STATUS section (shows in group info)
// From inside a group (admin only): .togstatus [message]  |  reply to media + .togstatus [caption]
// From anywhere with a JID (owner only): .togstatus <groupJid> [message]
import { downloadContentFromMessage, generateWAMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';
import crypto from 'crypto';

// Download with a hard timeout so the bot never freezes on large media
async function downloadToBuffer(msgContent, type, timeoutMs = 30000) {
    return new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Download timed out after 30s')), timeoutMs);
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

// Build the sendable payload from quoted or direct message content
async function buildPayload(quotedMsg, directImage, directVideo, directAudio, textCaption) {
    if (quotedMsg?.imageMessage) {
        const buf = await downloadToBuffer(quotedMsg.imageMessage, 'image');
        return { image: buf, caption: textCaption || quotedMsg.imageMessage.caption || '' };
    }
    if (quotedMsg?.videoMessage) {
        const buf = await downloadToBuffer(quotedMsg.videoMessage, 'video');
        return { video: buf, caption: textCaption || quotedMsg.videoMessage.caption || '', gifPlayback: false };
    }
    if (quotedMsg?.audioMessage) {
        const buf = await downloadToBuffer(quotedMsg.audioMessage, 'audio');
        return { audio: buf, mimetype: quotedMsg.audioMessage.mimetype || 'audio/mpeg', ptt: !!quotedMsg.audioMessage.ptt };
    }
    if (quotedMsg?.stickerMessage) {
        const buf = await downloadToBuffer(quotedMsg.stickerMessage, 'sticker');
        return { sticker: buf, mimetype: 'image/webp' };
    }
    if (quotedMsg?.conversation || quotedMsg?.extendedTextMessage?.text) {
        const base = quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        return { text: textCaption ? `${base}\n\n${textCaption}` : base };
    }
    if (directImage) {
        const buf = await downloadToBuffer(directImage, 'image');
        return { image: buf, caption: textCaption || '' };
    }
    if (directVideo) {
        const buf = await downloadToBuffer(directVideo, 'video');
        return { video: buf, caption: textCaption || '', gifPlayback: false };
    }
    if (directAudio) {
        const buf = await downloadToBuffer(directAudio, 'audio');
        return { audio: buf, mimetype: directAudio.mimetype || 'audio/mpeg', ptt: !!directAudio.ptt };
    }
    if (textCaption) return { text: textCaption };
    return null;
}

// Post to GROUP STATUS — appears in the group info section, NOT the chat
// Uses groupStatusMessageV2 which is the correct Baileys API for group status updates
async function sendGroupStatus(sock, groupJid, content) {
    const inside = await generateWAMessageContent(content, { upload: sock.waUploadToServer });
    const messageSecret = crypto.randomBytes(32);

    // Attach messageSecret to inner message for end-to-end encryption
    const innerWithSecret = { ...inside, messageContextInfo: { messageSecret } };

    const m = generateWAMessageFromContent(groupJid, {
        messageContextInfo: { messageSecret },
        groupStatusMessageV2: { message: innerWithSecret }
    }, { userJid: sock.user?.id });

    await sock.relayMessage(groupJid, m.message, { messageId: m.key.id });
    return m;
}

function detectType(quotedMsg, directImage, directVideo, directAudio) {
    if (quotedMsg?.videoMessage || directVideo) return '🎥 Video';
    if (quotedMsg?.imageMessage || directImage) return '🖼️ Image';
    if (quotedMsg?.audioMessage || directAudio) return '🔊 Audio';
    if (quotedMsg?.stickerMessage) return '🏷️ Sticker';
    return '📝 Text';
}

export default {
    name: 'togstatus',
    alias: ['groupstatus', 'gstatus', 'gs', 'swgc', 'tosgroup'],
    category: 'group',
    desc: 'Post to a group\'s status (visible in group info). Run from inside the group or pass a JID.',
    adminOnly: false,
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;
        const isInGroup = chatId.endsWith('@g.us');
        const isOwner = typeof extra?.isOwner === 'function' ? extra.isOwner() : (extra?.isOwner || false);

        const ctxInfo = m.message?.extendedTextMessage?.contextInfo;
        const quotedMsg = ctxInfo?.quotedMessage || null;
        const directImage = m.message?.imageMessage || null;
        const directVideo = m.message?.videoMessage || null;
        const directAudio = m.message?.audioMessage || null;

        let targetJid = null;
        let textArg = '';

        // --- Decide mode: JID-based (owner) or in-group (admin) ---
        if (args.length > 0 && args[0].endsWith('@g.us')) {
            // Owner-only: specify a group JID from anywhere
            if (!isOwner) {
                return sock.sendMessage(chatId, {
                    text: `❌ Specifying a group JID is owner-only.\n\nRun \`${PREFIX}togstatus\` from *inside* the target group instead (admin required).`
                }, { quoted: m });
            }
            targetJid = args[0];
            textArg = args.slice(1).join(' ').trim();

        } else if (isInGroup) {
            // In-group mode: verify actual group admin status — do NOT assume owner = admin
            let isAdmin = false;
            try {
                const meta = await sock.groupMetadata(chatId);
                const p = meta.participants.find(pt =>
                    pt.id === sender || pt.id === sender.replace(/@.*/, '@s.whatsapp.net')
                );
                isAdmin = p && (p.admin === 'admin' || p.admin === 'superadmin');
            } catch {
                return sock.sendMessage(chatId, {
                    text: `❌ Could not verify admin status. Please try again.`
                }, { quoted: m });
            }

            if (!isAdmin && !isOwner) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ADMIN ONLY* 👑 ⧭─┐\n│\n├─⧭ Only group admins can post a group status!\n│\n└─⧭🦊`
                }, { quoted: m });
            }
            targetJid = chatId;
            textArg = args.join(' ').trim();

        } else {
            // Not in group, no JID — show help
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📢 *TOGSTATUS* ⌋
│
├─⊷ Posts to the group's *status* section
│  (visible in Group Info, not the chat)
│
├─⊷ *From inside the group (admin):*
│  \`${PREFIX}togstatus New announcement!\`
│  Reply to image/video/audio + \`${PREFIX}togstatus\`
│  Reply to media + \`${PREFIX}togstatus caption\`
│
├─⊷ *From anywhere with a JID (owner):*
│  \`${PREFIX}togstatus <groupJid> Your text\`
│
├─⊷ *Get group JIDs:*
│  \`${PREFIX}fetchgroups\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        // Nothing to post?
        if (!textArg && !quotedMsg && !directImage && !directVideo && !directAudio) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📢 *TOGSTATUS — No Content* ⌋
│
├─⊷ *Reply to a message* to post it as group status
├─⊷ *Or add text:* \`${PREFIX}togstatus Your message here\`
│
├─⊷ *Examples:*
│  Reply to image → \`${PREFIX}togstatus\`
│  \`${PREFIX}togstatus New group rules!\`
│  Reply to video → \`${PREFIX}togstatus Check this out!\`
│
├─⊷ *Supported types:*
│  🖼️ Image  🎥 Video  🔊 Audio  🏷️ Sticker  📝 Text
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const processing = await sock.sendMessage(chatId, {
            text: `🔄 Posting to group status...`
        }, { quoted: m });

        try {
            const payload = await buildPayload(quotedMsg, directImage, directVideo, directAudio, textArg);

            if (!payload) {
                await sock.sendMessage(chatId, { delete: processing.key }).catch(() => {});
                return sock.sendMessage(chatId, {
                    text: `❌ Could not process the content. Try replying to a message or add text.`
                }, { quoted: m });
            }

            let groupName = targetJid.split('@')[0];
            try {
                const meta = await sock.groupMetadata(targetJid);
                groupName = meta.subject;
            } catch {}

            await sendGroupStatus(sock, targetJid, payload);

            await sock.sendMessage(chatId, { delete: processing.key }).catch(() => {});

            const typeLabel = detectType(quotedMsg, directImage, directVideo, directAudio);
            return sock.sendMessage(chatId, {
                text:
`✅ *Group Status Posted!*

👥 *Group:* ${groupName}
${typeLabel}${textArg ? `\n📝 *Content:* ${textArg}` : ''}

Check the group's Info section to view it.`
            }, { quoted: m });

        } catch (e) {
            await sock.sendMessage(chatId, { delete: processing.key }).catch(() => {});
            let errMsg = e.message || String(e);
            if (/no sessions|nosessions/i.test(errMsg)) {
                errMsg = `No encryption session for this group yet.\n\n💡 Send any message in the group first, then try again.`;
            } else if (/not-authorized|forbidden/i.test(errMsg)) {
                errMsg = `Bot is not authorized. Make sure the bot is an admin in the group.`;
            }
            return sock.sendMessage(chatId, { text: `❌ Failed: ${errMsg}` }, { quoted: m });
        }
    }
};
