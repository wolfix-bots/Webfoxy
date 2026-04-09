// menustyle.js — Switch the bot's menu display style
// Saves the selected style to foxy_settings.json
import fs from 'fs';

const SETTINGS_FILE = './data/foxy_settings.json';

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8')); } catch { return {}; }
}
function saveSettings(s) {
    try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2)); } catch {}
}

// All available style previews
const STYLES = {
    'default': {
        label: 'Default',
        emoji: '📋',
        desc: 'Categorized with borders',
        preview: (p) =>
`╭━━━━━━━━━━━━━━━━━━━━━╮
┃  🦊 *FOXY BOT*
╰━━━━━━━━━━━━━━━━━━━━━╯
╭─「 👥 *GROUP* 」
│ \`${p}tagall\`  \`${p}kick\`
╰──────────────────`
    },
    'compact': {
        label: 'Compact',
        emoji: '📌',
        desc: 'Minimal — commands only, no borders',
        preview: (p) =>
`🦊 *FOXY BOT*

👥 *GROUP*
${p}tagall • ${p}kick • ${p}promote

👑 *OWNER*
${p}settings • ${p}autobio`
    },
    'fancy': {
        label: 'Fancy',
        emoji: '✨',
        desc: 'Decorative style with emojis',
        preview: (p) =>
`┏━━━━⌈ 🦊 *FOXY BOT* ⌋━━━━┓
┃
┣━━⌈ 👥 GROUP ⌋
┃  ❯ ${p}tagall
┃  ❯ ${p}kick
┃
┗━━━━━━━━━━━━━━━━━━━━━┛`
    },
    'minimal': {
        label: 'Minimal',
        emoji: '🔹',
        desc: 'Clean, simple list',
        preview: (p) =>
`🦊 *FOXY BOT*
━━━━━━━━━━━

GROUP
 › ${p}tagall
 › ${p}kick`
    },
    'boxed': {
        label: 'Boxed',
        emoji: '📦',
        desc: 'Box-style borders',
        preview: (p) =>
`╔═══════════════════╗
║  🦊 *FOXY BOT*   ║
╠═══════════════════╣
║ 👥 GROUP          ║
║ ${p}tagall ${p}kick  ║
╚═══════════════════╝`
    },
    'numbered': {
        label: 'Numbered',
        emoji: '🔢',
        desc: 'Numbered command list',
        preview: (p) =>
`🦊 *FOXY BOT*

👥 *GROUP*
1. ${p}tagall
2. ${p}kick
3. ${p}promote`
    },
};

export default {
    name: 'menustyle',
    alias: ['menuformat', 'setmenu', 'changemenu'],
    category: 'owner',
    desc: 'Switch the menu display style',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const isOwner = extra?.isOwner?.() || false;
        if (!isOwner) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const settings = loadSettings();
        const current = settings.menustyle || 'default';
        const choice = args[0]?.toLowerCase();

        /* ── No arg: show all styles ── */
        if (!choice || choice === 'list' || choice === 'styles') {
            let text = `╭─⌈ 🎨 *MENU STYLES* ⌋\n`;
            text += `├─⊷ *Current:* ${current}\n│\n`;
            for (const [key, s] of Object.entries(STYLES)) {
                const active = key === current ? ' ◀ *ACTIVE*' : '';
                text += `├─ ${s.emoji} *${key}*${active}\n`;
                text += `│  ${s.desc}\n│\n`;
            }
            text += `├─⊷ *Usage:* \`${PREFIX}menustyle <name>\`\n`;
            text += `╰⊷ 🦊 Example: \`${PREFIX}menustyle fancy\``;
            return sock.sendMessage(chatId, { text }, { quoted: m });
        }

        /* ── Preview ── */
        if (choice === 'preview') {
            const styleName = args[1]?.toLowerCase() || current;
            const s = STYLES[styleName];
            if (!s) return sock.sendMessage(chatId, { text: `❌ Unknown style. Use \`${PREFIX}menustyle\` to see all styles.` }, { quoted: m });
            return sock.sendMessage(chatId, {
                text: `👁️ *Preview: ${s.label}*\n\n${s.preview(PREFIX)}`
            }, { quoted: m });
        }

        /* ── Set style ── */
        if (!STYLES[choice]) {
            const list = Object.keys(STYLES).join(', ');
            return sock.sendMessage(chatId, {
                text: `❌ Unknown style *${choice}*\n\nAvailable: ${list}\n\nUse \`${PREFIX}menustyle\` to see previews.`
            }, { quoted: m });
        }

        settings.menustyle = choice;
        saveSettings(settings);

        const s = STYLES[choice];
        return sock.sendMessage(chatId, {
            text:
`✅ *Menu Style Changed!*

${s.emoji} *Style:* ${s.label}
📝 *Description:* ${s.desc}

*Preview:*
${s.preview(PREFIX)}

Use \`${PREFIX}help\` to see your new menu.`
        }, { quoted: m });
    }
};
