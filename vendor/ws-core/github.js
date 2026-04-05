export default {
    name: 'github',
    alias: ['gh', 'githubstalk', 'ghstalk'],
    category: 'stalk',
    desc: 'Look up any public GitHub profile',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const username = (args[0] || '').replace('@', '').trim();

        if (!username) {
            return sock.sendMessage(chatId, {
                text: `🐙 *GITHUB LOOKUP*\n\n*Usage:* ${PREFIX||''}github <username>\n*Example:* ${PREFIX||''}github torvalds`
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
                    // xwolf returns publicRepos (camelCase)
                    `📁 *Repos:* ${data.publicRepos ?? data.public_repos ?? 'N/A'}\n` +
                    (data.company ? `🏢 *Company:* ${data.company}\n` : '') +
                    `\n🔗 ${data.profileUrl || data.html_url || 'https://github.com/' + username}\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not find GitHub user *${username}*.` }, { quoted: m });
        }
    }
};
