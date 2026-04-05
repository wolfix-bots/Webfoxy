export default {
    name: 'lyrics',
    alias: ['lyric', 'songlyrics', 'ly'],
    category: 'search',
    desc: 'Get full lyrics for any song',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `🎵 *LYRICS*\n\n*Usage:* ${PREFIX||''}lyrics <song name or artist>\n*Example:* ${PREFIX||''}lyrics Blinding Lights`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://api.giftedtech.co.ke/api/search/lyrics?apikey=gifted&query=' + encodeURIComponent(query), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success || !data.result) throw new Error('Lyrics not found');

            const r = data.result;
            const lyricsText = r.lyrics || r.text || '';
            if (!lyricsText) throw new Error('Lyrics not found');

            const header = `🎵 *${r.title || query}*\n👤 *${r.artist || 'Unknown'}*\n━━━━━━━━━━━━━━━━━━━━\n\n`;
            const full = header + lyricsText;

            // WhatsApp caps at ~65536 chars — trim if needed
            const trimmed = full.length > 4000 ? full.slice(0, 4000) + '\n...[truncated]' : full;

            return sock.sendMessage(chatId, { text: trimmed }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not find lyrics for *${query}*. Try a more specific song name.` }, { quoted: m });
        }
    }
};
