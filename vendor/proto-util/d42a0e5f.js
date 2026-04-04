import fs from 'fs';

const SETTINGS_FILE = './utils/antispam.json';

function load() {
    try { return fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) : {}; }
    catch { return {}; }
}
function save(s) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); }

export default {
    name: 'antispam',
    alias: ['antiflood', 'nospam', 'floodprotect'],
    category: 'automation',
    description: 'Detect and warn message spammers 🚫',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const sub = args[0]?.toLowerCase();
        const settings = load();
        const scope = isGroup ? chatId : 'private';

        if (sub === 'on') {
            settings[scope] = true;
            save(settings);
            return sock.sendMessage(chatId, {
                text: `🚫 *Anti-Spam ON*\nUsers sending ${settings.limit || 7}+ messages in 10s will be warned.`
            }, { quoted: msg });
        }

        if (sub === 'off') {
            settings[scope] = false;
            save(settings);
            return sock.sendMessage(chatId, {
                text: '✅ *Anti-Spam OFF*\nFlood protection disabled.'
            }, { quoted: msg });
        }

        if (sub === 'limit' && args[1] && !isNaN(args[1])) {
            settings.limit = parseInt(args[1]);
            save(settings);
            return sock.sendMessage(chatId, {
                text: `✅ Spam limit set to *${settings.limit}* messages per 10 seconds.`
            }, { quoted: msg });
        }

        const enabled = settings[scope] ? '✅ ON' : '❌ OFF';
        await sock.sendMessage(chatId, {
            text: `🚫 *ANTI-SPAM*\n\n` +
                  `Status: ${enabled}\n` +
                  `Limit: ${settings.limit || 7} msgs / 10s\n\n` +
                  `*Usage:*\n` +
                  `${PREFIX}antispam on/off\n` +
                  `${PREFIX}antispam limit <number>`
        }, { quoted: msg });
    }
};
