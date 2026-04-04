import fs from 'fs';

const SETTINGS_FILE = './utils/anticall.json';

function loadSettings() {
    try {
        return fs.existsSync(SETTINGS_FILE) ? JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) : { enabled: false, notify: true };
    } catch { return { enabled: false, notify: true }; }
}

function saveSettings(s) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

export default {
    name: 'anticall',
    alias: ['nocall', 'blockCall', 'callblock'],
    category: 'automation',
    description: 'Auto-decline incoming calls 📵',

    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sub = args[0]?.toLowerCase();
        const settings = loadSettings();

        if (sub === 'on') {
            settings.enabled = true;
            saveSettings(settings);
            return sock.sendMessage(chatId, {
                text: '📵 *Anti-Call ON*\nAll incoming calls will be declined automatically.'
            }, { quoted: msg });
        }

        if (sub === 'off') {
            settings.enabled = false;
            saveSettings(settings);
            return sock.sendMessage(chatId, {
                text: '✅ *Anti-Call OFF*\nCalls will no longer be auto-declined.'
            }, { quoted: msg });
        }

        if (sub === 'notify') {
            settings.notify = !settings.notify;
            saveSettings(settings);
            return sock.sendMessage(chatId, {
                text: `🔔 *Call Notification:* ${settings.notify ? 'ON — caller will be notified' : 'OFF — silent decline'}`
            }, { quoted: msg });
        }

        if (sub === 'msg' && args.slice(1).length) {
            settings.message = args.slice(1).join(' ');
            saveSettings(settings);
            return sock.sendMessage(chatId, {
                text: `✏️ *Decline message set:*\n"${settings.message}"`
            }, { quoted: msg });
        }

        await sock.sendMessage(chatId, {
            text: `📵 *ANTI-CALL*\n\n` +
                  `Status: ${settings.enabled ? '✅ ON' : '❌ OFF'}\n` +
                  `Notify caller: ${settings.notify ? '✅ Yes' : '❌ No'}\n` +
                  `Decline message: "${settings.message || 'default'}"\n\n` +
                  `*Usage:*\n` +
                  `${PREFIX}anticall on — enable\n` +
                  `${PREFIX}anticall off — disable\n` +
                  `${PREFIX}anticall notify — toggle caller notification\n` +
                  `${PREFIX}anticall msg <text> — set custom decline message`
        }, { quoted: msg });
    }
};
