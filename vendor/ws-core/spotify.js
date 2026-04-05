export default {
    name: 'spotify',
    alias: ['spoti', 'spotidl', 'spdl'],
    category: 'downloader',
    desc: 'Download a Spotify track (open.spotify.com/track/...)',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !url.includes('spotify.com/track')) {
            return sock.sendMessage(chatId, {
                text: `🎧 *SPOTIFY DOWNLOAD*\n\n*Usage:* ${PREFIX||''}spotify <track link>\n\n*Example:*\n${PREFIX||''}spotify https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT\n\n_Tracks only — playlists are not supported_`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: '⏳ Fetching track, please wait...' }, { quoted: m });

        try {
            const res = await fetch('https://apis.xcasper.space/api/downloader/spotify?url=' + encodeURIComponent(url), { signal: AbortSignal.timeout(40000) });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Download failed');

            // xcasper response: { track: { title, artist, cover }, download: { url, format, quality } }
            const downloadUrl = data.download?.url;
            if (!downloadUrl) throw new Error('No download link in response');

            const track = data.track || {};
            const title = track.title || 'Unknown Track';
            const artist = track.artist || 'Unknown Artist';

            const audioRes = await fetch(downloadUrl, { signal: AbortSignal.timeout(40000) });
            if (!audioRes.ok) throw new Error('Audio fetch failed');
            const buffer = Buffer.from(await audioRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${title} - ${artist}`.replace(/[^a-zA-Z0-9\s\-]/g,'').trim() + '.mp3',
                ptt: false
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Could not download this track. Make sure it\'s a valid Spotify track link.' }, { quoted: m });
        }
    }
};
