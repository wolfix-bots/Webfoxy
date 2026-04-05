export default {
    name: 'ytmp4',
    alias: ['ymp4', 'ytvideo', 'ytv', 'mp4'],
    category: 'downloader',
    desc: 'Download YouTube video as MP4',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !(url.includes('youtube.com') || url.includes('youtu.be'))) {
            return sock.sendMessage(chatId, {
                text: `🎬 *YOUTUBE MP4*\n\n*Usage:* ${PREFIX||''}ytmp4 <youtube link>\n\n*Example:*\n${PREFIX||''}ytmp4 https://youtu.be/dQw4w9WgXcQ`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Downloading video, please wait...' }, { quoted: m });

        try {
            const res = await fetch('https://apis.xwolf.space/download/mp4?url=' + encodeURIComponent(url), {
                signal: AbortSignal.timeout(40000)
            });
            const data = await res.json();
            if (!data.success || !data.download_url) throw new Error(data.error || 'No download link');

            const vidRes = await fetch(data.download_url, { signal: AbortSignal.timeout(40000) });
            if (!vidRes.ok) throw new Error('Video fetch failed');
            const buffer = Buffer.from(await vidRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎬 *${data.title || 'YouTube Video'}*`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Could not download video. Try a shorter video or different link.' }, { quoted: m });
        }
    }
};
