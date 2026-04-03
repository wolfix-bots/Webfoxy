export default {
    name: "add",
    alias: ["adduser", "invite"],
    category: "group",
    description: "Add users to group (via reply or number)",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const { jidManager } = extra;
        
        // Check if in group
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
            // Get group metadata
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            
            // Check if bot is admin
            const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin === 'admin' || 
                              participants.find(p => p.id === sock.user.id)?.admin === 'superadmin';
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *BOT NOT ADMIN* ❌ ⧭─┐
│
├─⧭ I need to be an admin to add people!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Get target user
            let target = null;
            
            // Check quoted message
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
            
            // Check if args contain number
            if (args[0] && args[0].match(/^\d+$/)) {
                target = args[0] + '@s.whatsapp.net';
            }
            
            target = quoted || target;
            
            if (!target) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ADD USER* 👥 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}add <number>
│ • Reply to their message with ${PREFIX}add
│
├─⧭ *Examples:*
│ • ${PREFIX}add 1234567890
│ • Reply to message → ${PREFIX}add
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Add user to group
            await sock.groupParticipantsUpdate(chatId, [target], 'add');
            
            const cleaned = jidManager.cleanJid(target);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ USER ADDED* ⧭─┐
│
├─⧭ *User:* @${cleaned.cleanNumber}
├─⧭ *Added by:* ${m.pushName || 'Admin'}
│
│ Welcome to the group! 👋
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
            
        } catch (error) {
            console.error('Add error:', error);
            
            let errorMsg = `┌─⧭ *ADD FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Invalid number
│ • User already in group
│ • User privacy settings
│ • Bot not admin
│
└─⧭🦊`;
            
            if (error.message.includes('403')) {
                errorMsg = `┌─⧭ *PRIVACY RESTRICTED* 🔒 ⧭─┐
│
├─⧭ User has privacy settings that
├─⧭ prevent being added to groups.
│
│ They need to change their settings.
│
└─⧭🦊`;
            }
            
            await sock.sendMessage(chatId, {
                text: errorMsg
            }, { quoted: m });
        }
    }
};