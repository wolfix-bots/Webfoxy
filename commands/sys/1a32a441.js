export default {
    name: "mistral",
    alias: ["mistralai"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Mistral AI*\n\u2502 Fast & efficient AI\n\u2502\n\u2502 Usage: ${PREFIX}mistral <question>\n\u2502 Example: ${PREFIX}mistral How's the weather?\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const question = args.join(' ');
        
        await sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *Mistral thinking...*\n\u2514\u2500\u29ED`
        }, { quoted: m });
        
        try {
            const axios = (await import('axios')).default;
            
            const prompt = `You are Mistral AI. Give direct, clear answers.`;
            const url = `https://api.giftedtech.co.ke/api/ai/letmegpt?apikey=gifted&q=${encodeURIComponent(prompt + '\nUser: ' + question)}`;
            
            const response = await axios.get(url, { timeout: 30000 });
            const answer = response.data?.result || response.data?.response || "I don't know";
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Mistral*\n\u2502\n\`\`\`\n${answer}\n\`\`\`\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Mistral unavailable\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};