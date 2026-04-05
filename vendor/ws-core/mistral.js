export default {
    name: 'mistral',
    alias: ['mist', 'mis', 'mistralai'],
    category: 'ai',
    desc: 'Chat with Mistral AI — fast European model',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const q = args.join(' ').trim();

        if (!q) {
            return sock.sendMessage(chatId, {
                text: `⚡ *MISTRAL AI*\n\n*Usage:* ${PREFIX||''}mistral <your question>\n*Example:* ${PREFIX||''}mistral Translate "good morning" to Swahili`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xcasper.space/api/ai/mistral?message=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'AI error');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `⚡ *Mistral AI*\n${LINE}\n\n${data.reply}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Mistral is unavailable right now. Try again later.' }, { quoted: m });
        }
    }
};
