// commands/system/ultimatefix.js
import fs from 'fs';
import path from 'path';
import { foxCanUse, foxMode, foxOwners } from '../../utils/foxMaster.js';

const FOX_DEN = './fox_den';

export default {
    name: 'ultimatefix',
    alias: ['fix', 'repair', 'resetbot'],
    category: 'system',
    description: 'Fix common bot issues',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'ultimatefix')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        // Check if user is owner
        if (!foxOwners.isOwner(msg)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *OWNER ONLY* 🦊\n\n` +
                      `Only bot owners can use ultimate fix!\n\n` +
                      `🦊 This is a powerful tool!`
            });
            return;
        }
        
        const fixType = args[0]?.toLowerCase();
        
        if (!fixType || !['economy', 'groups', 'all', 'help'].includes(fixType)) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔧 *ULTIMATE FIX* 🦊\n\n` +
                      `Usage: ${prefix}ultimatefix <type>\n\n` +
                      `*Available fixes:*\n` +
                      `• ${prefix}ultimatefix economy - Reset economy data\n` +
                      `• ${prefix}ultimatefix groups - Reset group settings\n` +
                      `• ${prefix}ultimatefix all - Reset everything\n` +
                      `• ${prefix}ultimatefix help - Show this help\n\n` +
                      `⚠️ *WARNING:*\n` +
                      `• This will DELETE data\n` +
                      `• Cannot be undone\n` +
                      `• Backup recommended\n\n` +
                      `💡 *Use carefully!*\n\n` +
                      `🦊 Fix what's broken!`
            });
            return;
        }
        
        if (fixType === 'help') {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `🔧 *ULTIMATE FIX HELP* 🦊\n\n` +
                      `*What it does:*\n` +
                      `Resets specific bot data to fix issues.\n\n` +
                      `*When to use:*\n` +
                      `• Economy commands not working\n` +
                      `• Group settings corrupted\n` +
                      `• Bot behaving strangely\n\n` +
                      `*What gets reset:*\n` +
                      `• economy - User balances, shop, inventory\n` +
                      `• groups - Group settings, rules, polls\n` +
                      `• all - Everything except owner settings\n\n` +
                      `*What's preserved:*\n` +
                      `• Owner settings\n` +
                      `• Bot mode\n` +
                      `• Setup status\n\n` +
                      `🦊 Use only when necessary!`
            });
            return;
        }
        
        // Confirm before proceeding
        if (args[1] !== 'confirm') {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `⚠️ *CONFIRMATION REQUIRED* 🦊\n\n` +
                      `You are about to reset: ${fixType.toUpperCase()}\n\n` +
                      `*This will delete:*\n` +
                      `${fixType === 'economy' ? '• All user balances\n• Shop data\n• Inventory items\n• Leaderboard' : 
                        fixType === 'groups' ? '• All group settings\n• Welcome messages\n• Goodbye messages\n• Group rules\n• Polls' : 
                        '• Everything except owner settings'}\n\n` +
                      `⚠️ *THIS CANNOT BE UNDONE!*\n\n` +
                      `To confirm: ${prefix}ultimatefix ${fixType} confirm\n\n` +
                      `🦊 Are you absolutely sure?`
            });
            return;
        }
        
        // Perform the fix
        try {
            if (fixType === 'economy' || fixType === 'all') {
                const economyFile = path.join(FOX_DEN, 'fox_economy.json');
                const shopFile = path.join(FOX_DEN, 'fox_shop.json');
                
                if (fs.existsSync(economyFile)) {
                    fs.unlinkSync(economyFile);
                }
                if (fs.existsSync(shopFile)) {
                    fs.unlinkSync(shopFile);
                }
            }
            
            if (fixType === 'groups' || fixType === 'all') {
                const groupsFile = path.join(FOX_DEN, 'fox_groups.json');
                if (fs.existsSync(groupsFile)) {
                    fs.unlinkSync(groupsFile);
                }
            }
            
            if (fixType === 'all') {
                const gamesFile = path.join(FOX_DEN, 'fox_games.json');
                const prefixesFile = path.join(FOX_DEN, 'prefixes.json');
                
                if (fs.existsSync(gamesFile)) {
                    fs.unlinkSync(gamesFile);
                }
                if (fs.existsSync(prefixesFile)) {
                    fs.unlinkSync(prefixesFile);
                }
            }
            
            await sock.sendMessage(msg.key.remoteJid, {
                text: `✅ *${fixType.toUpperCase()} RESET COMPLETE!* 🦊\n\n` +
                      `*Reset type:* ${fixType}\n` +
                      `*Performed by:* ${msg.pushName || 'Owner'}\n` +
                      `*Time:* ${new Date().toLocaleTimeString()}\n\n` +
                      `*What was reset:*\n` +
                      `${fixType === 'economy' ? '• Economy database\n• Shop items\n• User balances' : 
                        fixType === 'groups' ? '• Group settings\n• Welcome/Goodbye messages\n• Group rules' : 
                        '• All bot data (except owner settings)'}\n\n` +
                      `*What was preserved:*\n` +
                      `• Owner settings\n• Bot mode\n• Setup status\n\n` +
                      `💡 *Bot will recreate data as needed!*\n\n` +
                      `🦊 Fresh start achieved!`
            });
            
        } catch (error) {
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ *FIX FAILED* 🦊\n\n` +
                      `*Error:* ${error.message}\n\n` +
                      `💡 *Try manually deleting files in ./fox_den/*\n\n` +
                      `🦊 Even ultimate fixes can fail!`
            });
        }
    }
};