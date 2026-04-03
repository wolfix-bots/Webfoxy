// commands/tools/tosticker.js - CLEAN VERSION (No extra messages!)

export default {
    name: "tosticker",
    alias: ["sticker2", "s", "stick"],
    category: "tools",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        try {
            // Check for image in different ways
            let imageMessage = null;
            
            // Method 1: Check if message is a reply to an image
            if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
                if (quoted.imageMessage) {
                    imageMessage = quoted.imageMessage;
                } else if (quoted.documentMessage?.mimetype?.startsWith('image/')) {
                    imageMessage = quoted.documentMessage;
                }
            }
            
            // Method 2: Check if message itself contains an image
            if (!imageMessage && m.message?.imageMessage) {
                imageMessage = m.message.imageMessage;
            }
            
            // Method 3: Check if message contains image document
            if (!imageMessage && m.message?.documentMessage?.mimetype?.startsWith('image/')) {
                imageMessage = m.message.documentMessage;
            }
            
            if (!imageMessage) {
                await sock.sendMessage(jid, { 
                    text: `🎨 *Image to Sticker*\n\nUsage:\n• Reply to image with \`${PREFIX}tosticker\`\n• Or send image with caption \`${PREFIX}tosticker\``
                }, { quoted: m });
                return;
            }

            // Get emoji from args (first arg) or use default
            const emoji = args[0] || '🤖';
            const packName = 'foxybot';
            const authorName = m.pushName || 'User';
            
            // Download image
            const { downloadContentFromMessage } = await import('@whiskeysockets/baileys');
            
            const downloadType = imageMessage.mimetype?.startsWith('image/') ? 'image' : 
                                (imageMessage.jpegThumbnail ? 'image' : 'document');
            
            const stream = await downloadContentFromMessage(imageMessage, downloadType);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            // Check size limit (3MB)
            if (buffer.length > 1024 * 1024 * 3) {
                await sock.sendMessage(jid, { 
                    text: `⚠️ *Image too large*\nMax size: 3MB\nYour image: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`
                }, { quoted: m });
                return;
            }
            
            try {
                // Convert to WebP using sharp
                const sharp = (await import('sharp')).default;
                
                // Process image
                let processedImage = sharp(buffer).rotate();
                
                // Get metadata
                const metadata = await sharp(buffer).metadata().catch(() => ({ width: 0, height: 0 }));
                
                // Resize to max 512x512 for stickers
                const maxSize = 512;
                if (metadata.width > maxSize || metadata.height > maxSize) {
                    processedImage = processedImage.resize(maxSize, maxSize, {
                        fit: 'inside',
                        withoutEnlargement: true,
                        background: { r: 0, g: 0, b: 0, alpha: 0 }
                    });
                }
                
                // Convert to WebP
                const webpBuffer = await processedImage
                    .webp({ quality: 80 })
                    .toBuffer();
                
                // Try to add metadata if available
                let finalSticker = webpBuffer;
                
                try {
                    const { Image } = (await import('node-webpmux')).default;
                    const crypto = await import('crypto');
                    
                    finalSticker = await addStickerMetadata(webpBuffer, {
                        packName, authorName, emoji
                    }, Image, crypto);
                } catch (e) {
                    // Ignore metadata errors
                }
                
                // Send ONLY the sticker (no extra message!)
                await sock.sendMessage(jid, {
                    sticker: finalSticker
                }, { quoted: m });
                
            } catch (sharpError) {
                // Fallback: send as sticker without processing
                await sock.sendMessage(jid, {
                    sticker: buffer
                }, { quoted: m });
            }

        } catch (error) {
            // Silent fail - don't send error message
            console.error('Sticker error:', error);
        }
    }
};

// Helper function for metadata (silent fail if not working)
async function addStickerMetadata(webpBuffer, metadata, Image, crypto) {
    try {
        const { packName, authorName, emoji } = metadata;
        
        const img = new Image();
        await img.load(webpBuffer);
        
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packName,
            'sticker-pack-publisher': authorName,
            'emojis': [emoji]
        };
        
        const exifAttr = Buffer.from([
            0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
            0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x16, 0x00, 0x00, 0x00
        ]);
        
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        
        img.exif = exif;
        
        return await img.save(null);
    } catch {
        return webpBuffer; // Return original on error
    }
}