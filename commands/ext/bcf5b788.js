// commands/status/autoreactstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration file path
const CONFIG_FILE = './data/autoReactConfig.json';

// Initialize config directory and file
function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            enabled: true, // ON BY DEFAULT
            mode: 'fixed', // fixed mode by default
            fixedEmoji: '🦊', // FOX EMOJI AS DEFAULT
            reactions: ["🦊", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
            logs: [],
            totalReacted: 0,
            lastReacted: null,
            consecutiveReactions: 0,
            lastSender: null,
            settings: {
                rateLimitDelay: 500, // Faster reaction
                reactToAll: true, // React to all statuses
                ignoreConsecutiveLimit: true, // React to consecutive statuses
                noHourlyLimit: true // NO HOURLY LIMIT
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
}

initConfig();

// Auto React Manager
class AutoReactManager {
    constructor() {
        this.config = this.loadConfig();
        this.reactionQueue = [];
        this.lastReactionTime = 0;
        
        // Log initialization
        console.log(`🦊 AutoReactStatus initialized: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
        console.log(`🎭 Default mode: ${this.config.mode}`);
        console.log(`😄 Default emoji: ${this.config.fixedEmoji}`);
    }
    
    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('🦊 Error loading auto react config:', error);
            return {
                enabled: true,
                mode: 'fixed',
                fixedEmoji: '🦊',
                reactions: ["🦊", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"],
                logs: [],
                totalReacted: 0,
                lastReacted: null,
                consecutiveReactions: 0,
                lastSender: null,
                settings: {
                    rateLimitDelay: 500,
                    reactToAll: true,
                    ignoreConsecutiveLimit: true,
                    noHourlyLimit: true
                }
            };
        }
    }
    
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('🦊 Error saving auto react config:', error);
        }
    }
    
    get enabled() {
        return this.config.enabled;
    }
    
    get mode() {
        return this.config.mode;
    }
    
    get fixedEmoji() {
        return this.config.fixedEmoji;
    }
    
    get reactions() {
        return this.config.reactions;
    }
    
    get logs() {
        return this.config.logs;
    }
    
    get totalReacted() {
        return this.config.totalReacted;
    }
    
    // Smart toggle: if already ON, just confirm instead of toggling
    toggle(forceOff = false) {
        if (forceOff) {
            // Force turn off
            this.config.enabled = false;
            this.saveConfig();
            return false;
        }
        
        // If already enabled, don't toggle - just return true (enabled)
        if (this.config.enabled) {
            return true; // Still enabled
        }
        
        // If disabled, enable it
        this.config.enabled = true;
        this.saveConfig();
        return true;
    }
    
    setMode(newMode) {
        if (newMode === 'random' || newMode === 'fixed') {
            this.config.mode = newMode;
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    setFixedEmoji(emoji) {
        if (emoji.length <= 2) {
            this.config.fixedEmoji = emoji;
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    addReaction(emoji) {
        if (!this.config.reactions.includes(emoji) && emoji.length <= 2) {
            this.config.reactions.push(emoji);
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    removeReaction(emoji) {
        const index = this.config.reactions.indexOf(emoji);
        if (index !== -1) {
            this.config.reactions.splice(index, 1);
            this.saveConfig();
            return true;
        }
        return false;
    }
    
    resetReactions() {
        this.config.reactions = ["🦊", "❤️", "👍", "🔥", "🎉", "😂", "😮", "👏", "🎯", "💯", "🌟", "✨", "⚡", "💥", "🫶"];
        this.saveConfig();
    }
    
    addLog(sender, reaction, type = 'status') {
        const logEntry = {
            sender,
            reaction,
            type,
            timestamp: Date.now()
        };
        
        this.config.logs.push(logEntry);
        this.config.totalReacted++;
        this.config.lastReacted = logEntry;
        
        // Check for consecutive statuses from same sender
        if (this.config.lastSender === sender) {
            this.config.consecutiveReactions++;
        } else {
            this.config.consecutiveReactions = 1;
            this.config.lastSender = sender;
        }
        
        // Keep only last 100 logs
        if (this.config.logs.length > 100) {
            this.config.logs.shift();
        }
        
        this.saveConfig();
    }
    
    clearLogs() {
        this.config.logs = [];
        this.config.totalReacted = 0;
        this.config.lastReacted = null;
        this.config.consecutiveReactions = 0;
        this.config.lastSender = null;
        this.saveConfig();
    }
    
    getStats() {
        return {
            enabled: this.config.enabled,
            mode: this.config.mode,
            fixedEmoji: this.config.fixedEmoji,
            reactions: [...this.config.reactions],
            logsCount: this.config.logs.length,
            totalReacted: this.config.totalReacted,
            lastReacted: this.config.lastReacted,
            consecutiveReactions: this.config.consecutiveReactions,
            settings: { ...this.config.settings }
        };
    }
    
    shouldReact(sender) {
        if (!this.config.enabled) return false;
        
        // Check rate limiting
        const now = Date.now();
        if (now - this.lastReactionTime < this.config.settings.rateLimitDelay) {
            return false;
        }
        
        // Check if we should react to consecutive statuses
        if (!this.config.settings.ignoreConsecutiveLimit && 
            this.config.lastSender === sender && 
            this.config.consecutiveReactions >= 3) {
            return false;
        }
        
        return true;
    }
    
    getReaction() {
        if (this.config.mode === 'fixed') {
            return this.config.fixedEmoji;
        } else {
            // Random mode
            if (this.config.reactions.length === 0) return '🦊';
            const randomIndex = Math.floor(Math.random() * this.config.reactions.length);
            return this.config.reactions[randomIndex];
        }
    }
    
    async reactToStatus(sock, statusKey) {
        try {
            const sender = statusKey.participant || statusKey.remoteJid;
            const cleanSender = sender.split('@')[0];
            
            if (!this.shouldReact(sender)) {
                return false;
            }
            
            const reactionEmoji = this.getReaction();
            
            await sock.relayMessage(
                'status@broadcast',
                {
                    reactionMessage: {
                        key: {
                            remoteJid: 'status@broadcast',
                            id: statusKey.id,
                            participant: statusKey.participant || statusKey.remoteJid,
                            fromMe: false
                        },
                        text: reactionEmoji
                    }
                },
                {
                    messageId: statusKey.id,
                    statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
                }
            );
            
            // Update reaction time
            this.lastReactionTime = Date.now();
            
            // Add to logs
            this.addLog(cleanSender, reactionEmoji, 'status');
            
            console.log(`🦊 AutoReact: Reacted to ${cleanSender}'s status with ${reactionEmoji}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error reacting to status:', error.message);
            
            // Handle rate limiting by increasing delay
            if (error.message?.includes('rate-overlimit')) {
                console.log('⚠️ Rate limit hit, increasing delay...');
                this.config.settings.rateLimitDelay = Math.min(
                    this.config.settings.rateLimitDelay * 2,
                    5000
                );
                this.saveConfig();
            }
            
            return false;
        }
    }
}

// Create singleton instance
const autoReactManager = new AutoReactManager();

// Export the function for index.js
export async function handleAutoReact(sock, statusKey) {
    return await autoReactManager.reactToStatus(sock, statusKey);
}

// Export the manager for other uses
export { autoReactManager };

// The command module
export default {
    name: "autoreactstatus",
    alias: ["reactstatus", "statusreact", "sr", "reacts", "foxyreact"], // Added foxyreact alias
    desc: "Automatically react to WhatsApp statuses 🦊",
    category: "Status",
    ownerOnly: true, // Changed to owner only for control
    usage: ".autoreactstatus [on/off/random/emoji/list/add/remove/reset/stats]\nExample: .autoreactstatus on\nExample: .autoreactstatus random\nExample: .autoreactstatus emoji 🦊",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        const sendMessage = async (text) => {
            return await sock.sendMessage(chatId, { text }, { quoted: m });
        };
        
        try {
            // Check if sender is owner
            const isOwner = jidManager.isOwner(m);
            
            if (!isOwner) {
                return await sendMessage(
                    `❌ *Owner Only Command!* 🦊\n\n` +
                    `Only the bot owner can use auto react commands.\n` +
                    `This feature controls automatic status reactions.`
                );
            }
            
            if (args.length === 0) {
                // Show current status
                const stats = autoReactManager.getStats();
                
                let statusText = `🦊 *FOXY AUTO REACT STATUS*\n\n`;
                statusText += `*Status:* ${stats.enabled ? '✅ **ACTIVE**' : '❌ **INACTIVE**'}\n`;
                statusText += `*Mode:* ${stats.mode === 'fixed' ? `Fixed (${stats.fixedEmoji})` : 'Random 🎲'}\n`;
                statusText += `*Total Reacted:* ${stats.totalReacted}\n`;
                statusText += `*Reaction Delay:* ${stats.settings.rateLimitDelay}ms\n\n`;
                
                statusText += `📋 *Commands:*\n`;
                statusText += `• \`${PREFIX}autoreactstatus on\` - Enable\n`;
                statusText += `• \`${PREFIX}autoreactstatus off\` - Disable\n`;
                statusText += `• \`${PREFIX}autoreactstatus random\` - Random mode\n`;
                statusText += `• \`${PREFIX}autoreactstatus emoji 🦊\` - Set fixed emoji\n`;
                statusText += `• \`${PREFIX}autoreactstatus list\` - Show emoji list\n`;
                statusText += `• \`${PREFIX}autoreactstatus stats\` - Detailed stats\n`;
                statusText += `• \`${PREFIX}autoreactstatus help\` - Full help`;
                
                await sendMessage(statusText);
                return;
            }
            
            const action = args[0].toLowerCase();
            
            // Log the action
            const senderJid = m.key.participant || chatId;
            const cleaned = jidManager.cleanJid(senderJid);
            
            switch (action) {
                case 'on':
                case 'enable':
                case 'start':
                case 'activate':
                    // Use smart toggle that doesn't toggle if already on
                    const currentlyEnabled = autoReactManager.enabled;
                    const result = autoReactManager.toggle(false); // false = don't force off
                    
                    console.log(`🦊 Auto-react ${currentlyEnabled ? 'confirmed active' : 'enabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    if (currentlyEnabled) {
                        // Already enabled, just show confirmation
                        await sendMessage(
                            `✅ *AUTO REACT ALREADY ACTIVE* 🦊\n\n` +
                            `Foxy is already reacting to all statuses!\n\n` +
                            `*Current settings:*\n` +
                            `• Mode: ${autoReactManager.mode}\n` +
                            `• Emoji: ${autoReactManager.mode === 'fixed' ? autoReactManager.fixedEmoji : 'Random'}\n` +
                            `• Total reacted: ${autoReactManager.totalReacted}\n` +
                            `• Reaction delay: ${autoReactManager.config.settings.rateLimitDelay}ms\n\n` +
                            `Use \`${PREFIX}autoreactstatus off\` to disable.`
                        );
                    } else {
                        // Was disabled, now enabled
                        await sendMessage(
                            `✅ *AUTO REACT ENABLED* 🦊\n\n` +
                            `Foxy will now automatically react to ALL statuses!\n\n` +
                            `*Default settings:*\n` +
                            `• Emoji: ${autoReactManager.fixedEmoji}\n` +
                            `• Mode: ${autoReactManager.mode}\n` +
                            `• Reaction delay: ${autoReactManager.config.settings.rateLimitDelay}ms\n\n` +
                            `Foxy is ready to react! 🦊🎭`
                        );
                    }
                    break;
                    
                case 'off':
                case 'disable':
                case 'stop':
                case 'deactivate':
                    // Force turn off
                    const wasEnabled = autoReactManager.enabled;
                    autoReactManager.toggle(true); // true = force off
                    
                    console.log(`🦊 Auto-react ${wasEnabled ? 'disabled' : 'already disabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    if (wasEnabled) {
                        await sendMessage(
                            `❌ *AUTO REACT DISABLED* 🦊\n\n` +
                            `Foxy has stopped auto reacting to statuses.\n\n` +
                            `Use \`${PREFIX}autoreactstatus on\` to enable again.\n` +
                            `Foxy is taking a break... 😴`
                        );
                    } else {
                        await sendMessage(
                            `⚠️ *AUTO REACT ALREADY DISABLED*\n\n` +
                            `Foxy is not auto reacting to statuses.\n\n` +
                            `Use \`${PREFIX}autoreactstatus on\` to enable.`
                        );
                    }
                    break;
                    
                case 'random':
                case 'randomemoji':
                case 'randommode':
                    autoReactManager.setMode('random');
                    
                    console.log(`🦊 Auto-react mode set to 'random' by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `🎲 *Mode set to RANDOM* 🦊\n\n` +
                        `Foxy will now react with random emojis!\n\n` +
                        `*Available emojis (${autoReactManager.reactions.length}):*\n` +
                        `${autoReactManager.reactions.join(' ')}\n\n` +
                        `Each status will get a random emoji from this list.\n` +
                        `Use \`${PREFIX}autoreactstatus emoji 🦊\` to switch back to fixed mode.`
                    );
                    break;
                    
                case 'emoji':
                case 'setemoji':
                case 'fixed':
                    if (args.length < 2) {
                        await sendMessage(
                            `🦊 *Current Fixed Emoji:* ${autoReactManager.fixedEmoji}\n\n` +
                            `*Usage:* \`${PREFIX}autoreactstatus emoji 🦊\`\n\n` +
                            `Sets a fixed emoji for all reactions.\n` +
                            `Mode will automatically switch to FIXED.`
                        );
                        return;
                    }
                    
                    const emoji = args[1];
                    if (emoji.length > 2) {
                        await sendMessage('❌ Please use a single emoji (max 2 characters).');
                        return;
                    }
                    
                    if (autoReactManager.setFixedEmoji(emoji)) {
                        autoReactManager.setMode('fixed');
                        
                        console.log(`🦊 Auto-react fixed emoji set to '${emoji}' by: ${cleaned.cleanNumber || 'Owner'}`);
                        
                        await sendMessage(
                            `✅ *Fixed Emoji Set* 🦊\n\n` +
                            `Reactions will now use: ${emoji}\n\n` +
                            `Mode automatically switched to FIXED.\n` +
                            `Foxy will react with ${emoji} to all statuses!`
                        );
                    } else {
                        await sendMessage('❌ Failed to set emoji. Please use a valid single emoji.');
                    }
                    break;
                    
                case 'stats':
                case 'statistics':
                case 'info':
                    const detailedStats = autoReactManager.getStats();
                    let statsText = `📊 *FOXY AUTO REACT STATISTICS* 🦊\n\n`;
                    statsText += `*Status:* ${detailedStats.enabled ? '**ACTIVE** ✅' : '**INACTIVE** ❌'}\n`;
                    statsText += `*Mode:* ${detailedStats.mode === 'fixed' ? `FIXED (${detailedStats.fixedEmoji})` : 'RANDOM 🎲'}\n`;
                    statsText += `*Total Reacted:* **${detailedStats.totalReacted}**\n`;
                    statsText += `*Consecutive Reactions:* ${detailedStats.consecutiveReactions}\n`;
                    statsText += `*Logs Stored:* ${detailedStats.logsCount}\n\n`;
                    
                    if (detailedStats.lastReacted) {
                        const timeAgo = Math.floor((Date.now() - detailedStats.lastReacted.timestamp) / 60000);
                        statsText += `🕒 *Last Reaction:*\n`;
                        statsText += `• To: ${detailedStats.lastReacted.sender}\n`;
                        statsText += `• With: ${detailedStats.lastReacted.reaction}\n`;
                        statsText += `• ${timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}\n\n`;
                    }
                    
                    statsText += `⚙️ *Settings:*\n`;
                    statsText += `• Rate Limit: ${detailedStats.settings.rateLimitDelay}ms\n`;
                    statsText += `• React to All: ${detailedStats.settings.reactToAll ? '✅' : '❌'}\n`;
                    statsText += `• Ignore Consecutive: ${detailedStats.settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n`;
                    statsText += `• Hourly Limit: ❌ DISABLED\n`;
                    
                    await sendMessage(statsText);
                    break;
                    
                case 'list':
                case 'emojis':
                case 'emojilist':
                    const emojiList = autoReactManager.reactions;
                    await sendMessage(
                        `😄 *Random Emoji List* 🦊 (${emojiList.length} emojis)\n\n` +
                        `${emojiList.join(' ')}\n\n` +
                        `*Current mode:* ${autoReactManager.mode}\n` +
                        `*Fixed emoji:* ${autoReactManager.fixedEmoji}\n\n` +
                        `Use these emojis in random mode or set them as fixed.`
                    );
                    break;
                    
                case 'add':
                case 'addemoji':
                    if (args.length < 2) {
                        await sendMessage(
                            `*Usage:* \`${PREFIX}autoreactstatus add ❤️\`\n\n` +
                            `Adds an emoji to the random emoji list.\n` +
                            `Only works in random mode.`
                        );
                        return;
                    }
                    
                    const addEmoji = args[1];
                    if (addEmoji.length > 2) {
                        await sendMessage('❌ Please use a single emoji (max 2 characters).');
                        return;
                    }
                    
                    if (autoReactManager.addReaction(addEmoji)) {
                        console.log(`🦊 Emoji '${addEmoji}' added to reaction list by: ${cleaned.cleanNumber || 'Owner'}`);
                        
                        await sendMessage(
                            `✅ *Emoji Added* 🦊\n\n` +
                            `${addEmoji} has been added to the random list.\n\n` +
                            `*Current list (${autoReactManager.reactions.length} emojis):*\n` +
                            `${autoReactManager.reactions.join(' ')}`
                        );
                    } else {
                        await sendMessage(
                            `⚠️ *Emoji not added*\n\n` +
                            `${addEmoji} is already in the list or invalid.\n\n` +
                            `*Current list:* ${autoReactManager.reactions.join(' ')}`
                        );
                    }
                    break;
                    
                case 'remove':
                case 'removeemoji':
                case 'delete':
                    if (args.length < 2) {
                        await sendMessage(
                            `*Usage:* \`${PREFIX}autoreactstatus remove 🔥\`\n\n` +
                            `Removes an emoji from the random emoji list.\n` +
                            `Cannot remove the default fox emoji 🦊.`
                        );
                        return;
                    }
                    
                    const removeEmoji = args[1];
                    
                    // Prevent removing the fox emoji
                    if (removeEmoji === '🦊') {
                        await sendMessage(
                            `❌ *Cannot remove fox emoji!* 🦊\n\n` +
                            `The 🦊 emoji is Foxy's signature reaction!\n` +
                            `It must stay in the list.`
                        );
                        return;
                    }
                    
                    if (autoReactManager.removeReaction(removeEmoji)) {
                        console.log(`🦊 Emoji '${removeEmoji}' removed from reaction list by: ${cleaned.cleanNumber || 'Owner'}`);
                        
                        await sendMessage(
                            `✅ *Emoji Removed* 🦊\n\n` +
                            `${removeEmoji} has been removed from the random list.\n\n` +
                            `*Current list (${autoReactManager.reactions.length} emojis):*\n` +
                            `${autoReactManager.reactions.join(' ')}`
                        );
                    } else {
                        await sendMessage(
                            `❌ *Emoji not found*\n\n` +
                            `${removeEmoji} not found in the emoji list.\n\n` +
                            `*Current list:* ${autoReactManager.reactions.join(' ')}`
                        );
                    }
                    break;
                    
                case 'reset':
                case 'resetlist':
                case 'clear':
                case 'clearlist':
                    autoReactManager.resetReactions();
                    
                    console.log(`🦊 Reaction list reset by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `🔄 *Emoji List Reset* 🦊\n\n` +
                        `Reset to default emojis:\n\n` +
                        `${autoReactManager.reactions.join(' ')}\n\n` +
                        `The 🦊 emoji is always included as Foxy's signature!`
                    );
                    break;
                    
                case 'clearstats':
                case 'resetlogs':
                    autoReactManager.clearLogs();
                    
                    console.log(`🦊 Reaction logs cleared by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    await sendMessage(
                        `🗑️ *Statistics Cleared* 🦊\n\n` +
                        `All reaction logs and statistics have been reset.\n` +
                        `Total reacted: 0\n` +
                        `Logs: 0\n` +
                        `Foxy starts fresh! ✨`
                    );
                    break;
                    
                case 'help':
                case 'cmd':
                case 'guide':
                    await sendMessage(
                        `📖 *FOXY AUTO REACT HELP* 🦊\n\n` +
                        `*Basic Commands:*\n` +
                        `• \`${PREFIX}autoreactstatus on\` - Enable auto react\n` +
                        `• \`${PREFIX}autoreactstatus off\` - Disable auto react\n` +
                        `• \`${PREFIX}autoreactstatus random\` - Random emoji mode\n` +
                        `• \`${PREFIX}autoreactstatus emoji 🦊\` - Set fixed emoji\n\n` +
                        `*Emoji Management:*\n` +
                        `• \`${PREFIX}autoreactstatus list\` - Show all emojis\n` +
                        `• \`${PREFIX}autoreactstatus add ❤️\` - Add emoji\n` +
                        `• \`${PREFIX}autoreactstatus remove 🔥\` - Remove emoji\n` +
                        `• \`${PREFIX}autoreactstatus reset\` - Reset to defaults\n\n` +
                        `*Info & Stats:*\n` +
                        `• \`${PREFIX}autoreactstatus\` - Show status\n` +
                        `• \`${PREFIX}autoreactstatus stats\` - Detailed stats\n` +
                        `• \`${PREFIX}autoreactstatus clearstats\` - Clear logs\n\n` +
                        `*Examples:*\n` +
                        `\`${PREFIX}autoreactstatus on\`\n` +
                        `\`${PREFIX}autoreactstatus random\`\n` +
                        `\`${PREFIX}autoreactstatus emoji 👍\`\n` +
                        `\`${PREFIX}autoreactstatus add 🎉\``
                    );
                    break;
                    
                default:
                    await sendMessage(
                        `❓ *Invalid Command* 🦊\n\n` +
                        `*Available commands:*\n` +
                        `• \`${PREFIX}autoreactstatus on/off\`\n` +
                        `• \`${PREFIX}autoreactstatus random\`\n` +
                        `• \`${PREFIX}autoreactstatus emoji <emoji>\`\n` +
                        `• \`${PREFIX}autoreactstatus list\`\n` +
                        `• \`${PREFIX}autoreactstatus stats\`\n` +
                        `• \`${PREFIX}autoreactstatus help\`\n\n` +
                        `Type \`${PREFIX}autoreactstatus help\` for full command list.`
                    );
            }
            
        } catch (error) {
            console.error('🦊 AutoReactStatus command error:', error);
            await sendMessage(
                `❌ *Command Failed* 🦊\n\n` +
                `Error: ${error.message}\n` +
                `Try again or check the settings file.`
            );
        }
    }
};