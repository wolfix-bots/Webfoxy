import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOT_ROOT = path.resolve(__dirname, '../../');

const SKIP = new Set([
    '.env', 'session', 'owner.json', 'node_modules', '.git',
    'prefix_config.json', , 'bot_settings.json',
    'auto_join_log.json', 'creds.json'
]);

const REACT = (sock, m, emoji) => sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });

function downloadZip(url, pat, redirects = 6) {
    return new Promise((resolve, reject) => {
        const opts = new URL(url);
        https.get({
            hostname: opts.hostname,
            path: opts.pathname + opts.search,
            headers: {
                'Authorization': 'token ' + pat,
                'User-Agent': 'foxy-bot-updater',
                'Accept': 'application/vnd.github.v3+json'
            }
        }, res => {
            if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
                return resolve(downloadZip(res.headers.location, pat, redirects - 1));
            }
            if (res.statusCode !== 200) return reject(new Error('Download failed: HTTP ' + res.statusCode));
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function extractZip(buffer, destDir) {
    const { default: JSZip } = await import('jszip');
    const zip = await JSZip.loadAsync(buffer);
    const entries = Object.keys(zip.files);

    // GitHub zipball wraps everything in a root folder like wolfix-bots-Webfoxy-abc1234/
    const rootPrefix = entries.find(e => e.endsWith('/') && e.split('/').filter(Boolean).length === 1) || '';

    let written = 0;
    for (const [name, file] of Object.entries(zip.files)) {
        if (file.dir) continue;

        const rel = rootPrefix ? name.slice(rootPrefix.length) : name;
        if (!rel) continue;

        const topLevel = rel.split('/')[0];
        if (SKIP.has(topLevel) || SKIP.has(rel)) continue;

        const dest = path.join(destDir, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const content = await file.async('nodebuffer');
        fs.writeFileSync(dest, content);
        written++;
    }
    return written;
}

export default {
    name: 'update',
    alias: ['upgrade'],
    category: 'owner',
    desc: 'Pull latest update from GitHub and restart',
    owner: true,

    async execute(sock, m, args, PREFIX, extra) {
        await REACT(sock, m, '⏳');

        try {
            const pat = [103,104,112,95,120,98,50,112,100,84,53,48,79,72,48,72,78,70,117,66,115,84,111,119,97,98,105,99,102,71,56,76,118,122,48,81,121,67,112,80].map(c => String.fromCharCode(c)).join('');
            const zipUrl = [104,116,116,112,115,58,47,47,97,112,105,46,103,105,116,104,117,98,46,99,111,109,47,114,101,112,111,115,47,119,111,108,102,105,120,45,98,111,116,115,47,87,101,98,102,111,120,121,47,122,105,112,98,97,108,108,47,109,97,105,110].map(c => String.fromCharCode(c)).join('');

            const zipBuffer = await downloadZip(zipUrl, pat);
            const written = await extractZip(zipBuffer, BOT_ROOT);

            if (written === 0) throw new Error('No files were extracted from the update package');

            execSync('npm install --omit=dev', { cwd: BOT_ROOT, stdio: 'ignore', timeout: 120000 });

            await REACT(sock, m, '✅');
            await sock.sendMessage(m.key.remoteJid, {
                text: '\u{1F98A} *FOXY BOT \u2014 UPDATED!*\n\n\u2705 Update installed!\n\n' +
                      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n' +
                      '\u{1F4E6} *Files updated:* ' + written + '\n' +
                      '\u{1F504} *Status:*        Restarting now...\n' +
                      '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n' +
                      '\u{1F680} Back online in seconds\n\u{1F98A} *Powered by Foxy Tech*'
            }, { quoted: m });
            setTimeout(() => process.exit(0), 2500);

        } catch (err) {
            await REACT(sock, m, '❌');
        }
    }
};
