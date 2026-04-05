export default {
    name: 'font',
    alias: ['setfont', 'fonts', 'textfont'],
    category: 'fun',
    desc: 'Convert text into stylish WhatsApp fonts',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;

        // Convert text using code-point arithmetic — zero literal 4-byte chars in source
        function toMath(text, upOff, loOff, dgOff) {
            return [...text].map(c => {
                const n = c.codePointAt(0);
                if (n >= 65 && n <= 90 && upOff) return String.fromCodePoint(upOff + n - 65);
                if (n >= 97 && n <= 122 && loOff) return String.fromCodePoint(loOff + n - 97);
                if (n >= 48 && n <= 57 && dgOff) return String.fromCodePoint(dgOff + n - 48);
                return c;
            }).join('');
        }

        function toBubble(text) {
            return [...text].map(c => {
                const n = c.codePointAt(0);
                if (n >= 65 && n <= 90) return String.fromCodePoint(0x24B6 + n - 65);
                if (n >= 97 && n <= 122) return String.fromCodePoint(0x24D0 + n - 97);
                if (n >= 49 && n <= 57) return String.fromCodePoint(0x2460 + n - 49);
                if (n === 48) return String.fromCodePoint(0x24EA);
                return c;
            }).join('');
        }

        function toWide(text) {
            return [...text].map(c => {
                const n = c.codePointAt(0);
                if (n >= 65 && n <= 90) return String.fromCodePoint(0xFF21 + n - 65);
                if (n >= 97 && n <= 122) return String.fromCodePoint(0xFF41 + n - 97);
                if (n >= 48 && n <= 57) return String.fromCodePoint(0xFF10 + n - 48);
                return c + ' ';
            }).join('');
        }

        function toStrike(text) {
            return [...text].map(c => c === ' ' ? c : c + '\u0336').join('');
        }

        function toUnder(text) {
            return [...text].map(c => c === ' ' ? c : c + '\u0332').join('');
        }

        const FONTS = [
            { id: 1,  name: 'Bold',              fn: t => toMath(t, 0x1D400, 0x1D41A, 0x1D7CE) },
            { id: 2,  name: 'Italic',             fn: t => toMath(t, 0x1D434, 0x1D44E, null)    },
            { id: 3,  name: 'Bold Italic',        fn: t => toMath(t, 0x1D468, 0x1D482, null)    },
            { id: 4,  name: 'Script',             fn: t => toMath(t, 0x1D49C, 0x1D4B6, null)    },
            { id: 5,  name: 'Bold Script',        fn: t => toMath(t, 0x1D4D0, 0x1D4EA, null)    },
            { id: 6,  name: 'Fraktur',            fn: t => toMath(t, 0x1D504, 0x1D51E, null)    },
            { id: 7,  name: 'Double Struck',      fn: t => toMath(t, 0x1D538, 0x1D552, 0x1D7D8) },
            { id: 8,  name: 'Sans Serif',         fn: t => toMath(t, 0x1D5A0, 0x1D5BA, 0x1D7E2) },
            { id: 9,  name: 'Sans Bold',          fn: t => toMath(t, 0x1D5D4, 0x1D5EE, 0x1D7EC) },
            { id: 10, name: 'Sans Italic',        fn: t => toMath(t, 0x1D608, 0x1D622, null)    },
            { id: 11, name: 'Sans Bold Italic',   fn: t => toMath(t, 0x1D63C, 0x1D656, null)    },
            { id: 12, name: 'Monospace',          fn: t => toMath(t, 0x1D670, 0x1D68A, 0x1D7F6) },
            { id: 13, name: 'Bubble',             fn: t => toBubble(t)                           },
            { id: 14, name: 'Fullwidth',          fn: t => toWide(t)                             },
            { id: 15, name: 'Strikethrough',      fn: t => toStrike(t)                           },
            { id: 16, name: 'Underline',          fn: t => toUnder(t)                            },
        ];

        const SAMPLE = 'Foxy Bot';

        // No args — show font menu
        if (!args[0]) {
            const menu = FONTS.map(f =>
                f.id + '. *' + f.name + '*\n   ' + f.fn(SAMPLE)
            ).join('\n\n');

            return sock.sendMessage(chatId, {
                text:
'\u{1F98A} *FONT CONVERTER*\n\n' +
'Choose a style:\n\n' + menu + '\n\n' +
'*Usage:* ' + (PREFIX||'') + 'font <number> <text>\n' +
'*Example:* ' + (PREFIX||'') + 'font 1 Hello World'
            }, { quoted: m });
        }

        const num = parseInt(args[0]);
        const text = args.slice(1).join(' ');

        // Show menu if no text provided
        if (!text) {
            const font = FONTS.find(f => f.id === num);
            if (!font) {
                return sock.sendMessage(chatId, {
                    text: 'Invalid font number. Use ' + (PREFIX||'') + 'font to see options.'
                }, { quoted: m });
            }
            return sock.sendMessage(chatId, {
                text: '*' + font.name + ' font — send text after the number*\n\nExample: ' + (PREFIX||'') + 'font ' + num + ' Hello World'
            }, { quoted: m });
        }

        const font = FONTS.find(f => f.id === num);
        if (!font) {
            return sock.sendMessage(chatId, {
                text: 'Font *' + num + '* not found. Use ' + (PREFIX||'') + 'font to see all ' + FONTS.length + ' options.'
            }, { quoted: m });
        }

        const converted = font.fn(text);
        return sock.sendMessage(chatId, {
            text: '*' + font.name + ':*\n' + converted
        }, { quoted: m });
    }
};