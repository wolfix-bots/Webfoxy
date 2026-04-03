export default {
    name: "time",
    alias: ["clock", "date", "now"],
    description: "Show current time and date ⏰",
    category: "tools",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        const now = new Date();
        
        const time = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        });
        
        const date = now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        await sock.sendMessage(jid, {
            text: `┌─⧭ *🦊 CURRENT TIME* ⧭─┐
│
├─⧭ *📅 Date:*
│ ${date}
│
├─⧭ *⏰ Time:*
│ ${time}
│
├─⧭ *🌍 Timezone:*
│ ${timezone}
│
└─⧭🦊`
        }, { quoted: m });
    }
};