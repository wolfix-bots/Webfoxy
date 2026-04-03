export default {
    name: "hidtag",
    alias: ["hidetag", "stealthtag", "tagall", "ht"],
    description: "Tag all members without showing mentions 🦊",
    category: "group",
    ownerOnly: false,
    groupOnly: true,
    adminOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        try {
            const groupMetadata = await sock.groupMetadata(jid);
            const participants = groupMetadata.participants;
            
            const message = args.join(" ") || "";
            
            if (!message) {
                return sock.sendMessage(jid, {
                    text: `┌─⧭ *HIDDEN TAG* 🦊 ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}hidtag <message>
│
├─⧭ *Examples:*
│ • ${PREFIX}hidtag Hello everyone!
│ • ${PREFIX}hidtag Meeting now
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Zero-width space character (invisible)
            const invisibleChar = "‎";
            
            // Send hidden tag message - NO CONFIRMATION
            await sock.sendMessage(jid, {
                text: `${message}${invisibleChar}`,
                mentions: participants.map(p => p.id)
            }, { quoted: m });
            
        } catch (error) {
            console.error('Hidtag error:', error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};