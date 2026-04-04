import { foxCanUse, foxMode } from '../../utils/foxMaster.js';
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
        if (!foxCanUse(msg, 'deepseek')) {
            const m = foxMode.getMessage();
            if (m) await sock.sendMessage(msg.key.remoteJid, { text: m });
            return;
        }

        const query = args.join(' ').trim();
        if (!query) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: ${PREFIX}deepseek <your question>`
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

        const url = `https://apis.xwolf.space/api/ai/deepseek?q=${encodeURIComponent(query)}`;
        const json = await fetchJson(url);

        if (!json || !json.status || !json.result) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ DeepSeek failed to respond. Try again.' }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, { text: `🔍 *DeepSeek:*\n\n${json.result}` }, { quoted: msg });
    }
};
