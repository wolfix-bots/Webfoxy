export default {
    name: 'slap',
    alias: ['slaps', '👋', 'hit'],
    category: 'fun',
    description: 'Slap someone playfully 👋',
    
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
        
        // Slap messages
        const slapMessages = [
            `👋 *${sender} slapped ${targetName}!*`,
            `🦊 *${sender} gave ${targetName} a fox-style slap!*`,
            `💥 *${sender} smacked ${targetName}!*`,
            `👋 *${targetName} got slapped by ${sender}!*`,
            `🦊 *Foxy watched ${sender} slap ${targetName}!*`,
            `👋 *${sender} playfully slapped ${targetName}!*`,
            `💢 *${targetName} received a slap from ${sender}!*`
        ];
        
        // If no target, slap yourself
        if (!target) {
            targetName = 'themselves';
            slapMessages.push(
                `👋 *${sender} slapped themselves? Are you okay?*`,
                `🦊 *${sender} tried to slap Foxy but missed!*`,
                `💥 *${sender} slapped the air!*`
            );
        }
        
        const randomMessage = slapMessages[Math.floor(Math.random() * slapMessages.length)];
        
        // Slap GIF URLs
        const slapGifs = [
            'https://media.giphy.com/media/Gf3AUz3eBNbTW/giphy.gif',
            'https://media.giphy.com/media/jLeyZWgtwgr2U/giphy.gif',
            'https://media.giphy.com/media/uG3lKkAuh53wc/giphy.gif',
            'https://media.giphy.com/media/3XlEk2RxPS1m8/giphy.gif',
            'https://media.giphy.com/media/8FfGkUw47jxXW/giphy.gif',
            'https://media.giphy.com/media/9g70MpBRpFwuI/giphy.gif'
        ];
        
        const randomGif = slapGifs[Math.floor(Math.random() * slapGifs.length)];
        
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
                text: `┌─⧭ *FOXY SLAP* 👋 ⧭─┐
│
├─⧭ ${randomMessage}
│
└─⧭🦊 *Oops!*`,
                mentions: mentions
            }, { quoted: msg });
        }
        
        await sock.sendMessage(chatId, {
            react: { text: "👋", key: msg.key }
        });
    }
};