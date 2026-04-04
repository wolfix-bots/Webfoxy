import { foxCanUse, foxMode } from '../../utils/foxMaster.js';
import https from 'https';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

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
    name: 'ytmp3',
    alias: ['mp3', 'song', 'audio', 'yta'],
    category: 'download',
    description: 'Download YouTube audio as MP3 🎵',

    async execute(sock, msg, args, PREFIX) {
        if (!foxCanUse(msg, 'ytmp3')) {
            const m = foxMode.getMessage();
            if (m) await sock.sendMessage(msg.key.remoteJid, { text: m });
            return;
        }

        const url = args[0]?.trim();
        if (!url || !url.includes('youtu')) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Usage: ${PREFIX}ytmp3 <YouTube URL>`
            }, { quoted: msg });
        }

        await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

        const apiUrl = `https://apis.xwolf.space/download/mp3?url=${encodeURIComponent(url)}`;
        const json = await fetchJson(apiUrl);

        if (!json || !json.success || !json.downloadUrl) {
            await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(msg.key.remoteJid, { text: '❌ Could not fetch audio. Check the URL and try again.' }, { quoted: msg });
        }

        const buffer = await downloadBuffer(json.downloadUrl);
        await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });
        await sock.sendMessage(msg.key.remoteJid, {
            audio: buffer,
            mimetype: 'audio/mpeg',
            fileName: `${json.title || 'audio'}.mp3`
        }, { quoted: msg });
    }
};
