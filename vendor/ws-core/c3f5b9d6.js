export default {
    name: 'setdesc',
    alias: ['setdescription', 'setgroupdesc', 'gdesc', 'setdes', 'desc'],
    category: 'group',
    description: 'Change the group description',
    
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
├─⧭ Only admins can change group description!
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
├─⧭ I need to be an admin to change group description!
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            const newDesc = args.join(' ').trim();
            
            if (!newDesc) {
                const currentDesc = groupMetadata.desc || '*No description set*';
                const shortCurrent = currentDesc.length > 100 ? currentDesc.substring(0, 97) + '...' : currentDesc;
                
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *SET GROUP DESCRIPTION* 📝 ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}setdesc <new description>
│
├─⧭ *Examples:*
│ • ${PREFIX}setdesc Welcome to Foxy Friends!
│ • ${PREFIX}setdesc No spam allowed here
│ • ${PREFIX}setdesc Share memes and have fun
│
├─⧭ *Current description:*
│ ${shortCurrent}
│
├─⧭ *To remove:*
│ ${PREFIX}setdesc remove
│
├─⧭ *Limits:*
│ • Max 500 characters
│ • Supports emojis and links
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            // Handle removal
            if (newDesc.toLowerCase() === 'remove' || newDesc.toLowerCase() === 'delete' || newDesc.toLowerCase() === 'none') {
                // Send processing message
                const processingMsg = await sock.sendMessage(chatId, {
                    text: `┌─⧭ *REMOVING* 🗑️ ⧭─┐
│
│ Removing group description...
│
└─⧭🦊`
                }, { quoted: msg });
                
                // Remove description (set to empty)
                await sock.groupUpdateDescription(chatId, '');
                
                // Delete processing message
                await sock.sendMessage(chatId, {
                    delete: processingMsg.key
                });
                
                // Send success message
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ DESCRIPTION REMOVED* ⧭─┐
│
├─⧭ *Group description has been removed.*
├─⧭ *Changed by:* ${msg.pushName || 'Admin'}
│
│ Group now has no description.
│
└─⧭🦊`
                }, { quoted: msg });
                
                return;
            }
            
            if (newDesc.length > 500) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *DESCRIPTION TOO LONG* ❌ ⧭─┐
│
├─⧭ *Length:* ${newDesc.length} chars
├─⧭ *Max:* 500 chars
│
│ Please use a shorter description.
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            // Send processing message
            const processingMsg = await sock.sendMessage(chatId, {
                text: `┌─⧭ *UPDATING* 🔄 ⧭─┐
│
├─⧭ Changing group description to:
│ "${newDesc.substring(0, 50)}${newDesc.length > 50 ? '...' : ''}"
│
│ Please wait...
│
└─⧭🦊`
            }, { quoted: msg });
            
            // Update group description
            await sock.groupUpdateDescription(chatId, newDesc);
            
            // Delete processing message
            await sock.sendMessage(chatId, {
                delete: processingMsg.key
            });
            
            // Format display of new description
            const displayDesc = newDesc.length > 100 ? newDesc.substring(0, 97) + '...' : newDesc;
            const oldDesc = groupMetadata.desc ? (groupMetadata.desc.length > 100 ? groupMetadata.desc.substring(0, 97) + '...' : groupMetadata.desc) : '*No description*';
            
            // Send success message
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *✅ DESCRIPTION UPDATED* ⧭─┐
│
├─⧭ *Old description:*
│ ${oldDesc}
│
├─⧭ *New description:*
│ ${displayDesc}
│
├─⧭ *Changed by:* ${msg.pushName || 'Admin'}
│
│ Group description has been updated!
│
└─⧭🦊`
            }, { quoted: msg });
            
        } catch (error) {
            console.error('Setdesc error:', error);
            
            let errorMsg = `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Bot not admin
│ • Network issue
│ • Invalid characters
│
└─⧭🦊`;
            
            if (error.message.includes('403')) {
                errorMsg = `┌─⧭ *PERMISSION ERROR* 🔒 ⧭─┐
│
├─⧭ I don't have permission to
├─⧭ change group description.
│
│ Make me an admin first!
│
└─⧭🦊`;
            }
            
            await sock.sendMessage(chatId, {
                text: errorMsg
            }, { quoted: msg });
        }
    }
};