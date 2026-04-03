// commands/creative/story.js
export default {
    name: "story",
    alias: ["tale", "narrative", "fable"],
    category: "creative",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `📖 *STORY GENERATOR* 📖\n\n` +
                      `Usage: ${PREFIX}story <genre> about <topic>\n` +
                      `${PREFIX}story <character> in <situation>\n\n` +
                      `Genres: fantasy, sci-fi, mystery, romance, horror, adventure\n` +
                      `Examples:\n` +
                      `• ${PREFIX}story fantasy about dragon\n` +
                      `• ${PREFIX}story detective solving mystery\n` +
                      `• ${PREFIX}story robot falling in love\n` +
                      `• ${PREFIX}story adventure in space`
            }, { quoted: m });
        }
        
        const prompt = args.join(' ');
        
        try {
            await sock.sendMessage(jid, {
                text: `📝 Crafting a story about "${prompt}"...`
            }, { quoted: m });
            
            const axios = (await import('axios')).default;
            
            const aiPrompt = `Write a short engaging story about: "${prompt}"
            
            Requirements:
            1. 3-5 paragraphs
            2. Include characters, setting, conflict, resolution
            3. Engaging opening line
            4. Satisfying ending
            5. Title at the beginning
            6. Keep it PG-rated
            
            Make it creative and entertaining!`;
            
            const response = await axios.get('https://iamtkm.vercel.app/ai/copilot', {
                params: { apikey: 'tkm', text: aiPrompt },
                timeout: 25000
            });
            
            const story = response.data?.result || response.data?.response;
            
            await sock.sendMessage(jid, {
                text: `📖 *STORY TIME*\n\n${story}\n\n✨ The End ✨`
            }, { quoted: m });
            
        } catch (error) {
            console.error("Story error:", error);
            await sock.sendMessage(jid, {
                text: `❌ Story creation failed\nTry: ${PREFIX}story about something simpler`
            }, { quoted: m });
        }
    }
};