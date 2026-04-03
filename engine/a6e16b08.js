export default {
    name: 'hug',
    alias: ['hugs', '🤗', 'embrace'],
    category: 'fun',
    description: 'Give someone a warm hug 🤗',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        const isGroup = chatId.endsWith('@g.us');
        
        // Get mentioned user
        let target = null;
        let targetName = 'someone';
        
        if (isGroup) {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            if (mentioned) {
                target = mentioned;
                targetName = `@${mentioned.split('@')[0]}`;
            }
        }
        
        // If no mention, check quoted message
        if (!target) {
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
            if (quoted) {
                target = quoted;
                targetName = `@${quoted.split('@')[0]}`;
            }
        }
        
        // Hug messages
        const hugMessages = [
            `🤗 *${sender} gave ${targetName} a warm hug!*`,
            `🦊 *${sender} hugs ${targetName} tightly!*`,
            `💕 *${sender} sends a big hug to ${targetName}!*`,
            `🤗 *${sender} wraps ${targetName} in a cozy hug!*`,
            `🌟 *${targetName} received a magical hug from ${sender}!*`,
            `💖 *${sender} hugs ${targetName} with love!*`,
            `🦊 *Foxy approves this hug between ${sender} and ${targetName}!*`
        ];
        
        // If no target, hug yourself
        if (!target) {
            targetName = 'themselves';
            hugMessages.push(
                `🤗 *${sender} gives themselves a hug! (We all need self-love)*`,
                `🦊 *${sender} hugs themselves! Foxy sends virtual hugs!*`,
                `💕 *${sender} practices self-care with a warm hug!*`
            );
        }
        
        const randomMessage = hugMessages[Math.floor(Math.random() * hugMessages.length)];
        
        // Hug GIF URLs (from GIPHY or similar - safe for WhatsApp)
        const hugGifs = [
            'https://media.giphy.com/media/od5H3PmEG5EVq/giphy.gif',
            'https://media.giphy.com/media/3ZnBrkqoaI2hq/giphy.gif',
            'https://media.giphy.com/media/lrr9rHuoJOE0w/giphy.gif',
            'https://media.giphy.com/media/PHZ7v9tfQu0o0/giphy.gif',
            'https://media.giphy.com/media/wnsgren9NtITS/giphy.gif'
        ];
        
        const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];
        
        const mentions = target ? [target] : [];
        
        try {
            // Try to send as GIF first
            await sock.sendMessage(chatId, {
                video: { url: randomGif },
                caption: randomMessage,
                gifPlayback: true,
                mentions: mentions
            }, { quoted: msg });
            
        } catch (error) {
            // Fallback to text only
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY HUG* 🤗 ⧭─┐
│
├─⧭ ${randomMessage}
│
└─⧭🦊 *Spread the love!*`,
                mentions: mentions
            }, { quoted: msg });
        }
        
        await sock.sendMessage(chatId, {
            react: { text: "🤗", key: msg.key }
        });
    }
};