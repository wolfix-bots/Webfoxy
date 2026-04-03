import axios from 'axios';

export default {
    name: "logo",
    alias: ["brand", "designlogo", "logomaker", "foxlogo", "createlogo"],
    category: "ai",
    description: "Generate AI-powered logo designs for your brand 🎨",
    
    async execute(sock, m, args, prefix) {
        const jid = m.key.remoteJid;
        
        const businessTypes = [
            "☕ coffee shop",
            "💻 tech startup",
            "💪 gym fitness",
            "🍰 bakery cake",
            "🍔 restaurant",
            "👕 clothing brand",
            "📱 app development",
            "🏠 real estate",
            "🎵 music studio",
            "📷 photography",
            "💅 beauty salon",
            "🐾 pet shop",
            "📚 education",
            "🏥 medical",
            "🔧 automotive"
        ];
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY LOGO DESIGNER* 🎨 ⧭─┐
│
├─⧭ *What I do:*
│ Generate professional AI logos for your brand!
│
├─⧭ *Usage:*
│ ${prefix}logo <business name/type>
│
├─⧭ *Examples:*
│ • ${prefix}logo coffee shop
│ • ${prefix}logo tech startup
│ • ${prefix}logo gym fitness
│ • ${prefix}logo bakery cake
│
├─⧭ *Popular Business Types:`
            });
        }
        
        const business = args.join(' ');
        
        // Enhanced prompt for better logo generation
        const prompt = `professional vector logo design for ${business}, minimalist, clean lines, modern branding, high quality, 2d, white background, scalable vector, professional brand identity, unique design`;
        
        try {
            await sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY CREATING* 🎨 ⧭─┐
│
├─⧭ *Business:* ${business}
│
│ 🖌️ Designing your logo...
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
                    caption: `┌─⧭ *🦊 FOXY LOGO DESIGN* ⧭─┐
│
├─⧭ *Business:* ${business}
├─⧭ *Style:* Modern Minimalist
│
├─⧭ *Perfect for:*
│ • Brand identity
│ • Website header
│ • Social media
│ • Business cards
│
├─⧭ *Try another variation:*
│ ${prefix}logo ${business.split(' ')[0]} creative
│ ${prefix}logo ${business.split(' ')[0]} elegant
│
└─⧭🦊 *Your brand is ready!*`
                });
            } else {
                throw new Error('Failed to generate logo');
            }
            
        } catch (error) {
            console.error('Logo error:', error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *LOGO FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${error.message}
│
├─⧭ *Try:*
│ • ${prefix}logo cafe
│ • ${prefix}logo tech
│ • ${prefix}logo shop
│ • Simpler business name
│
└─⧭🦊 *Even foxes have bad design days!*`
            });
        }
    }
};