export default {
    name: 'gpt',
    alias: ['gpt4', 'chatgpt', 'ask'],
    category: 'ai',
    desc: 'Chat with GPT-4o AI',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const q = args.join(' ').trim();

        if (!q) {
            return sock.sendMessage(chatId, {
                text: `🤖 *GPT AI*\n\n*Usage:* ${PREFIX || '.'}gpt <your question>\n*Example:* ${PREFIX || '.'}gpt Write a short poem about Kenya`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { react: { text: '🦊', key: m.key } });

        try {
            const res = await fetch('https://apis.xwolf.space/api/ai/gpt?q=' + encodeURIComponent(q), {
                signal: AbortSignal.timeout(30000)
            });
            const data = await res.json();
            const answer = data.result || data.message || 'No response from AI';

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🤖 *GPT AI*\n${LINE}\n\n${answer}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, {
                text: '❌ GPT is unavailable right now. Try again later.'
            }, { quoted: m });
        }
    }
};
