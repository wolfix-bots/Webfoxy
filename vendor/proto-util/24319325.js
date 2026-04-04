export default {
    name: 'uptime',
    alias: ['runtime', 'online', 'up'],
    category: 'general',
    description: 'Show how long the bot has been running ⏱️',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        
        const diffSeconds = Math.floor(process.uptime());
        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0 || days > 0) uptimeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;

        await sock.sendMessage(chatId, {
            text: `⏱️ *Uptime:* ${uptimeString}`
        }, { quoted: msg });

        await sock.sendMessage(chatId, {
            react: { text: '⏱️', key: msg.key }
        });
    }
};
