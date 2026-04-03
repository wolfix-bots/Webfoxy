export default {
    name: "kick",
    alias: ["remove", "ban"],
    category: "group",
    description: "Remove users from group",
    
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
├─⧭ Only admins can kick members!
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
├─⧭ I need to be an admin to kick people!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Get target user
            let target = null;
            
            // Check mentions
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            
            // Check quoted message
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
            
            target = mentioned || quoted;
            
            if (!target) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *KICK USER* 👢 ⧭─┐
│
├─⧭ *Usage:*
│ • @mention the user
│ • Reply to their message
│
├─⧭ *Examples:*
│ • ${PREFIX}kick @user
│ • Reply to message → ${PREFIX}kick
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if trying to kick bot
            if (target === sock.user.id) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *CAN'T KICK BOT* 🤖 ⧭─┐
│
├─⧭ You can't kick me! I'm a good fox!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check if trying to kick admin (and sender is not super admin)
            const isTargetAdmin = participants.find(p => p.id === target)?.admin === 'admin' ||
                                 participants.find(p => p.id === target)?.admin === 'superadmin';
            
            if (isTargetAdmin && !m.key.fromMe) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *CAN'T KICK ADMIN* 👑 ⧭─┐
│
├─⧭ You can't kick another admin!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Kick user
            await sock.groupParticipantsUpdate(chatId, [target], 'remove');
            
            const cleaned = jidManager.cleanJid(target);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ USER KICKED* ⧭─┐
│
├─⧭ *User:* @${cleaned.cleanNumber}
├─⧭ *Kicked by:* ${m.pushName || 'Admin'}
│
│ 👢 Bye bye!
│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });
            
        } catch (error) {
            console.error('Kick error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *KICK FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • User not in group
│ • Bot not admin
│ • Trying to kick admin
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};