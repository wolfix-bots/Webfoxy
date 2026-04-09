export default {
    name: "mistral",
    alias: ["mistralai"],
    category: "ai",

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *Mistral AI*\n│ Fast & efficient AI\n│\n│ Usage: ${PREFIX}mistral <question>\n│ Example: ${PREFIX}mistral How's the weather?\n└─⧭`
            }, { quoted: m });
        }

        const question = args.join(' ');

        await sock.sendMessage(jid, { react: { text: '🦊', key: m.key } });

        try {
            const res = await fetch(
                'https://apis.xwolf.space/api/ai/gpt?q=' + encodeURIComponent(question),
                { signal: AbortSignal.timeout(30000) }
            );
            const data = await res.json();
            const answer = data.result || data.message || "No response from AI";

            await sock.sendMessage(jid, {
                text: `┌─⧭ *Mistral*\n│\n${answer}\n└─⧭`
            }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *Error*\n│ Mistral unavailable, try again later.\n└─⧭`
            }, { quoted: m });
        }
    }
};
