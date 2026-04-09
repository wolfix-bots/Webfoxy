// flip.js — Coin flip / heads or tails
// Usage: .flip  |  .flip 3  (flip 3 coins)
export default {
    name: 'flip',
    alias: ['coinflip', 'coin', 'toss', 'headsortails'],
    category: 'fun',
    desc: 'Flip a coin — heads or tails. Flip multiple coins too!',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const count = Math.min(Math.max(parseInt(args[0]) || 1, 1), 10);

        const results = Array.from({ length: count }, () => Math.random() < 0.5 ? 'HEADS' : 'TAILS');
        const heads = results.filter(r => r === 'HEADS').length;
        const tails = results.filter(r => r === 'TAILS').length;

        if (count === 1) {
            const r = results[0];
            await sock.sendMessage(chatId, {
                text:
`🪙 *Coin Flip*

${r === 'HEADS' ? '👑' : '🦅'} *${r}!*

${r === 'HEADS' ? '✨ Heads it is!' : '🌟 Tails wins!'}`
            }, { quoted: m });
        } else {
            const display = results.map(r => r === 'HEADS' ? '👑' : '🦅').join(' ');
            await sock.sendMessage(chatId, {
                text:
`🪙 *Coin Flip ×${count}*

${display}

📊 *Results:*
├─ 👑 Heads: ${heads}
╰─ 🦅 Tails: ${tails}`
            }, { quoted: m });
        }
    }
};
