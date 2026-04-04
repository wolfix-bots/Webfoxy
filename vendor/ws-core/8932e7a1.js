import { foxCanUse, foxMode } from '../../utils/foxMaster.js';
import https from 'https';

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        }).on('error', reject);
    });
}

function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            if (res.statusCode === 301 || res.statusCode === 302) {
                return downloadBuffer(res.headers.location).then(resolve).catch(reject);
            }
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
}

export default {
    name: 'ytmp4',
    alias: ['mp4', 'video', 'ytv', 'ytvideo'],
    category: 'download',
    description: 'Download YouTube video as MP4 🎬',

    async execute(sock, msg, args, PREFIX) {
        if (!foxCanUse(msg, 'ytmp4')) {
            const m = foxMode.getMessage();
            if (m) await sock.sendMessage(msg.key.remoteJid, { text: m });
            return;
        }

        const url = args[0]?.trim();
        if (!url || !url.includes('youtu')) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: ${PREFIX}ytmp4 <YouTube URL>`
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

        const apiUrl = `https://apis.xwolf.space/download/mp4?url=${encodeURIComponent(url)}`;
        const json = await fetchJson(apiUrl);

        if (!json || !json.success || !json.downloadUrl) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ Could not fetch video. Check the URL and try again.' }, { quoted: msg });
        }

        const buffer = await downloadBuffer(json.downloadUrl);
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, {
            video: buffer,
            mimetype: 'video/mp4',
            fileName: `${json.title || 'video'}.mp4`,
            caption: `🎬 *${json.title || 'Video'}*\n📊 Quality: ${json.quality || '720p'}`
        }, { quoted: msg });
    }
};
