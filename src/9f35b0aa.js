import axios from 'axios';

export default {
    name: "attp",
    alias: ["glitter", "sparkle", "glowtext", "animatetext"],
    description: "Create animated glitter text sticker ✨",
    category: "media",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        
        // Show help if no text
        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY GLITTER TEXT* ✨ ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}attp <text>
│
├─⧭ *Examples:*
│ • ${PREFIX}attp Hello
│ • ${PREFIX}attp Foxy
│ • ${PREFIX}attp Love
│
├─⧭ *Note:*
│ • Max 30 characters
│ • Creates animated sticker
│
└─⧭🦊`
            }, { quoted: m });
        }
        
        try {
            const text = args.join(' ');
            
            if (text.length > 30) {
                return sock.sendMessage(jid, {
                    text: `┌─⧭ *TEXT TOO LONG* ❌ ⧭─┐
│
├─⧭ Max 30 characters
├─⧭ Yours: ${text.length} chars
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Direct API call - no processing message
            const encodedText = encodeURIComponent(text);
            
            // Try multiple APIs for reliability
            let stickerUrl;
            const apis = [
                `https://api.lolhuman.xyz/api/attp?apikey=ayakadesu&text=${encodedText}`,
                `https://api.lolhuman.xyz/api/attp?apikey=beta&text=${encodedText}`,
                `https://api.lolhuman.xyz/api/attp?apikey=alama&text=${encodedText}`,
                `https://api.lolhuman.xyz/api/ttp?apikey=ayakadesu&text=${encodedText}`
            ];
            
            for (const api of apis) {
                try {
                    const response = await axios.get(api, {
                        responseType: 'arraybuffer',
                        timeout: 8000
                    });
                    
                    if (response.data && response.data.length > 100) {
                        stickerUrl = api;
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            if (!stickerUrl) {
                // Fallback to text if all APIs fail
                await sock.sendMessage(jid, {
                    text: `✨ *${text.toUpperCase()}* ✨`
                }, { quoted: m });
                
                await sock.sendMessage(jid, {
                    react: { text: "✨", key: m.key }
                });
                return;
            }
            
            // Send sticker directly
            await sock.sendMessage(jid, {
                sticker: { url: stickerUrl },
                mimetype: 'image/webp'
            }, { quoted: m });
            
            // Just add reaction
            await sock.sendMessage(jid, {
                react: { text: "✨", key: m.key }
            });
            
        } catch (error) {
            console.error("ATTP error:", error);
            
            // Silent fail - just react with ❌
            await sock.sendMessage(jid, {
                react: { text: "❌", key: m.key }
            });
        }
    }
};