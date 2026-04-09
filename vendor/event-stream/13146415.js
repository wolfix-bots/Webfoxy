export default {
    name: "gpt4",
    alias: ["gpt4o", "openai", "chatgpt"],
    category: "ai",

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *GPT-4o AI*\n│ OpenAI's advanced AI\n│\n│ Usage: ${PREFIX}gpt4 <question>\n│ Example: ${PREFIX}gpt4 Explain quantum physics\n└─⧭`
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
                text: `┌─⧭ *GPT-4o*\n│\n${answer}\n└─⧭`
            }, { quoted: m });
        } catch {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *Error*\n│ GPT-4o unavailable, try again later.\n└─⧭`
            }, { quoted: m });
        }
    }
};
