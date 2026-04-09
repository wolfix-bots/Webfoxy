// anticall.js — Manage anticall settings (on/off, custom message, notify toggle)
import fs from 'fs';

const CONFIG_FILE = './utils/anticall.json';

function load() {
    try {
        if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch {}
    return { enabled: false, notify: true, message: '📵 This bot does not accept calls. Your call has been rejected automatically.' };
}

function save(cfg) {
    try { fs.mkdirSync('./utils', { recursive: true }); fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2)); } catch {}
}

export default {
    name: 'anticall',
    alias: ['blockcall', 'callblock', 'rejectcall'],
    category: 'owner',
    desc: 'Manage anticall — block all incoming calls with a custom message',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const cfg = load();
        const sub = (args[0] || '').toLowerCase();
        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });

        /* ── Status / help ── */
        if (!sub || sub === 'status' || sub === 'info') {
            return reply(
`╭─⌈ 📵 *ANTICALL* ⌋
├─⊷ *Status:* ${cfg.enabled ? '✅ ON' : '❌ OFF'}
├─⊷ *Notify Caller:* ${cfg.notify ? '✅ YES' : '❌ NO'}
├─⊷ *Message:*
│  ${cfg.message}
│
├─⊷ *Commands:*
│  \`${PREFIX}anticall on\` — Enable
│  \`${PREFIX}anticall off\` — Disable
│  \`${PREFIX}anticall msg <text>\` — Set message
│  \`${PREFIX}anticall notify on/off\` — Toggle notify
│  \`${PREFIX}anticall reset\` — Reset to default
│
╰⊷ 🦊 Foxy`);
        }

        /* ── ON ── */
        if (sub === 'on' || sub === 'enable') {
            cfg.enabled = true;
            save(cfg);
            return reply(`✅ *Anticall ENABLED!*\n\nAll incoming calls will be rejected.\n📝 *Message sent to caller:*\n${cfg.message}`);
        }

        /* ── OFF ── */
        if (sub === 'off' || sub === 'disable') {
            cfg.enabled = false;
            save(cfg);
            return reply(`❌ *Anticall DISABLED!*\n\nThe bot will no longer reject calls.`);
        }

        /* ── SET MESSAGE ── */
        if (sub === 'msg' || sub === 'message' || sub === 'setmsg') {
            const newMsg = args.slice(1).join(' ');
            if (!newMsg) return reply(`❌ Provide a message.\n*Usage:* \`${PREFIX}anticall msg Sorry, I don't take calls!\``);
            cfg.message = newMsg;
            save(cfg);
            return reply(`✅ *Anticall message updated!*\n\n📝 *New message:*\n${cfg.message}`);
        }

        /* ── NOTIFY TOGGLE ── */
        if (sub === 'notify') {
            const opt = (args[1] || '').toLowerCase();
            if (opt === 'on' || opt === 'enable') {
                cfg.notify = true;
                save(cfg);
                return reply(`✅ *Notify caller:* ON\n\nThe bot will send a message when rejecting a call.`);
            }
            if (opt === 'off' || opt === 'disable') {
                cfg.notify = false;
                save(cfg);
                return reply(`❌ *Notify caller:* OFF\n\nCalls will be silently rejected.`);
            }
            return reply(`*Notify caller:* ${cfg.notify ? '✅ ON' : '❌ OFF'}\n\nUsage: \`${PREFIX}anticall notify on/off\``);
        }

        /* ── RESET ── */
        if (sub === 'reset') {
            cfg.message = '📵 This bot does not accept calls. Your call has been rejected automatically.';
            save(cfg);
            return reply(`✅ *Anticall message reset to default.*`);
        }

        return reply(`❓ Unknown subcommand. Use \`${PREFIX}anticall\` for help.`);
    }
};
