export default {
    name: 'fancy',
    alias: ['fancytext', 'styletext', 'unicode', 'bold', 'italic'],
    category: 'tools',
    description: 'Convert text to fancy Unicode styles ✨',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const text = args.join(' ').trim();

        if (!text) {
            return sock.sendMessage(chatId, {
                text: `✨ Usage: ${PREFIX}fancy <your text>\n\nExample: ${PREFIX}fancy Hello World`
            }, { quoted: msg });
        }

        const styles = {
            '𝗕𝗼𝗹𝗱': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x1D400);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + 0x1D41A);
                if (code >= 48 && code <= 57) return String.fromCodePoint(code - 48 + 0x1D7CE);
                return c;
            }).join(''),
            '𝘐𝘵𝘢𝘭𝘪𝘤': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x1D434);
                if (code >= 97 && code <= 122) return c === 'h' ? '𝘩' : String.fromCodePoint(code - 97 + 0x1D44E);
                return c;
            }).join(''),
            '𝙱𝚘𝚕𝚍 𝙼𝚘𝚗𝚘': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x1D670);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + 0x1D68A);
                if (code >= 48 && code <= 57) return String.fromCodePoint(code - 48 + 0x1D7F6);
                return c;
            }).join(''),
            '𝔉𝔯𝔞𝔨𝔱𝔲𝔯': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x1D504);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + 0x1D51E);
                return c;
            }).join(''),
            '𝒮𝒸𝓇𝒾𝓅𝓉': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x1D49C);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + 0x1D4B6);
                return c;
            }).join(''),
            'Ⓒⓘⓡⓒⓛⓔ': t => t.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code - 65 + 0x24B6);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code - 97 + 0x24D0);
                if (code >= 49 && code <= 57) return String.fromCodePoint(code - 49 + 0x2460);
                return c;
            }).join(''),
            'F̲u̲l̲l̲ ̲U̲n̲d̲e̲r̲': t => t.split('').map(c => c + '\u0332').join(''),
            'F̶u̶l̶l̶ ̶S̶t̶r̶i̶k̶e̶': t => t.split('').map(c => c + '\u0336').join(''),
            'UPPERCASE': t => t.toUpperCase(),
            'lowercase': t => t.toLowerCase(),
            'ꜱᴍᴀʟʟ ᴄᴀᴘꜱ': t => t.toLowerCase().split('').map(c => {
                const sc = 'aʙcᴅeꜰɢʜɪᴊᴋʟᴍɴoᴘqʀꜱᴛᴜᴠᴡxyᴢ';
                const idx = 'abcdefghijklmnopqrstuvwxyz'.indexOf(c);
                return idx >= 0 ? sc[idx] : c;
            }).join('')
        };

        const lines = Object.entries(styles).map(([name, fn]) => `*${name}:* ${fn(text)}`);
        await sock.sendMessage(chatId, {
            text: `✨ *FANCY TEXT*\n\n${lines.join('\n\n')}`
        }, { quoted: msg });
    }
};
