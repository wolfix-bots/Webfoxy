export default {
    name: 'google',
    alias: ['gsearch', 'websearch', 'web'],
    category: 'search',
    desc: 'Search the web and get results',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim();

        if (!query) {
            return sock.sendMessage(chatId, {
                text: '\u{1F50D} *WEB SEARCH*\n\nUsage: ' + (PREFIX||'') + 'google <what to search>\nExample: ' + (PREFIX||'') + 'google latest technology news'
            }, { quoted: m });
        }

        try {
            const LINE = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';
            const res = await fetch('https://api.giftedtech.co.ke/api/search/google?query=' + encodeURIComponent(query) + '&apikey=gifted', {
                signal: AbortSignal.timeout(15000)
            });
            const data = await res.json();

            if (!data.success || !data.results?.length) {
                return sock.sendMessage(chatId, { text: 'No results found for: *' + query + '*' }, { quoted: m });
            }

            const results = data.results.slice(0, 5).map((r, i) =>
                (i + 1) + '. *' + (r.title || 'No title') + '*' +
                (r.snippet ? '\n' + r.snippet.slice(0, 120) : '') +
                '\n\u{1F517} ' + (r.link || '')
            ).join('\n\n');

            return sock.sendMessage(chatId, {
                text: '\u{1F50D} *Search: ' + query + '*\n' + LINE + '\n\n' + results + '\n\n' + LINE
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, { text: 'Search failed. Please try again later.' }, { quoted: m });
        }
    }
};