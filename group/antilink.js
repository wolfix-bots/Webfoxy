import fs from 'fs';
import path from 'path';

const antiLinkFile = './antilink.json';

// Ensure JSON file exists
if (!fs.existsSync(antiLinkFile)) {
    fs.writeFileSync(antiLinkFile, JSON.stringify([], null, 2));
}

// Load settings
function loadAntiLink() {
    try {
        if (!fs.existsSync(antiLinkFile)) return [];
        const data = fs.readFileSync(antiLinkFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading anti-link settings:', error);
        return [];
    }
}

// Save settings
function saveAntiLink(data) {
    try {
        fs.writeFileSync(antiLinkFile, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving anti-link settings:', error);
    }
}

// Utility function to clean JID
function cleanJid(jid) {
    if (!jid) return jid;
    const clean = jid.split(':')[0];
    return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

// List of URL patterns to detect
const URL_PATTERNS = [
    /https?:\/\/[^\s<>]+/gi,
    /www\.[^\s<>]+\.[a-zA-Z]{2,}/gi,
    /\b[a-zA-Z0-9-]+\.[a-zA-Z]{2,}\/[^\s<>]*/gi,
    /t\.me\/[^\s<>]+/gi,
    /instagram\.com\/[^\s<>]+/gi,
    /facebook\.com\/[^\s<>]+/gi,
    /twitter\.com\/[^\s<>]+/gi,
    /x\.com\/[^\s<>]+/gi,
    /youtube\.com\/[^\s<>]+/gi,
    /youtu\.be\/[^\s<>]+/gi,
    /whatsapp\.com\/[^\s<>]+/gi,
    /chat\.whatsapp\.com\/[^\s<>]+/gi,
    /discord\.gg\/[^\s<>]+/gi,
    /tiktok\.com\/[^\s<>]+/gi,
    /bit\.ly\/[^\s<>]+/gi,
    /tinyurl\.com\/[^\s<>]+/gi
];

// Check if message contains links
function containsLink(text) {
    if (!text || typeof text !== 'string') return false;
    const cleanText = text.replace(/[*_~`|]/g, '');
    for (const pattern of URL_PATTERNS) {
        pattern.lastIndex = 0;
        if (pattern.test(cleanText)) {
            return true;
        }
    }
    return false;
}

// Extract links from message
function extractLinks(text) {
    if (!text || typeof text !== 'string') return [];
    const links = [];
    const cleanText = text.replace(/[*_~`|]/g, '');
    for (const pattern of URL_PATTERNS) {
        pattern.lastIndex = 0;
        const matches = cleanText.match(pattern);
        if (matches) {
            matches.forEach(link => {
                let cleanLink = link.trim();
                if (cleanLink.startsWith('www.') && !cleanLink.startsWith('https://')) {
                    cleanLink = 'https://' + cleanLink;
                }
                cleanLink = cleanLink.replace(/[.,;:!?]+$/, '');
                if (!links.includes(cleanLink)) {
                    links.push(cleanLink);
                }
            });
        }
    }
    return links;
}

// Extract text from any message type
function extractMessageText(message) {
    if (!message) return '';
    
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage) return message.extendedTextMessage.text || '';
    if (message.imageMessage) return message.imageMessage.caption || '';
    if (message.videoMessage) return message.videoMessage.caption || '';
    if (message.documentMessage) return message.documentMessage.caption || '';
    if (message.audioMessage) return message.audioMessage.caption || '';
    
    return '';
}

// Setup listener once globally
let antiLinkListenerAttached = false;

export default {
    name: 'antilink',
    alias: ['antilink', 'nolink', 'blocklink'],
    category: 'group',
    description: 'Control link sharing in the group 🔗',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const { jidManager } = extra;
        
        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ONLY* 👥 ⧭─┐
│
├─⧭ This command only works in groups!
│
└─⧭🦊`
            }, { quoted: msg });
        }

        // Get sender's JID
        let sender = msg.key.participant || (msg.key.fromMe ? sock.user.id : msg.key.remoteJid);
        sender = cleanJid(sender);

        // Check if user is admin
        let isAdmin = false;
        let botIsAdmin = false;
        let botIsSuperAdmin = false;
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const cleanSender = cleanJid(sender);
            
            const participant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === cleanSender;
            });
            
            isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
            
            const botJid = cleanJid(sock.user?.id);
            const botParticipant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === botJid;
            });
            botIsAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';
            botIsSuperAdmin = botParticipant?.admin === 'superadmin';
            
        } catch (error) {
            console.error('Error fetching group metadata:', error);
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Failed to fetch group info
│
└─⧭🦊`
            }, { quoted: msg });
        }

        // ONLY admins can use the command
        if (!isAdmin) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *ADMIN ONLY* 👑 ⧭─┐
│
├─⧭ Only group admins can use this!
│
└─⧭🦊`
            }, { quoted: msg });
        }

        const settings = loadAntiLink();
        const groupIndex = settings.findIndex(g => g.chatId === chatId);
        const currentGroupSettings = groupIndex !== -1 ? settings[groupIndex] : null;

        const subCommand = args[0]?.toLowerCase();
        const mode = args[1]?.toLowerCase();

        // Warn if bot is not admin for certain modes
        if (!botIsAdmin && (mode === 'delete' || mode === 'kick')) {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *BOT PERMISSION WARNING* ⚠️ ⧭─┐
│
├─⧭ I need admin permissions for:
│ • Delete mode
│ • Kick mode
│
├─⧭ Please make me an admin first!
│
└─⧭🦊`
            }, { quoted: msg });
        }

        if (subCommand === 'on') {
            if (!mode || !['warn', 'delete', 'kick'].includes(mode)) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ANTI-LINK SETUP* 🔗 ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}antilink on <mode>
│
├─⧭ *Modes:*
│ • warn   - Send warning only
│ • delete - Delete links + warn
│ • kick   - Kick users + delete
│
├─⧭ *Examples:*
│ • ${PREFIX}antilink on warn
│ • ${PREFIX}antilink on delete
│ • ${PREFIX}antilink on kick
│
└─⧭🦊`
                }, { quoted: msg });
            }

            const newSettings = {
                chatId,
                enabled: true,
                mode: mode,
                exemptAdmins: true,
                exemptLinks: [],
                warningCount: {}
            };

            if (groupIndex !== -1) {
                settings[groupIndex] = newSettings;
            } else {
                settings.push(newSettings);
            }

            saveAntiLink(settings);
            
            // Attach listener if not already attached
            if (!antiLinkListenerAttached) {
                setupAntiLinkListener(sock);
                antiLinkListenerAttached = true;
            }

            const modeEmoji = {
                'warn': '⚠️',
                'delete': '🗑️',
                'kick': '👢'
            };

            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ ANTI-LINK ENABLED* ⧭─┐
│
├─⧭ *Mode:* ${modeEmoji[mode]} ${mode.toUpperCase()}
│
├─⧭ *Action:*
│ ${mode === 'warn' ? '• Send warning only' : ''}
│ ${mode === 'delete' ? '• Delete links + warn' : ''}
│ ${mode === 'kick' ? '• Kick users + delete' : ''}
│
├─⧭ *Admins:* ✅ Exempt
│
├─⧭ *To disable:*
│ ${PREFIX}antilink off
│
└─⧭🦊`
            }, { quoted: msg });

        } 
        else if (subCommand === 'off') {
            if (groupIndex !== -1) {
                settings.splice(groupIndex, 1);
                saveAntiLink(settings);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *❌ ANTI-LINK DISABLED* ⧭─┐
│
├─⧭ Everyone can now share links.
│
└─⧭🦊`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *ℹ️ ALREADY DISABLED* ⧭─┐
│
├─⧭ Anti-link is not active in this group.
│
└─⧭🦊`
                }, { quoted: msg });
            }
        } 
        else if (subCommand === 'status') {
            const botStatus = botIsAdmin ? '✅ Yes' : '❌ No';
            const botSuperStatus = botIsSuperAdmin ? '✅ Yes' : '❌ No';
            
            if (currentGroupSettings) {
                const status = currentGroupSettings.enabled ? '✅ ENABLED' : '❌ DISABLED';
                const modeEmoji = {
                    'warn': '⚠️',
                    'delete': '🗑️',
                    'kick': '👢'
                };
                
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *📊 ANTI-LINK STATUS* ⧭─┐
│
├─⧭ *Status:* ${status}
├─⧭ *Mode:* ${modeEmoji[currentGroupSettings.mode]} ${currentGroupSettings.mode.toUpperCase()}
├─⧭ *Allowed Links:* ${currentGroupSettings.exemptLinks?.length || 0}
├─⧭ *Admins Exempt:* ${currentGroupSettings.exemptAdmins ? '✅ Yes' : '❌ No'}
│
├─⧭ *Bot Permissions:*
│ • Admin: ${botStatus}
│ • Superadmin: ${botSuperStatus}
│
├─⧭ *Commands:*
│ • ${PREFIX}antilink allow <link>
│ • ${PREFIX}antilink disallow <link>
│ • ${PREFIX}antilink listallowed
│
└─⧭🦊`
                }, { quoted: msg });
            } else {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *📊 ANTI-LINK STATUS* ⧭─┐
│
├─⧭ *Status:* ❌ DISABLED
│
├─⧭ *Bot Permissions:*
│ • Admin: ${botStatus}
│ • Superadmin: ${botSuperStatus}
│
├─⧭ *To enable:*
│ ${PREFIX}antilink on <mode>
│
└─⧭🦊`
                }, { quoted: msg });
            }
        }
        else if (subCommand === 'allow') {
            if (!currentGroupSettings || !currentGroupSettings.enabled) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Anti-link is not enabled!
│
├─⧭ Enable first:
│ ${PREFIX}antilink on <mode>
│
└─⧭🦊`
                }, { quoted: msg });
            }

            const linkToAllow = args.slice(1).join(' ').trim();
            if (!linkToAllow) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ALLOW LINK* ✅ ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}antilink allow <link>
│
├─⧭ *Example:*
│ ${PREFIX}antilink allow https://example.com
│
└─⧭🦊`
                }, { quoted: msg });
            }

            if (!currentGroupSettings.exemptLinks) {
                currentGroupSettings.exemptLinks = [];
            }

            const cleanLink = linkToAllow.replace(/^https?:\/\//, '').toLowerCase();
            
            if (currentGroupSettings.exemptLinks.includes(cleanLink)) {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *ALREADY ALLOWED* ✅ ⧭─┐
│
├─⧭ \`${cleanLink}\`
│
│ This link is already allowed.
│
└─⧭🦊`
                }, { quoted: msg });
            } else {
                currentGroupSettings.exemptLinks.push(cleanLink);
                settings[groupIndex] = currentGroupSettings;
                saveAntiLink(settings);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ LINK ALLOWED* ⧭─┐
│
├─⧭ \`${cleanLink}\`
│
│ This link can now be shared freely.
│
└─⧭🦊`
                }, { quoted: msg });
            }
        }
        else if (subCommand === 'disallow') {
            if (!currentGroupSettings || !currentGroupSettings.enabled) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Anti-link is not enabled!
│
└─⧭🦊`
                }, { quoted: msg });
            }

            const linkToRemove = args.slice(1).join(' ').trim();
            if (!linkToRemove) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *DISALLOW LINK* ❌ ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}antilink disallow <link>
│
├─⧭ *Example:*
│ ${PREFIX}antilink disallow https://example.com
│
└─⧭🦊`
                }, { quoted: msg });
            }

            if (!currentGroupSettings.exemptLinks || currentGroupSettings.exemptLinks.length === 0) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *NO ALLOWED LINKS* 📋 ⧭─┐
│
├─⧭ There are no allowed links to remove.
│
└─⧭🦊`
                }, { quoted: msg });
            }

            const cleanLink = linkToRemove.replace(/^https?:\/\//, '').toLowerCase();
            const index = currentGroupSettings.exemptLinks.indexOf(cleanLink);
            
            if (index === -1) {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *LINK NOT FOUND* ❌ ⧭─┐
│
├─⧭ \`${cleanLink}\`
│
│ This link is not in allowed list.
│
└─⧭🦊`
                }, { quoted: msg });
            } else {
                currentGroupSettings.exemptLinks.splice(index, 1);
                settings[groupIndex] = currentGroupSettings;
                saveAntiLink(settings);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *❌ LINK REMOVED* ⧭─┐
│
├─⧭ \`${cleanLink}\`
│
│ This link will now be blocked.
│
└─⧭🦊`
                }, { quoted: msg });
            }
        }
        else if (subCommand === 'listallowed') {
            if (!currentGroupSettings || !currentGroupSettings.enabled) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Anti-link is not enabled!
│
└─⧭🦊`
                }, { quoted: msg });
            }

            const allowedLinks = currentGroupSettings.exemptLinks || [];
            if (allowedLinks.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *📋 ALLOWED LINKS* ⧭─┐
│
├─⧭ No links are currently allowed.
│
├─⧭ *To add:*
│ ${PREFIX}antilink allow <link>
│
└─⧭🦊`
                }, { quoted: msg });
            } else {
                let listText = `┌─⧭ *📋 ALLOWED LINKS* ⧭─┐\n│\n`;
                allowedLinks.forEach((link, index) => {
                    listText += `├─⧭ ${index + 1}. \`${link}\`\n`;
                });
                listText += `│\n├─⧭ *Total:* ${allowedLinks.length} links\n│\n`;
                listText += `└─⧭🦊`;
                
                await sock.sendMessage(chatId, { text: listText }, { quoted: msg });
            }
        }
        else {
            // Show help
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🦊 FOXY ANTI-LINK* 🔗 ⧭─┐
│
├─⧭ *Commands:*
│
├─⧭ *Enable/Disable:*
│ • ${PREFIX}antilink on <mode>
│ • ${PREFIX}antilink off
│ • ${PREFIX}antilink status
│
├─⧭ *Modes:*
│ • warn   ⚠️  - Send warning only
│ • delete 🗑️  - Delete links + warn
│ • kick   👢  - Kick users + delete
│
├─⧭ *Link Management:*
│ • ${PREFIX}antilink allow <link>
│ • ${PREFIX}antilink disallow <link>
│ • ${PREFIX}antilink listallowed
│
├─⧭ *Examples:*
│ • ${PREFIX}antilink on delete
│ • ${PREFIX}antilink allow youtube.com
│
└─⧭🦊`
            }, { quoted: msg });
        }
    }
};

function setupAntiLinkListener(sock) {
    console.log('🔧 Setting up anti-link listener...');
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const newMsg = messages[0];
        
        if (!newMsg || !newMsg.key.remoteJid?.endsWith('@g.us')) return;
        if (newMsg.key.fromMe) return;
        
        const chatId = newMsg.key.remoteJid;
        
        const settings = loadAntiLink();
        const groupSettings = settings.find(g => g.chatId === chatId);
        
        if (!groupSettings || !groupSettings.enabled) return;
        
        const messageText = extractMessageText(newMsg.message);
        
        if (!containsLink(messageText)) return;
        
        const stickerSender = newMsg.key.participant || newMsg.key.remoteJid;
        const cleanStickerSender = cleanJid(stickerSender);
        const senderNumber = cleanStickerSender.split('@')[0];
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            
            let isSenderAdmin = false;
            const senderParticipant = groupMetadata.participants.find(p => {
                const cleanParticipantJid = cleanJid(p.id);
                return cleanParticipantJid === cleanStickerSender;
            });
            
            isSenderAdmin = senderParticipant?.admin === 'admin' || senderParticipant?.admin === 'superadmin';
            
            if (isSenderAdmin && groupSettings.exemptAdmins) return;
            
            const foundLinks = extractLinks(messageText);
            
            const isLinkAllowed = foundLinks.some(link => {
                const cleanLink = link.replace(/^https?:\/\//, '').toLowerCase();
                return groupSettings.exemptLinks?.includes(cleanLink);
            });
            
            if (isLinkAllowed) return;
            
            if (!groupSettings.warningCount) {
                groupSettings.warningCount = {};
            }
            
            const userId = cleanStickerSender;
            if (!groupSettings.warningCount[userId]) {
                groupSettings.warningCount[userId] = 0;
            }
            
            switch (groupSettings.mode) {
                case 'warn':
                    groupSettings.warningCount[userId]++;
                    const warnings = groupSettings.warningCount[userId];
                    
                    await sock.sendMessage(chatId, { 
                        text: `┌─⧭ *⚠️ LINK WARNING* ⧭─┐
│
├─⧭ *User:* @${senderNumber}
├─⧭ *Warning:* #${warnings}
├─⧭ *Links:* ${foundLinks.length}
│
│ Links are not allowed in this group!
│
└─⧭🦊`,
                        mentions: [cleanStickerSender]
                    });
                    
                    const warnSettingsIndex = settings.findIndex(g => g.chatId === chatId);
                    if (warnSettingsIndex !== -1) {
                        settings[warnSettingsIndex] = groupSettings;
                        saveAntiLink(settings);
                    }
                    break;
                    
                case 'delete':
                    await sock.sendMessage(chatId, { 
                        text: `┌─⧭ *🗑️ LINK DELETED* ⧭─┐
│
├─⧭ *User:* @${senderNumber}
│
│ Your message contained links
│ and has been removed.
│
└─⧭🦊`,
                        mentions: [cleanStickerSender]
                    });
                    
                    try {
                        await sock.sendMessage(chatId, { 
                            delete: {
                                id: newMsg.key.id,
                                participant: stickerSender,
                                remoteJid: chatId,
                                fromMe: false
                            }
                        });
                    } catch (deleteError) {
                        console.error('Failed to delete message:', deleteError);
                    }
                    break;
                    
                case 'kick':
                    const botJid = cleanJid(sock.user?.id);
                    const botParticipant = groupMetadata.participants.find(p => {
                        const cleanParticipantJid = cleanJid(p.id);
                        return cleanParticipantJid === botJid;
                    });
                    const botIsSuperAdmin = botParticipant?.admin === 'superadmin';
                    
                    if (!botIsSuperAdmin) {
                        await sock.sendMessage(chatId, { 
                            text: `┌─⧭ *⚠️ CANNOT KICK* ⧭─┐
│
├─⧭ *User:* @${senderNumber}
│
│ I need superadmin permissions
│ to kick members!
│
└─⧭🦊`,
                            mentions: [cleanStickerSender]
                        });
                        return;
                    }
                    
                    await sock.sendMessage(chatId, { 
                        text: `┌─⧭ *👢 LINK VIOLATION* ⧭─┐
│
├─⧭ *User:* @${senderNumber}
│
│ You are being kicked for
│ sharing links in this group.
│
└─⧭🦊`,
                        mentions: [cleanStickerSender]
                    });
                    
                    setTimeout(async () => {
                        try {
                            await sock.groupParticipantsUpdate(chatId, [cleanStickerSender], 'remove');
                            await sock.sendMessage(chatId, { 
                                text: `┌─⧭ *✅ USER KICKED* ⧭─┐
│
├─⧭ *User:* @${senderNumber}
│
│ Removed for sharing links.
│
└─⧭🦊`
                            });
                        } catch (kickError) {
                            console.error('Failed to kick user:', kickError);
                        }
                    }, 2000);
                    break;
            }
            
        } catch (error) {
            console.error('Error handling link detection:', error);
        }
    });
    
    console.log('✅ Anti-link listener attached');
}