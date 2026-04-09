export default {
    name: "llama",
    alias: ["meta", "llama3"],
    category: "ai",

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *LLaMA AI*\n│ Meta's AI assistant\n│\n│ Usage: ${PREFIX}llama <question>\n│ Example: ${PREFIX}llama Tell a story\n└─⧭`
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
                text: `┌─⧭ *LLaMA*\n│\n${answer}\n└─⧭`
            }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *Error*\n│ LLaMA unavailable, try again later.\n└─⧭`
            }, { quoted: m });
        }
    }
};
