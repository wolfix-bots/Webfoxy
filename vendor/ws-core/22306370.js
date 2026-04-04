// Truth Detector — fun only (reply or typed text supported)
export default {
    name: 'truthdetect',
    alias: ['truth', 'liedetect', 'detector', 'trustcheck'],
    category: 'fun',
    description: 'Fun truth/lie detector — works with typed text or replied messages',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        // Typed args first, then fall back to quoted/replied message
        let text = args.join(' ').trim();

        if (!text) {
            const q = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (q) {
                text = (
                    q.conversation ||
                    q.extendedTextMessage?.text ||
                    q.imageMessage?.caption ||
                    q.videoMessage?.caption ||
                    ''
                ).trim();
            }
        }

        if (!text) {
            return await sock.sendMessage(chatId, {
                text:
`❌ Give me something to scan!

• Type it: *${PREFIX}truthdetect I did my homework*
• Or reply to any message with *${PREFIX}truthdetect*`
            }, { quoted: m });
        }

        const truthScore = Math.floor(Math.random() * 101);
        const lieScore   = 100 - truthScore;

        let verdict, verdictEmoji;
        if      (truthScore >= 85) { verdict = 'DEFINITELY TRUE'; verdictEmoji = '✅'; }
        else if (truthScore >= 65) { verdict = 'PROBABLY TRUE';   verdictEmoji = '🟡'; }
        else if (truthScore >= 45) { verdict = 'UNCERTAIN';        verdictEmoji = '🤔'; }
        else if (truthScore >= 25) { verdict = 'LIKELY A LIE';    verdictEmoji = '❌'; }
        else                        { verdict = 'TOTAL LIE 🤥';   verdictEmoji = '🚫'; }

        const confidence = Math.floor(Math.random() * 15) + 84;

        const filled   = n => '█'.repeat(n);
        const empty    = n => '░'.repeat(n);
        const truthBar = filled(Math.round(truthScore / 10)) + empty(10 - Math.round(truthScore / 10));
        const lieBar   = filled(Math.round(lieScore  / 10)) + empty(10 - Math.round(lieScore  / 10));

        const reactPool = ['🧐','😳','💀','😏','🤣','👀','😂','🔥','😐','🫡'];
        const react     = reactPool[Math.floor(Math.random() * reactPool.length)];
        const snippet   = text.length > 80 ? text.slice(0, 77) + '...' : text;

        await sock.sendMessage(chatId, { react: { text: react, key: m.key } });

        return await sock.sendMessage(chatId, {
            text:
`╭━━━〔🔍 *TRUTH DETECTOR* 〕━━━╮
┃
┃ 📝 *Statement scanned:*
┃ "${snippet}"
┃
┃ ✅ *Truth Meter:*
┃ [${truthBar}] ${truthScore}%
┃
┃ 🤥 *Lie Meter:*
┃ [${lieBar}] ${lieScore}%
┃
┃ 🧠 *Verdict:* ${verdictEmoji} ${verdict}
┃ 📡 *Confidence:* ${confidence}%
┃
┃ ⚠️ Results are for fun only
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m });
    }
};
