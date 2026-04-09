// fetchgroups.js — Fetch all group JIDs the bot is currently in
export default {
    name: 'fetchgroups',
    alias: ['getgroups', 'listgroups', 'groupjids', 'groups'],
    category: 'group',
    desc: 'Fetch JIDs of all groups the bot is in',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        await sock.sendMessage(chatId, { text: '🔄 Fetching all groups...' }, { quoted: m });

        try {
            const allChats = await sock.groupFetchAllParticipating();
            const groups = Object.values(allChats);

            if (!groups.length) {
                return sock.sendMessage(chatId, {
                    text: '📭 Bot is not in any groups.'
                }, { quoted: m });
            }

            const filter = args[0]?.toLowerCase() || '';
            const filtered = filter
                ? groups.filter(g => g.subject?.toLowerCase().includes(filter))
                : groups;

            if (!filtered.length) {
                return sock.sendMessage(chatId, {
                    text: `📭 No groups matching *"${filter}"*`
                }, { quoted: m });
            }

            const chunk = 25;
            const pages = Math.ceil(filtered.length / chunk);

            for (let p = 0; p < pages; p++) {
                const slice = filtered.slice(p * chunk, (p + 1) * chunk);
                let text = `╭─⌈ 👥 *GROUP JIDs* (${p + 1}/${pages}) ⌋\n`;
                text += `├─⊷ Total: *${filtered.length}* groups\n`;
                if (filter) text += `├─⊷ Filter: *${filter}*\n`;
                text += `│\n`;

                slice.forEach((g, i) => {
                    const num = p * chunk + i + 1;
                    const name = g.subject || 'Unknown';
                    const jid = g.id;
                    const count = g.participants?.length || 0;
                    text += `├─ *${num}. ${name}*\n`;
                    text += `│  ◈ JID: \`${jid}\`\n`;
                    text += `│  ◈ Members: ${count}\n`;
                    text += `│\n`;
                });

                text += `╰⊷ 🦊 Use JID with .togstatus <jid> <message>`;

                await sock.sendMessage(chatId, { text }, { quoted: p === 0 ? m : undefined });

                if (p < pages - 1) await new Promise(r => setTimeout(r, 800));
            }

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: `❌ Failed to fetch groups: ${e.message}`
            }, { quoted: m });
        }
    }
};
