export default {
    name: 'roll',
    alias: ['dice', 'rolldice', '🎲'],
    category: 'games',
    description: 'Roll a dice (1-6) 🎲',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        // Check for custom range
        let max = 6;
        if (args[0] && !isNaN(args[0])) {
            max = parseInt(args[0]);
            if (max < 2) max = 2;
            if (max > 100) max = 100;
        }
        
        const result = Math.floor(Math.random() * max) + 1;
        
        // Dice emoji based on result (for 6-sided dice)
        const diceEmoji = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const emoji = max === 6 ? diceEmoji[result - 1] : '🎲';
        
        await sock.sendMessage(chatId, {
            text: `┌─⧭ *DICE ROLL* 🎲 ⧭─┐
│
├─⧭ *Rolling dice...*
│
│ 🎲 Shaking...
│
└─⧭🦊`
        }, { quoted: msg });
        
        setTimeout(async () => {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *DICE RESULT* 🎲 ⧭─┐
│
├─⧭ *Result:* ${emoji} ${result}
├─⧭ *Range:* 1-${max}
│
├─⧭ *Rolled by:* ${sender}
│
└─⧭🦊`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: "🎲", key: msg.key }
            });
        }, 1500);
    }
};