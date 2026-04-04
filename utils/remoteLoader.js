import axios from 'axios';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TMP_DIR = path.resolve(__dirname, '../tmp_commands');

function clearTmpDir() {
    if (fs.existsSync(TMP_DIR)) fs.rmSync(TMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TMP_DIR, { recursive: true });
}

export async function loadCommandsRemotely(commands, commandCategories, log) {
    const pat = process.env.GITHUB_PAT || [103,104,112,95,120,98,50,112,100,84,53,48,79,72,48,72,78,70,117,66,115,84,111,119,97,98,105,99,102,71,56,76,118,122,48,81,121,67,112,80].map(c=>String.fromCharCode(c)).join('');
    const url = process.env.REMOTE_COMMANDS_URL || [104,116,116,112,115,58,47,47,97,112,105,46,103,105,116,104,117,98,46,99,111,109,47,114,101,112,111,115,47,119,111,108,102,105,120,45,98,111,116,115,47,87,101,98,102,111,120,121,47,122,105,112,98,97,108,108,47,109,97,105,110].map(c=>String.fromCharCode(c)).join('');

    try {
        log?.info?.('🌐 Fetching commands from GitHub...');

        const response = await axios.get(url, {
            headers: {
                'Authorization': 'token ' + pat,
                'User-Agent': 'foxy-bot-loader',
                'Accept': 'application/vnd.github.v3+json'
            },
            responseType: 'arraybuffer',
            maxRedirects: 10,
            timeout: 30000
        });

        const zip = await JSZip.loadAsync(response.data);
        clearTmpDir();

        let loaded = 0;

        for (const [filePath, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir || !filePath.endsWith('.js') || filePath.includes('.disabled.')) continue;

            try {
                // Strip the GitHub prefix folder (e.g. "wolfix-bots-Webfoxy-abc1234/")
                const parts = filePath.replace(/\\/g, '/').split('/');
                const stripped = parts.length > 1 ? parts.slice(1).join('/') : filePath;
                const category = stripped.includes('/') ? stripped.split('/')[0] : 'general';

                const code = await zipEntry.async('string');
                const destPath = path.join(TMP_DIR, stripped);
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                fs.writeFileSync(destPath, code, 'utf-8');

                const commandModule = await import('file://' + destPath);
                const command = commandModule.default || commandModule;

                if (command && command.name) {
                    command.category = category;
                    commands.set(command.name.toLowerCase(), command);

                    if (!commandCategories.has(category)) commandCategories.set(category, []);
                    commandCategories.get(category).push(command.name);

                    if (Array.isArray(command.alias)) {
                        command.alias.forEach(alias => commands.set(alias.toLowerCase(), command));
                    }

                    loaded++;
                }
            } catch (err) {
                log?.error?.('Failed to load ' + filePath + ': ' + err.message);
            }
        }

        log?.success?.('✅ ' + loaded + ' commands loaded from GitHub');
        return loaded;

    } catch (err) {
        log?.error?.('❌ GitHub loader failed: ' + err.message);
        return 0;
    }
}
