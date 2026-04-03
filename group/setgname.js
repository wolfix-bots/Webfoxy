export default {
    name: 'setgname',
    alias: ['setname', 'setgroupname', 'gname', 'rename'],
    category: 'group',
    description: 'Change the group name',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        
        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ONLY* 👥 ⧭─┐
│
├─⧭ This command only works in groups!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        try {
            const groupMetadata = await sock.groupMetadata(chatId);
            const participants = groupMetadata.participants;
            const senderId = msg.key.participant || chatId;
            
            // Check if sender is admin
            const isSenderAdmin = participants.find(p => p.id === senderId)?.admin === 'admin' ||
                                 participants.find(p => p.id === senderId)?.admin === 'superadmin';
            
            if (!isSenderAdmin && !msg.key.fromMe) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *ADMIN ONLY* 👑 ⧭─┐
│
├─⧭ Only admins can change group name!
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            // Check if bot is admin
            const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin === 'admin' || 
                              participants.find(p => p.id === sock.user.id)?.admin === 'superadmin';
            
            if (!isBotAdmin) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *BOT NOT ADMIN* ❌ ⧭─┐
│
├─⧭ I need to be an admin to change group name!
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            const newName = args.join(' ').trim();
            
            if (!newName) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *SET GROUP NAME* 📝 ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}setgname <new name>
│
├─⧭ *Examples:*
│ • ${PREFIX}setgname Foxy Friends
│ • ${PREFIX}setgname Tech Talk
│ • ${PREFIX}setgname Gaming Zone
│
├─⧭ *Current name:*
│ ${groupMetadata.subject}
│
├─⧭ *Limits:*
│ • Max 50 characters
│ • No special restrictions
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            if (newName.length > 50) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *NAME TOO LONG* ❌ ⧭─┐
│
├─⧭ *Length:* ${newName.length} chars
├─⧭ *Max:* 50 chars
│
│ Please use a shorter name.
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            // Send processing message
            const processingMsg = await sock.sendMessage(chatId, {
                text: `┌─⧭ *UPDATING* 🔄 ⧭─┐
│
├─⧭ Changing group name to:
│ "${newName}"
│
│ Please wait...
│
└─⧭🦊`
            }, { quoted: msg });
            
            // Update group name
            await sock.groupUpdateSubject(chatId, newName);
            
            // Delete processing message
            await sock.sendMessage(chatId, {
                delete: processingMsg.key
            });
            
            // Send success message
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ NAME UPDATED* ⧭─┐
│
├─⧭ *Old name:* ${groupMetadata.subject}
├─⧭ *New name:* ${newName}
├─⧭ *Changed by:* ${msg.pushName || 'Admin'}
│
│ Group name has been updated!
│
└─⧭🦊`
            }, { quoted: msg });
            
        } catch (error) {
            console.error('Setgname error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Bot not admin
│ • Network issue
│ • Invalid name
│
└─⧭🦊`
            }, { quoted: msg });
        }
    }
};