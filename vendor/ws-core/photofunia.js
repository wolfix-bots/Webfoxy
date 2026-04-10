// photofunia.js — PhotoFunia image effects using xwolf API
import fs from 'fs';
import path from 'path';

async function downloadToBuffer(url, timeoutMs = 30000) {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

// All supported effects
const EFFECTS = {
    hauntedhotel: { needsImage: true, needsText: true, desc: 'Haunted hotel with your photo and text' },
    nightmarewriting: { needsImage: false, needsText: true, desc: 'Nightmare writing effect' },
    lightning: { needsImage: true, needsText: false, desc: 'Lightning storm effect on photo' },
    cemeterygates: { needsImage: false, needsText: true, desc: 'Cemetery gates with text' },
    summoningspirits: { needsImage: true, needsText: false, desc: 'Summoning spirits with photo' },
    ghostwood: { needsImage: true, needsText: false, desc: 'Ghost forest effect' },
    frankensteinmonster: { needsImage: false, needsText: false, desc: 'Frankenstein monster image' },
};

export default {
    name: 'photofunia',
    alias: ['pfx', 'photoeffect', 'pfunia', 'hauntedhotel', 'nightmarewriting', 'cemeterygates', 'summoningspirits', 'ghostwood', 'frankensteinmonster', 'lightningphoto'],
    category: 'fun',
    desc: 'Apply PhotoFunia image effects to your photos',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        // Determine which effect was requested
        const cmdName = (m.message?.extendedTextMessage?.text || m.message?.conversation || '').split(' ')[0].replace(/^[.!#/]/, '').toLowerCase();
        let effect = args[0]?.toLowerCase();

        // If called via alias directly, use that as the effect
        const directEffects = ['hauntedhotel', 'nightmarewriting', 'cemeterygates', 'summoningspirits', 'ghostwood', 'frankensteinmonster'];
        if (directEffects.includes(cmdName)) {
            effect = cmdName;
        }
        if (cmdName === 'lightningphoto') effect = 'lightning';

        if (!effect || !EFFECTS[effect]) {
            const effectList = Object.entries(EFFECTS).map(([key, val]) =>
                `• \`${PREFIX}photofunia ${key}\` — ${val.desc}`
            ).join('\n');

            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 🎨 *PHOTOFUNIA* ⌋
│
├─⊷ Apply spooky photo effects!
│
├─⊷ *Effects:*
${effectList}
│
├─⊷ *Usage:*
│  Reply to photo + \`${PREFIX}photofunia <effect>\`
│  \`${PREFIX}photofunia nightmarewriting Hello World\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const effectInfo = EFFECTS[effect];
        const BASE = 'https://apis.xwolf.space/api/photofunia';

        try {
            // Get image URL if needed
            let imageUrl = null;
            if (effectInfo.needsImage) {
                const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const directImage = m.message?.imageMessage;

                if (quotedMsg?.imageMessage) {
                    imageUrl = quotedMsg.imageMessage.url || quotedMsg.imageMessage.directPath;
                } else if (directImage) {
                    imageUrl = directImage.url || directImage.directPath;
                } else {
                    return sock.sendMessage(chatId, {
                        text: `❌ The *${effect}* effect requires an image.\n\nReply to a photo + \`${PREFIX}photofunia ${effect}\``
                    }, { quoted: m });
                }
            }

            // Get text if needed
            let text = null;
            if (effectInfo.needsText) {
                text = (effect === 'nightmarewriting' ? args.join(' ') : args.slice(1).join(' ')) || args.join(' ');
                if (!text) {
                    return sock.sendMessage(chatId, {
                        text: `❌ The *${effect}* effect requires text.\n\nExample: \`${PREFIX}photofunia ${effect} Your Text Here\``
                    }, { quoted: m });
                }
            }

            await sock.sendMessage(chatId, { text: `🎨 Applying *${effect}* effect...` }, { quoted: m });

            // Build API URL
            let apiUrl = `${BASE}/${effect}`;
            const params = new URLSearchParams();
            if (imageUrl) params.set('imageUrl', imageUrl);
            if (text) params.set('text', text);
            if (params.toString()) apiUrl += '?' + params.toString();

            const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) throw new Error(`API error: ${res.status}`);

            const data = await res.json();
            const resultUrl = data.resultUrl || data.result || data.url || data.image;
            if (!resultUrl) throw new Error('No result URL in response');

            const imgBuffer = await downloadToBuffer(resultUrl);

            return sock.sendMessage(chatId, {
                image: imgBuffer,
                caption: `🎨 *${effect.charAt(0).toUpperCase() + effect.slice(1)}* effect applied!${text ? `\n📝 Text: ${text}` : ''}\n\n🦊 Foxy PhotoFunia`
            }, { quoted: m });

        } catch (e) {
            return sock.sendMessage(chatId, {
                text: `❌ *PhotoFunia Failed*\n\n_${e.message}_\n\nTry a different image or effect.`
            }, { quoted: m });
        }
    }
};
