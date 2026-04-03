import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Save one level up from this command file (commands/owner/ -> commands/)
const MEDIA_DIR = path.join(__dirname, '..', 'media');
const IMAGE_PATH = path.join(MEDIA_DIR, 'foxybot.jpg');
const GIF_PATH = path.join(MEDIA_DIR, 'foxybot.gif');

// Create dir if not exists
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

export default {
    name: "setmenuimage",
    alias: ["setmenuimg", "menuimage", "setimg", "smi"],
    category: "owner",
    ownerOnly: true,
  
    async execute(sock, m, args, PREFIX, extra) {
        const { jidManager } = extra;
        
        // Owner check - silent reaction only
        if (!jidManager.isOwner(m)) {
            await sock.sendMessage(m.key.remoteJid, {
                react: { text: "👑", key: m.key }
            });
            return;
        }
        
        const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // If no quoted message and no args
        if (!quotedMsg && args.length === 0) {
            await sock.sendMessage(m.key.remoteJid, {
                react: { text: "❓", key: m.key }
            });
            return;
        }
        
        try {
            let buffer;
            let isGif = false;
            
            // React with processing
            await sock.sendMessage(m.key.remoteJid, {
                react: { text: "🔄", key: m.key }
            });
            
            // Handle URL
            if (args.length > 0 && args[0].startsWith('http')) {
                const response = await axios.get(args[0], { 
                    responseType: 'arraybuffer',
                    timeout: 10000
                });
                buffer = Buffer.from(response.data);
                isGif = args[0].toLowerCase().includes('.gif');
            } 
            // Handle quoted media
            else if (quotedMsg) {
                if (quotedMsg.videoMessage?.gifPlayback) {
                    isGif = true;
                    buffer = await downloadMediaMessage(
                        { message: quotedMsg },
                        'buffer',
                        {},
                        { logger: { level: 'silent' } }
                    );
                }
                else if (quotedMsg.imageMessage) {
                    buffer = await downloadMediaMessage(
                        { message: quotedMsg },
                        'buffer',
                        {},
                        { logger: { level: 'silent' } }
                    );
                }
                else if (quotedMsg.stickerMessage) {
                    buffer = await downloadMediaMessage(
                        { message: quotedMsg },
                        'buffer',
                        {},
                        { logger: { level: 'silent' } }
                    );
                }
                else if (quotedMsg.videoMessage) {
                    buffer = await downloadMediaMessage(
                        { message: quotedMsg },
                        'buffer',
                        {},
                        { logger: { level: 'silent' } }
                    );
                }
            }
            
            if (!buffer || buffer.length === 0) {
                await sock.sendMessage(m.key.remoteJid, {
                    react: { text: "❌", key: m.key }
                });
                return;
            }
            
            // Check size (10MB limit)
            if (buffer.length > 10 * 1024 * 1024) {
                await sock.sendMessage(m.key.remoteJid, {
                    react: { text: "⚠️", key: m.key }
                });
                return;
            }
            
            // Save file
            if (isGif) {
                fs.writeFileSync(GIF_PATH, buffer);
                fs.writeFileSync(IMAGE_PATH, buffer);
                console.log(`✅ GIF saved to: ${GIF_PATH}`);
            } else {
                fs.writeFileSync(IMAGE_PATH, buffer);
                if (fs.existsSync(GIF_PATH)) fs.unlinkSync(GIF_PATH);
                console.log(`✅ Image saved to: ${IMAGE_PATH}`);
            }
            
            // Success reaction
            await sock.sendMessage(m.key.remoteJid, {
                react: { text: "✅", key: m.key }
            });
            
            console.log(`🦊 Menu ${isGif ? 'GIF' : 'Image'} updated`);
            
        } catch (error) {
            console.error("Error:", error.message);
            await sock.sendMessage(m.key.remoteJid, {
                react: { text: "❌", key: m.key }
            });
        }
    }
};