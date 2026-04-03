export default {
    name: "promote",
    alias: ["makeadmin", "admin"],
    category: "group",
    description: "Promote user to admin",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const { jidManager } = extra;
        
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
├─⧭ Only admins can promote members!
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
├─⧭ I need to be an admin to promote people!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Get target user
            let target = null;
            
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
            
            target = mentioned || quoted;
            
            if (!target) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *PROMOTE USER* 👑 ⧭─┐
│
├─⧭ *Usage:*
│ • @mention the user
│ • Reply to their message
│
├─⧭ *Examples:*
│ • ${PREFIX}promote @user
│ • Reply to message → ${PREFIX}promote
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if already admin
            const isAlreadyAdmin = participants.find(p => p.id === target)?.admin === 'admin' ||
                                  participants.find(p => p.id === target)?.admin === 'superadmin';
            
            if (isAlreadyAdmin) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ALREADY ADMIN* 👑 ⧭─┐
│
├─⧭ This user is already an admin!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Promote user
            await sock.groupParticipantsUpdate(chatId, [target], 'promote');
            
            const cleaned = jidManager.cleanJid(target);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ USER PROMOTED* ⧭─┐
│
├─⧭ *User:* @${cleaned.cleanNumber}
├─⧭ *Promoted by:* ${m.pushName || 'Admin'}
│
│ 👑 Welcome to the admin team!
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
            
        } catch (error) {
            console.error('Promote error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *PROMOTE FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • User not in group
│ • Bot not admin
│ • Already admin
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};