export default {
    name: "ascii",
    alias: ["asciiart", "textart"],
    category: "fun",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *ASCII Art*\n\u2502 Usage: ${PREFIX}ascii <text>\n\u2502 Example: ${PREFIX}ascii heart\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const text = args.join(' ');
        
        await sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *Creating ASCII...*\n\u2514\u2500\u29ED`
        }, { quoted: m });
        
        try {
            const axios = (await import('axios')).default;
            
            const prompt = `Create ASCII art for: "${text}". Use only text characters.`;
            const url = `https://iamtkm.vercel.app/ai/copilot?apikey=tkm&text=${encodeURIComponent(prompt)}`;
            
            const response = await axios.get(url, { timeout: 15000 });
            const asciiArt = response.data?.result || response.data?.response;
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *ASCII: ${text}*\n\u2502\n\`\`\`\n${asciiArt}\n\`\`\`\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 ASCII art failed\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};