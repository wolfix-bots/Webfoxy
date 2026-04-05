export default {
    name: 'tiktok',
    alias: ['tt', 'tiktokdl', 'ttdl', 'ttdown'],
    category: 'downloader',
    desc: 'Download TikTok video without watermark',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !url.includes('tiktok')) {
            return sock.sendMessage(chatId, {
                text: '\u{1F3B5} *TIKTOK DOWNLOADER*\n\n*Usage:* ' + (PREFIX||'') + 'tiktok <tiktok link>\n\n*Example:*\n' + (PREFIX||'') + 'tiktok https://vm.tiktok.com/...'
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xcasper.space/api/downloader/tiktok?url=' + encodeURIComponent(url), {
                signal: AbortSignal.timeout(30000)
            });
            const data = await res.json();

            if (!data.success || data.error) {
                throw new Error(data.message || 'Download failed');
            }

            // Find the video URL in response — try common field names
            const r = data.result || data.data || data;
            const videoUrl = r.nowm || r.nwm || r.video || r.play || r.mp4 || r.url ||
                             (Array.isArray(r.video_list) ? r.video_list[0] : null);

            if (!videoUrl) throw new Error('No video link in response');

            const videoRes = await fetch(videoUrl, { signal: AbortSignal.timeout(30000) });
            if (!videoRes.ok) throw new Error('Video download failed');
            const buffer = Buffer.from(await videoRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                video: buffer,
                mimetype: 'video/mp4',
                caption: '\u{1F3B5} *TikTok Video*'
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: '\u274C Could not download. Make sure the link is a valid public TikTok video.'
            }, { quoted: m });
        }
    }
};