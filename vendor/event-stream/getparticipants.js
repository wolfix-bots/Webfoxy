// getparticipants.js — List all participants/members of a group
export default {
    name: 'getparticipants',
    alias: ['participants', 'members', 'getmembers', 'listmembers'],
    category: 'group',
    desc: 'List all participants of a group with their roles',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        const isGroup = chatId.endsWith('@g.us');

        let targetJid = chatId;
        if (args[0]?.endsWith('@g.us')) {
            if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Only owner can query other groups.' }, { quoted: m });
            targetJid = args[0];
        } else if (!isGroup) {
            return sock.sendMessage(chatId, {
                text: `❌ Run this in a group, or provide a group JID:\n*${PREFIX}getparticipants <groupjid>*`
            }, { quoted: m });
        }

        try {
            const meta = await sock.groupMetadata(targetJid);
            const participants = meta.participants;

            const admins   = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
            const superAdm = participants.filter(p => p.admin === 'superadmin');
            const members  = participants.filter(p => !p.admin);

            let text = `╭─⌈ 👥 *${meta.subject}* ⌋\n`;
            text += `├─⊷ *Total:* ${participants.length} members\n`;
            text += `├─⊷ *Admins:* ${admins.length} | *Members:* ${members.length}\n`;
            text += `│\n`;

            if (superAdm.length) {
                text += `├─ 👑 *Super Admin*\n`;
                superAdm.forEach(p => { text += `│  • +${p.id.split('@')[0]}\n`; });
                text += `│\n`;
            }

            if (admins.length) {
                text += `├─ 🛡️ *Admins (${admins.length})*\n`;
                admins.forEach(p => { text += `│  • +${p.id.split('@')[0]}\n`; });
                text += `│\n`;
            }

            text += `├─ 👤 *Members (${members.length})*\n`;

            const show = args.includes('all') ? members : members.slice(0, 30);
            show.forEach(p => { text += `│  • +${p.id.split('@')[0]}\n`; });
            if (!args.includes('all') && members.length > 30) {
                text += `│  _...+${members.length - 30} more (use ${PREFIX}getparticipants all)_\n`;
            }

            text += `│\n├─⊷ *Group JID:* \`${targetJid}\``;
            text += `\n╰⊷ 🦊 Foxy`;

            await sock.sendMessage(chatId, { text }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Failed: ${e.message}` }, { quoted: m });
        }
    }
};
