import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temp directory for processing
const TEMP_DIR = path.join(process.cwd(), 'temp', 'toimg');
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Auto-cleanup old files (older than 10 minutes)
setInterval(() => {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > tenMinutes) {
                fs.unlinkSync(filePath);
            }
        }
    } catch (error) {}
}, 5 * 60 * 1000);

export default {
    name: "toimg",
    alias: ["toimage", "img", "unsticker", "sticker2img", "s2i"],
    category: "tools",
    description: "Convert stickers to images/GIFs 🖼️",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        const sender = m.pushName || 'Friend';
        
        try {
            // Check for sticker
            let stickerMessage = null;
            
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                stickerMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            } else if (m.message?.stickerMessage) {
                stickerMessage = m.message.stickerMessage;
            }
            
            if (!stickerMessage) {
                return sock.sendMessage(jid, { 
                    text: `┌─⧭ *STICKER TO IMAGE* 🖼️ ⧭─┐
│
├─⧭ *Usage:*
│ Reply to a sticker with \`${PREFIX}toimg\`
│
├─⧭ *Examples:*
│ ${PREFIX}toimg (reply to sticker)
│ ${PREFIX}unsticker (same)
│
└─⧭🦊`
                }, { quoted: m });
            }

            const isAnimated = stickerMessage.isAnimated || 
                              (stickerMessage.pseconds && stickerMessage.pseconds > 0) || 
                              false;
            
            // Download sticker
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            
            let buffer = Buffer.from([]);
            const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            if (buffer.length === 0) {
                throw new Error('Download failed');
            }

            const fileSizeKB = (buffer.length / 1024).toFixed(1);
            
            // Extract metadata
            let metadata = null;
            try {
                const { Image } = (await import('node-webpmux')).default;
                const img = new Image();
                await img.load(buffer);
                
                if (img.exif && img.exif.length > 0) {
                    const jsonString = img.exif.slice(22).toString('utf8').replace(/\0/g, '').trim();
                    if (jsonString) {
                        metadata = JSON.parse(jsonString);
                    }
                }
            } catch (e) {}

            // Process the sticker
            let resultBuffer;
            let format;
            
            if (isAnimated) {
                // Animated sticker
                const frameDelay = stickerMessage.pseconds ? 
                                  Math.max(20, Math.floor(stickerMessage.pseconds * 1000)) : 
                                  100;
                
                try {
                    const sharp = (await import('sharp')).default;
                    
                    resultBuffer = await sharp(buffer, { animated: true })
                        .gif({
                            loop: 0,
                            delay: frameDelay,
                            effort: 2
                        })
                        .toBuffer();
                    
                    format = 'gif';
                } catch (e) {
                    // Fallback to WebP
                    format = 'webp';
                    resultBuffer = buffer;
                }
            } else {
                // Static sticker
                try {
                    const sharp = (await import('sharp')).default;
                    
                    resultBuffer = await sharp(buffer)
                        .png({ quality: 90 })
                        .toBuffer();
                    
                    format = 'png';
                } catch (e) {
                    format = 'webp';
                    resultBuffer = buffer;
                }
            }

            // Build caption
            let caption = `┌─⧭ *STICKER CONVERTED* ✅ ⧭─┐\n`;
            caption += `│\n`;
            caption += `├─⧭ *Format:* ${format.toUpperCase()}\n`;
            caption += `├─⧭ *Size:* ${fileSizeKB}KB\n`;
            
            if (metadata) {
                if (metadata['sticker-pack-name']) {
                    caption += `├─⧭ *Pack:* ${metadata['sticker-pack-name']}\n`;
                }
                if (metadata['sticker-pack-publisher']) {
                    caption += `├─⧭ *Author:* ${metadata['sticker-pack-publisher']}\n`;
                }
            }
            
            caption += `├─⧭ *Requested by:* ${sender}\n`;
            caption += `│\n`;
            caption += `└─⧭🦊`;

            // Send result
            if (format === 'gif') {
                await sock.sendMessage(jid, {
                    video: resultBuffer,
                    caption: caption,
                    gifPlayback: true,
                    mimetype: 'image/gif'
                }, { quoted: m });
            } else if (format === 'webp' && isAnimated) {
                await sock.sendMessage(jid, {
                    video: resultBuffer,
                    caption: caption,
                    mimetype: 'video/webm'
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    image: resultBuffer,
                    caption: caption,
                    mimetype: format === 'webp' ? 'image/webp' : 'image/png'
                }, { quoted: m });
            }

        } catch (error) {
            console.error('❌ [TOIMG] Error:', error);
            
            await sock.sendMessage(jid, { 
                text: `┌─⧭ *CONVERSION FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${error.message.substring(0, 100)}
│
├─⧭ *Try:*
│ • Different sticker
│ • Static sticker first
│ • Reply properly
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};

console.log('🖼️ ToImg module loaded (no processing messages)');