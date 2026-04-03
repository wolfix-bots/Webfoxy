export default {
    name: "compliment",
    alias: ["praise", "nice", "flatter", "nice", "💝"],
    category: "fun",
    description: "Get a heartwarming compliment 💝",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        // Check if mentioned someone
        let mentionedUser = null;
        let mentionedName = '';
        
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
            mentionedUser = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
            mentionedName = mentionedUser.split('@')[0];
        }
        
        // Show help if needed
        if (args[0]?.toLowerCase() === 'help') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY COMPLIMENTS* 💝 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}compliment
│ • ${PREFIX}compliment @friend
│ • ${PREFIX}compliment about something
│
├─⧭ *Examples:*
│ • ${PREFIX}compliment
│ • ${PREFIX}compliment @john
│ • ${PREFIX}compliment about coding
│
└─⧭🦊 *Spread the love!*`
            }, { quoted: m });
        }
        
        try {
            // Local compliments database (no API needed)
            const compliments = [
                // Personality compliments
                "You have a heart of gold and it shows in everything you do! 💛",
                "Your smile could light up the darkest room! ✨",
                "You're one of the kindest souls I've ever met! 🌟",
                "Your energy is absolutely infectious in the best way! ⚡",
                "You make the world a better place just by being in it! 🌍",
                "Your laugh is genuinely the sweetest sound! 🎵",
                "You have a way of making everyone feel special! 💝",
                "Your positivity is truly inspiring! 🌈",
                "You're stronger than you know and braver than you believe! 🦁",
                "Your presence makes everything better! ✨",
                
                // Intelligence compliments
                "Your mind is absolutely brilliant! Keep shining! 🧠",
                "You have such a unique and beautiful perspective on things! 💭",
                "Your ideas are always so creative and inspiring! 💡",
                "You're not just smart, you're wise beyond your years! 📚",
                "The way you think about problems is truly impressive! 🔍",
                
                // Friendship compliments
                "You're the kind of friend everyone wishes they had! 🤗",
                "Having you in my life is one of the best things ever! 🦊",
                "You make even ordinary days feel special! 🌟",
                "Your friendship is a gift I treasure every day! 🎁",
                "You're the definition of a true friend! 👑",
                
                // Fox-themed compliments
                "You're as clever as a fox and twice as charming! 🦊",
                "Foxy approves of your awesomeness! 🦊✨",
                "You've got that fox-like wit and wisdom! 🦊",
                "Sly like a fox, sweet like honey! 🦊🍯",
                "Even Foxy is jealous of your coolness! 🦊😎",
                
                // Random warm fuzzies
                "You deserve all the happiness in the world! 🌸",
                "Someone out there is really lucky to have you! 💫",
                "You're doing better than you think you are! 🌱",
                "Today is better because you're in it! ☀️",
                "You matter more than you know! 💖",
                "You're capable of amazing things! 🚀",
                "Your potential is limitless! ∞",
                "You're a masterpiece in progress! 🎨"
            ];
            
            // Topic-specific compliments
            const topicCompliments = {
                'hair': ["Your hair is absolutely gorgeous! 💇", "That hairstyle really suits you! ✨"],
                'eyes': ["Your eyes are captivating! 👀", "You have such kind eyes! 💫"],
                'smile': ["Your smile is infectious! 😊", "That smile could light up the world! ✨"],
                'laugh': ["Your laugh is the best sound ever! 😄", "I love hearing you laugh! 🎵"],
                'voice': ["Your voice is so soothing! 🎤", "You could be a voice actor! 🎙️"],
                'style': ["Your fashion sense is impeccable! 👗", "You always look so put together! 👔"],
                'cooking': ["Your cooking is legendary! 🍳", "You should be a chef! 👨‍🍳"],
                'art': ["Your art is breathtaking! 🎨", "You're so talented! 🖼️"],
                'music': ["Your taste in music is amazing! 🎵", "You have the soul of a musician! 🎸"],
                'writing': ["Your way with words is beautiful! ✍️", "You're such a gifted writer! 📝"],
                'coding': ["Your code is cleaner than a fox's fur! 💻", "You're a coding genius! 👨‍💻"],
                'gaming': ["Your gaming skills are legendary! 🎮", "You're a pro gamer! 👾"],
                'dancing': ["Your moves are incredible! 💃", "You dance like nobody's watching! 🕺"],
                'singing': ["Your voice is angelic! 🎤", "You could win singing competitions! 🏆"],
                'photos': ["You take amazing photos! 📸", "You have an eye for photography! 📷"]
            };
            
            let compliment = '';
            
            // Check for topic-specific compliments
            if (args.length > 0 && !mentionedUser) {
                const topic = args.join(' ').toLowerCase();
                let foundTopic = false;
                
                for (const [key, values] of Object.entries(topicCompliments)) {
                    if (topic.includes(key)) {
                        compliment = values[Math.floor(Math.random() * values.length)];
                        foundTopic = true;
                        break;
                    }
                }
                
                if (!foundTopic) {
                    compliment = `I love your ${topic}! Keep being awesome! 🌟`;
                }
            } else {
                // Random compliment
                compliment = compliments[Math.floor(Math.random() * compliments.length)];
            }
            
            // Build message
            let message = '';
            if (mentionedUser) {
                message = `┌─⧭ *FOXY COMPLIMENT* 💝 ⧭─┐
│
├─⧭ @${mentionedName}
│
├─⧭ ${compliment}
│
└─⧭🦊 *Spread the love!*`;
            } else {
                message = `┌─⧭ *FOXY COMPLIMENT* 💝 ⧭─┐
│
├─⧭ ${compliment}
│
└─⧭🦊 *You're amazing!*`;
            }
            
            // Send compliment
            await sock.sendMessage(jid, {
                text: message,
                mentions: mentionedUser ? [mentionedUser] : []
            }, { quoted: m });
            
            // Add reaction
            await sock.sendMessage(jid, {
                react: { text: "💝", key: m.key }
            });
            
        } catch (error) {
            console.error("Compliment error:", error);
            
            // Ultra simple fallback
            const fallbackCompliments = [
                "You're awesome! 🌟",
                "You're the best! 🦊",
                "You're amazing! ✨",
                "You're wonderful! 💝"
            ];
            
            const fallback = fallbackCompliments[Math.floor(Math.random() * fallbackCompliments.length)];
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY COMPLIMENT* 💝 ⧭─┐
│
├─⧭ ${fallback}
│
└─⧭🦊`,
                mentions: mentionedUser ? [mentionedUser] : []
            }, { quoted: m });
            
            await sock.sendMessage(jid, {
                react: { text: "💝", key: m.key }
            });
        }
    }
};