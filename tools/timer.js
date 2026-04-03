export default {
    name: "timer",
    alias: ["alarm", "countdown", "reminder"],
    description: "Set a timer or reminder ⏰",
    category: "tools",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        const sender = m.pushName || 'Friend';
        
        if (args.length < 2) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOX TIMER* ⏰ ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}timer <time> <message>
│
├─⧭ *Formats:*
│ • 30s - seconds
│ • 5m  - minutes
│ • 2h  - hours
│ • 1d  - days
│
├─⧭ *Examples:*
│ ${PREFIX}timer 5m Pizza ready!
│ ${PREFIX}timer 30s Break time!
│
└─⧭🦊`
            }, { quoted: m });
        }
        
        const timeStr = args[0].toLowerCase();
        const message = args.slice(1).join(" ");
        
        let milliseconds = 0;
        
        if (timeStr.endsWith('s')) milliseconds = parseInt(timeStr) * 1000;
        else if (timeStr.endsWith('m')) milliseconds = parseInt(timeStr) * 60 * 1000;
        else if (timeStr.endsWith('h')) milliseconds = parseInt(timeStr) * 60 * 60 * 1000;
        else if (timeStr.endsWith('d')) milliseconds = parseInt(timeStr) * 24 * 60 * 60 * 1000;
        else milliseconds = parseInt(timeStr) * 1000;
        
        if (isNaN(milliseconds) || milliseconds <= 0) {
            return sock.sendMessage(jid, {
                text: `❌ Invalid format! Use: 30s, 5m, 2h, 1d`
            }, { quoted: m });
        }
        
        if (milliseconds > 24 * 60 * 60 * 1000) {
            return sock.sendMessage(jid, {
                text: `❌ Max timer is 24 hours!`
            }, { quoted: m });
        }
        
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const timeDisplay = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
        
        await sock.sendMessage(jid, {
            text: `┌─⧭ *TIMER SET* ✅ ⧭─┐
│
├─⧭ ⏱️ *Time:* ${timeDisplay}
├─⧭ 📝 *Message:* ${message}
├─⧭ 👤 *By:* ${sender}
│
│ I'll remind you!
│
└─⧭🦊`
        }, { quoted: m });
        
        setTimeout(async () => {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *⏰ TIME'S UP!* ⧭─┐
│
├─⧭ 📝 ${message}
├─⧭ ⏱️ ${timeDisplay}
├─⧭ 👤 ${sender}
│
└─⧭🦊`
            });
        }, milliseconds);
    }
};