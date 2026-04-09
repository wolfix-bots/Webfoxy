// ghostping.js — Mention/ping someone then immediately delete the message
// They get the notification but the message disappears instantly 👻
export default {
    name: 'ghostping',
    alias: ['ghost', 'gping', 'phantomping', 'spookping'],
    category: 'fun',
    desc: 'Mention someone then instantly delete the message (ghost notification)',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `❌ Use this command in a group.\n*Usage:* \`${PREFIX}ghostping @mention\``
            }, { quoted: m });
        }

        // Get mentioned JIDs from the message
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targets = [...mentioned];

        // Also parse raw numbers from args
        for (const arg of args) {
            const num = arg.replace(/[^0-9]/g, '');
            if (num.length >= 7) {
                const jid = `${num}@s.whatsapp.net`;
                if (!targets.includes(jid)) targets.push(jid);
            }
        }

        if (!targets.length) {
            return sock.sendMessage(chatId, {
                text:
`👻 *Ghost Ping*

*Usage:*
\`${PREFIX}ghostping @person\`
\`${PREFIX}ghostping 254712345678\`

Mentions them then vanishes instantly!`
            }, { quoted: m });
        }

        try {
            // Delete the command message first
            await sock.sendMessage(chatId, { delete: m.key }).catch(() => {});

            // Send the ghost ping
            const text = targets.map(j => `@${j.split('@')[0]}`).join(' ');
            const sent = await sock.sendMessage(chatId, {
                text: `👻 ${text}`,
                mentions: targets
            });

            // Delete immediately (100ms later)
            setTimeout(async () => {
                try { await sock.sendMessage(chatId, { delete: sent.key }); } catch {}
            }, 100);

        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Ghost ping failed: ${e.message}` }, { quoted: m });
        }
    }
};
