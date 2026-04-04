import { foxCanUse, foxMode } from '../../utils/foxMaster.js';
import https from 'https';

function postJson(url, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const u = new URL(url);
        const req = https.request({
            hostname: u.hostname, path: u.pathname, method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, res => {
            let r = '';
            res.on('data', c => r += c);
            res.on('end', () => { try { resolve(JSON.parse(r)); } catch { resolve(null); } });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

export default {
    name: 'humanize',
    alias: ['humanizer', 'rewrite', 'human'],
    category: 'ai',
    description: 'Humanize AI-generated text ✍️',

    async execute(sock, msg, args, PREFIX) {
        if (!foxCanUse(msg, 'humanize')) {
            const m = foxMode.getMessage();
            if (m) await sock.sendMessage(msg.key.remoteJid, { text: m });
            return;
        }

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const inputText = args.join(' ').trim() || quotedText;

        if (!inputText) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: ${PREFIX}humanize <text>\nOr reply to a message with ${PREFIX}humanize`
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

        const json = await postJson('https://apis.xwolf.space/api/ai/humanizer', { text: inputText });

        if (!json || !json.success || !json.humanized) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ Humanizer failed. Try again.' }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, {
            text: `✍️ *Humanized:*\n\n${json.humanized}`
        }, { quoted: msg });
    }
};
