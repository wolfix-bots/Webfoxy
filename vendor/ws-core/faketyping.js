// faketyping.js — Send typing/recording presence for N seconds
// Usage: .faketyping 30s  |  .faketyping recording 1m
const activePresences = new Map();

export default {
    name: 'faketyping',
    alias: ['faketype', 'typing', 'fakerecord', 'presence'],
    category: 'fun',
    desc: 'Appear as typing or recording a voice note for N seconds',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });

        if (args[0]?.toLowerCase() === 'stop') {
            const t = activePresences.get(chatId);
            if (t) { clearInterval(t); activePresences.delete(chatId); }
            await sock.sendPresenceUpdate('available', chatId);
            return reply('✅ Fake presence stopped.');
        }

        if (!args.length) {
            return reply(
`╭─⌈ ⌨️ *FAKE TYPING* ⌋
│
├─⊷ *Typing:*
│  \`${PREFIX}faketyping 30s\`
│  \`${PREFIX}faketyping 2m\`
│
├─⊷ *Recording:*
│  \`${PREFIX}faketyping recording 1m\`
│
├─⊷ *Stop:*
│  \`${PREFIX}faketyping stop\`
│
╰⊷ 🦊 Foxy`);
        }

        let presenceType = 'composing';
        let delayStr = args[0];

        if (args[0].toLowerCase() === 'recording' || args[0].toLowerCase() === 'record') {
            presenceType = 'recording';
            delayStr = args[1] || '30s';
        }

        const parseMs = str => {
            const match = str?.match(/^(\d+)(s|m)$/i);
            if (!match) return null;
            return parseInt(match[1]) * (match[2].toLowerCase() === 'm' ? 60000 : 1000);
        };

        const durationMs = parseMs(delayStr);
        if (!durationMs) return reply(`❌ Invalid time. Use: 30s, 1m, 2m`);
        if (durationMs < 3000) return reply('❌ Minimum: 3 seconds.');
        if (durationMs > 600000) return reply('❌ Maximum: 10 minutes.');

        // Clear existing
        const existing = activePresences.get(chatId);
        if (existing) clearInterval(existing);

        const label = presenceType === 'recording' ? '🎙️ recording' : '⌨️ typing';
        const secs = Math.round(durationMs / 1000);

        await sock.sendPresenceUpdate(presenceType, chatId);

        // Refresh presence every 5s (WhatsApp auto-clears typing after ~5s)
        const interval = setInterval(async () => {
            try { await sock.sendPresenceUpdate(presenceType, chatId); } catch {}
        }, 4500);
        activePresences.set(chatId, interval);

        // Auto-stop after duration
        setTimeout(async () => {
            clearInterval(interval);
            activePresences.delete(chatId);
            try { await sock.sendPresenceUpdate('available', chatId); } catch {}
        }, durationMs);

        await sock.sendMessage(chatId, {
            text: `${label === '⌨️ typing' ? '⌨️' : '🎙️'} *Fake ${presenceType === 'recording' ? 'Recording' : 'Typing'}* active for *${secs}s*\n\nUse \`${PREFIX}faketyping stop\` to stop early.`
        }, { quoted: m });
    }
};
