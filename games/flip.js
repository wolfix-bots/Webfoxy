export default {
    name: 'flip',
    alias: ['coin', 'coinflip', 'toss'],
    category: 'games',
    description: 'Flip a coin 🪙',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        const outcomes = ['Heads', 'Tails'];
        const result = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        const emoji = result === 'Heads' ? '👑' : '🪙';
        
        await sock.sendMessage(chatId, {
            text: `┌─⧭ *COIN FLIP* 🪙 ⧭─┐
│
├─⧭ *Flipping coin...*
│
│ 🌀 Spinning...
│
└─⧭🦊`
        }, { quoted: msg });
        
        setTimeout(async () => {
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *COIN FLIP RESULT* 🪙 ⧭─┐
│
├─⧭ *Result:* ${emoji} ${result}
│
├─⧭ *Flipped by:* ${sender}
│
└─⧭🦊`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: result === 'Heads' ? '👑' : '🪙', key: msg.key }
            });
        }, 1500);
    }
};