export default {
    name: "gpt4",
    alias: ["gpt", "chatgpt", "openai"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *GPT-4 AI*\n\u2502 OpenAI's advanced AI\n\u2502\n\u2502 Usage: ${PREFIX}gpt4 <question>\n\u2502 Example: ${PREFIX}gpt4 Explain quantum physics\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const question = args.join(' ');
        
        await sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *GPT-4 thinking...*\n\u2514\u2500\u29ED`
        }, { quoted: m });
        
        try {
            const axios = (await import('axios')).default;
            
            const prompt = `You are GPT-4, OpenAI's advanced AI. Be precise.`;
            const url = `https://api.giftedtech.co.ke/api/ai/letmegpt?apikey=gifted&q=${encodeURIComponent(prompt + '\nUser: ' + question)}`;
            
            const response = await axios.get(url, { timeout: 30000 });
            const answer = response.data?.result || response.data?.response || "I don't know";
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *GPT-4*\n\u2502\n\`\`\`\n${answer}\n\`\`\`\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 GPT-4 unavailable\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};