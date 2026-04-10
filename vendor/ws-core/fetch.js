// fetch.js — Fetch a URL and display the response content
export default {
    name: 'fetch',
    alias: ['geturl', 'httpget', 'apifetch', 'urlget'],
    category: 'tool',
    desc: 'Fetch a URL and display the response (JSON, text, etc.)',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const url = args[0];

        if (!url || !url.startsWith('http')) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 🌐 *FETCH* ⌋
│
├─⊷ Fetch any URL and see its response
│
├─⊷ *Usage:*
│  \`${PREFIX}fetch <url>\`
│
├─⊷ *Examples:*
│  \`${PREFIX}fetch https://api.example.com/data\`
│  \`${PREFIX}fetch https://www.omdbapi.com/?t=castle+rock&apikey=2d664151\`
│  \`${PREFIX}fetch https://wttr.in/Nairobi?format=j1\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        await sock.sendMessage(chatId, { text: `🌐 Fetching: ${url}` }, { quoted: m });

        try {
            const res = await fetch(url, {
                signal: AbortSignal.timeout(20000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (FoxyBot/1.0)',
                    'Accept': 'application/json, text/plain, */*'
                }
            });

            const contentType = res.headers.get('content-type') || '';
            const statusText = `${res.status} ${res.statusText}`;
            let body;

            if (contentType.includes('application/json')) {
                const json = await res.json();
                body = JSON.stringify(json, null, 2);
            } else {
                body = await res.text();
                // Trim extremely long HTML
                if (body.length > 3000) {
                    body = body.slice(0, 3000) + '\n...[truncated]';
                }
            }

            // Trim total response
            if (body.length > 4000) {
                body = body.slice(0, 4000) + '\n...[truncated]';
            }

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🌐 *FETCH RESULT*\n${LINE}\n📡 *Status:* ${statusText}\n📄 *Type:* ${contentType || 'unknown'}\n🔗 *URL:* ${url}\n${LINE}\n\n${body}`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: `❌ *Fetch Failed*\n\n_${e.message}_\n\nMake sure the URL is valid and accessible.`
            }, { quoted: m });
        }
    }
};
