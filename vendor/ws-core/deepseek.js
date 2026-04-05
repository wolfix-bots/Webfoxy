export default {
    name: 'deepseek',
    alias: ['ds', 'seek', 'dsai'],
    category: 'ai',
    desc: 'Chat with DeepSeek AI — strong reasoning model',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const q = args.join(' ').trim();

        if (!q) {
            return sock.sendMessage(chatId, {
                text: `🧠 *DEEPSEEK AI*\n\n*Usage:* ${PREFIX||''}deepseek <your question>\n*Example:* ${PREFIX||''}deepseek Explain recursion step by step`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xwolf.space/api/ai/deepseek?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(20000) });
            const data = await res.json();
            if (!data.status && !data.success) throw new Error(data.message || 'AI error');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🧠 *DeepSeek AI*\n${LINE}\n\n${data.result}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ DeepSeek is unavailable right now. Try again later.' }, { quoted: m });
        }
    }
};
