import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - SILENT MODE
const CONFIG = {
    SAVE_DIR: './vv2_downloads',
    MAX_SIZE_MB: 100,
    AUTO_CLEANUP: true,
    CLEANUP_DELAY: 30000, // 30 seconds
    SILENT_MODE: true, // No notifications in original chat
    SHOW_SENDER_INFO: true, // Show who sent it in your DM
    DM_CAPTION: '' // Empty = no caption
};

// Track processed messages to avoid duplicates
const processedMessages = new Set();

// Ensure save directory exists
if (!fs.existsSync(CONFIG.SAVE_DIR)) {
    fs.mkdirSync(CONFIG.SAVE_DIR, { recursive: true });
}

// Utility functions
function cleanJid(jid) {
    if (!jid) return jid;
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

function generateFilename(type, mimetype = '', senderNumber) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    let extension = '.bin';
    if (mimetype) {
        const parts = mimetype.split('/');
        if (parts.length > 1) {
            const subtype = parts[1].split(';')[0];
            if (subtype.includes('jpeg') || subtype.includes('jpg')) extension = '.jpg';
            else if (subtype.includes('png')) extension = '.png';
            else if (subtype.includes('gif')) extension = '.gif';
            else if (subtype.includes('webp')) extension = '.webp';
            else if (subtype.includes('mp4')) extension = '.mp4';
            else if (subtype.includes('3gp')) extension = '.3gp';
            else if (subtype.includes('mov')) extension = '.mov';
            else if (subtype.includes('ogg')) extension = '.ogg';
            else if (subtype.includes('mpeg') || subtype.includes('mp3')) extension = '.mp3';
            else if (subtype.includes('aac')) extension = '.aac';
            else if (subtype.includes('m4a')) extension = '.m4a';
            else extension = '.' + subtype;
        }
    }
    
    return `${type}_${timestamp}_${random}${extension}`;
}

// Check if message is view-once
function isViewOnceMessage(message) {
    if (!message?.message) return false;
    
    if (message.message.imageMessage?.viewOnce) return true;
    if (message.message.videoMessage?.viewOnce) return true;
    if (message.message.audioMessage?.viewOnce) return true;
    
    if (message.message.viewOnceMessageV2) return true;
    if (message.message.viewOnceMessageV2Extension) return true;
    if (message.message.viewOnceMessage) return true;
    
    if (message.message.ephemeralMessage?.message?.viewOnceMessage) return true;
    
    return false;
}

// Extract media from view-once message
function extractViewOnceMedia(message) {
    try {
        // Direct view-once media
        if (message.message?.imageMessage?.viewOnce) {
            return {
                type: 'image',
                message: message.message.imageMessage,
                direct: true
            };
        }
        if (message.message?.videoMessage?.viewOnce) {
            return {
                type: 'video',
                message: message.message.videoMessage,
                direct: true
            };
        }
        if (message.message?.audioMessage?.viewOnce) {
            return {
                type: 'audio',
                message: message.message.audioMessage,
                direct: true
            };
        }
        
        // Wrapped view-once media
        let wrappedMessage = null;
        if (message.message?.viewOnceMessageV2?.message) {
            wrappedMessage = message.message.viewOnceMessageV2.message;
        } else if (message.message?.viewOnceMessageV2Extension?.message) {
            wrappedMessage = message.message.viewOnceMessageV2Extension.message;
        } else if (message.message?.viewOnceMessage?.message) {
            wrappedMessage = message.message.viewOnceMessage.message;
        } else if (message.message?.ephemeralMessage?.message?.viewOnceMessage?.message) {
            wrappedMessage = message.message.ephemeralMessage.message.viewOnceMessage.message;
        }
        
        if (wrappedMessage?.imageMessage) {
            return {
                type: 'image',
                message: wrappedMessage.imageMessage,
                direct: false
            };
        }
        if (wrappedMessage?.videoMessage) {
            return {
                type: 'video',
                message: wrappedMessage.videoMessage,
                direct: false
            };
        }
        if (wrappedMessage?.audioMessage) {
            return {
                type: 'audio',
                message: wrappedMessage.audioMessage,
                direct: false
            };
        }
    } catch (error) {
        console.error('Error extracting view-once media:', error);
    }
    
    return null;
}

// Delete file after delay
function cleanupFile(filepath, delay = CONFIG.CLEANUP_DELAY) {
    if (!CONFIG.AUTO_CLEANUP) return;
    
    setTimeout(() => {
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
                console.log(`🗑️ Cleaned up: ${path.basename(filepath)}`);
            }
        } catch (error) {
            console.error('Error cleaning up file:', error);
        }
    }, delay);
}

// Get owner JID from metadata or extra
function getOwnerJid(extra) {
    // Try multiple sources for owner info
    if (extra?.OWNER_JID) {
        return extra.OWNER_JID;
    }
    if (extra?.ownerJid) {
        return extra.ownerJid;
    }
    if (extra?.OWNER_NUMBER) {
        return extra.OWNER_NUMBER + '@s.whatsapp.net';
    }
    if (extra?.ownerNumber) {
        return extra.ownerNumber + '@s.whatsapp.net';
    }
    
    // Try global variables
    if (typeof global !== 'undefined') {
        if (global.OWNER_JID) return global.OWNER_JID;
        if (global.ownerJid) return global.ownerJid;
        if (global.OWNER_NUMBER) return global.OWNER_NUMBER + '@s.whatsapp.net';
        if (global.ownerNumber) return global.ownerNumber + '@s.whatsapp.net';
    }
    
    return null;
}

// Check if sender is owner
function isOwner(msg, extra) {
    if (!msg) return false;
    
    // fromMe is always owner
    if (msg.key.fromMe) return true;
    
    const senderJid = msg.key.participant || msg.key.remoteJid;
    const senderClean = cleanJid(senderJid);
    
    // Check against extra owner info
    if (extra?.OWNER_JID && senderClean === cleanJid(extra.OWNER_JID)) return true;
    if (extra?.ownerJid && senderClean === cleanJid(extra.ownerJid)) return true;
    
    // Check by number
    const senderNumber = senderClean.split('@')[0];
    if (extra?.OWNER_NUMBER && senderNumber === extra.OWNER_NUMBER) return true;
    if (extra?.ownerNumber && senderNumber === extra.ownerNumber) return true;
    
    // Check global
    if (typeof global !== 'undefined') {
        if (global.OWNER_JID && senderClean === cleanJid(global.OWNER_JID)) return true;
        if (global.ownerJid && senderClean === cleanJid(global.ownerJid)) return true;
        if (global.OWNER_NUMBER && senderNumber === global.OWNER_NUMBER) return true;
        if (global.ownerNumber && senderNumber === global.ownerNumber) return true;
    }
    
    return false;
}

// Generate info for owner's DM
function generateDMInfo(mediaInfo, fileSizeKB, senderNumber, senderName, chatName, originalCaption) {
    if (!CONFIG.SHOW_SENDER_INFO) return null;
    
    const timestamp = new Date().toLocaleString();
    
    let info = `📸 *View-Once Captured*\n\n`;
    info += `━━━━━━━━━━━━━━━\n`;
    info += `👤 *From:* ${senderName} (${senderNumber})\n`;
    info += `💬 *Chat:* ${chatName}\n`;
    info += `📊 *Type:* ${mediaInfo.type.toUpperCase()}\n`;
    info += `📁 *Size:* ${fileSizeKB} KB\n`;
    info += `🕒 *Time:* ${timestamp}\n`;
    
    if (mediaInfo.type === 'video' && mediaInfo.message.seconds) {
        info += `⏱️ *Duration:* ${mediaInfo.message.seconds}s\n`;
    }
    if (mediaInfo.message.width && mediaInfo.message.height) {
        info += `📐 *Dimensions:* ${mediaInfo.message.width}x${mediaInfo.message.height}\n`;
    }
    if (originalCaption) {
        info += `📝 *Caption:* ${originalCaption}\n`;
    }
    
    info += `━━━━━━━━━━━━━━━`;
    
    return info;
}

// Download media and send to owner's DM (silently)
async function downloadAndSendToOwnerDM(sock, message, mediaInfo, originalMsg, extra) {
    try {
        const msgId = message.key.id;
        const ownerJid = getOwnerJid(extra);
        
        if (!ownerJid) {
            console.error('VV2: No owner JID found!');
            return { success: false, error: 'Owner not configured' };
        }
        
        // Skip if already processed
        if (processedMessages.has(msgId)) {
            return { success: false, reason: 'already_processed' };
        }
        
        processedMessages.add(msgId);
        
        // Clean up processed messages set periodically
        if (processedMessages.size > 1000) {
            processedMessages.clear();
        }
        
        console.log(`⬇️ VV2 Downloading ${mediaInfo.type}...`);
        
        // Download the media
        const buffer = await downloadMediaMessage(
            message,
            'buffer',
            {},
            {
                logger: { level: 'silent' },
                reuploadRequest: sock.updateMediaMessage
            }
        );
        
        if (!buffer || buffer.length === 0) {
            throw new Error('Download failed: empty buffer');
        }
        
        // Check file size
        const fileSizeMB = buffer.length / (1024 * 1024);
        if (fileSizeMB > CONFIG.MAX_SIZE_MB) {
            throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB (max: ${CONFIG.MAX_SIZE_MB}MB)`);
        }
        
        // Get sender info
        const fromUser = message.key.participant || message.key.remoteJid;
        const senderNumber = cleanJid(fromUser).split('@')[0];
        const senderName = message.pushName || 'Unknown';
        
        // Get chat info
        const chatId = message.key.remoteJid;
        let chatName = 'Private Chat';
        if (chatId.endsWith('@g.us')) {
            try {
                const metadata = await sock.groupMetadata(chatId);
                chatName = metadata.subject || 'Group';
            } catch (error) {
                chatName = 'Group';
            }
        }
        
        // Generate filename
        const mimetype = mediaInfo.message.mimetype || '';
        const filename = generateFilename(mediaInfo.type, mimetype, senderNumber);
        const filepath = path.join(CONFIG.SAVE_DIR, filename);
        
        // Save temporarily
        fs.writeFileSync(filepath, buffer);
        const fileSizeKB = (buffer.length / 1024).toFixed(2);
        
        console.log(`✅ VV2 Downloaded: ${filename} (${fileSizeKB} KB) from ${senderNumber}`);
        
        // Generate info text for owner DM
        const originalCaption = mediaInfo.message.caption || '';
        const infoText = generateDMInfo(mediaInfo, fileSizeKB, senderNumber, senderName, chatName, originalCaption);
        
        let sentToOwner = false;
        
        // Send to owner's DM
        if (mediaInfo.type === 'image') {
            await sock.sendMessage(ownerJid, {
                image: fs.readFileSync(filepath),
                caption: infoText || CONFIG.DM_CAPTION || undefined
            });
            sentToOwner = true;
        } 
        else if (mediaInfo.type === 'video') {
            await sock.sendMessage(ownerJid, {
                video: fs.readFileSync(filepath),
                caption: infoText || CONFIG.DM_CAPTION || undefined,
                seconds: mediaInfo.message.seconds || 0
            });
            sentToOwner = true;
        } 
        else if (mediaInfo.type === 'audio') {
            await sock.sendMessage(ownerJid, {
                audio: fs.readFileSync(filepath),
                mimetype: mimetype || 'audio/mpeg',
                caption: infoText || CONFIG.DM_CAPTION || undefined
            });
            sentToOwner = true;
        }
        
        if (sentToOwner) {
            console.log(`✅ VV2 Sent to owner DM: ${filename}`);
            
            // Clean up the file after sending
            cleanupFile(filepath);
            
            return {
                success: true,
                filename,
                filepath,
                type: mediaInfo.type,
                sizeKB: fileSizeKB,
                sizeMB: fileSizeMB.toFixed(2),
                sender: senderNumber,
                chat: chatName,
                silent: CONFIG.SILENT_MODE,
                ownerJid: ownerJid
            };
        } else {
            throw new Error('Failed to send to owner DM');
        }
        
    } catch (error) {
        console.error('VV2 Download/send failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

// Clean old files from directory
function cleanOldFiles(maxAgeHours = 24) {
    try {
        const files = fs.readdirSync(CONFIG.SAVE_DIR);
        const now = Date.now();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        let deletedCount = 0;
        
        for (const file of files) {
            const filepath = path.join(CONFIG.SAVE_DIR, file);
            const stats = fs.statSync(filepath);
            const fileAge = now - stats.mtimeMs;
            
            if (fileAge > maxAgeMs) {
                fs.unlinkSync(filepath);
                deletedCount++;
                console.log(`🧹 Cleaned old file: ${file}`);
            }
        }
        
        if (deletedCount > 0) {
            console.log(`🧹 Cleaned ${deletedCount} old files from ${CONFIG.SAVE_DIR}`);
        }
    } catch (error) {
        console.error('Error cleaning old files:', error);
    }
}

// Clean old files on startup
cleanOldFiles();

// Auto-cleanup every hour
setInterval(() => {
    cleanOldFiles(1); // Clean files older than 1 hour
}, 60 * 60 * 1000);

// Main command module
export default {
    name: 'vv2',
    alias: ['vvprivate', 'viewonce2'],
    description: 'Silently capture view-once media and send to owner DM',
    category: 'utility',
    ownerOnly: false, // Anyone can use it, but it sends to owner
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const ownerJid = getOwnerJid(extra);

        // All feedback goes to owner's DM only — never to the original chat
        const notifyOwner = async (text) => {
            if (ownerJid) {
                try { await sock.sendMessage(ownerJid, { text }); } catch {}
            }
        };

        const subCommand = args[0]?.toLowerCase();

        if (subCommand === 'clean' || subCommand === 'clear') {
            try {
                const files = fs.readdirSync(CONFIG.SAVE_DIR);
                let deletedCount = 0;
                for (const file of files) {
                    fs.unlinkSync(path.join(CONFIG.SAVE_DIR, file));
                    deletedCount++;
                }
                await notifyOwner(`🗑️ VV2: Cleaned ${deletedCount} temporary files`);
            } catch (error) {
                await notifyOwner(`❌ VV2 clean error: ${error.message}`);
            }
            return; // No response in chat
        }

        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const contextInfo = msg.message?.extendedTextMessage?.contextInfo;

        // If no quoted message, notify owner silently — nothing visible in the chat
        if (!quotedMsg || !contextInfo) {
            await notifyOwner(`⚠️ VV2: Reply to a view-once message to capture it.`);
            return;
        }

        const quotedMessage = {
            key: {
                remoteJid: contextInfo.remoteJid,
                id: contextInfo.stanzaId,
                participant: contextInfo.participant,
                fromMe: contextInfo.fromMe
            },
            message: quotedMsg,
            pushName: msg.pushName
        };

        if (!isViewOnceMessage(quotedMessage)) {
            await notifyOwner(`❌ VV2: That message is not a view-once.`);
            return;
        }

        const mediaInfo = extractViewOnceMedia(quotedMessage);
        if (!mediaInfo) {
            await notifyOwner(`❌ VV2: Could not extract media from that message.`);
            return;
        }

        try {
            // Completely silent in the original chat — no typing, no read receipts, nothing
            const result = await downloadAndSendToOwnerDM(sock, quotedMessage, mediaInfo, msg, extra);

            if (result.success) {
                console.log(`✅ VV2: ${result.type} from ${result.sender} sent to owner DM silently`);
            } else if (result.reason !== 'already_processed') {
                await notifyOwner(`❌ VV2 failed: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('VV2 Error:', error);
            await notifyOwner(`❌ VV2 error: ${error.message}`);
        }
    }
};

console.log('🔐 VV2 Module loaded - SILENT MODE');
console.log(`📁 Temp storage: ${path.resolve(CONFIG.SAVE_DIR)}`);
console.log(`👑 Owner detection: Automatic`);
console.log(`🤫 Silent: ${CONFIG.SILENT_MODE ? 'YES - No chat notifications' : 'NO'}`);