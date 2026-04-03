import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config file path
const CONFIG_FILE = path.join(process.cwd(), 'server', 'bot', 'bot_config.json');
const BACKUP_DIR = path.join(process.cwd(), 'server', 'bot', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Default config
const DEFAULT_CONFIG = {
    prefix: '.',
    mode: 'public',
    ownerNumber: '',
    botName: 'Foxy Bot',
    botBio: '🦊 Foxy Bot - Your WhatsApp Assistant'
};

// Load current config
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return { ...DEFAULT_CONFIG };
}

// Save config with backup
function saveConfig(newConfig) {
    try {
        // Create backup of current config
        if (fs.existsSync(CONFIG_FILE)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const backupPath = path.join(BACKUP_DIR, `bot_config_backup_${timestamp}.json`);
            fs.copyFileSync(CONFIG_FILE, backupPath);
            console.log(`💾 Config backed up to: ${backupPath}`);
        }
        
        // Save new config
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

export default {
    name: 'setbotname',
    alias: ['setname', 'botname', 'rename', 'foxyrename'],
    category: 'owner',
    description: 'Change the bot\'s name',
    ownerOnly: true,

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        // Owner check
        if (!jidManager.isOwner(m)) {
            await sock.sendMessage(chatId, {
                react: { text: "👑", key: m.key }
            });
            return;
        }

        const newName = args.join(' ').trim();

        // Show current name if no args
        if (!newName) {
            const config = loadConfig();
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *SET BOT NAME* 📝 ⧭─┐
│
├─⧭ *Current Name:*
│ • ${config.botName}
│
├─⧭ *Usage:*
│ ${PREFIX}setbotname <new name>
│
├─⧭ *Examples:*
│ • ${PREFIX}setbotname Foxy Bot
│ • ${PREFIX}setbotname Alpha Fox
│ • ${PREFIX}setbotname 🦊 FoxMaster
│
├─⧭ *Limits:*
│ • Max 30 characters
│ • Emojis allowed
│
└─⧭🦊`
            }, { quoted: m });
        }

        // Check length
        if (newName.length > 30) {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *NAME TOO LONG* ❌ ⧭─┐
│
├─⧭ *Length:* ${newName.length} chars
├─⧭ *Max:* 30 chars
│
│ Please use a shorter name.
│
└─⧭🦊`
            }, { quoted: m });
        }

        try {
            // Load current config
            const config = loadConfig();
            const oldName = config.botName;

            // Update config
            config.botName = newName;
            
            if (saveConfig(config)) {
                // Try to update profile name (if supported)
                try {
                    await sock.updateProfileName(newName);
                    console.log(`✅ Profile name updated to: ${newName}`);
                } catch (profileError) {
                    console.log('⚠️ Could not update profile name:', profileError.message);
                }

                // Success message
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ BOT NAME UPDATED* ⧭─┐
│
├─⧭ *Old Name:* ${oldName}
├─⧭ *New Name:* ${newName}
│
│ Foxy has a new identity!
│
└─⧭🦊`
                }, { quoted: m });

                // Add reaction
                await sock.sendMessage(chatId, {
                    react: { text: "✅", key: m.key }
                });

                console.log(`🦊 Bot name changed from "${oldName}" to "${newName}"`);
            } else {
                throw new Error('Failed to save config');
            }

        } catch (error) {
            console.error('Setbotname error:', error);
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${error.message}
│
└─⧭🦊`
            }, { quoted: m });

            await sock.sendMessage(chatId, {
                react: { text: "❌", key: m.key }
            });
        }
    }
};