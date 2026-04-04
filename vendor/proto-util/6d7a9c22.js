import fs from 'fs';

const SETTINGS_FILE = './utils/antibadword.json';

function load() {
    try { return fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) : {}; }
    catch { return {}; }
}
function save(s) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); }

export default {
    name: 'antibadword',
    alias: ['antiswear', 'badword', 'noswear', 'wordfilter'],
    category: 'automation',
    description: 'Filter bad words in groups 🤬',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
        }

        const sub = args[0]?.toLowerCase();
        const settings = load();
        if (!settings[chatId]) settings[chatId] = { enabled: false, words: [] };

        if (sub === 'on') {
            settings[chatId].enabled = true;
            save(settings);
            return sock.sendMessage(chatId, {
                text: '🤬 *Anti-Badword ON*\nBad words will be deleted and the sender will be warned.'
            }, { quoted: msg });
        }

        if (sub === 'off') {
            settings[chatId].enabled = false;
            save(settings);
            return sock.sendMessage(chatId, {
                text: '✅ *Anti-Badword OFF*\nWord filter is now disabled.'
            }, { quoted: msg });
        }

        if (sub === 'add' && args[1]) {
            const word = args[1].toLowerCase();
            if (!settings[chatId].words.includes(word)) {
                settings[chatId].words.push(word);
                save(settings);
            }
            return sock.sendMessage(chatId, {
                text: `✅ Word *"${word}"* added to filter list.`
            }, { quoted: msg });
        }

        if (sub === 'remove' && args[1]) {
            const word = args[1].toLowerCase();
            settings[chatId].words = settings[chatId].words.filter(w => w !== word);
            save(settings);
            return sock.sendMessage(chatId, {
                text: `✅ Word *"${word}"* removed from filter list.`
            }, { quoted: msg });
        }

        if (sub === 'list') {
            const words = settings[chatId].words;
            return sock.sendMessage(chatId, {
                text: words.length
                    ? `📋 *Filtered Words:*\n${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`
                    : '📋 No words in filter list yet.'
            }, { quoted: msg });
        }

        if (sub === 'clear') {
            settings[chatId].words = [];
            save(settings);
            return sock.sendMessage(chatId, { text: '🗑️ Filter list cleared.' }, { quoted: msg });
        }

        const status = settings[chatId].enabled ? '✅ ON' : '❌ OFF';
        const wordCount = settings[chatId].words.length;
        await sock.sendMessage(chatId, {
            text: `🤬 *ANTI-BADWORD*\n\n` +
                  `Status: ${status}\n` +
                  `Words filtered: ${wordCount}\n\n` +
                  `*Usage:*\n` +
                  `${PREFIX}antibadword on/off\n` +
                  `${PREFIX}antibadword add <word>\n` +
                  `${PREFIX}antibadword remove <word>\n` +
                  `${PREFIX}antibadword list\n` +
                  `${PREFIX}antibadword clear`
        }, { quoted: msg });
    }
};
