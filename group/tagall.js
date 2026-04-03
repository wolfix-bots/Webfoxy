export default {
    name: 'tagall',
    alias: ['everyone', 'listall', 'members', 'taglist'],
    category: 'group',
    description: 'List and tag all members in the group',
    
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
├─⧭ Only admins can tag everyone!
│
└─⧭🦊`
                }, { quoted: msg });
            }
            
            const message = args.join(' ').trim() || '📢 Group Members List';
            
            // Separate admins and members
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const members = participants.filter(p => !p.admin);
            
            // Sort alphabetically by name (if available)
            const sortByName = (a, b) => {
                const nameA = a.name || a.id.split('@')[0];
                const nameB = b.name || b.id.split('@')[0];
                return nameA.localeCompare(nameB);
            };
            
            admins.sort(sortByName);
            members.sort(sortByName);
            
            // Build the member list
            let listText = `┌─⧭ *${message}* 👥 ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Total Members:* ${participants.length}
├─⧭ *Admins:* ${admins.length}
├─⧭ *Members:* ${members.length}
│
├─⧭ *👑 ADMIN LIST*\n`;
            
            // List admins
            if (admins.length > 0) {
                admins.forEach((admin, index) => {
                    const isSuper = admin.admin === 'superadmin' ? '👑' : '🔰';
                    const name = admin.name || admin.id.split('@')[0];
                    const number = admin.id.split('@')[0];
                    listText += `│ ${index + 1}. ${isSuper} @${number} ${name !== number ? `(${name})` : ''}\n`;
                });
            } else {
                listText += `│ No admins found\n`;
            }
            
            listText += `│
├─⧭ *👥 MEMBER LIST*\n`;
            
            // List members - FIXED: removed async from forEach
            if (members.length > 0) {
                for (let i = 0; i < members.length; i++) {
                    const member = members[i];
                    const name = member.name || member.id.split('@')[0];
                    const number = member.id.split('@')[0];
                    listText += `│ ${i + 1}. 👤 @${number} ${name !== number ? `(${name})` : ''}\n`;
                    
                    // Break into chunks if too long (WhatsApp limit ~100 mentions per message)
                    if ((i + 1) % 50 === 0 && i < members.length - 1) {
                        listText += `│\n└─⧭🦊 *Continued...*`;
                        
                        // Get mentions for this chunk
                        const chunkMentions = members.slice(i - 49, i + 1).map(m => m.id);
                        
                        // Send this chunk
                        await sock.sendMessage(chatId, {
                            text: listText,
                            mentions: [...admins.map(a => a.id), ...chunkMentions]
                        }, { quoted: msg });
                        
                        // Reset for next chunk
                        listText = `┌─⧭ *${message} (Continued)* 👥 ⧭─┐\n│\n`;
                    }
                }
            } else {
                listText += `│ No members found\n`;
            }
            
            listText += `│
├─⧭ *Total:* ${participants.length} members
├─⧭ *Requested by:* ${msg.pushName || 'Admin'}
│
└─⧭🦊`;
            
            // Get all mentions
            const allMentions = participants.map(p => p.id);
            
            // Send final message
            await sock.sendMessage(chatId, {
                text: listText,
                mentions: allMentions
            }, { quoted: msg });
            
            console.log(`📋 Tagall list sent in ${groupMetadata.subject} with ${participants.length} members`);
            
        } catch (error) {
            console.error('Tagall error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
├─⧭ *Possible reasons:*
│ • Too many members
│ • Network issue
│ • Bot not admin
│
└─⧭🦊`
            }, { quoted: msg });
        }
    }
};