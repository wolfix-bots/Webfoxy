export default {
    name: 'news',
    alias: ['headlines', 'breaking', 'latestnews'],
    category: 'search',
    desc: 'Get latest news headlines on any topic',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim() || 'world';

        try {
            const res = await fetch('https://apis.xwolf.space/api/search/news?q=' + encodeURIComponent(query), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success || !data.results?.length) throw new Error('No news found');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            const items = data.results.slice(0, 5).map((n, i) =>
                `${i + 1}. *${n.title || 'No title'}*` + (n.url ? `\n🔗 ${n.url}` : '')
            ).join('\n\n');

            return sock.sendMessage(chatId, {
                text: `📰 *News: ${query}*\n${LINE}\n\n${items}\n\n${LINE}\n📡 Source: WikiNews`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not fetch news for *${query}*. Try a different topic.` }, { quoted: m });
        }
    }
};
