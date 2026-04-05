export default {
    name: 'ytsearch',
    alias: ['yts', 'ytsrch', 'youtubesearch', 'ytsearch'],
    category: 'search',
    desc: 'Search YouTube for videos',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: `▶️ *YOUTUBE SEARCH*\n\n*Usage:* ${PREFIX||''}ytsearch <search term>\n*Example:* ${PREFIX||''}ytsearch lofi hip hop`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xcasper.space/api/search/youtube?query=' + encodeURIComponent(query), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success || !data.videos?.length) throw new Error('No results');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            const items = data.videos.slice(0, 5).map((v, i) =>
                `${i + 1}. *${v.title || 'No title'}*\n` +
                (v.channel ? `   👤 ${v.channel}\n` : '') +
                (v.duration ? `   ⏱️ ${v.duration}\n` : '') +
                (v.views ? `   👁️ ${v.views}\n` : '') +
                (v.url ? `   🔗 ${v.url}` : '')
            ).join('\n\n');

            return sock.sendMessage(chatId, {
                text: `▶️ *YouTube: ${query}*\n${LINE}\n\n${items}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ No YouTube results for *${query}*.` }, { quoted: m });
        }
    }
};
