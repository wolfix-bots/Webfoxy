// ytmp4.js — Download YouTube video as MP4 or search by name using xwolf API
export default {
    name: 'ytmp4',
    alias: ['ymp4', 'ytvideo', 'ytv', 'mp4', 'video', 'ytdoc'],
    category: 'downloader',
    desc: 'Download YouTube video as MP4 (also accepts search queries)',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🎬 *YOUTUBE MP4*\n\n*Usage:*\n${PREFIX||''}ytmp4 <youtube link or video name>\n\n*Examples:*\n${PREFIX||''}ytmp4 Ordinary Alex Warren\n${PREFIX||''}ytmp4 https://youtu.be/dQw4w9WgXcQ`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Searching and downloading video, please wait...' }, { quoted: m });

        try {
            const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
            let apiUrl;

            if (isUrl) {
                apiUrl = 'https://apis.xwolf.space/download/mp4?url=' + encodeURIComponent(query);
            } else {
                // Use ytmp5 for search by name
                apiUrl = 'https://apis.xwolf.space/download/ytmp5?q=' + encodeURIComponent(query) + '&type=mp4';
            }

            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(50000) });
            const data = await res.json();

            const dlUrl = data.downloadUrl || data.download_url || data.videoUrl || data.url;
            if (!dlUrl && !data.success) throw new Error(data.error || data.message || 'No download link');

            const finalUrl = dlUrl;
            if (!finalUrl) throw new Error('No download link in response');

            const vidRes = await fetch(finalUrl, { signal: AbortSignal.timeout(60000) });
            if (!vidRes.ok) throw new Error('Video fetch failed');
            const buffer = Buffer.from(await vidRes.arrayBuffer());

            const title = data.title || data.name || query;

            return sock.sendMessage(chatId, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `🎬 *${title}*`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: `❌ *Download Failed*\n\n_${e.message}_\n\nMake sure:\n• The link is a valid public YouTube URL\n• Or try a different video name\n• Note: Long videos may fail due to size limits`
            }, { quoted: m });
        }
    }
};
