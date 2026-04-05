export default {
    name: 'facebook',
    alias: ['fb', 'fbdl', 'facebookdl', 'fbvideo'],
    category: 'downloader',
    desc: 'Download Facebook videos or reels',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !url.includes('facebook.com')) {
            return sock.sendMessage(chatId, {
                text: `📘 *FACEBOOK DOWNLOADER*\n\n*Usage:* ${PREFIX||''}facebook <facebook video link>\n\n*Example:*\n${PREFIX||''}facebook https://www.facebook.com/watch?v=...\n\n_Public videos only_`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Fetching video links...' }, { quoted: m });

        try {
            const res = await fetch('https://fb.xcasper.space/scrape?url=' + encodeURIComponent(url), { signal: AbortSignal.timeout(30000) });
            const data = await res.json();
            if (!data.success || !data.links?.length) throw new Error('Could not fetch video');

            // Try HD first, then SD
            const hdLink = data.links.find(l => l.label?.toLowerCase().includes('hd') || l.quality?.includes('HD'));
            const sdLink = data.links.find(l => l.label?.toLowerCase().includes('sd') || l.quality?.includes('SD'));
            const chosen = hdLink || sdLink || data.links[0];

            const videoUrl = chosen.url || chosen.link;
            if (!videoUrl) throw new Error('No video URL found');

            const vidRes = await fetch(videoUrl, { signal: AbortSignal.timeout(40000) });
            if (!vidRes.ok) throw new Error('Video fetch failed');
            const buffer = Buffer.from(await vidRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: `📘 *${data.title || 'Facebook Video'}*`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Could not download this video. Make sure it\'s a public Facebook video.' }, { quoted: m });
        }
    }
};
