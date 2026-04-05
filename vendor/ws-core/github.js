export default {
    name: 'github',
    alias: ['gh', 'gitstalk', 'ghstalk', 'githubstalk'],
    category: 'stalk',
    desc: 'Look up any GitHub profile',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const username = args[0]?.trim();

        if (!username) {
            return sock.sendMessage(chatId, {
                text: `🐙 *GITHUB STALK*\n\n*Usage:* ${PREFIX||''}github <username>\n*Example:* ${PREFIX||''}github torvalds`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xwolf.space/api/stalk/github?username=' + encodeURIComponent(username), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success) throw new Error('User not found');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🐙 *GitHub: @${data.username || username}*\n${LINE}\n\n` +
                    `👤 *Name:* ${data.name || 'N/A'}\n` +
                    (data.bio ? `📝 *Bio:* ${data.bio}\n` : '') +
                    (data.location ? `📍 *Location:* ${data.location}\n` : '') +
                    `👥 *Followers:* ${data.followers ?? 'N/A'}\n` +
                    `➡️ *Following:* ${data.following ?? 'N/A'}\n` +
                    `📁 *Repos:* ${data.public_repos ?? 'N/A'}\n` +
                    (data.company ? `🏢 *Company:* ${data.company}\n` : '') +
                    `\n🔗 ${data.html_url || 'https://github.com/' + username}\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not find GitHub user *${username}*.` }, { quoted: m });
        }
    }
};
