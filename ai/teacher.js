export default {
    name: "teach",
    alias: ["teacher", "learn", "tutor", "lesson"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *AI Teacher*\n\u2502 Learn any topic\n\u2502\n\u2502 Usage: ${PREFIX}teach <topic>\n\u2502 Example: ${PREFIX}teach how rainbows form\n\u2502 Example: ${PREFIX}teacher algebra\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
        
        const topic = args.join(' ');
        
        await sock.sendMessage(jid, {
            text: `\u250C\u2500\u29ED *Preparing lesson:* ${topic}\n\u2514\u2500\u29ED`
        }, { quoted: m });
        
        try {
            const axios = (await import('axios')).default;
            
            const prompt = `You are a teacher. Explain "${topic}" in simple terms with examples.`;
            const url = `https://api.giftedtech.co.ke/api/ai/letmegpt?apikey=gifted&q=${encodeURIComponent(prompt)}`;
            
            const response = await axios.get(url, { timeout: 30000 });
            const answer = response.data?.result || response.data?.response || "I don't know";
            
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Lesson: ${topic}*\n\u2502\n\`\`\`\n${answer}\n\`\`\`\n\u2502\n\u2502 Keep learning! 📚\n\u2514\u2500\u29ED`
            }, { quoted: m });
            
        } catch (error) {
            await sock.sendMessage(jid, {
                text: `\u250C\u2500\u29ED *Error*\n\u2502 Teacher unavailable\n\u2514\u2500\u29ED`
            }, { quoted: m });
        }
    }
};