export default {
    name: 'wallpaper',
    alias: ['wall', 'wp', 'wallpapers', 'background'],
    category: 'media',
    desc: 'Get a wallpaper by search term',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const query = args.join(' ').trim() || 'nature';

        try {
            const res = await fetch('https://api.giftedtech.co.ke/api/search/wallpaper?query=' + encodeURIComponent(query) + '&apikey=gifted', {
                signal: AbortSignal.timeout(15000)
            });
            const data = await res.json();

            if (!data.success || !data.results?.length) {
                return sock.sendMessage(chatId, { text: 'No wallpapers found for: *' + query + '*' }, { quoted: m });
            }

            const items = data.results.filter(r => r.source || r.url || r.image);
            if (!items.length) return sock.sendMessage(chatId, { text: 'Could not get wallpaper images.' }, { quoted: m });

            const pick = items[Math.floor(Math.random() * Math.min(items.length, 5))];
            const imageUrl = pick.source || pick.url || pick.image;

            const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(20000) });
            if (!imgRes.ok) throw new Error('Image download failed');
            const buffer = Buffer.from(await imgRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                image: buffer,
                caption: '\u{1F5BC} *' + (pick.type || query) + ' Wallpaper*'
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, { text: 'Could not get wallpaper for *' + query + '*. Try a different search.' }, { quoted: m });
        }
    }
};