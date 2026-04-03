export default {
    name: "mute",
    alias: ["lock", "close"],
    category: "group",
    description: "Mute/lock group (only admins can send messages)",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
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
├─⧭ Only admins can mute the group!
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
├─⧭ I need to be an admin to mute the group!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Check current setting
            const isMuted = groupMetadata.announce === true;
            
            if (isMuted) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ALREADY MUTED* 🔇 ⧭─┐
│
├─⧭ Group is already locked.
│
├─⧭ *To unmute:*
│ ${PREFIX}unmute
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Mute group
            await sock.groupSettingUpdate(chatId, 'announcement');
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🔇 GROUP MUTED* ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Muted by:* ${m.pushName || 'Admin'}
│
│ Only admins can send messages now.
│
└─⧭🦊`
            }, { quoted: m });
            
        } catch (error) {
            console.error('Mute error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *MUTE FAILED* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Bot not admin
│ • Already muted
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};