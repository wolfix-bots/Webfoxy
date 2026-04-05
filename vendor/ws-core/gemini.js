export default {
    name: 'gemini',
    alias: ['gem', 'google-ai', 'gai'],
    category: 'ai',
    desc: 'Chat with Google Gemini AI',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const q = args.join(' ').trim();

        if (!q) {
            return sock.sendMessage(chatId, {
                text: `🤖 *GEMINI AI*\n\n*Usage:* ${PREFIX||''}gemini <your question>\n*Example:* ${PREFIX||''}gemini What is quantum computing?`
            }, { quoted: m });
        }

        try {
            let result;
            // Primary: xwolf
            try {
                const res = await fetch('https://apis.xwolf.space/api/ai/gemini?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
                const data = await res.json();
                if (data.status || data.success) result = data.result;
                else throw new Error('xwolf failed');
            } catch {
                // Fallback: xcasper
                const res2 = await fetch('https://apis.xcasper.space/api/ai/gemini?q=' + encodeURIComponent(q), { signal: AbortSignal.timeout(15000) });
                const data2 = await res2.json();
                if (!data2.success) throw new Error('Both Gemini sources failed');
                result = data2.reply;
            }

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `✨ *Gemini AI*\n${LINE}\n\n${result}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Gemini is unavailable right now. Try again later.' }, { quoted: m });
        }
    }
};
