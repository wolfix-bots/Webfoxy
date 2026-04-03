export default {
    name: "demote",
    alias: ["removeadmin", "unadmin"],
    category: "group",
    description: "Demote user from admin",
    
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
├─⧭ Only admins can demote members!
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
├─⧭ I need to be an admin to demote people!
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
                    text: `┌─⧭ *DEMOTE USER* ⬇️ ⧭─┐
│
├─⧭ *Usage:*
│ • @mention the admin
│ • Reply to their message
│
├─⧭ *Examples:*
│ • ${PREFIX}demote @admin
│ • Reply to message → ${PREFIX}demote
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if user is admin
            const isAdmin = participants.find(p => p.id === target)?.admin === 'admin' ||
                           participants.find(p => p.id === target)?.admin === 'superadmin';
            
            if (!isAdmin) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *NOT AN ADMIN* ❌ ⧭─┐
│
├─⧭ This user is not an admin!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if trying to demote bot
            if (target === sock.user.id) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *CAN'T DEMOTE BOT* 🤖 ⧭─┐
│
├─⧭ You can't demote me! I'm a good fox!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Demote user
            await sock.groupParticipantsUpdate(chatId, [target], 'demote');
            
            const cleaned = jidManager.cleanJid(target);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ USER DEMOTED* ⧭─┐
│
├─⧭ *User:* @${cleaned.cleanNumber}
├─⧭ *Demoted by:* ${m.pushName || 'Admin'}
│
│ 👤 Back to regular member
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
            
        } catch (error) {
            console.error('Demote error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *DEMOTE FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • User not in group
│ • Bot not admin
│ • Not an admin
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};