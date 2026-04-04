// Alive — styled alive check
import os from 'os';

export default {
    name: 'alive',
    alias: ['isalive', 'foxyalive', 'imalive'],
    category: 'general',
    description: 'Check if the bot is alive with personality',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId  = m.key.remoteJid;
        const botName = extra?.BOT_NAME || 'Foxy Bot';

        const uptime    = process.uptime();
        const hrs       = Math.floor(uptime / 3600);
        const mins      = Math.floor((uptime % 3600) / 60);
        const secs      = Math.floor(uptime % 60);
        const uptimeStr = hrs > 0 ? `${hrs}h ${mins}m ${secs}s`
                        : mins > 0 ? `${mins}m ${secs}s`
                        : `${secs}s`;

        const memUsed  = process.memoryUsage().heapUsed / 1024 / 1024;
        const memTotal = os.totalmem() / 1024 / 1024;
        const ramPct   = Math.round((memUsed / memTotal) * 100);
        const ramBar   = '█'.repeat(Math.round(ramPct / 10)) + '░'.repeat(10 - Math.round(ramPct / 10));

        const pingStart = Date.now();
        await sock.sendMessage(chatId, { react: { text: '🦊', key: m.key } });
        const latency = Date.now() - pingStart;

        const greetings = [
            'Still breathing 🔥',
            'Wide awake and ready 👀',
            'Online and lurking 😏',
            'Never off duty 💪',
            'Always watching 👁️',
            'Born to run 🚀',
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];

        return await sock.sendMessage(chatId, {
            text:
`╭━━━〔🦊 *${botName.toUpperCase()}* 〕━━━╮
┃
┃ 💬 *Status:* ${greeting}
┃ ⚡ *Ping:* ${latency}ms
┃ ⏱️ *Uptime:* ${uptimeStr}
┃ 🧠 *RAM:* [${ramBar}] ${ramPct}%
┃ 📦 *Memory:* ${memUsed.toFixed(1)}MB / ${memTotal.toFixed(0)}MB
┃ 🖥️ *Platform:* ${os.platform()} (${os.arch()})
┃
┃ 🔧 *Prefix:* ${PREFIX}
┃ 🌍 *Node:* ${process.version}
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m });
    }
};
