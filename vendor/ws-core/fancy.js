// fancy.js — Convert text to aesthetic/fancy Unicode styles
// Usage: .fancy hello  |  .fancy bold hello  |  .fancy list
const STYLES = {
    bold: { name: '𝗕𝗼𝗹𝗱', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', out: '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵' },
    italic: { name: '𝘐𝘵𝘢𝘭𝘪𝘤', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', out: '𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻' },
    script: { name: '𝓢𝓬𝓻𝓲𝓹𝓽', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', out: '𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃' },
    fraktur: { name: '𝔉𝔯𝔞𝔨𝔱𝔲𝔯', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', out: '𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷' },
    double: { name: 'ⓓⓞⓤⓑⓛⓔ', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', out: '𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡' },
    vaporwave: { name: 'Ｖａｐｏｒ', map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', out: 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９' },
    smallcaps: { name: 'ꜱᴍᴀʟʟ ᴄᴀᴘꜱ', map: 'abcdefghijklmnopqrstuvwxyz', out: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴩqʀꜱᴛᴜᴠᴡxyᴢ' },
};

function convert(style, text) {
    const { map, out } = STYLES[style];
    return [...text].map(c => {
        const i = map.indexOf(c);
        return i >= 0 ? [...out.split('')][i] || c : c;
    }).join('');
}

// Split out chars correctly for multi-byte Unicode
function applyStyle(style, text) {
    const { map } = STYLES[style];
    const outArr = [...STYLES[style].out];
    return [...text].map(c => {
        const i = map.indexOf(c);
        return i >= 0 ? (outArr[i] || c) : c;
    }).join('');
}

export default {
    name: 'fancy',
    alias: ['aesthetic', 'fancytext', 'textfancy', 'styletext', 'styledtext'],
    category: 'fun',
    desc: 'Convert text to aesthetic/fancy Unicode styles',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        if (!args.length || args[0] === 'list') {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ ✨ *FANCY TEXT* ⌋
│
├─⊷ *Usage:* \`${PREFIX}fancy <style> <text>\`
├─⊷ Or: \`${PREFIX}fancy <text>\` (shows all)
│
├─⊷ *Styles:*
│  • bold • italic • script
│  • fraktur • double • vaporwave
│  • smallcaps
│
├─⊷ *Examples:*
│  \`${PREFIX}fancy bold Hello Foxy!\`
│  \`${PREFIX}fancy vaporwave vibes only\`
│  \`${PREFIX}fancy Hello World\` ← shows all styles
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const styleKeys = Object.keys(STYLES);
        let style = null;
        let textStart = 0;

        if (styleKeys.includes(args[0]?.toLowerCase())) {
            style = args[0].toLowerCase();
            textStart = 1;
        }

        const text = args.slice(textStart).join(' ');
        if (!text) return sock.sendMessage(chatId, { text: `❌ Provide text to convert.` }, { quoted: m });

        if (style) {
            const result = applyStyle(style, text);
            await sock.sendMessage(chatId, {
                text: `✨ *${STYLES[style].name}*\n\n${result}`
            }, { quoted: m });
        } else {
            // Show all styles
            let out = `✨ *Fancy Text: "${text}"*\n\n`;
            for (const [key, val] of Object.entries(STYLES)) {
                const converted = applyStyle(key, text);
                out += `*${val.name}:* ${converted}\n`;
            }
            await sock.sendMessage(chatId, { text: out.trim() }, { quoted: m });
        }
    }
};
