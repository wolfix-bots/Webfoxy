import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

const TMP_DIR = path.join(process.cwd(), 'tmp', 'grouppp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

export default {
    name: "setgpp",
    alias: ["setgrouppic", "setgroupicon", "gpp"],
    category: "group",
    description: "Change group profile picture",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ONLY* 👥 ⧭─┐
│
├─⧭ This command only works in groups!
│
└─⧭🦊`
            }, { quoted: m });
        }
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            const senderId = m.key.participant || chatId;
            
            // Check if sender is admin
            const isSenderAdmin = participants.find(p => p.id === senderId)?.admin === 'admin' ||
                                 participants.find(p => p.id === senderId)?.admin === 'superadmin';
            
            if (!isSenderAdmin && !m.key.fromMe) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ADMIN ONLY* 👑 ⧭─┐
│
├─⧭ Only admins can change group icon!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if bot is admin
            const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin === 'admin' || 
                              participants.find(p => p.id === sock.user.id)?.admin === 'superadmin';
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *BOT NOT ADMIN* ❌ ⧭─┐
│
├─⧭ I need to be an admin to change group icon!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Get image
            let imageBuffer = null;
            
            // Check if URL provided
            if (args[0] && args[0].startsWith('http')) {
                const response = await axios.get(args[0], { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(response.data);
            }
            
            // Check quoted image
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (quoted?.imageMessage) {
                const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
                let buffer = Buffer.alloc(0);
                for await (const chunk of stream) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                imageBuffer = buffer;
            }
            
            if (!imageBuffer) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *SET GROUP PIC* 🖼️ ⧭─┐
│
├─⧭ *Usage:*
│ • Reply to an image
│ • Provide image URL
│
├─⧭ *Examples:*
│ • Reply to image → ${PREFIX}setgpp
│ • ${PREFIX}setgpp https://example.com/image.jpg
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Save temp file
            const filePath = path.join(TMP_DIR, `grouppp_${Date.now()}.jpg`);
            fs.writeFileSync(filePath, imageBuffer);
            
            // Update group picture
            await sock.updateProfilePicture(chatId, { url: filePath });
            
            // Clean up
            fs.unlinkSync(filePath);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ GROUP ICON UPDATED* ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Updated by:* ${m.pushName || 'Admin'}
│
│ 🖼️ New look for the group!
│
└─⧭🦊`
            }, { quoted: m });
            
        } catch (error) {
            console.error('Setgpp error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *UPDATE FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Invalid image
│ • Bot not admin
│ • Image too large
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};