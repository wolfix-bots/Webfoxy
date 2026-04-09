// snapmsg.js — Self-destructing message: bot sends it, then auto-deletes after N seconds
// Usage: .snapmsg 30s Your secret message here
export default {
    name: 'snapmsg',
    alias: ['snap', 'selfdelete', 'destruct', 'burnmsg', 'disappear'],
    category: 'automation',
    desc: 'Send a self-destructing message that auto-deletes after N seconds',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const delayStr = args[0]?.toLowerCase();
        const message = args.slice(1).join(' ');

        const parseDelay = str => {
            const match = str?.match(/^(\d+)(s|m)$/i);
            if (!match) return null;
            return parseInt(match[1]) * (match[2].toLowerCase() === 'm' ? 60000 : 1000);
        };

        const delay = parseDelay(delayStr);
        if (!delay || !message) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 💥 *SNAP MSG* ⌋
│
├─⊷ Send a message that auto-deletes itself!
│
├─⊷ *Usage:*
│  \`${PREFIX}snapmsg 30s Your message here\`
│  \`${PREFIX}snapmsg 2m This will vanish!\`
│
├─⊷ *Max delay:* 10 minutes
├─⊷ *Min delay:* 5 seconds
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        if (delay < 5000) return sock.sendMessage(chatId, { text: '❌ Minimum delay: 5 seconds.' }, { quoted: m });
        if (delay > 600000) return sock.sendMessage(chatId, { text: '❌ Maximum delay: 10 minutes.' }, { quoted: m });

        const secs = Math.round(delay / 1000);
        const label = secs >= 60 ? `${Math.round(secs / 60)}m` : `${secs}s`;

        try {
            const sent = await sock.sendMessage(chatId, {
                text: `💥 *This message self-destructs in ${label}*\n\n${message}`
            }, { quoted: m });

            setTimeout(async () => {
                try {
                    await sock.sendMessage(chatId, { delete: sent.key });
                } catch {}
            }, delay);

        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: m });
        }
    }
};
