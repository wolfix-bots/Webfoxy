import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// FIXED PATH - Uses current working directory
const MEDIA_STORAGE_PATH = path.join(process.cwd(), 'temp', 'antidelete_media');

// Ensure directory exists
if (!fs.existsSync(MEDIA_STORAGE_PATH)) {
    fs.mkdirSync(MEDIA_STORAGE_PATH, { recursive: true });
    console.log('✅ Created antidelete folder:', MEDIA_STORAGE_PATH);
}

// Owner info
let OWNER_JID = null;
let OWNER_NUMBER = null;

// Load owner info
try {
    const ownerPath = path.join(process.cwd(), 'owner.json');
    if (fs.existsSync(ownerPath)) {
        const ownerData = JSON.parse(fs.readFileSync(ownerPath, 'utf8'));
        OWNER_JID = ownerData.OWNER_JID || ownerData.ownerLID;
        OWNER_NUMBER = ownerData.OWNER_NUMBER || ownerData.ownerNumber;
        console.log('👑 Owner loaded');
    }
} catch (e) {}

// Store group names cache
const groupNames = new Map();

export default {
    name: 'antidelete',
    alias: ['undelete', 'antidel', 'ad'],
    category: 'utility',
    
    async execute(sock, msg, args, PREFIX, metadata = {}) {
        const chatId = msg.key.remoteJid;
        
        // Initialize tracker
        if (!global.antideleteTerminal) {
            global.antideleteTerminal = {
                active: false,
                mode: 'public',
                messageCache: new Map(),
                mediaStorage: new Map(),
                listenerSetup: false,
                processedDeletions: new Set(),
                downloading: new Map(),
                stats: {
                    detected: 0,
                    retrieved: 0,
                    media: 0
                }
            };
        }
        
        const tracker = global.antideleteTerminal;
        const command = args[0]?.toLowerCase() || 'help';
        
        // Helper functions
        const isOwner = (msg) => {
            if (msg.key.fromMe) return true;
            const sender = msg.key.participant || msg.key.remoteJid;
            const senderNum = sender.split('@')[0];
            return senderNum === OWNER_NUMBER;
        };
        
        const getOwnerJid = () => {
            if (OWNER_JID) return OWNER_JID;
            if (OWNER_NUMBER) return OWNER_NUMBER + '@s.whatsapp.net';
            return null;
        };

        // Function to get group name
        const getGroupName = async (groupId) => {
            if (groupNames.has(groupId)) {
                return groupNames.get(groupId);
            }
            try {
                const metadata = await sock.groupMetadata(groupId);
                const name = metadata.subject || 'Unknown Group';
                groupNames.set(groupId, name);
                return name;
            } catch (error) {
                return 'Unknown Group';
            }
        };

        // Function to format sender info - NAMES ONLY, NO NUMBERS!
        const getSenderInfo = async (msg) => {
            const isGroup = msg.key.remoteJid.endsWith('@g.us');
            const pushName = msg.pushName || 'Unknown';
            
            let fromText = `👤 *From:* ${pushName}`;
            
            if (isGroup) {
                const groupName = await getGroupName(msg.key.remoteJid);
                fromText += `\n💬 *Group:* ${groupName}`;
            }
            
            return fromText;
        };

        // Function to check if message has media
        const hasMedia = (msg) => {
            return !!(msg.message?.imageMessage || 
                     msg.message?.videoMessage || 
                     msg.message?.audioMessage || 
                     msg.message?.documentMessage ||
                     msg.message?.stickerMessage);
        };

        // Function to get media type
        const getMediaType = (msg) => {
            if (msg.message?.imageMessage) return 'image';
            if (msg.message?.videoMessage) return 'video';
            if (msg.message?.audioMessage) return 'audio';
            if (msg.message?.documentMessage) return 'document';
            if (msg.message?.stickerMessage) return 'sticker';
            return 'unknown';
        };

        // Function to get mime type
        const getMimeType = (msg) => {
            return msg.message?.imageMessage?.mimetype ||
                   msg.message?.videoMessage?.mimetype ||
                   msg.message?.audioMessage?.mimetype ||
                   msg.message?.documentMessage?.mimetype ||
                   msg.message?.stickerMessage?.mimetype ||
                   'application/octet-stream';
        };

        // Function to download media IMMEDIATELY
        const downloadMediaNow = async (msg, msgId) => {
            try {
                console.log(`📥 Downloading media for ${msgId.substring(0, 8)}...`);
                
                const buffer = await downloadMediaMessage(
                    msg,
                    'buffer',
                    {},
                    { 
                        logger: { level: 'silent' },
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
                
                if (buffer && buffer.length > 0) {
                    // Get extension from mime type
                    const mimetype = getMimeType(msg);
                    let ext = '.bin';
                    
                    if (mimetype.includes('jpeg') || mimetype.includes('jpg')) ext = '.jpg';
                    else if (mimetype.includes('png')) ext = '.png';
                    else if (mimetype.includes('gif')) ext = '.gif';
                    else if (mimetype.includes('webp')) ext = '.webp';
                    else if (mimetype.includes('mp4')) ext = '.mp4';
                    else if (mimetype.includes('ogg')) ext = '.ogg';
                    else if (mimetype.includes('mp3')) ext = '.mp3';
                    
                    const filename = `${msgId}_${Date.now()}${ext}`;
                    const filepath = path.join(MEDIA_STORAGE_PATH, filename);
                    
                    // Save to file
                    fs.writeFileSync(filepath, buffer);
                    
                    // Store in memory too
                    tracker.mediaStorage.set(msgId, {
                        path: filepath,
                        buffer: buffer,
                        type: getMediaType(msg),
                        mimetype: mimetype,
                        filename: filename
                    });
                    
                    console.log(`✅ Media saved: ${filename} (${(buffer.length/1024).toFixed(2)}KB)`);
                    tracker.downloading.delete(msgId);
                    return true;
                }
            } catch (error) {
                console.error(`❌ Download failed: ${error.message}`);
                tracker.downloading.delete(msgId);
            }
            return false;
        };
        
        // Setup listener
        if (!tracker.listenerSetup) {
            console.log('🚫 Setting up antidelete listener...');
            
            // Store messages when they come in
            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (!tracker.active || type !== 'notify') return;
                
                for (const msg of messages) {
                    if (msg.key?.fromMe) continue;
                    
                    const msgId = msg.key.id;
                    if (!msgId) continue;
                    
                    // Store message immediately with full info
                    tracker.messageCache.set(msgId, {
                        id: msgId,
                        chat: msg.key.remoteJid,
                        sender: msg.key.participant || msg.key.remoteJid,
                        pushName: msg.pushName || 'Unknown',
                        timestamp: Date.now(),
                        message: msg.message,
                        hasMedia: hasMedia(msg),
                        isGroup: msg.key.remoteJid.endsWith('@g.us')
                    });
                    
                    // If it has media, download it IMMEDIATELY
                    if (hasMedia(msg)) {
                        tracker.downloading.set(msgId, true);
                        await downloadMediaNow(msg, msgId);
                    }
                }
            });
            
            // Detect deletions
            sock.ev.on('messages.update', async (updates) => {
                if (!tracker.active) return;
                
                for (const update of updates) {
                    const isDeleted = update.update?.message === null || update.update?.status === 6;
                    if (!isDeleted) continue;
                    
                    const msgId = update.key.id;
                    if (!msgId || tracker.processedDeletions.has(msgId)) continue;
                    
                    tracker.processedDeletions.add(msgId);
                    tracker.stats.detected++;
                    
                    setTimeout(() => tracker.processedDeletions.delete(msgId), 10000);
                    
                    // Wait a bit for download to complete if still downloading
                    let waitCount = 0;
                    while (tracker.downloading.has(msgId) && waitCount < 10) {
                        await new Promise(r => setTimeout(r, 500));
                        waitCount++;
                    }
                    
                    const cached = tracker.messageCache.get(msgId);
                    if (!cached) continue;
                    
                    tracker.messageCache.delete(msgId);
                    tracker.stats.retrieved++;
                    
                    const media = tracker.mediaStorage.get(msgId);
                    if (media) tracker.stats.media++;
                    
                    // Get sender info - NAMES ONLY, NO NUMBERS!
                    const time = new Date(cached.timestamp).toLocaleTimeString();
                    
                    // Get sender info with name and group only
                    let fromText = `👤 *From:* ${cached.pushName}`;
                    
                    if (cached.isGroup) {
                        const groupName = await getGroupName(cached.chat);
                        fromText += `\n💬 *Group:* ${groupName}`;
                    }
                    
                    // Get text content
                    let text = '';
                    if (cached.message?.conversation) {
                        text = cached.message.conversation;
                    } else if (cached.message?.extendedTextMessage?.text) {
                        text = cached.message.extendedTextMessage.text;
                    } else if (cached.message?.imageMessage?.caption) {
                        text = cached.message.imageMessage.caption;
                    } else if (cached.message?.videoMessage?.caption) {
                        text = cached.message.videoMessage.caption;
                    }
                    
                    if (tracker.mode === 'private' && getOwnerJid()) {
                        // Send to owner DM
                        if (media) {
                            const caption = `🔒 *PRIVATE - DELETED ${media.type.toUpperCase()}*\n\n${fromText}\n🕒 Time: ${time}\n${text ? `\n💬 ${text}` : ''}`;
                            
                            if (media.type === 'image') {
                                await sock.sendMessage(getOwnerJid(), { 
                                    image: media.buffer, 
                                    caption,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'video') {
                                await sock.sendMessage(getOwnerJid(), { 
                                    video: media.buffer, 
                                    caption,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'audio') {
                                await sock.sendMessage(getOwnerJid(), { 
                                    audio: media.buffer,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'sticker') {
                                await sock.sendMessage(getOwnerJid(), { 
                                    sticker: media.buffer,
                                    mimetype: media.mimetype
                                });
                                // Send caption separately for stickers
                                await sock.sendMessage(getOwnerJid(), { text: caption });
                            }
                            
                            console.log(`✅ Media sent to owner DM: ${media.filename}`);
                            
                        } else {
                            await sock.sendMessage(getOwnerJid(), {
                                text: `🔒 *PRIVATE - DELETED MESSAGE*\n\n${fromText}\n🕒 Time: ${time}\n\n💬 ${text || 'Media message (could not retrieve)'}`
                            });
                        }
                        
                    } else {
                        // Send to original chat
                        if (media) {
                            const caption = `🚫 *DELETED ${media.type.toUpperCase()}*\n\n${fromText}\n🕒 Time: ${time}\n${text ? `\n💬 ${text}` : ''}`;
                            
                            if (media.type === 'image') {
                                await sock.sendMessage(cached.chat, { 
                                    image: media.buffer, 
                                    caption,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'video') {
                                await sock.sendMessage(cached.chat, { 
                                    video: media.buffer, 
                                    caption,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'audio') {
                                await sock.sendMessage(cached.chat, { 
                                    audio: media.buffer,
                                    mimetype: media.mimetype
                                });
                            } else if (media.type === 'sticker') {
                                await sock.sendMessage(cached.chat, { 
                                    sticker: media.buffer,
                                    mimetype: media.mimetype
                                });
                                // Send caption separately for stickers
                                await sock.sendMessage(cached.chat, { text: caption });
                            }
                            
                            console.log(`✅ Media sent to chat: ${media.filename}`);
                            
                        } else {
                            await sock.sendMessage(cached.chat, {
                                text: `🚫 *DELETED MESSAGE*\n\n${fromText}\n🕒 Time: ${time}\n\n💬 ${text || 'Media message (could not retrieve)'}`
                            });
                        }
                    }
                    
                    // Clean up file after sending
                    if (media) {
                        setTimeout(() => {
                            try { 
                                fs.unlinkSync(media.path); 
                                console.log(`🧹 Cleaned: ${media.filename}`);
                            } catch (e) {}
                            tracker.mediaStorage.delete(msgId);
                        }, 5000);
                    }
                }
            });
            
            tracker.listenerSetup = true;
            console.log('✅ Antidelete listener ready');
        }
        
        // ========== COMMANDS ==========
        
        if (command === 'on' || command === 'enable') {
            const mode = args[1]?.toLowerCase() === 'private' ? 'private' : 'public';
            
            if (mode === 'private' && !isOwner(msg)) {
                return sock.sendMessage(chatId, { 
                    text: '❌ Only owner can use private mode' 
                }, { quoted: msg });
            }
            
            tracker.active = true;
            tracker.mode = mode;
            
            // Reset stats
            tracker.stats = { detected: 0, retrieved: 0, media: 0 };
            
            await sock.sendMessage(chatId, { 
                text: `┌─⧭ *ANTIDELETE ON* ⧭─┐
│
├─⧭ Mode: ${mode === 'private' ? '🔒 PRIVATE' : '🌐 PUBLIC'}
├─⧭ Status: ✅ Active
│
│ I'll capture deleted messages with:
│ • Sender name
│ • Group name (if in group)
│ • Media (images/videos/audio)
│ • Original text/caption
│
└─⧭🦊` 
            }, { quoted: msg });
            return;
        }
        
        if (command === 'off' || command === 'disable') {
            tracker.active = false;
            await sock.sendMessage(chatId, { 
                text: `┌─⧭ *ANTIDELETE OFF* ⧭─┐
│
├─⧭ Status: ❌ Disabled
│
└─⧭🦊` 
            }, { quoted: msg });
            return;
        }
        
        if (command === 'status' || command === 'stats') {
            let files = 0;
            try {
                files = fs.readdirSync(MEDIA_STORAGE_PATH).length;
            } catch (e) {}
            
            await sock.sendMessage(chatId, { 
                text: `┌─⧭ *ANTIDELETE STATUS* ⧭─┐
│
├─⧭ Status: ${tracker.active ? '✅ ACTIVE' : '❌ INACTIVE'}
├─⧭ Mode: ${tracker.mode === 'private' ? '🔒 Private' : '🌐 Public'}
├─⧭ Detected: ${tracker.stats.detected}
├─⧭ Retrieved: ${tracker.stats.retrieved}
├─⧭ Media saved: ${tracker.stats.media}
├─⧭ Temp files: ${files}
│
├─⧭ *Features:*
│ • Shows sender name only
│ • Shows group name
│ • NO phone numbers shown
│ • Captures all media
│
├─⧭ *Commands:*
│ • ${PREFIX}ad on [private]
│ • ${PREFIX}ad off
│ • ${PREFIX}ad status
│ • ${PREFIX}ad test
│ • ${PREFIX}ad clear
│
└─⧭🦊` 
            }, { quoted: msg });
            return;
        }
        
        if (command === 'test') {
            const isGroup = chatId.endsWith('@g.us');
            let testMsg = `┌─⧭ *ANTIDELETE TEST* ⧭─┐
│
│ 📝 *Instructions:*
│ 1. Send an image/video
│ 2. Delete it immediately
│ 3. I'll capture it with:
│    • Your name
│    • ${isGroup ? 'Group name' : 'Chat type'}
│    • Time
│    • Media
│
│ Mode: ${tracker.mode === 'private' ? '🔒 Sent to owner' : '🌐 Shown here'}
│
│ Try it now! Send and delete.
│
└─⧭🦊`;
            
            await sock.sendMessage(chatId, { text: testMsg }, { quoted: msg });
            return;
        }
        
        if (command === 'clear') {
            const msgCount = tracker.messageCache.size;
            const mediaCount = tracker.mediaStorage.size;
            
            tracker.messageCache.clear();
            tracker.mediaStorage.clear();
            tracker.downloading.clear();
            
            // Delete all files
            try {
                const files = fs.readdirSync(MEDIA_STORAGE_PATH);
                for (const file of files) {
                    fs.unlinkSync(path.join(MEDIA_STORAGE_PATH, file));
                }
                console.log(`🧹 Deleted ${files.length} temp files`);
            } catch (e) {}
            
            await sock.sendMessage(chatId, { 
                text: `┌─⧭ *CACHE CLEARED* ⧭─┐
│
├─⧭ Cleared: ${msgCount} messages
├─⧭ Cleared: ${mediaCount} media files
├─⧭ Temp folder: Cleaned
│
└─⧭🦊` 
            }, { quoted: msg });
            return;
        }
        
        // Help
        await sock.sendMessage(chatId, { 
            text: `┌─⧭ *ANTIDELETE HELP* ⧭─┐
│
├─⧭ *Commands:*
│ • ${PREFIX}ad on - Enable public
│ • ${PREFIX}ad on private - Enable private
│ • ${PREFIX}ad off - Disable
│ • ${PREFIX}ad status - Show stats
│ • ${PREFIX}ad test - Test system
│ • ${PREFIX}ad clear - Clear cache
│
├─⧭ *When capturing:*
│ • Shows sender name only
│ • Shows group name (if in group)
│ • NO phone numbers shown
│ • Shows time
│ • Shows original text
│ • Shows media (images/videos/audio)
│
├─⧭ *Modes:*
│ • Public - Shows in this chat
│ • Private - Sends to owner DM
│
└─⧭🦊` 
        }, { quoted: msg });
    }
};

console.log('🚫 Antidelete module loaded');
console.log('📁 Storage:', MEDIA_STORAGE_PATH);
console.log('👤 Showing: Sender name only - NO NUMBERS!');