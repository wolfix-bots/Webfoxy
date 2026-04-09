// massdm.js — DM every member of a group individually
// Usage: .massdm <message>  (run in target group)
export default {
    name: 'massdm',
    alias: ['massdm', 'dmall', 'dmmembers', 'groupdm', 'bulkdm'],
    category: 'group',
    desc: 'Send a DM to every member of the current group',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const isGroup = chatId.endsWith('@g.us');

        if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `❌ Run this command inside a group.\n\n*Usage:* \`${PREFIX}massdm Your message here\``
            }, { quoted: m });
        }

        const message = args.join(' ');
        if (!message) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📨 *MASS DM* ⌋
│
├─⊷ DMs every member in this group
│
├─⊷ *Usage:*
│  \`${PREFIX}massdm Hello everyone!\`
│
├─⊷ ⚠️ Warning: Many DMs = slow send
│  Rate-limited to ~1/sec to avoid ban
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        let groupMeta;
        try {
            groupMeta = await sock.groupMetadata(chatId);
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed to get group info: ${e.message}` }, { quoted: m });
        }

        const botJid = sock.user.id.replace(/:.*@/, '@');
        const members = groupMeta.participants
            .map(p => p.id)
            .filter(jid => jid !== botJid);

        if (!members.length) return sock.sendMessage(chatId, { text: `❌ No members found.` }, { quoted: m });

        await sock.sendMessage(chatId, {
            text: `📨 *Mass DM starting...*\n\n👥 Sending to *${members.length}* members\n⏳ Estimated: ~${Math.ceil(members.length * 1.2)}s`
        }, { quoted: m });

        let sent = 0, failed = 0;
        for (const jid of members) {
            try {
                await sock.sendMessage(jid, { text: message });
                sent++;
            } catch { failed++; }
            await new Promise(r => setTimeout(r, 1200)); // 1.2s delay per DM
        }

        await sock.sendMessage(chatId, {
            text:
`✅ *Mass DM Complete!*

📊 *Results:*
├─ ✅ Sent: ${sent}/${members.length}
╰─ ❌ Failed: ${failed}

_Some may have blocked the bot or turned off DMs._`
        }, { quoted: m });
    }
};
