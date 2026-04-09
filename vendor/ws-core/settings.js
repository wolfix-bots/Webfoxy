import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

const SETTINGS_FILE = path.join(ROOT, 'data', 'foxy_settings.json');

const DEFAULTS = {
    autobio: false,
    chatbot: false,
    antibug: false,
    autotype: false,
    autofont: false,
    antiedit: false,
    menustyle: 'default',
    autoreact: false,
    autoblock: false,
    autorecord: false,
    antidelete: false,
    alwaysonline: false,
    statusantidelete: false,
    antiviewonce: false,
    autosavestatus: false,
    chatbotMode: 'group',
    antisticker: 'per-group',
    autolike: false,
    autoview: false,
    botname: 'FOXY BOT',
    ownername: '',
    watermark: '🦊 Powered by Foxy Tech',
    author: '',
    packname: 'Foxy MD',
    timezone: 'UTC',
    contextlink: '',
    menuimage: '',
    anticallmsg: 'Sorry, I am busy right now. Send a message instead 🦊',
    warnLimit: 3,
    statusemoji: '🦊',
    autorecordtype: false
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_FILE)) {
            return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')) };
        }
    } catch {}
    return { ...DEFAULTS };
}

function saveSettings(data) {
    try {
        fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
    } catch {}
}

function readJson(filePath, fallback = {}) {
    try {
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch {}
    return fallback;
}

function flag(val) {
    if (val === true || val === 'on' || val === 'ON') return 'ON';
    if (val === false || val === 'off' || val === 'OFF') return 'OFF';
    return String(val);
}

export default {
    name: 'settings',
    alias: ['setting', 'config', 'botsettings'],
    category: 'owner',
    desc: 'View and manage all bot settings',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || extra?.jidManager?.isOwner?.(m) || false;

        if (!isOwner) {
            return sock.sendMessage(chatId, {
                text: '❌ *Owner only command!*'
            }, { quoted: m });
        }

        const settings = loadSettings();

        // Read prefix
        const prefixCfg = readJson(path.join(ROOT, 'prefix_config.json'));
        const prefix = prefixCfg.prefix || extra?.getCurrentPrefix?.() || PREFIX || '.';

        // Read mode
        const modeCfg = readJson(path.join(ROOT, 'bot_mode.json'));
        const mode = modeCfg.mode || extra?.BOT_MODE || 'public';

        // Read autoread
        const autoreadCfg = readJson(path.join(ROOT, 'utils', 'autoread_settings.json'));
        const autoread = autoreadCfg.enabled ?? false;

        // Read autoreactstatus
        const reactStatusCfg = readJson(path.join(ROOT, 'data', 'autoReactConfig.json'));
        const autoreactstatus = reactStatusCfg.enabled ?? false;

        // Read autoviewstatus
        const viewStatusCfg = readJson(path.join(ROOT, 'data', 'autoViewConfig.json'));
        const autoviewstatus = viewStatusCfg.enabled ?? false;

        // Read anticall
        const anticallCfg = readJson(path.join(ROOT, 'utils', 'anticall.json'));
        const anticall = anticallCfg.enabled ?? false;

        // Read owner info
        const ownerCfg = readJson(path.join(ROOT, 'utils', 'owner.json'));
        const ownernumber = ownerCfg.ownerNumber || ownerCfg.cleanNumber || extra?.OWNER_NUMBER || 'Not set';
        const ownername = settings.ownername || ownerCfg.name || 'Not set';
        const botname = settings.botname || extra?.BOT_NAME || 'FOXY BOT';

        // Handle set/toggle sub-commands: .settings <key> <value>
        if (args.length >= 2) {
            const key = args[0].toLowerCase();
            const val = args[1].toLowerCase();
            const boolVal = val === 'on' || val === 'true' || val === '1';

            const boolKeys = ['autobio','chatbot','antibug','autotype','autofont','antiedit',
                              'autoreact','autoblock','autorecord','antidelete','alwaysonline',
                              'statusantidelete','antiviewonce','autosavestatus','autolike','autoview',
                              'autorecordtype'];
            const strKeys  = ['menustyle','chatbotMode','antisticker','botname','ownername',
                               'watermark','author','packname','timezone','contextlink','menuimage',
                               'anticallmsg','statusemoji'];

            if (boolKeys.includes(key)) {
                settings[key] = boolVal;
                saveSettings(settings);
                return sock.sendMessage(chatId, {
                    text: `✅ *${key}* set to *${boolVal ? 'ON' : 'OFF'}*`
                }, { quoted: m });
            }

            if (strKeys.includes(key)) {
                settings[key] = args.slice(1).join(' ');
                saveSettings(settings);
                return sock.sendMessage(chatId, {
                    text: `✅ *${key}* set to *${settings[key]}*`
                }, { quoted: m });
            }

            return sock.sendMessage(chatId, {
                text: `❌ Unknown setting: *${key}*\n\nUse *${PREFIX}settings* to see all settings.`
            }, { quoted: m });
        }

        const LINE = '━━━━━━━━━━━━━━━━━━━━━━━';

        const text =
`⚙️ *Current Bot Settings:*

❇️ *prefix*: ${prefix}
❇️ *mode*: ${mode}
❇️ *autobio*: ${flag(settings.autobio)}
❇️ *anticall*: ${flag(anticall)}
❇️ *chatbot*: ${flag(settings.chatbot)}
❇️ *antibug*: ${flag(settings.antibug)}
❇️ *autotype*: ${flag(settings.autotype)}
❇️ *autoread*: ${flag(autoread)}
❇️ *autofont*: ${flag(settings.autofont)}
❇️ *antiedit*: ${flag(settings.antiedit)}
❇️ *menustyle*: ${settings.menustyle}
❇️ *autoreact*: ${flag(settings.autoreact)}
❇️ *autoblock*: ${flag(settings.autoblock)}
❇️ *autorecord*: ${flag(settings.autorecord)}
❇️ *antidelete*: ${flag(settings.antidelete)}
❇️ *alwaysonline*: ${flag(settings.alwaysonline)}
❇️ *autoviewstatus*: ${flag(autoviewstatus)}
❇️ *autoreactstatus*: ${flag(autoreactstatus)}
❇️ *autorecordtype*: ${flag(settings.autorecordtype)}
❇️ *statusantidelete*: ${flag(settings.statusantidelete)}
❇️ *antiviewonce*: ${flag(settings.antiviewonce)}
❇️ *autosavestatus*: ${flag(settings.autosavestatus)}
❇️ *chatbotMode*: ${settings.chatbotMode}
❇️ *antisticker*: ${settings.antisticker}
❇️ *autolike*: ${flag(settings.autolike)}
❇️ *autoview*: ${flag(settings.autoview)}

❇️ *botname*: ${botname}
❇️ *ownername*: ${ownername}
❇️ *ownernumber*: ${ownernumber}
❇️ *statusemoji*: ${settings.statusemoji}
❇️ *watermark*: ${settings.watermark}
❇️ *author*: ${settings.author}
❇️ *packname*: ${settings.packname}
❇️ *timezone*: ${settings.timezone}
❇️ *contextlink*: ${settings.contextlink || '(not set)'}
❇️ *menuimage*: ${settings.menuimage || '(not set)'}
❇️ *anticallmsg*: ${settings.anticallmsg}
❇️ *warnLimit*: ${settings.warnLimit}

${LINE}
💡 *Usage:* ${PREFIX}settings <key> <value>
📌 *Example:* ${PREFIX}settings alwaysonline off
📌 *Example:* ${PREFIX}settings botname FOXY BOT`;

        await sock.sendMessage(chatId, { text }, { quoted: m });
    }
};
