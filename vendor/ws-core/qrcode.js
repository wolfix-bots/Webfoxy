export default {
    name: 'qrcode',
    alias: ['qr', 'qrgen', 'makeqr'],
    category: 'tools',
    desc: 'Generate a QR code for any text or link',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const text = args.join(' ').trim();

        if (!text) {
            return sock.sendMessage(chatId, {
                text: `📱 *QR CODE*\n\n*Usage:* ${PREFIX||''}qrcode <text or link>\n*Example:* ${PREFIX||''}qrcode https://github.com/wolfix-bots`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xwolf.space/api/tools/qrcode?text=' + encodeURIComponent(text), { signal: AbortSignal.timeout(15000) });
            const data = await res.json();
            if (!data.success) throw new Error('QR generation failed');
            const qrUrl = data.result?.url || data.result;
            if (!qrUrl) throw new Error('No QR URL returned');

            const imgRes = await fetch(qrUrl, { signal: AbortSignal.timeout(20000) });
            if (!imgRes.ok) throw new Error('Image fetch failed');
            const buffer = Buffer.from(await imgRes.arrayBuffer());

            return sock.sendMessage(chatId, {
                image: buffer,
                caption: `📱 *QR Code*\n\`${text.slice(0, 60)}${text.length > 60 ? '...' : ''}\``
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: '❌ Could not generate QR code. Try again.' }, { quoted: m });
        }
    }
};
