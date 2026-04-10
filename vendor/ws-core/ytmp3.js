// ytmp3.js — Download YouTube audio as MP3 or search by name using xwolf API
export default {
    name: 'ytmp3',
    alias: ['ymp3', 'ytaudio', 'yta', 'mp3', 'play', 'song', 'audio'],
    category: 'downloader',
    desc: 'Download YouTube audio as MP3 (also accepts search queries)',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🎵 *YOUTUBE MP3 / PLAY*\n\n*Usage:*\n${PREFIX||''}ytmp3 <youtube link or song name>\n\n*Examples:*\n${PREFIX||''}play Ordinary Alex Warren\n${PREFIX||''}ytmp3 https://youtu.be/dQw4w9WgXcQ`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Searching and downloading audio, please wait...' }, { quoted: m });

        try {
            // Check if it's a URL or a search query
            const isUrl = query.includes('youtube.com') || query.includes('youtu.be');
            let apiUrl;

            if (isUrl) {
                apiUrl = 'https://apis.xwolf.space/download/mp3?url=' + encodeURIComponent(query);
            } else {
                // Use ytmp5 for search by name
                apiUrl = 'https://apis.xwolf.space/download/ytmp5?q=' + encodeURIComponent(query) + '&type=mp3';
            }

            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(50000) });
            const data = await res.json();

            const dlUrl = data.downloadUrl || data.download_url || data.audioUrl || data.url;
            if (!dlUrl && !data.success) throw new Error(data.error || data.message || 'No download link');

            const finalUrl = dlUrl || (data.success && data.downloadUrl);
            if (!finalUrl) throw new Error('No download link in response');

            const audioRes = await fetch(finalUrl, { signal: AbortSignal.timeout(50000) });
            if (!audioRes.ok) throw new Error('Audio fetch failed');
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            const title = data.title || data.name || query;

            return sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mp4',
                fileName: title.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50) + '.mp3',
                ptt: false,
                caption: `🎵 *${title}*`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: `❌ *Download Failed*\n\n_${e.message}_\n\nMake sure:\n• The link is a valid public YouTube URL\n• Or try a different song name`
            }, { quoted: m });
        }
    }
};
