// autoreply.js — Keyword-triggered automatic replies
// Usage: .autoreply add <trigger> <response>  |  .autoreply list  |  .autoreply remove <trigger>
import fs from 'fs';

const FILE = './data/autoreply_rules.json';

function load() {
    try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
    return {};
}
function save(data) {
    try { fs.mkdirSync('./data', { recursive: true }); fs.writeFileSync(FILE, JSON.stringify(data, null, 2)); } catch {}
}

// Call this from index.js: autoreplyCheck(sock, m)
export function autoreplyCheck(sock, m) {
    try {
        const rules = load();
        if (!Object.keys(rules).length) return;
        const body = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase().trim();
        if (!body) return;
        const chatId = m.key.remoteJid;
        for (const [trigger, response] of Object.entries(rules)) {
            if (body.includes(trigger.toLowerCase())) {
                sock.sendMessage(chatId, { text: response }, { quoted: m }).catch(() => {});
                break; // Only first match
            }
        }
    } catch {}
}

export default {
    name: 'autoreply',
    alias: ['autoresp', 'autoresponse', 'setreply', 'keyword'],
    category: 'automation',
    desc: 'Set keyword-triggered automatic replies for any chat',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        if (!extra?.isOwner?.()) return sock.sendMessage(chatId, { text: '❌ Owner only.' }, { quoted: m });

        const reply = t => sock.sendMessage(chatId, { text: t }, { quoted: m });
        const sub = args[0]?.toLowerCase();
        const rules = load();

        if (!sub || sub === 'list' || sub === 'show') {
            const entries = Object.entries(rules);
            if (!entries.length) return reply(
`📋 *No auto-replies set*

*Usage:*
\`${PREFIX}autoreply add hello Hey there!\`
\`${PREFIX}autoreply add what's up I'm Foxy! 🦊\`
\`${PREFIX}autoreply list\`
\`${PREFIX}autoreply remove hello\``);

            let text = `📋 *Auto-Reply Rules (${entries.length})*\n\n`;
            entries.forEach(([trigger, response], i) => {
                text += `*${i + 1}.* 🗝 \`${trigger}\`\n   💬 ${response.slice(0, 60)}\n\n`;
            });
            text += `\`${PREFIX}autoreply remove <trigger>\` to delete`;
            return reply(text);
        }

        if (sub === 'add' || sub === 'set') {
            const trigger = args[1]?.toLowerCase();
            const response = args.slice(2).join(' ');
            if (!trigger || !response) return reply(`❌ Usage: \`${PREFIX}autoreply add <trigger> <response>\``);
            if (trigger.length > 50) return reply('❌ Trigger too long (max 50 chars).');
            if (response.length > 500) return reply('❌ Response too long (max 500 chars).');
            rules[trigger] = response;
            save(rules);
            return reply(`✅ Auto-reply added!\n\n🗝 Trigger: \`${trigger}\`\n💬 Response: ${response}`);
        }

        if (sub === 'remove' || sub === 'delete' || sub === 'del' || sub === 'rm') {
            const trigger = args[1]?.toLowerCase();
            if (!trigger) return reply(`❌ Usage: \`${PREFIX}autoreply remove <trigger>\``);
            if (!rules[trigger]) return reply(`❌ Trigger \`${trigger}\` not found.`);
            delete rules[trigger];
            save(rules);
            return reply(`🗑️ Auto-reply \`${trigger}\` removed.`);
        }

        if (sub === 'clear' || sub === 'clearall') {
            save({});
            return reply('🗑️ All auto-replies cleared.');
        }

        return reply(`❌ Unknown sub-command.\n*Options:* \`add\` \`list\` \`remove\` \`clear\``);
    }
};
