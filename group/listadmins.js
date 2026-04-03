export default {
    name: "listadmins",
    alias: ["admins", "adminlist", "mods"],
    category: "group",
    description: "List all group admins",
    
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
            
            // Filter admins
            const admins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            
            if (admins.length === 0) {
                return sock.sendMessage(chatId, {
                    text: `┌─⧭ *NO ADMINS* 👥 ⧭─┐
│
├─⧭ This group has no admins!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Build admin list
            let adminList = '';
            let mentions = [];
            
            admins.forEach((admin, index) => {
                const isSuper = admin.admin === 'superadmin' ? '👑' : '🔰';
                const adminNumber = admin.id.split('@')[0];
                adminList += `${index + 1}. ${isSuper} @${adminNumber}\n`;
                mentions.push(admin.id);
            });
            
            // Add bot if it's admin
            const isBotAdmin = admins.some(a => a.id === sock.user.id);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *GROUP ADMINS* 👑 ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Total Admins:* ${admins.length}
│
${adminList}
├─⧭ *Legend:*
│ 👑 = Super Admin
│ 🔰 = Admin
│
├─⧭ *Bot is admin:* ${isBotAdmin ? '✅ Yes' : '❌ No'}
│
└─⧭🦊`,
                mentions: mentions
            }, { quoted: m });
            
        } catch (error) {
            console.error('Listadmins error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Failed to get admin list
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};