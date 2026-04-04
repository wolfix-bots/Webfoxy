// Truth Detector — AI-powered (reply or typed text)
import https from 'https';

function fetchJson(url) {
    return new Promise((resolve) => {
        https.get(url, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
        }).on('error', () => resolve(null));
    });
}

// Ask GPT to evaluate the statement and return structured data
async function analyzeWithAI(statement) {
    const prompt =
        `Analyze this statement for truthfulness: "${statement}". ` +
        `Reply ONLY in this exact format, no extra text:\n` +
        `VERDICT: [TRUE/FALSE/UNCERTAIN]\n` +
        `SCORE: [number 0-100, where 100=definitely true, 0=definitely false]\n` +
        `REASON: [one short sentence max 15 words]`;

    const url = `https://apis.xwolf.space/api/ai/gpt?q=${encodeURIComponent(prompt)}`;
    const json = await fetchJson(url);

    if (!json || !json.status || !json.result) return null;

    const text = json.result;

    // Parse fields
    const verdictMatch = text.match(/VERDICT:\s*(TRUE|FALSE|UNCERTAIN)/i);
    const scoreMatch   = text.match(/SCORE:\s*(\d+)/i);
    const reasonMatch  = text.match(/REASON:\s*(.+)/i);

    if (!verdictMatch || !scoreMatch) return null;

    const score   = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
    const verdict = verdictMatch[1].toUpperCase();
    const reason  = reasonMatch ? reasonMatch[1].trim() : '';

    return { score, verdict, reason, aiUsed: true };
}

export default {
    name: 'truthdetect',
    alias: ['truth', 'liedetect', 'detector', 'trustcheck'],
    category: 'fun',
    description: 'AI-powered truth detector — works with typed text or replied messages',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        // Collect statement — typed args first, then quoted/replied message
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

        // Show scanning reaction while AI thinks
        await sock.sendMessage(chatId, { react: { text: '🔍', key: m.key } });
        await sock.sendMessage(chatId, {
            text: '🤖 Scanning with AI...'
        }, { quoted: m });

        // Try AI analysis
        let result = await analyzeWithAI(text);

        // Fallback: pure random if API fails
        if (!result) {
            const score = Math.floor(Math.random() * 101);
            const verdict = score >= 65 ? 'TRUE' : score >= 45 ? 'UNCERTAIN' : 'FALSE';
            result = { score, verdict, reason: '', aiUsed: false };
        }

        const { score: truthScore, verdict: rawVerdict, reason, aiUsed } = result;
        const lieScore = 100 - truthScore;

        // Verdict label + emoji
        let verdictLabel, verdictEmoji;
        if      (truthScore >= 85) { verdictLabel = 'DEFINITELY TRUE'; verdictEmoji = '✅'; }
        else if (truthScore >= 65) { verdictLabel = 'PROBABLY TRUE';   verdictEmoji = '🟡'; }
        else if (truthScore >= 45) { verdictLabel = 'UNCERTAIN';        verdictEmoji = '🤔'; }
        else if (truthScore >= 25) { verdictLabel = 'LIKELY A LIE';    verdictEmoji = '❌'; }
        else                        { verdictLabel = 'TOTAL LIE 🤥';   verdictEmoji = '🚫'; }

        const filled   = n => '█'.repeat(Math.max(0, n));
        const empty    = n => '░'.repeat(Math.max(0, n));
        const truthBar = filled(Math.round(truthScore / 10)) + empty(10 - Math.round(truthScore / 10));
        const lieBar   = filled(Math.round(lieScore  / 10)) + empty(10 - Math.round(lieScore  / 10));

        const reactPool = ['🧐','😳','💀','😏','🤣','👀','😂','🔥','😐','🫡'];
        const react     = reactPool[Math.floor(Math.random() * reactPool.length)];
        const snippet   = text.length > 80 ? text.slice(0, 77) + '...' : text;

        await sock.sendMessage(chatId, { react: { text: react, key: m.key } });

        const aiLine   = aiUsed ? '🤖 *Powered by AI*' : '🎲 *AI offline — randomized*';
        const reasonLine = reason ? `┃ 💬 *AI Note:* ${reason}\n` : '';

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
┃ 🧠 *Verdict:* ${verdictEmoji} ${verdictLabel}
${reasonLine}┃ ${aiLine}
┃
┃ ⚠️ Results are for fun only
╰━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: m });
    }
};
