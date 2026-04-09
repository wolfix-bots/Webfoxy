// joke.js — Random jokes from free API
// Usage: .joke  |  .joke dark  |  .joke programming  |  .joke dad
export default {
    name: 'joke',
    alias: ['jokes', 'funny', 'laugh', 'lol'],
    category: 'fun',
    desc: 'Get a random joke — dark, dad, programming, and more',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const categoryMap = {
            'dark': 'Dark',
            'dad': 'Pun',
            'pun': 'Pun',
            'programming': 'Programming',
            'code': 'Programming',
            'misc': 'Misc',
            'spooky': 'Spooky',
            'christmas': 'Christmas',
        };

        const cat = args[0]?.toLowerCase();
        const apiCat = categoryMap[cat] || 'Any';
        const blacklist = cat === 'dark' ? '' : '&blacklistFlags=nsfw,racist,sexist,explicit';

        const url = `https://v2.jokeapi.dev/joke/${apiCat}?type=twopart,single${blacklist}&lang=en`;

        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
            const data = await res.json();

            if (data.error) throw new Error(data.message || 'API error');

            let jokeText = '';
            if (data.type === 'twopart') {
                jokeText = `😂 *${data.setup}*\n\n🤣 ${data.delivery}`;
            } else {
                jokeText = `😂 ${data.joke}`;
            }

            await sock.sendMessage(chatId, {
                text:
`╭─⌈ 😂 *JOKE* ⌋
│
${jokeText}
│
╰⊷ 🦊 Category: ${data.category || 'Random'}`
            }, { quoted: m });

        } catch (e) {
            // Fallback jokes if API fails
            const fallbacks = [
                '😂 Why don\'t scientists trust atoms?\n\n🤣 Because they make up everything!',
                '😂 Why did the fox bring a ladder to school?\n\n🤣 Because it wanted to go to high school! 🦊',
                '😂 What do you call a sleeping dinosaur?\n\n🤣 A dino-snore!',
                '😂 Why can\'t you give Elsa a balloon?\n\n🤣 Because she\'ll let it go!',
                '😂 What do you call cheese that isn\'t yours?\n\n🤣 Nacho cheese!',
            ];
            const joke = fallbacks[Math.floor(Math.random() * fallbacks.length)];
            await sock.sendMessage(chatId, { text: `╭─⌈ 😂 *JOKE* ⌋\n│\n${joke}\n╰⊷ 🦊 Foxy` }, { quoted: m });
        }
    }
};
