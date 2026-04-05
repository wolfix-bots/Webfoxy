export default {
    name: 'tikstalk',
    alias: ['ttstalk', 'tiktokstalk', 'tkstalk', 'tksearch'],
    category: 'stalk',
    desc: 'Look up any public TikTok profile',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const username = (args[0] || '').replace('@', '').trim();

        if (!username) {
            return sock.sendMessage(chatId, {
                text: `🎵 *TIKTOK STALK*\n\n*Usage:* ${PREFIX||''}tikstalk <username>\n*Example:* ${PREFIX||''}tikstalk tiktok`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xwolf.space/api/stalk/tiktok?username=' + encodeURIComponent(username), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success) throw new Error('User not found');

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🎵 *TikTok: @${data.username || username}*\n${LINE}\n\n` +
                    `👤 *Name:* ${data.nickname || 'N/A'}\n` +
                    (data.bio || data.signature ? `📝 *Bio:* ${data.bio || data.signature}\n` : '') +
                    `👥 *Followers:* ${data.followers ?? data.followerCount ?? 'N/A'}\n` +
                    `➡️ *Following:* ${data.following ?? data.followingCount ?? 'N/A'}\n` +
                    `❤️ *Likes:* ${data.likes ?? data.heartCount ?? 'N/A'}\n` +
                    `📹 *Videos:* ${data.videos ?? data.videoCount ?? 'N/A'}\n` +
                    `✅ *Verified:* ${data.verified ? 'Yes' : 'No'}\n` +
                    `\n🔗 https://tiktok.com/@${username}\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not find TikTok user *${username}*.` }, { quoted: m });
        }
    }
};
