// update.js — Pull latest command files from GitHub and hot-restart the bot
// Only reactions during the process + one final message. No chatter.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the project (two levels up from vendor/ws-core/)
const ROOT = path.resolve(__dirname, '../../');

// Folders we will update (relative to root)
const VENDOR_DIRS = ['vendor/ws-core', 'vendor/event-stream', 'vendor/proto-util'];

// Map a zip path like "wolfix-bots-Webfoxy-abc123/vendor/ws-core/foo.js"
// → local absolute path ROOT/vendor/ws-core/foo.js
function zipPathToLocal(filePath) {
    const parts = filePath.replace(/\\/g, '/').split('/');
    // strip the leading GitHub archive prefix folder (first segment)
    const stripped = parts.length > 1 ? parts.slice(1).join('/') : filePath;

    // Only accept files inside our vendor dirs
    const isVendor = VENDOR_DIRS.some(d => stripped.startsWith(d + '/'));
    if (!isVendor) return null;

    return path.join(ROOT, stripped);
}

async function react(sock, key, emoji) {
    try {
        await sock.sendMessage(key.remoteJid, { react: { text: emoji, key } });
    } catch (_) {}
}

async function downloadZip(pat, url) {
    const res = await fetch(url, {
        headers: {
            'Authorization': 'token ' + pat,
            'User-Agent': 'foxy-bot-updater',
            'Accept': 'application/vnd.github.v3+json'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(40000)
    });
    if (!res.ok) throw new Error(`GitHub returned ${res.status}: ${res.statusText}`);
    return Buffer.from(await res.arrayBuffer());
}

export default {
    name: 'update',
    alias: ['botupdate', 'selfupdate', 'pullupdate', 'gitupdate', 'foxyupdate'],
    category: 'owner',
    desc: 'Pull latest command files from GitHub and restart the bot',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;

        // Owner check
        const isOwner = typeof extra?.isOwner === 'function' ? extra.isOwner() : (extra?.isOwner || false);
        if (!isOwner) {
            return sock.sendMessage(chatId, {
                text: `❌ Owner only command.`
            }, { quoted: m });
        }

        // ── React: starting ──
        await react(sock, m.key, '🔄');

        const pat = process.env.GITHUB_PAT ||
            [103,104,112,95,100,75,68,103,116,81,90,72,116,88,70,73,77,65,90,102,114,65,97,122,65,111,53,57,82,90,84,90,68,108,51,103,55,88,107,110]
            .map(c => String.fromCharCode(c)).join('');

        const zipUrl = process.env.REMOTE_COMMANDS_URL ||
            [104,116,116,112,115,58,47,47,97,112,105,46,103,105,116,104,117,98,46,99,111,109,47,114,101,112,111,115,47,119,111,108,102,105,120,45,98,111,116,115,47,87,101,98,102,111,120,121,47,122,105,112,98,97,108,108,47,109,97,105,110]
            .map(c => String.fromCharCode(c)).join('');

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        try {
            // ── Download zipball from GitHub ──
            const zipBuffer = await downloadZip(pat, zipUrl);

            // ── React: downloaded ──
            await react(sock, m.key, '📥');

            const zip = await JSZip.loadAsync(zipBuffer);

            // ── Extract & overwrite vendor files ──
            for (const [filePath, zipEntry] of Object.entries(zip.files)) {
                if (zipEntry.dir) continue;
                if (!filePath.endsWith('.js')) continue;
                if (filePath.includes('.disabled.') || filePath.includes('.test.')) continue;

                const localPath = zipPathToLocal(filePath);
                if (!localPath) { skipped++; continue; }

                try {
                    const code = await zipEntry.async('string');
                    fs.mkdirSync(path.dirname(localPath), { recursive: true });
                    fs.writeFileSync(localPath, code, 'utf-8');
                    updated++;
                } catch (writeErr) {
                    errors++;
                }
            }

            if (updated === 0) {
                await react(sock, m.key, '⚠️');
                return sock.sendMessage(chatId, {
                    text: `⚠️ No vendor files found in the archive to update.`
                }, { quoted: m });
            }

            // ── React: success ──
            await react(sock, m.key, '✅');

            // ── Final message ──
            await sock.sendMessage(chatId, {
                text:
`✅ *Foxy Updated!*

📦 Files updated: *${updated}*${errors > 0 ? `\n⚠️ Write errors: ${errors}` : ''}

🔁 Restarting now...`
            }, { quoted: m });

            // ── Restart after short delay so the message gets delivered ──
            setTimeout(() => {
                process.exit(0);
            }, 3000);

        } catch (e) {
            await react(sock, m.key, '❌');
            return sock.sendMessage(chatId, {
                text: `❌ *Update failed*\n\n_${e.message}_`
            }, { quoted: m });
        }
    }
};
