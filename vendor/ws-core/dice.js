// dice.js — Roll dice + coin flip
// Usage: .dice  |  .dice 20  |  .dice 2d6  |  .flip
export default {
    name: 'dice',
    alias: ['roll', 'rolldice', 'd6', 'random'],
    category: 'fun',
    desc: 'Roll dice — any number of sides. Also: .flip for coin toss',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const input = args[0]?.toLowerCase() || '6';

        // Multi-dice format: NdS (e.g. 2d6, 3d20)
        const multiMatch = input.match(/^(\d+)d(\d+)$/);
        if (multiMatch) {
            const count = Math.min(parseInt(multiMatch[1]), 10);
            const sides = Math.min(parseInt(multiMatch[2]), 1000);
            if (sides < 2) return sock.sendMessage(chatId, { text: '❌ Minimum 2 sides.' }, { quoted: m });

            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
            const total = rolls.reduce((a, b) => a + b, 0);
            const dice_emoji = sides <= 6 ? ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][sides - 1] || '🎲' : '🎲';

            return sock.sendMessage(chatId, {
                text:
`🎲 *Dice Roll — ${count}d${sides}*

🎯 Rolls: ${rolls.join(' + ')}
━━━━━━━━━━━━━━━━
🏆 Total: *${total}*
📊 Avg: ${(total / count).toFixed(1)}`
            }, { quoted: m });
        }

        // Single die
        const sides = Math.min(Math.max(parseInt(input) || 6, 2), 1000);
        const result = Math.floor(Math.random() * sides) + 1;

        const faceMap = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };
        const face = sides === 6 ? (faceMap[result] || '🎲') : '🎲';

        await sock.sendMessage(chatId, {
            text:
`${face} *Dice Roll — d${sides}*

🎯 Result: *${result}*
━━━━━━━━━━━━━━━━
💡 _Try:_ \`${PREFIX}dice 2d6\` \`${PREFIX}dice 20\` \`${PREFIX}flip\``
        }, { quoted: m });
    }
};
