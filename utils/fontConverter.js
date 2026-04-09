// ====== FONT CONVERTER UTILITY ======
// Converts ASCII text to Unicode font styles supported by WhatsApp

const FONTS = {
    normal: {
        name: 'Normal',
        emoji: '📝',
        desc: 'Default text'
    },
    bold: {
        name: 'Bold',
        emoji: '🔡',
        desc: '𝗕𝗼𝗹𝗱 𝘁𝗲𝘅𝘁',
        upper: [...'𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭'],
        lower: [...'𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇'],
        digit: [...'𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵']
    },
    italic: {
        name: 'Italic',
        emoji: '✍️',
        desc: '𝘐𝘵𝘢𝘭𝘪𝘤 𝘵𝘦𝘹𝘵',
        upper: [...'𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'],
        lower: [...'𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻']
    },
    bolditalic: {
        name: 'Bold Italic',
        emoji: '🖋️',
        desc: '𝙱𝚘𝚕𝚍 𝙸𝚝𝚊𝚕𝚒𝚌',
        upper: [...'𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'],
        lower: [...'𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣']
    },
    script: {
        name: 'Script',
        emoji: '📜',
        desc: '𝒮𝒸𝓇𝒾𝓅𝓉 𝓉𝑒𝓍𝓉',
        upper: [...'𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵'],
        lower: [...'𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏']
    },
    boldscript: {
        name: 'Bold Script',
        emoji: '🖊️',
        desc: '𝓑𝓸𝓵𝓭 𝓢𝓬𝓻𝓲𝓹𝓽',
        upper: [...'𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'],
        lower: [...'𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃']
    },
    fraktur: {
        name: 'Fraktur',
        emoji: '🏰',
        desc: '𝔉𝔯𝔞𝔨𝔱𝔲𝔯 𝔱𝔢𝔵𝔱',
        upper: [...'𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ'],
        lower: [...'𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷']
    },
    mono: {
        name: 'Monospace',
        emoji: '💻',
        desc: '𝙼𝚘𝚗𝚘𝚜𝚙𝚊𝚌𝚎',
        upper: [...'𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'],
        lower: [...'𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'],
        digit: [...'𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿']
    },
    double: {
        name: 'Double-Struck',
        emoji: '🔲',
        desc: '𝔻𝕠𝕦𝕓𝕝𝕖 𝕊𝕥𝕣𝕦𝕔𝕜',
        upper: [...'𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ'],
        lower: [...'𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫'],
        digit: [...'𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡']
    }
};

const UPPER = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
const LOWER = [...'abcdefghijklmnopqrstuvwxyz'];
const DIGIT = [...'0123456789'];

export function convertFont(text, fontName) {
    if (!fontName || fontName === 'normal') return text;
    const font = FONTS[fontName];
    if (!font || !font.upper) return text;

    return [...text].map(ch => {
        const ui = UPPER.indexOf(ch);
        if (ui !== -1 && font.upper[ui]) return font.upper[ui];
        const li = LOWER.indexOf(ch);
        if (li !== -1 && font.lower && font.lower[li]) return font.lower[li];
        const di = DIGIT.indexOf(ch);
        if (di !== -1 && font.digit && font.digit[di]) return font.digit[di];
        return ch;
    }).join('');
}

export function applyFontToMessage(msg, fontName) {
    if (!fontName || fontName === 'normal') return msg;
    if (typeof msg !== 'object' || !msg) return msg;

    const patched = { ...msg };

    if (typeof patched.text === 'string') {
        patched.text = convertFont(patched.text, fontName);
    }

    if (patched.caption && typeof patched.caption === 'string') {
        patched.caption = convertFont(patched.caption, fontName);
    }

    return patched;
}

export { FONTS };
