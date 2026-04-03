import axios from 'axios';

export default {
    name: "room",
    alias: ["interior", "designroom", "roomdesign", "foxroom"],
    category: "ai",
    description: "Generate AI-powered room interior designs 🏠",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        const roomTypes = [
            "🏠 modern living room",
            "🛏️ cozy bedroom",
            "🍳 minimalist kitchen",
            "🎮 gaming room setup",
            "💻 home office workspace",
            "🛁 luxury bathroom",
            "🏢 studio apartment",
            "📚 library with bookshelves",
            "🍽️ mansion dining room",
            "🌿 balcony garden view",
            "🏗️ loft style bedroom",
            "❄️ scandinavian living room",
            "🏭 industrial style kitchen",
            "🕰️ vintage bedroom",
            "🌴 tropical patio"
        ];
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY ROOM DESIGNER* 🏠 ⧭─┐
│
├─⧭ *What I do:*
│ Generate AI-powered room interior designs!
│
├─⧭ *Usage:*
│ ${prefix}room <room description>
│
├─⧭ *Examples:*
│ • ${prefix}room modern living room
│ • ${prefix}room cozy bedroom with plants
│ • ${prefix}room gaming room rgb lights
│ • ${prefix}room minimalist kitchen white
│
├─⧭ *Popular Room Ideas:`
            });
        }
        
        const roomDesc = args.join(' ');
        
        // Enhanced prompt for better room visualization
        const prompt = `interior design of ${roomDesc}, realistic, architectural visualization, high quality, 4k, photorealistic, professional photography, modern interior, well lit, magazine quality`;
        
        try {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY DESIGNER* 🎨 ⧭─┐
│
├─⧭ *Creating:* ${roomDesc}
│
│ 🏠 Generating your dream room...
│ ⏳ This may take a few seconds
│
└─⧭🦊`
            });
            
            // USING GIFTEDTECH MAGICSTUDIO API
            const apiUrl = `https://api.giftedtech.co.ke/api/ai/magicstudio?apikey=gifted&prompt=${encodeURIComponent(prompt)}`;
            
            const response = await axios.get(apiUrl, { timeout: 30000 });
            
            if (response.data.success && response.data.result) {
                const imageUrl = response.data.result.imageUrl || response.data.result;
                
                await sock.sendMessage(jid, {
                    image: { url: imageUrl },
                    caption: `┌─⧭ *🦊 FOXY ROOM DESIGN* ⧭─┐
│
├─⧭ *Room:* ${roomDesc}
│
├─⧭ *Inspiration:*
│ • Perfect for your next makeover
│ • AI-generated visualization
│ • Realistic 4K quality
│
├─⧭ *Try another:*
│ ${prefix}room ${args[0] || 'bedroom'}
│ ${prefix}room ${args[0] || 'living room'} modern
│
└─⧭🦊 *Dream room created!*`
                });
            } else {
                throw new Error('Failed to generate room design');
            }
            
        } catch (error) {
            console.error('Room design error:', error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *DESIGN FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${error.message}
│
├─⧭ *Try:*
│ • Simpler description
│ • ${prefix}room bedroom
│ • ${prefix}room living room
│ • ${prefix}room kitchen
│
└─⧭🦊 *Even foxes have bad design days!*`
            });
        }
    }
};