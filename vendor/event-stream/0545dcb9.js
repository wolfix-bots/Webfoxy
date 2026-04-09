export default {
    name: "cohere",
    alias: ["co", "cohereai"],
    category: "ai",

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *Cohere AI*\n│ Natural language AI\n│\n│ Usage: ${PREFIX}cohere <question>\n│ Example: ${PREFIX}cohere Explain love\n└─⧭`
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
                text: `┌─⧭ *Cohere*\n│\n${answer}\n└─⧭`
            }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *Error*\n│ Cohere unavailable, try again later.\n└─⧭`
            }, { quoted: m });
        }
    }
};
