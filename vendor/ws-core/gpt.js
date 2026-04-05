export default {
    name: 'gpt',
    alias: ['gpt4', 'chatgpt', 'ai', 'ask'],
    category: 'ai',
    desc: 'Chat with GPT-4o AI',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const q = args.join(' ').trim();

        if (!q) {
            return sock.sendMessage(chatId, {
                text: `🤖 *GPT AI*\n\n*Usage:* ${PREFIX||''}gpt <your question>\n*Example:* ${PREFIX||''}gpt Write a short poem about Kenya`
            }, { quoted: m });
        }

        try {
            let result;
            // Primary: gpt4o
            try {
                const res = await fetch('https://api.giftedtech.co.ke/api/ai/gpt4o?apikey=gifted&q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
                const data = await res.json();
                if (data.success) result = data.result;
                else throw new Error('gpt4o failed');
            } catch {
                // Fallback: letmegpt
                const res2 = await fetch('https://api.giftedtech.co.ke/api/ai/letmegpt?apikey=gifted&q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
                const data2 = await res2.json();
                if (!data2.success) throw new Error('Both GPT sources failed');
                result = data2.result;
            }

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🤖 *GPT AI*\n${LINE}\n\n${result}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ GPT is unavailable right now. Try again later.' }, { quoted: m });
        }
    }
};
