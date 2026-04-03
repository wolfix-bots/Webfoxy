import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MODE_FILE = path.join(__dirname, '../../bot_mode.json');

export default {
    name: 'mode',
    alias: ['botmode', 'setmode'],
    category: 'system',
    description: 'Change bot operating mode',
    ownerOnly: true,
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        // Owner check (using your jidManager)
        const isOwner = jidManager.isOwner(m);
        if (!isOwner && !m.key.fromMe) {
            return sock.sendMessage(chatId, {
                text: `❌ Owner only command!`
            }, { quoted: m });
        }
        
        // Available modes (matching your handler's expectations)
        const modes = {
            'public': '🌍 Public - Everyone can use',
            'private': '🔒 Private - Owner only',
            'silent': '🔇 Silent - Ignore non-owners',
            'group-only': '👥 Group Only - No DMs',
            'maintenance': '🔧 Maintenance - Limited commands'
        };
        
        // Show current mode if no args
        if (!args[0]) {
            let currentMode = 'public';
            if (existsSync(MODE_FILE)) {
                try {
                    const data = readFileSync(MODE_FILE, 'utf8');
                    const json = JSON.parse(data);
                    currentMode = json.mode || 'public';
                } catch (error) {
                    // Use default
                }
            }
            
            let modeList = `🎛️ *BOT MODE*\n\n`;
            modeList += `📊 Current: ${modes[currentMode] || currentMode}\n\n`;
            modeList += `📋 Available modes:\n`;
            
            for (const [mode, description] of Object.entries(modes)) {
                modeList += `• *${mode}* - ${description}\n`;
            }
            
            modeList += `\n💡 Usage: ${PREFIX}mode <mode_name>\n`;
            modeList += `Example: ${PREFIX}mode private`;
            
            return sock.sendMessage(chatId, {
                text: modeList
            }, { quoted: m });
        }
        
        const requestedMode = args[0].toLowerCase();
        
        // Validate mode
        if (!modes[requestedMode]) {
            return sock.sendMessage(chatId, {
                text: `❌ Invalid mode!\n\n` +
                      `Valid modes: ${Object.keys(modes).join(', ')}\n\n` +
                      `Example: ${PREFIX}mode private`
            }, { quoted: m });
        }
        
        try {
            // Save mode to file
            const modeData = {
                mode: requestedMode,
                setBy: jidManager.cleanJid(m.key.participant || chatId).cleanNumber,
                setAt: new Date().toISOString(),
                chatId: chatId
            };
            
            writeFileSync(MODE_FILE, JSON.stringify(modeData, null, 2));
            
            // Update global variable (for immediate effect)
            if (typeof global !== 'undefined') {
                global.BOT_MODE = requestedMode;
            }
            
            // Success message
            const successMsg = `✅ *Mode Updated!*\n\n` +
                              `New mode: *${requestedMode}*\n` +
                              `${modes[requestedMode]}\n\n` +
                              `🔄 Changes apply immediately!\n` +
                              `📊 Bot will now: ${getModeBehavior(requestedMode)}`;
            
            await sock.sendMessage(chatId, {
                text: successMsg
            }, { quoted: m });
            
            console.log(`✅ Mode changed to ${requestedMode}`);
            
        } catch (error) {
            await sock.sendMessage(chatId, {
                text: `❌ Error saving mode: ${error.message}`
            }, { quoted: m });
        }
    }
};

function getModeBehavior(mode) {
    const behaviors = {
        'public': 'Respond to everyone in all chats',
        'private': 'Respond only to owner, others get errors',
        'silent': 'Ignore non-owners completely (no messages)',
        'group-only': 'Work in groups only, ignore DMs',
        'maintenance': 'Allow only basic commands'
    };
    return behaviors[mode] || 'Use default behavior';
}

// Helper for other files to check mode
export function getCurrentMode() {
    try {
        if (existsSync(MODE_FILE)) {
            const data = readFileSync(MODE_FILE, 'utf8');
            const json = JSON.parse(data);
            return json.mode || 'public';
        }
        return 'public';
    } catch (error) {
        return 'public';
    }
}