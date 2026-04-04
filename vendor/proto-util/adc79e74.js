import fs from 'fs';

const SETTINGS_FILE = './utils/antilink.json';

function load() {
    try { return fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) : {}; }
    catch { return {}; }
}
function save(s) { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); }

export default {
    name: 'antilink',
    alias: ['antlink', 'nolink', 'linkblock'],
    category: 'automation',
    description: 'Block WhatsApp invite links in groups 🔗',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, { text: '❌ This command only works in groups.' }, { quoted: msg });
        }

        const sub = args[0]?.toLowerCase();
        const settings = load();

        if (sub === 'on') {
            settings[chatId] = true;
            save(settings);
            return sock.sendMessage(chatId, {
                text: '🔗 *Anti-Link ON*\nWhatsApp group invite links will be deleted automatically.\nAdmins and owner are exempt.'
            }, { quoted: msg });
        }

        if (sub === 'off') {
            settings[chatId] = false;
            save(settings);
            return sock.sendMessage(chatId, {
                text: '✅ *Anti-Link OFF*\nGroup links are now allowed.'
            }, { quoted: msg });
        }

        const status = settings[chatId] ? '✅ ON' : '❌ OFF';
        await sock.sendMessage(chatId, {
            text: `🔗 *ANTI-LINK*\n\nStatus: ${status}\n\n*Usage:*\n${PREFIX}antilink on — enable\n${PREFIX}antilink off — disable`
        }, { quoted: msg });
    }
};
