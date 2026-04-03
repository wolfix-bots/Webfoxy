export default {
    name: "groups",
    alias: ["grouplist", "mygroups", "joinedgroups", "gcs", "grouppanel", "listgroups"],
    description: "Show all groups the bot is currently in 👥",
    category: "owner",
    usage: ".groups",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        const isGroup = chatId.endsWith('@g.us');
        
        const sendMessage = async (text, editKey = null) => {
            const options = { quoted: m };
            if (editKey) options.edit = editKey;
            return await sock.sendMessage(chatId, { text }, options);
        };
        
        try {
            const senderJid = m.key.participant || chatId;
            const cleaned = jidManager.cleanJid(senderJid);
            
            // Owner check
            if (!m.key.fromMe) {
                return await sendMessage(
                    `┌─⧭ *OWNER ONLY* 👑 ⧭─┐
│
├─⧭ This command is only for the bot owner.
│
└─⧭🦊`
                );
            }

            console.log(`🦊 Groups list requested by owner: ${cleaned.cleanNumber}`);

            // Send processing message
            const processingMsg = await sendMessage(
                `┌─⧭ *FOXY GROUPS* 👥 ⧭─┐
│
│ 🔍 Fetching group list...
│ Please wait, Foxy is counting!
│
└─⧭🦊`
            );

            // Get all groups
            let groups = [];
            
            try {
                const fetchedGroups = await sock.groupFetchAllParticipating().catch(() => ({}));
                groups = Object.values(fetchedGroups);
                console.log(`🦊 Found ${groups.length} groups`);
            } catch (e) {
                console.log("🦊 Group detection error:", e.message);
            }

            if (groups.length === 0) {
                return await sendMessage(
                    `┌─⧭ *NO GROUPS FOUND* 📭 ⧭─┐
│
├─⧭ I am not in any WhatsApp groups yet.
│
├─⧭ *Tips:*
│ • Add me to groups
│ • Wait for sync
│ • Check permissions
│
└─⧭🦊`,
                    processingMsg.key
                );
            }

            // Calculate stats
            const totalMembers = groups.reduce((acc, g) => acc + (g.participants?.length || 0), 0);
            const totalAdmins = groups.reduce((acc, g) => {
                return acc + (g.participants?.filter(p => p.admin)?.length || 0);
            }, 0);
            const groupsWithIcon = groups.filter(g => {
                try {
                    return g.subject && true;
                } catch {
                    return false;
                }
            }).length;

            // Prepare header
            let groupList = `┌─⧭ *🦊 FOXY GROUPS* ⧭─┐
│
├─⧭ *Summary:*
│ • Total Groups: ${groups.length}
│ • Total Members: ${totalMembers}
│ • Total Admins: ${totalAdmins}
│ • Groups with Icon: ${groupsWithIcon}
│
├─⧭ *Group List:*\n`;

            // Sort groups by name
            groups.sort((a, b) => a.subject?.localeCompare(b.subject || '') || 0);

            // Build group list with details
            groups.forEach((group, index) => {
                const name = group.subject || 'Unnamed Group';
                const members = group.participants?.length || 0;
                const admins = group.participants?.filter(p => p.admin)?.length || 0;
                const isMuted = group.announce ? '🔇' : '🔊';
                const isRestricted = group.restrict ? '🔒' : '🔓';
                const groupId = group.id.split('@')[0];
                
                // Truncate long names
                const displayName = name.length > 30 ? name.substring(0, 27) + '...' : name;
                
                groupList += `│
├─⧭ *${index + 1}. ${displayName}*
│   🆔 \`${groupId}\`
│   👥 ${members} members | 👑 ${admins} admins
│   ${isMuted} ${isMuted === '🔇' ? 'Muted' : 'Open'} | ${isRestricted} ${isRestricted === '🔒' ? 'Restricted' : 'Unrestricted'}
│   📝 ${group.desc ? (group.desc.length > 50 ? group.desc.substring(0, 47) + '...' : group.desc) : 'No description'}\n`;
            });

            // Add footer
            groupList += `│
├─⧭ *Requested by:* ${cleaned.cleanNumber || 'Owner'}
│
└─⧭🦊 *Foxy is in ${groups.length} groups!*`;

            // Delete processing message
            await sock.sendMessage(chatId, {
                delete: processingMsg.key
            });

            // Check if message is too long
            if (groupList.length > 65000) {
                const chunks = splitMessage(groupList, 65000);
                
                // Send first chunk with header
                await sendMessage(chunks[0]);
                
                // Send remaining chunks
                for (let i = 1; i < chunks.length; i++) {
                    await sendMessage(`┌─⧭ *CONTINUED* (Part ${i+1}/${chunks.length}) ⧭─┐\n${chunks[i].replace(/^┌─⧭.*⧭─┐\n/, '')}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } else {
                await sendMessage(groupList);
            }

            console.log(`✅ Groups list sent: ${groups.length} groups`);

        } catch (err) {
            console.error("🦊 [GROUPS ERROR]:", err);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${err.message}
│
├─⧭ *Possible reasons:*
│ • Network issue
│ • WhatsApp API error
│ • Too many groups
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};

// Helper function to split long messages
function splitMessage(text, maxLength) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
        let end = start + maxLength;
        if (end > text.length) end = text.length;
        
        // Try to split at group boundary
        if (end < text.length) {
            const lastGroup = text.lastIndexOf('\n\n├─⧭', end);
            if (lastGroup > start) {
                end = lastGroup;
            }
        }
        
        chunks.push(text.substring(start, end));
        start = end;
    }
    
    return chunks;
}