// pp.js — Get anyone's WhatsApp profile picture
// Usage: .pp @mention  |  .pp 254712345678  |  .pp (in group, gets your own)
export default {
    name: 'pp',
    alias: ['profilepic', 'pfp', 'avatar', 'getpp', 'profilepicture'],
    category: 'tool',
    desc: 'Get the profile picture of any WhatsApp contact',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const sender = m.key.participant || m.key.remoteJid;

        // Priority: mentioned JID > arg number > quoted msg sender > self
        let targetJid = null;
        const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;

        if (mentioned?.length) {
            targetJid = mentioned[0];
        } else if (args[0]) {
            const num = args[0].replace(/[^0-9]/g, '');
            if (num.length >= 7) targetJid = `${num}@s.whatsapp.net`;
        } else if (quotedParticipant) {
            targetJid = quotedParticipant;
        } else {
            targetJid = sender;
        }

        const displayNum = targetJid.split('@')[0];
        const isSelf = targetJid === sender;

        try {
            const ppUrl = await sock.profilePictureUrl(targetJid, 'image');

            // Fetch the image buffer
            const res = await fetch(ppUrl, { signal: AbortSignal.timeout(10000) });
            if (!res.ok) throw new Error('Failed to download image');
            const buffer = Buffer.from(await res.arrayBuffer());

            await sock.sendMessage(chatId, {
                image: buffer,
                caption: `📸 *Profile Picture*\n${isSelf ? '👤 Your profile' : `📱 +${displayNum}`}`
            }, { quoted: m });

        } catch (e) {
            const isNopp = e.message?.includes('404') || e.message?.includes('not-authorized') || e.output?.statusCode === 404;
            if (isNopp) {
                await sock.sendMessage(chatId, {
                    text: `❌ *No profile picture found*\n\n📱 +${displayNum}\n\n_Either hidden or not set._`
                }, { quoted: m });
            } else {
                await sock.sendMessage(chatId, {
                    text: `❌ Could not fetch profile picture.\n\n_${e.message}_`
                }, { quoted: m });
            }
        }
    }
};
