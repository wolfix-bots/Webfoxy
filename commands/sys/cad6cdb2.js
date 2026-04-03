import fs from "fs";
import path from "path";
import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temp directory for processing
const TMP_DIR = path.join(process.cwd(), "tmp", "setpp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Auto-cleanup old files (older than 10 minutes)
setInterval(() => {
    try {
        const files = fs.readdirSync(TMP_DIR);
        const now = Date.now();
        const tenMinutes = 10 * 60 * 1000;
        
        for (const file of files) {
            const filePath = path.join(TMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > tenMinutes) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Cleaned setpp temp: ${file}`);
            }
        }
    } catch (error) {}
}, 5 * 60 * 1000);

export default {
    name: "setpp",
    alias: ["setprofilepic", "foxpp", "setpfp", "profilepic", "setavatar", "foxavatar"],
    desc: "Change bot profile picture 🦊",
    category: "owner",
    usage: ".setpp [reply to image] or .setpp [image URL]",

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const sender = m.pushName || 'Friend';
        let processingMsg = null;

        try {
            // ✅ Only owner can use this
            if (!m.key.fromMe) {
                return await sock.sendMessage(chatId, {
                    text: `┌─⧭ *FOX DENIED* 🦊 ⧭─┐
│
├─⧭ Only the Alpha Fox (Owner)
├─⧭ can change my profile picture!
│
│ 🦊 This is an owner-only command.
│
└─⧭🦊`
                });
            }

            // Helper function to send messages
            const sendMessage = async (text, editKey = null) => {
                const options = { quoted: m };
                if (editKey) options.edit = editKey;
                return await sock.sendMessage(chatId, { text }, options);
            };

            // Show help if no arguments and no quoted message
            if (args.length === 0 && !m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                return await sendMessage(
                    `┌─⧭ *FOXY PROFILE* 🦊 ⧭─┐
│
├─⧭ *What I do:*
│ Change my profile picture!
│
├─⧭ *How to use:*
│ • Reply to image: \`${PREFIX}setpp\`
│ • URL method: \`${PREFIX}setpp [url]\`
│
├─⧭ *Examples:*
│ • Reply to image → \`.setpp\`
│ • \`.setpp https://example.com/fox.jpg\`
│
├─⧭ *Requirements:*
│ • Square image (1:1 ratio)
│ • Max size: 5MB
│ • Formats: JPG, PNG, WebP
│ • Owner only
│
├─⧭ *Quick tip:*
│ Use a cute fox picture! 🦊
│
└─⧭🦊 *Foxy needs a new look!*`
                );
            }

            // ✅ If user provides a URL
            if (args[0] && args[0].startsWith('http')) {
                const imageUrl = args[0];
                
                // Send processing message
                processingMsg = await sendMessage(
                    `┌─⧭ *FOXY UPDATER* 🦊 ⧭─┐
│
├─⧭ *Step 1/3:* 📥 Downloading from URL...
│
│ Foxy is fetching your image!
│
└─⧭`
                );

                const imagePath = path.join(TMP_DIR, `foxpp_url_${Date.now()}.jpg`);
                
                try {
                    const response = await axios.get(imageUrl, { 
                        responseType: "arraybuffer",
                        timeout: 10000
                    });
                    
                    fs.writeFileSync(imagePath, Buffer.from(response.data));
                    
                    // Check file size
                    const stats = fs.statSync(imagePath);
                    const fileSizeMB = stats.size / (1024 * 1024);
                    
                    if (fileSizeMB > 5) {
                        fs.unlinkSync(imagePath);
                        return await sendMessage(
                            `┌─⧭ *FILE TOO LARGE* ⚠️ ⧭─┐
│
├─⧭ *Size:* ${fileSizeMB.toFixed(2)} MB
├─⧭ *Limit:* 5 MB
│
│ Please use a smaller image!
│
└─⧭🦊`,
                            processingMsg.key
                        );
                    }
                    
                    await sendMessage(
                        `┌─⧭ *FOXY UPDATER* 🦊 ⧭─┐
│
├─⧭ *Step 2/3:* 🔄 Applying new look...
│
│ Making Foxy beautiful!
│
└─⧭`,
                        processingMsg.key
                    );

                    // Update profile picture
                    await sock.updateProfilePicture(sock.user.id, { url: imagePath });
                    
                    await sendMessage(
                        `┌─⧭ *✅ PROFILE UPDATED!* 🦊 ⧭─┐
│
├─⧭ *Method:* URL
├─⧭ *Size:* ${fileSizeMB.toFixed(2)} MB
├─⧭ *Updated by:* ${sender}
│
│ Foxy looks amazing! 🦊
│
└─⧭🦊`,
                        processingMsg.key
                    );
                    
                    fs.unlinkSync(imagePath);
                    
                } catch (error) {
                    fs.unlinkSync(imagePath).catch(() => {});
                    throw new Error(`URL download failed: ${error.message}`);
                }
                
                return;
            }

            // ✅ If replying to an image
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return await sendMessage(
                    `┌─⧭ *NO IMAGE* ❌ ⧭─┐
│
├─⧭ Please reply to an image
├─⧭ or provide a URL!
│
│ Usage: \`${PREFIX}setpp\` (reply to image)
│
└─⧭🦊`
                );
            }

            const imageMessage = quoted.imageMessage || quoted.stickerMessage;
            if (!imageMessage) {
                return await sendMessage(
                    `┌─⧭ *INVALID MEDIA* ❌ ⧭─┐
│
├─⧭ The replied message must contain:
│ • Image (JPG/PNG)
│ • Sticker (will be converted)
│
└─⧭🦊`
                );
            }

            // Send processing message
            processingMsg = await sendMessage(
                `┌─⧭ *FOXY UPDATER* 🦊 ⧭─┐
│
├─⧭ *Step 1/3:* 📥 Downloading image...
│
│ Foxy is getting your picture!
│
└─⧭`
            );

            // Download image
            const stream = await downloadContentFromMessage(imageMessage, "image");
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // Check file size
            const fileSizeMB = buffer.length / (1024 * 1024);
            if (fileSizeMB > 5) {
                return await sendMessage(
                    `┌─⧭ *FILE TOO LARGE* ⚠️ ⧭─┐
│
├─⧭ *Size:* ${fileSizeMB.toFixed(2)} MB
├─⧭ *Limit:* 5 MB
│
│ Please use a smaller image!
│
└─⧭🦊`,
                    processingMsg.key
                );
            }

            const imagePath = path.join(TMP_DIR, `foxpp_reply_${Date.now()}.jpg`);
            fs.writeFileSync(imagePath, buffer);

            await sendMessage(
                `┌─⧭ *FOXY UPDATER* 🦊 ⧭─┐
│
├─⧭ *Step 2/3:* 🔄 Applying new look...
├─⧭ *Size:* ${fileSizeMB.toFixed(2)} MB
│
│ Making Foxy beautiful!
│
└─⧭`,
                processingMsg.key
            );

            // Update profile picture
            await sock.updateProfilePicture(sock.user.id, { url: imagePath });
            
            // Clean up temp file
            fs.unlinkSync(imagePath);

            // Success message
            await sendMessage(
                `┌─⧭ *✅ PROFILE UPDATED!* 🦊 ⧭─┐
│
├─⧭ *Method:* Image Reply
├─⧭ *Size:* ${fileSizeMB.toFixed(2)} MB
├─⧭ *Updated by:* ${sender}
│
│ 🦊 *Foxy looks amazing!*
│
├─⧭ *What's new?*
│ • Fresh new look
│ • Ready to serve
│ • More fox energy!
│
└─⧭🦊 *Foxy is beautiful!*`,
                processingMsg.key
            );

            // Also send a quick confirmation with the new PP
            try {
                await sock.sendMessage(chatId, {
                    image: buffer,
                    caption: `🦊 *New Profile Picture!*\n\nFoxy got a makeover!`
                });
            } catch (e) {}

        } catch (error) {
            console.error("🦊 SetPP Error:", error);
            
            // Delete processing message if exists
            if (processingMsg) {
                try {
                    await sock.sendMessage(chatId, { delete: processingMsg.key });
                } catch (e) {}
            }
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *UPDATE FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${error.message.substring(0, 100)}
│
├─⧭ *Possible reasons:*
│ • Image too large (>5MB)
│ • Invalid image format
│ • Corrupted image
│ • Network issue
│
├─⧭ *Try:*
│ • Different image
│ • Use square image
│ • Reply directly to image
│ • Use URL method
│
└─⧭🦊 *Even foxes have bad hair days!*`
            });
        }
    }
};

console.log('🦊 SetPP module loaded - Fox Profile Picture Updater');
console.log(`📁 Temp folder: ${TMP_DIR}`);