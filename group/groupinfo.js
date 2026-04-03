export default {
    name: 'groupinfo',
    alias: ['ginfo', 'infogroup', 'group', 'gc'],
    category: 'group',
    description: 'Show group information 📊',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const { jidManager } = extra;
        
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ONLY* 👥 ⧭─┐
│
├─⧭ This command works in groups only!
│
└─⧭🦊`
            }, { quoted: msg });
        }
        
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participants = metadata.participants || [];
            
            // Count stats
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const superAdmins = participants.filter(p => p.admin === 'superadmin');
            const regularAdmins = participants.filter(p => p.admin === 'admin');
            const members = participants.length;
            const bots = participants.filter(p => p.id.includes('bot') || p.id.includes('whatsappbot')).length;
            
            // Format dates
            const createdAt = new Date(metadata.creation * 1000);
            const createdDate = createdAt.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            const createdTime = createdAt.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            // Get group icon
            let hasIcon = false;
            try {
                await sock.profilePictureUrl(chatId, 'image');
                hasIcon = true;
            } catch {
                hasIcon = false;
            }
            
            // Get owner info
            let ownerJid = metadata.owner || participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
            let ownerName = 'Unknown';
            if (ownerJid !== 'Unknown') {
                const ownerParticipant = participants.find(p => p.id === ownerJid);
                ownerName = ownerParticipant?.name || ownerJid.split('@')[0];
            }
            
            // Build info text
            let infoText = `┌─⧭ *🦊 GROUP INFORMATION* ⧭─┐
│
├─⧭ *📌 Name:* ${metadata.subject}
`;
            
            // Add description if exists
            if (metadata.desc) {
                const shortDesc = metadata.desc.length > 50 ? metadata.desc.substring(0, 50) + '...' : metadata.desc;
                infoText += `├─⧭ *📝 Desc:* ${shortDesc}\n`;
            }
            
            infoText += `├─⧭ *🆔 ID:* \`${metadata.id}\`
│
├─⧭ *👥 Members:* ${members}
├─⧭ *👑 Admins:* ${admins.length} (${superAdmins.length} super, ${regularAdmins.length} regular)
${bots > 0 ? `├─⧭ *🤖 Bots:* ${bots}\n` : ''}├─⧭ *🖼️ Icon:* ${hasIcon ? '✅ Yes' : '❌ No'}
│
├─⧭ *📅 Created:*
│ • ${createdDate}
│ • ${createdTime}
│
├─⧭ *👤 Group Owner:*
│ • @${ownerJid.split('@')[0]}
│
├─⧭ *👑 Admin List:*\n`;

            // Show top 10 admins
            const topAdmins = admins.slice(0, 10);
            topAdmins.forEach((admin, index) => {
                const isSuper = admin.admin === 'superadmin' ? '👑' : '🔰';
                const adminName = admin.name || admin.id.split('@')[0];
                infoText += `│ ${index + 1}. ${isSuper} @${admin.id.split('@')[0]} (${adminName.substring(0, 15)})\n`;
            });
            
            if (admins.length > 10) {
                infoText += `│ ... and ${admins.length - 10} more admins\n`;
            }
            
            // Add group settings (simplified)
            infoText += `│
├─⧭ *⚙️ Settings:*
│ • ${metadata.announce ? '🔇 Muted' : '🔊 Open'}
│
├─⧭ *👤 Requested by:* ${msg.pushName || 'Friend'}
│
└─⧭🦊 *Foxy knows your group!*`;

            // Get all admin JIDs for mentions
            const adminJids = admins.map(a => a.id);
            
            await sock.sendMessage(chatId, {
                text: infoText,
                mentions: [ownerJid, ...adminJids]
            }, { quoted: msg });
            
        } catch (error) {
            console.error('Group info error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Failed to fetch group info!
│
├─⧭ *Possible reasons:*
│ • Bot not in group
│ • No internet
│ • Group deleted
│
└─⧭🦊`
            }, { quoted: msg });
        }
    }
};