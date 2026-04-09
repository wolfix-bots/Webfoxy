import https from 'https';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        }).on('error', reject);
    });
}

export default {
    name: 'deepseek',
    alias: ['ds', 'deep', 'seek'],
    category: 'ai',
    description: 'Chat with DeepSeek AI 🔍',

    async execute(sock, msg, args, PREFIX) {
        const jid = msg.key.remoteJid;

        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(jid, {
                text: `❌ Usage: ${PREFIX}deepseek <your question>`
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '🦊', key: msg.key } });

        try {
            const json = await fetchJson(
                `https://apis.xwolf.space/api/ai/deepseek?q=${encodeURIComponent(query)}`
            );
            const answer = json?.result || json?.message || '❌ DeepSeek failed to respond. Try again.';
            await sock.sendMessage(jid, { text: `🔍 *DeepSeek:*\n\n${answer}` }, { quoted: msg });
        } catch {
            await sock.sendMessage(jid, { text: '❌ DeepSeek unavailable. Try again later.' }, { quoted: msg });
        }
    }
};
