export default {
    name: 'ytmp3',
    alias: ['ymp3', 'ytaudio', 'yta', 'mp3'],
    category: 'downloader',
    desc: 'Download YouTube video as MP3 audio',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !(url.includes('youtube.com') || url.includes('youtu.be'))) {
            return sock.sendMessage(chatId, {
                text: `🎵 *YOUTUBE MP3*\n\n*Usage:* ${PREFIX||''}ytmp3 <youtube link>\n\n*Example:*\n${PREFIX||''}ytmp3 https://youtu.be/dQw4w9WgXcQ`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Downloading audio, please wait...' }, { quoted: m });

        try {
            const res = await fetch('https://apis.xwolf.space/download/mp3?url=' + encodeURIComponent(url), {
                signal: AbortSignal.timeout(40000)
            });
            const data = await res.json();
            // xwolf returns downloadUrl (camelCase)
            const dlUrl = data.downloadUrl || data.download_url;
            if (!data.success || !dlUrl) throw new Error(data.error || 'No download link');

            const audioRes = await fetch(dlUrl, { signal: AbortSignal.timeout(40000) });
            if (!audioRes.ok) throw new Error('Audio fetch failed');
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mp4',
                fileName: (data.title || 'audio').replace(/[^a-zA-Z0-9\s]/g,'').trim() + '.mp3',
                ptt: false
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Could not download audio. Make sure it\'s a valid public YouTube link.' }, { quoted: m });
        }
    }
};
