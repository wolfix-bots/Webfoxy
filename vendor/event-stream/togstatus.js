// togstatus_clean.js — Send your WhatsApp status to a specific group's members
// Usage: .togstatus <groupJid> <message>   OR reply to media with .togstatus <groupJid>
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
    name: 'togstatus',
    alias: ['groupstatus', 'statusgroup', 'sendstatus'],
    category: 'group',
    desc: 'Send a status update visible to a specific group\'s members',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        if (!args.length) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📡 *TOGSTATUS* ⌋
│
├─⊷ *Send status to a specific group*
│
├─⊷ *Text status:*
│  \`${PREFIX}togstatus <groupJid> <message>\`
│
├─⊷ *Media status:*
│  Reply to an image/video + \`${PREFIX}togstatus <groupJid>\`
│
├─⊷ *Get group JIDs:*
│  \`${PREFIX}fetchgroups\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const groupJid = args[0];
        if (!groupJid.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: `❌ First argument must be a group JID ending in *@g.us*\n\nGet your group JIDs: \`${PREFIX}fetchgroups\``
            }, { quoted: m });
        }

        // Get group members
        let memberJids = [];
        let groupName = groupJid;
        try {
            const meta = await sock.groupMetadata(groupJid);
            memberJids = meta.participants.map(p => p.id);
            groupName = meta.subject;
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not fetch group: ${e.message}` }, { quoted: m });
        }

        const statusText = args.slice(1).join(' ');
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
            || m.message?.imageMessage
            || m.message?.videoMessage;

        const quotedType = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ? Object.keys(m.message.extendedTextMessage.contextInfo.quotedMessage)[0]
            : null;

        let sent = false;

        try {
            /* ── Media status (replied image/video) ── */
            if (quotedType === 'imageMessage' || quotedType === 'videoMessage') {
                const qMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
                const mediaMsg = qMsg[quotedType];
                const stream = await downloadContentFromMessage(mediaMsg, quotedType.replace('Message', ''));
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                const buffer = Buffer.concat(chunks);

                if (quotedType === 'imageMessage') {
                    await sock.sendImageMessage('status@broadcast',
                        { image: buffer, caption: statusText || '' },
                        { statusJidList: memberJids }
                    ).catch(() =>
                        sock.sendMessage('status@broadcast',
                            { image: buffer, caption: statusText || '' },
                            { statusJidList: memberJids }
                        )
                    );
                } else {
                    await sock.sendMessage('status@broadcast',
                        { video: buffer, caption: statusText || '', gifPlayback: false },
                        { statusJidList: memberJids }
                    );
                }
                sent = true;
            } else if (m.message?.imageMessage) {
                /* ── Direct image message ── */
                const stream = await downloadContentFromMessage(m.message.imageMessage, 'image');
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                await sock.sendMessage('status@broadcast',
                    { image: Buffer.concat(chunks), caption: statusText || '' },
                    { statusJidList: memberJids }
                );
                sent = true;
            }

            /* ── Text status ── */
            if (!sent) {
                if (!statusText) {
                    return sock.sendMessage(chatId, {
                        text: `❌ Provide a message or reply to media.\n*Usage:* \`${PREFIX}togstatus ${groupJid} Hello!\``
                    }, { quoted: m });
                }
                await sock.sendMessage('status@broadcast',
                    { text: statusText },
                    { statusJidList: memberJids }
                );
                sent = true;
            }

            /* ── Also forward to the group chat ── */
            if (sent) {
                const fwdContent = statusText
                    ? { text: `📡 *Status posted!*\n\n${statusText}` }
                    : { text: `📡 *Media status posted to ${groupName} members!*` };
                await sock.sendMessage(groupJid, fwdContent);
            }

            await sock.sendMessage(chatId, {
                text:
`✅ *Status Sent!*

👥 *Group:* ${groupName}
👤 *Visible to:* ${memberJids.length} members
📝 *Content:* ${statusText || '[Media]'}

📡 Status also posted in group chat.`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed to send status: ${e.message}` }, { quoted: m });
        }
    }
};
