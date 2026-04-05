export default {
    name: 'setfont',
    alias: ['fontset', 'botfont'],
    category: 'owner',
    ownerOnly: true,
    desc: 'Set or reset the global font for all bot responses',

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { setFont, getCurrentFont, FONT_NAMES } = extra;

        const TOTAL = 12;
        const LINE = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

        // Helper — preview sample in font id (recomputed here so no circular dep)
        function mathFont(text, up, lo, dg) {
            return [...text].map(c => {
                const n = c.codePointAt(0);
                if (n >= 65 && n <= 90 && up) return String.fromCodePoint(up + n - 65);
                if (n >= 97 && n <= 122 && lo) return String.fromCodePoint(lo + n - 97);
                if (n >= 48 && n <= 57 && dg) return String.fromCodePoint(dg + n - 48);
                return c;
            }).join('');
        }
        const PREVIEWS = {
            1:  t => mathFont(t, 0x1D400, 0x1D41A, 0x1D7CE),
            2:  t => mathFont(t, 0x1D434, 0x1D44E, null),
            3:  t => mathFont(t, 0x1D468, 0x1D482, null),
            4:  t => mathFont(t, 0x1D49C, 0x1D4B6, null),
            5:  t => mathFont(t, 0x1D4D0, 0x1D4EA, null),
            6:  t => mathFont(t, 0x1D504, 0x1D51E, null),
            7:  t => mathFont(t, 0x1D538, 0x1D552, 0x1D7D8),
            8:  t => mathFont(t, 0x1D5A0, 0x1D5BA, 0x1D7E2),
            9:  t => mathFont(t, 0x1D5D4, 0x1D5EE, 0x1D7EC),
            10: t => mathFont(t, 0x1D608, 0x1D622, null),
            11: t => mathFont(t, 0x1D63C, 0x1D656, null),
            12: t => mathFont(t, 0x1D670, 0x1D68A, 0x1D7F6),
        };

        const currentId = getCurrentFont ? getCurrentFont() : 0;
        const input = (args[0] || '').toLowerCase();

        // No args — show menu
        if (!input) {
            const rows = Object.entries(FONT_NAMES || {}).map(([id, name]) => {
                const sample = PREVIEWS[id] ? PREVIEWS[id]('Foxy Bot') : 'Foxy Bot';
                const active = Number(id) === currentId ? ' \u2b50' : '';
                return id + '. *' + name + '*' + active + '\n   ' + sample;
            }).join('\n\n');

            const current = currentId === 0
                ? 'Default (no font)'
                : (FONT_NAMES[currentId] || 'Unknown');

            return sock.sendMessage(chatId, {
                text:
'\u{1F98A} *BOT FONT SETTINGS*\n\n' +
LINE + '\n' +
'*Current font:* ' + current + '\n' +
LINE + '\n\n' +
rows + '\n\n' +
LINE + '\n' +
'*Set:*   ' + (PREFIX||'') + 'setfont <1-' + TOTAL + '>\n' +
'*Reset:* ' + (PREFIX||'') + 'setfont reset\n' +
LINE
            }, { quoted: m });
        }

        // Reset
        if (input === 'reset' || input === '0' || input === 'none' || input === 'default') {
            if (setFont) setFont(0);
            return sock.sendMessage(chatId, {
                text:
'\u{1F98A} *FONT RESET*\n\n' +
LINE + '\n' +
'\u2705 Bot font reset to *Default*\n' +
'All responses are now in normal text.\n' +
LINE
            }, { quoted: m });
        }

        // Set font by number
        const id = parseInt(input);
        if (isNaN(id) || id < 1 || id > TOTAL) {
            return sock.sendMessage(chatId, {
                text: 'Invalid option. Use 1-' + TOTAL + ' or "reset".\nType ' + (PREFIX||'') + 'setfont to see the menu.'
            }, { quoted: m });
        }

        if (setFont) setFont(id);
        const name = (FONT_NAMES && FONT_NAMES[id]) || ('Font ' + id);
        const preview = PREVIEWS[id] ? PREVIEWS[id]('Foxy Bot is now using ' + name + ' font!') : '';

        return sock.sendMessage(chatId, {
            text:
'\u{1F98A} *FONT CHANGED*\n\n' +
LINE + '\n' +
'\u2705 Font set to *' + name + '*\n\n' +
'Preview:\n' + preview + '\n' +
LINE + '\n' +
'Every bot response will now use this style.\n' +
'Type ' + (PREFIX||'') + 'setfont reset to go back to normal.'
        }, { quoted: m });
    }
};