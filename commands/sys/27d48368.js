// commands/automation/autoviewstatus.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration file path
const CONFIG_FILE = './data/autoViewConfig.json';

// Initialize config directory and file
function initConfig() {
    const configDir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    
    if (!fs.existsSync(CONFIG_FILE)) {
        const defaultConfig = {
            enabled: true, // ON BY DEFAULT
            logs: [],
            totalViewed: 0,
            lastViewed: null,
            consecutiveViews: 0,
            lastSender: null,
            settings: {
                rateLimitDelay: 1000, // 1 second delay between views
                viewToAll: true, // View all statuses
                ignoreConsecutiveLimit: true, // View consecutive statuses
                markAsSeen: true, // Actually mark as "seen"
                noHourlyLimit: true // NO HOURLY LIMIT
            }
        };
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    }
}

initConfig();

// Auto View Manager
class AutoViewManager {
    constructor() {
        this.config = this.loadConfig();
        this.viewQueue = [];
        this.lastViewTime = 0;
        
        // Log initialization
        console.log(`🦊 AutoViewStatus initialized: ${this.config.enabled ? '✅ ACTIVE' : '❌ INACTIVE'}`);
        console.log(`⚡ Viewing delay: ${this.config.settings.rateLimitDelay}ms`);
        console.log(`👁️ Mark as seen: ${this.config.settings.markAsSeen ? '✅' : '❌'}`);
    }
    
    loadConfig() {
        try {
            const data = fs.readFileSync(CONFIG_FILE, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error loading auto view config:', error);
            return {
                enabled: true,
                logs: [],
                totalViewed: 0,
                lastViewed: null,
                consecutiveViews: 0,
                lastSender: null,
                settings: {
                    rateLimitDelay: 1000,
                    viewToAll: true,
                    ignoreConsecutiveLimit: true,
                    markAsSeen: true,
                    noHourlyLimit: true
                }
            };
        }
    }
    
    saveConfig() {
        try {
            fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error('Error saving auto view config:', error);
        }
    }
    
    get enabled() {
        return this.config.enabled;
    }
    
    get logs() {
        return this.config.logs;
    }
    
    get totalViewed() {
        return this.config.totalViewed;
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
    
    addLog(sender, action = 'viewed') {
        const logEntry = {
            sender,
            action,
            timestamp: Date.now()
        };
        
        this.config.logs.push(logEntry);
        this.config.totalViewed++;
        this.config.lastViewed = logEntry;
        
        // Check for consecutive statuses from same sender
        if (this.config.lastSender === sender) {
            this.config.consecutiveViews++;
        } else {
            this.config.consecutiveViews = 1;
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
        this.config.totalViewed = 0;
        this.config.lastViewed = null;
        this.config.consecutiveViews = 0;
        this.config.lastSender = null;
        this.saveConfig();
    }
    
    getStats() {
        return {
            enabled: this.config.enabled,
            totalViewed: this.config.totalViewed,
            lastViewed: this.config.lastViewed,
            consecutiveViews: this.config.consecutiveViews,
            settings: { ...this.config.settings }
        };
    }
    
    shouldView(sender) {
        if (!this.config.enabled) return false;
        if (!this.config.settings.markAsSeen) return false;
        
        // Check rate limiting
        const now = Date.now();
        if (now - this.lastViewTime < this.config.settings.rateLimitDelay) {
            return false;
        }
        
        // Check if we should view consecutive statuses
        if (!this.config.settings.ignoreConsecutiveLimit && 
            this.config.lastSender === sender && 
            this.config.consecutiveViews >= 3) {
            return false;
        }
        
        return true;
    }
    
    async viewStatus(sock, statusKey) {
        try {
            const sender = statusKey.participant || statusKey.remoteJid;
            const cleanSender = sender.split('@')[0];
            
            if (!this.shouldView(sender)) {
                return false;
            }
            
            // Mark status as read
            await sock.readMessages([statusKey]);
            
            // Update view time
            this.lastViewTime = Date.now();
            
            // Add to logs
            this.addLog(cleanSender, 'viewed');
            
            console.log(`🦊 AutoView: Viewed ${cleanSender}'s status`);
            return true;
            
        } catch (error) {
            console.error('❌ Error viewing status:', error.message);
            
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
    
    // Update settings
    updateSetting(setting, value) {
        if (this.config.settings.hasOwnProperty(setting)) {
            this.config.settings[setting] = value;
            this.saveConfig();
            return true;
        }
        return false;
    }
}

// Create singleton instance
const autoViewManager = new AutoViewManager();

// Export the function for index.js
export async function handleAutoView(sock, statusKey) {
    return await autoViewManager.viewStatus(sock, statusKey);
}

// Export the manager for other uses
export { autoViewManager };

// The command module
export default {
    name: "autoviewstatus",
    alias: ["autoview", "viewstatus", "statusview", "vs", "views", "foxyview"], // Added foxyview alias
    desc: "Automatically view (mark as seen) WhatsApp statuses 👁️",
    category: "Automation",
    ownerOnly: true, // Changed to owner only for safety
    usage: ".autoviewstatus [on/off/stats/settings/help]\nExample: .autoviewstatus on\nExample: .autoviewstatus stats\nExample: .autoviewstatus settings seen on",
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        const sendMessage = async (text) => {
            return await sock.sendMessage(chatId, { text }, { quoted: m });
        };
        
        try {
            // Check if sender is owner
            const isOwner = extra?.jidManager?.isOwner?.(m) || false;
            
            if (!isOwner) {
                return await sendMessage(
                    `❌ *Owner Only Command!* 🦊\n\n` +
                    `Only the bot owner can use auto view commands.\n` +
                    `This feature controls automatic status viewing.`
                );
            }
            
            if (args.length === 0) {
                // Show current status
                const stats = autoViewManager.getStats();
                
                let statusText = `🦊 *FOXY AUTO VIEW STATUS*\n\n`;
                statusText += `*Status:* ${stats.enabled ? '✅ **ACTIVE**' : '❌ **INACTIVE**'}\n`;
                statusText += `*Total Viewed:* ${stats.totalViewed}\n`;
                statusText += `*Mark as Seen:* ${stats.settings.markAsSeen ? '✅ ON' : '❌ OFF'}\n`;
                statusText += `*View Delay:* ${stats.settings.rateLimitDelay}ms\n`;
                statusText += `*View All Statuses:* ${stats.settings.viewToAll ? '✅ YES' : '❌ NO'}\n\n`;
                
                statusText += `📋 *Commands:*\n`;
                statusText += `• \`${PREFIX}autoviewstatus on\` - Enable auto viewing\n`;
                statusText += `• \`${PREFIX}autoviewstatus off\` - Disable auto viewing\n`;
                statusText += `• \`${PREFIX}autoviewstatus stats\` - Detailed statistics\n`;
                statusText += `• \`${PREFIX}autoviewstatus settings\` - Configure options\n`;
                statusText += `• \`${PREFIX}autoviewstatus help\` - Help menu\n\n`;
                
                statusText += `💡 *Foxy is watching...* 🦊`;
                
                await sendMessage(statusText);
                return;
            }
            
            const action = args[0].toLowerCase();
            
            switch (action) {
                case 'on':
                case 'enable':
                case 'start':
                case 'activate':
                    // Use smart toggle that doesn't toggle if already on
                    const currentlyEnabled = autoViewManager.enabled;
                    const result = autoViewManager.toggle(false); // false = don't force off
                    
                    if (currentlyEnabled) {
                        // Already enabled, just show confirmation
                        await sendMessage(
                            `✅ *AUTO VIEW ALREADY ACTIVE* 🦊\n\n` +
                            `Foxy is already watching all statuses!\n\n` +
                            `*Current settings:*\n` +
                            `• Mark as seen: ${autoViewManager.config.settings.markAsSeen ? '✅' : '❌'}\n` +
                            `• Delay: ${autoViewManager.config.settings.rateLimitDelay}ms\n` +
                            `• Total viewed: ${autoViewManager.totalViewed}\n\n` +
                            `Use \`${PREFIX}autoviewstatus off\` to disable.`
                        );
                    } else {
                        // Was disabled, now enabled
                        await sendMessage(
                            `✅ *AUTO VIEW ENABLED* 🦊\n\n` +
                            `Foxy will now automatically view ALL statuses!\n\n` +
                            `Statuses will be marked as "seen" automatically.\n` +
                            `Foxy is on the hunt... 👀`
                        );
                    }
                    
                    // Log the action
                    const senderJid = m.key.participant || chatId;
                    const cleaned = jidManager.cleanJid(senderJid);
                    console.log(`🦊 AutoView ${currentlyEnabled ? 'confirmed active' : 'enabled'} by: ${cleaned.cleanNumber || 'Owner'}`);
                    
                    break;
                    
                case 'off':
                case 'disable':
                case 'stop':
                case 'deactivate':
                    // Force turn off
                    const wasEnabled = autoViewManager.enabled;
                    autoViewManager.toggle(true); // true = force off
                    
                    if (wasEnabled) {
                        await sendMessage(
                            `❌ *AUTO VIEW DISABLED* 🦊\n\n` +
                            `Foxy has stopped auto viewing statuses.\n\n` +
                            `Use \`${PREFIX}autoviewstatus on\` to enable again.\n` +
                            `Foxy is taking a nap... 😴`
                        );
                    } else {
                        await sendMessage(
                            `⚠️ *AUTO VIEW ALREADY DISABLED*\n\n` +
                            `Foxy is not auto viewing statuses.\n\n` +
                            `Use \`${PREFIX}autoviewstatus on\` to enable.`
                        );
                    }
                    
                    // Log the action
                    const senderJid2 = m.key.participant || chatId;
                    const cleaned2 = jidManager.cleanJid(senderJid2);
                    console.log(`🦊 AutoView ${wasEnabled ? 'disabled' : 'already disabled'} by: ${cleaned2.cleanNumber || 'Owner'}`);
                    
                    break;
                    
                case 'stats':
                case 'statistics':
                case 'info':
                    const detailedStats = autoViewManager.getStats();
                    let statsText = `📊 *FOXY AUTO VIEW STATISTICS* 🦊\n\n`;
                    statsText += `*Status:* ${detailedStats.enabled ? '**ACTIVE** ✅' : '**INACTIVE** ❌'}\n`;
                    statsText += `*Total Viewed:* **${detailedStats.totalViewed}**\n`;
                    statsText += `*Consecutive Views:* ${detailedStats.consecutiveViews}\n`;
                    statsText += `*Logs Stored:* ${detailedStats.logs?.length || 0}\n\n`;
                    
                    statsText += `⚙️ *Settings:*\n`;
                    statsText += `• Mark as Seen: ${detailedStats.settings.markAsSeen ? '✅' : '❌'}\n`;
                    statsText += `• Delay: ${detailedStats.settings.rateLimitDelay}ms\n`;
                    statsText += `• View All: ${detailedStats.settings.viewToAll ? '✅' : '❌'}\n`;
                    statsText += `• Ignore Consecutive: ${detailedStats.settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n`;
                    statsText += `• Hourly Limit: ❌ DISABLED\n`;
                    
                    if (detailedStats.lastViewed) {
                        const timeAgo = Math.floor((Date.now() - detailedStats.lastViewed.timestamp) / 60000);
                        statsText += `\n🕒 *Last Viewed:*\n`;
                        statsText += `• From: ${detailedStats.lastViewed.sender}\n`;
                        statsText += `• ${timeAgo < 1 ? 'Just now' : `${timeAgo} minutes ago`}\n`;
                    }
                    
                    await sendMessage(statsText);
                    break;
                    
                case 'logs':
                case 'history':
                    const logs = autoViewManager.logs.slice(-10).reverse();
                    if (logs.length === 0) {
                        await sendMessage(
                            `📭 *No View Logs Found*\n\n` +
                            `Foxy hasn't viewed any statuses yet.\n` +
                            `Make sure auto view is enabled with \`${PREFIX}autoviewstatus on\``
                        );
                        return;
                    }
                    
                    let logsText = `📋 *RECENT STATUS VIEWS* 🦊\n\n`;
                    logs.forEach((log, index) => {
                        const time = new Date(log.timestamp).toLocaleTimeString();
                        logsText += `${index + 1}. ${log.sender}\n   ${time}\n`;
                    });
                    
                    logsText += `\n📊 Total: ${autoViewManager.totalViewed} statuses viewed`;
                    
                    await sendMessage(logsText);
                    break;
                    
                case 'settings':
                case 'config':
                    if (args.length < 2) {
                        const settings = autoViewManager.config.settings;
                        let settingsText = `⚙️ *FOXY AUTO VIEW SETTINGS* 🦊\n\n`;
                        settingsText += `1. Mark as Seen: ${settings.markAsSeen ? '✅ ON' : '❌ OFF'}\n`;
                        settingsText += `2. Delay: ${settings.rateLimitDelay}ms\n`;
                        settingsText += `3. View All: ${settings.viewToAll ? '✅' : '❌'}\n`;
                        settingsText += `4. Ignore Consecutive: ${settings.ignoreConsecutiveLimit ? '✅' : '❌'}\n\n`;
                        
                        settingsText += `*Usage:*\n`;
                        settingsText += `\`${PREFIX}autoviewstatus settings seen on/off\`\n`;
                        settingsText += `\`${PREFIX}autoviewstatus settings delay <ms>\`\n`;
                        settingsText += `\`${PREFIX}autoviewstatus settings all on/off\`\n`;
                        settingsText += `\`${PREFIX}autoviewstatus settings consecutive on/off\`\n`;
                        
                        await sendMessage(settingsText);
                        return;
                    }
                    
                    const settingName = args[1].toLowerCase();
                    
                    if (settingName === 'seen') {
                        if (args.length < 3) {
                            await sendMessage(
                                `*Usage:* \`${PREFIX}autoviewstatus settings seen on/off\`\n\n` +
                                `Controls whether statuses are actually marked as "seen".\n` +
                                `✅ ON - Statuses will be marked as seen\n` +
                                `❌ OFF - Statuses will NOT be marked as seen`
                            );
                            return;
                        }
                        
                        const seenSetting = args[2].toLowerCase();
                        if (seenSetting === 'on') {
                            autoViewManager.updateSetting('markAsSeen', true);
                            await sendMessage(
                                `✅ *Setting Updated*\n\n` +
                                `Statuses will be marked as "seen"\n` +
                                `Foxy is watching closely... 👁️`
                            );
                        } else if (seenSetting === 'off') {
                            autoViewManager.updateSetting('markAsSeen', false);
                            await sendMessage(
                                `❌ *Setting Updated*\n\n` +
                                `Statuses will NOT be marked as "seen"\n` +
                                `Foxy is watching secretly... 🦊`
                            );
                        } else {
                            await sendMessage('❌ Invalid option! Use "on" or "off"');
                            return;
                        }
                        
                    } else if (settingName === 'delay') {
                        if (args.length < 3) {
                            await sendMessage(
                                `*Usage:* \`${PREFIX}autoviewstatus settings delay <milliseconds>\`\n\n` +
                                `Set delay between viewing statuses.\n` +
                                `Minimum: 500ms (0.5 second)\n` +
                                `Recommended: 1000ms-2000ms`
                            );
                            return;
                        }
                        
                        const delay = parseInt(args[2]);
                        if (isNaN(delay) || delay < 500) {
                            await sendMessage('❌ Invalid delay! Minimum is 500ms (0.5 second).');
                            return;
                        }
                        
                        autoViewManager.updateSetting('rateLimitDelay', delay);
                        
                        await sendMessage(
                            `✅ *Setting Updated*\n\n` +
                            `Viewing delay set to ${delay}ms\n` +
                            `Foxy will wait ${delay/1000} seconds between views`
                        );
                        
                    } else if (settingName === 'all') {
                        if (args.length < 3) {
                            await sendMessage(
                                `*Usage:* \`${PREFIX}autoviewstatus settings all on/off\`\n\n` +
                                `Controls whether to view all statuses or selective.\n` +
                                `✅ ON - View ALL statuses\n` +
                                `❌ OFF - View selective statuses`
                            );
                            return;
                        }
                        
                        const allSetting = args[2].toLowerCase();
                        if (allSetting === 'on') {
                            autoViewManager.updateSetting('viewToAll', true);
                            await sendMessage(
                                `✅ *Setting Updated*\n\n` +
                                `Will view ALL statuses\n` +
                                `Foxy watches everything! 👀`
                            );
                        } else if (allSetting === 'off') {
                            autoViewManager.updateSetting('viewToAll', false);
                            await sendMessage(
                                `❌ *Setting Updated*\n\n` +
                                `Will view selective statuses\n` +
                                `Foxy is being picky... 🦊`
                            );
                        } else {
                            await sendMessage('❌ Invalid option! Use "on" or "off"');
                            return;
                        }
                        
                    } else if (settingName === 'consecutive') {
                        if (args.length < 3) {
                            await sendMessage(
                                `*Usage:* \`${PREFIX}autoviewstatus settings consecutive on/off\`\n\n` +
                                `Controls consecutive status viewing.\n` +
                                `✅ ON - View consecutive statuses\n` +
                                `❌ OFF - Skip consecutive statuses`
                            );
                            return;
                        }
                        
                        const consecutiveSetting = args[2].toLowerCase();
                        if (consecutiveSetting === 'on') {
                            autoViewManager.updateSetting('ignoreConsecutiveLimit', true);
                            await sendMessage(
                                `✅ *Setting Updated*\n\n` +
                                `Will view consecutive statuses\n` +
                                `Foxy watches every update! 📱`
                            );
                        } else if (consecutiveSetting === 'off') {
                            autoViewManager.updateSetting('ignoreConsecutiveLimit', false);
                            await sendMessage(
                                `❌ *Setting Updated*\n\n` +
                                `Will NOT view consecutive statuses\n` +
                                `Foxy avoids spam... 🚫`
                            );
                        } else {
                            await sendMessage('❌ Invalid option! Use "on" or "off"');
                            return;
                        }
                    }
                    
                    break;
                    
                case 'reset':
                case 'clearstats':
                case 'clear':
                    autoViewManager.clearLogs();
                    await sendMessage(
                        `🗑️ *Statistics Cleared* 🦊\n\n` +
                        `All viewing logs and statistics have been reset.\n\n` +
                        `Total viewed: 0\n` +
                        `Logs: 0\n` +
                        `Foxy starts fresh! ✨`
                    );
                    break;
                    
                case 'help':
                case 'cmd':
                case 'guide':
                    await sendMessage(
                        `📖 *FOXY AUTO VIEW HELP* 🦊\n\n` +
                        `*Main Commands:*\n` +
                        `• \`${PREFIX}autoviewstatus\` - Show status\n` +
                        `• \`${PREFIX}autoviewstatus on\` - Enable\n` +
                        `• \`${PREFIX}autoviewstatus off\` - Disable\n\n` +
                        `*Info & Stats:*\n` +
                        `• \`${PREFIX}autoviewstatus stats\` - Detailed stats\n` +
                        `• \`${PREFIX}autoviewstatus logs\` - View logs\n` +
                        `• \`${PREFIX}autoviewstatus reset\` - Clear stats\n\n` +
                        `*Configuration:*\n` +
                        `• \`${PREFIX}autoviewstatus settings\` - Configure options\n\n` +
                        `*Examples:*\n` +
                        `\`${PREFIX}autoviewstatus on\`\n` +
                        `\`${PREFIX}autoviewstatus stats\`\n` +
                        `\`${PREFIX}autoviewstatus settings seen on\`\n` +
                        `\`${PREFIX}autoviewstatus settings delay 2000\``
                    );
                    break;
                    
                default:
                    await sendMessage(
                        `❓ *Invalid Command*\n\n` +
                        `Use:\n` +
                        `• \`${PREFIX}autoviewstatus on/off\`\n` +
                        `• \`${PREFIX}autoviewstatus stats\`\n` +
                        `• \`${PREFIX}autoviewstatus settings\`\n` +
                        `• \`${PREFIX}autoviewstatus help\``
                    );
            }
            
        } catch (error) {
            console.error('AutoViewStatus command error:', error);
            await sendMessage(
                `❌ *Command Failed*\n\n` +
                `Error: ${error.message}\n` +
                `Try again or check the settings.`
            );
        }
    }
};