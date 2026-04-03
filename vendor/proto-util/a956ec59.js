import { downloadMediaMessage } from '@whiskeysockets/baileys';
import webp from 'node-webpmux';
import crypto from 'crypto';

export default {
    name: "take",
    alias: ["steal", "copysticker", "foxytake"],
    description: "Take a sticker and add custom metadata 🦊",
    category: "owner",
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;

        // Owner check
        if (!jidManager.isOwner(m)) {
            await sock.sendMessage(chatId, {
                react: { text: "👑", key: m.key }
            });
            return; // Complete silence
        }

        try {
            const pushname = m.pushName || m.sender.split('@')[0] || "User";

            // Check if message is a reply to a sticker
            const quotedMessage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stickerMessage = quotedMessage?.stickerMessage || m.quoted?.message?.stickerMessage;

            if (!stickerMessage) {
                await sock.sendMessage(chatId, {
                    react: { text: "❓", key: m.key }
                });
                return;
            }

            // Get emoji from args or use default
            const emoji = args.length > 0 ? args[0] : '🦊';

            try {
                // Get the message key for download
                const messageKey = m.quoted?.key || {
                    remoteJid: chatId,
                    id: m.message?.extendedTextMessage?.contextInfo?.stanzaId || m.key.id,
                    participant: m.sender
                };

                // Download the sticker
                const stickerBuffer = await downloadMediaMessage(
                    {
                        key: messageKey,
                        message: { stickerMessage },
                        messageType: 'stickerMessage'
                    },
                    'buffer',
                    {},
                    {
                        logger: { level: 'silent' },
                        reuploadRequest: sock.updateMediaMessage
                    }
                );

                if (!stickerBuffer) {
                    await sock.sendMessage(chatId, {
                        react: { text: "❌", key: m.key }
                    });
                    return;
                }

                // Add metadata using webpmux
                const img = new webp.Image();
                await img.load(stickerBuffer);

                // Create metadata
                const json = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': 'FoxyBot',
                    'sticker-pack-publisher': pushname,
                    'emojis': [emoji]
                };

                // Create exif buffer
                const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
                const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);

                // Set the exif data
                img.exif = exif;

                // Get the final buffer with metadata
                const finalBuffer = await img.save(null);

                // Send the sticker
                await sock.sendMessage(chatId, {
                    sticker: finalBuffer
                }, { quoted: m });

                // Add success reaction
                await sock.sendMessage(chatId, {
                    react: { text: emoji, key: m.key }
                });

                // Log silently
                const senderJid = m.key.participant || chatId;
                const cleaned = jidManager.cleanJid(senderJid);
                console.log(`🦊 Sticker taken by: ${cleaned.cleanNumber || 'Unknown'} with emoji: ${emoji}`);

            } catch (error) {
                console.error('Sticker error:', error.message);
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: m.key }
                });
            }

        } catch (error) {
            console.error('Command error:', error.message);
            await sock.sendMessage(chatId, {
                react: { text: "💥", key: m.key }
            });
        }
    }
};