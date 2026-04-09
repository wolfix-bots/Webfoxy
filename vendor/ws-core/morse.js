// morse.js — Text to Morse code and vice versa
// Usage: .morse hello world  |  .unmorse .... . .-.. .-.. ---
const MORSE = {
    A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',
    I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',
    Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',
    Y:'-.--',Z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-',
    '5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
    '.':'.-.-.-',',':'--..--','?':'..--..','!':'-.-.--',
    '/':'-..-.','-':'-....-','_':'..--.-','@':'.--.-.','&':'.-...'
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k,v]) => [v,k]));

function toMorse(text) {
    return text.toUpperCase().split('').map(c => {
        if (c === ' ') return '/';
        return MORSE[c] || '?';
    }).join(' ');
}
function fromMorse(code) {
    return code.split(' / ').map(word =>
        word.split(' ').map(sym => REVERSE_MORSE[sym] || '?').join('')
    ).join(' ');
}

export default {
    name: 'morse',
    alias: ['morsecode', 'morseencode', 'morseconvert'],
    category: 'tool',
    desc: 'Convert text to Morse code and decode Morse back to text',
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(chatId, {
                text:
`╭─⌈ 📡 *MORSE CODE* ⌋
│
├─⊷ *Encode (text → morse):*
│  \`${PREFIX}morse Hello Foxy!\`
│
├─⊷ *Decode (morse → text):*
│  \`${PREFIX}morse decode .... . .-.. .-.. ---\`
│  \`${PREFIX}unmorse .... . .-.. .-.. ---\`
│
╰⊷ 🦊 Foxy`
            }, { quoted: m });
        }

        const sub = args[0]?.toLowerCase();
        let input, mode;

        if (sub === 'decode' || sub === 'd') {
            mode = 'decode';
            input = args.slice(1).join(' ');
        } else if (/^[.\-/ ]+$/.test(args.join(' '))) {
            mode = 'decode';
            input = args.join(' ');
        } else {
            mode = 'encode';
            input = args.join(' ');
        }

        if (!input) {
            return sock.sendMessage(chatId, { text: `❌ Provide text or morse code.` }, { quoted: m });
        }

        if (mode === 'encode') {
            const result = toMorse(input);
            await sock.sendMessage(chatId, {
                text:
`📡 *Morse Code*

📝 *Input:* ${input}
━━━━━━━━━━━━
⚡ *Morse:*
\`\`\`${result}\`\`\``
            }, { quoted: m });
        } else {
            const result = fromMorse(input);
            await sock.sendMessage(chatId, {
                text:
`📡 *Morse Decode*

⚡ *Morse:* \`${input}\`
━━━━━━━━━━━━
📝 *Text:* ${result}`
            }, { quoted: m });
        }
    }
};
