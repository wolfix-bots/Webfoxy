// calc.js — Safe math calculator
// Usage: .calc 2 + 2  |  .calc (10 * 5) / 2  |  .calc 2^10
export default {
    name: 'calc',
    alias: ['calculate', 'math', 'calculator', 'solve'],
    category: 'tool',
    desc: 'Safe math calculator — supports +, -, *, /, ^, %, (, )',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        const expr = args.join(' ').trim();
        if (!expr) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 🧮 *CALCULATOR* ⌋
│
├─⊷ *Usage:* \`${PREFIX}calc <expression>\`
│
├─⊷ *Examples:*
│  \`${PREFIX}calc 2 + 2\` → 4
│  \`${PREFIX}calc (10 * 5) / 2\` → 25
│  \`${PREFIX}calc 2^10\` → 1024
│  \`${PREFIX}calc 15 % 4\` → 3
│  \`${PREFIX}calc sqrt(144)\` → 12
│  \`${PREFIX}calc 1000 * 24 * 365\` → 8760000
│
├─⊷ *Ops:* + - * / ^ % sqrt() abs() round()
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        // Safe expression evaluator — only allow math chars + functions
        const sanitize = e => e
            .replace(/\^/g, '**')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/abs\(/g, 'Math.abs(')
            .replace(/round\(/g, 'Math.round(')
            .replace(/floor\(/g, 'Math.floor(')
            .replace(/ceil\(/g, 'Math.ceil(')
            .replace(/pi/gi, 'Math.PI')
            .replace(/e(?=[^a-z]|$)/g, 'Math.E');

        const safe = sanitize(expr);

        // Whitelist: only allow numbers, operators, spaces, Math functions, parens, dots
        if (/[^0-9+\-*/.%() \nMath.sqrtabsroundflorceilPI E]/.test(safe)) {
            return sock.sendMessage(chatId, {
                text: `❌ *Invalid expression*\n\nOnly math operators allowed.\n*Try:* \`${PREFIX}calc 5 * 10\``
            }, { quoted: m });
        }

        try {
            const result = Function('"use strict"; return (' + safe + ')')();
            if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');

            const formatted = Number.isInteger(result)
                ? result.toLocaleString()
                : parseFloat(result.toFixed(10)).toString();

            await sock.sendMessage(chatId, {
                text:
`🧮 *Calculator*

📝 *Expr:* \`${expr}\`
━━━━━━━━━━━━━━━━
🟰 *Result:* \`${formatted}\``
            }, { quoted: m });

        } catch {
            await sock.sendMessage(chatId, {
                text: `❌ *Math error!*\n\nCould not evaluate: \`${expr}\`\n\nCheck for typos or division by zero.`
            }, { quoted: m });
        }
    }
};
