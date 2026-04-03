// AutoReact Manager (State Management)
const autoReactConfig = {
    enabled: false,
    emoji: "🦊",
    reactToDMs: true,
    reactToGroups: true,
    reactToCommands: false,
    activeReactions: new Set(),
    botSock: null,
    isHooked: false,
    maxReactionsPerMinute: 30,
    reactionTimestamps: [],
    cooldown: 1000,
    userCooldowns: new Map()
};

class AutoReactManager {
    static initialize(sock) {
        if (!autoReactConfig.isHooked && sock) {
            autoReactConfig.botSock = sock;
            this.hookIntoBot();
            autoReactConfig.isHooked = true;
            console.log('🦊 Auto-react system initialized (off by default)!');
        }
    }

    static hookIntoBot() {
        if (!autoReactConfig.botSock || !autoReactConfig.botSock.ev) return;
        
        autoReactConfig.botSock.ev.on('messages.upsert', async (data) => {
            await this.handleIncomingMessage(data);
        });
        
        console.log('✅ Auto-react hooked into message events');
    }

    static isRateLimited() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        
        autoReactConfig.reactionTimestamps = autoReactConfig.reactionTimestamps.filter(
            timestamp => timestamp > oneMinuteAgo
        );
        
        if (autoReactConfig.reactionTimestamps.length >= autoReactConfig.maxReactionsPerMinute) {
            return true;
        }
        
        autoReactConfig.reactionTimestamps.push(now);
        return false;
    }

    static isUserOnCooldown(userJid) {
        const now = Date.now();
        const lastReaction = autoReactConfig.userCooldowns.get(userJid);
        
        if (!lastReaction) return false;
        return (now - lastReaction) < autoReactConfig.cooldown;
    }

    static async handleIncomingMessage(data) {
        try {
            if (!data || !data.messages || data.messages.length === 0) return;
            if (!autoReactConfig.enabled) return;
            
            const m = data.messages[0];
            const sock = autoReactConfig.botSock;
            
            if (!m || !m.key || m.key.fromMe) return;
            
            const userJid = m.key.participant || m.key.remoteJid;
            const chatJid = m.key.remoteJid;
            const messageKey = m.key;
            
            if (!userJid || !chatJid || !messageKey) return;
            
            const messageId = `${chatJid}_${messageKey.id}`;
            if (autoReactConfig.activeReactions.has(messageId)) return;
            if (this.isUserOnCooldown(userJid)) return;
            
            const isGroup = chatJid.includes('@g.us');
            const isDM = !isGroup;
            
            if (isDM && !autoReactConfig.reactToDMs) return;
            if (isGroup && !autoReactConfig.reactToGroups) return;
            
            let messageText = '';
            if (m.message) {
                if (m.message.conversation) messageText = m.message.conversation;
                else if (m.message.extendedTextMessage?.text) messageText = m.message.extendedTextMessage.text;
                else if (m.message.imageMessage?.caption) messageText = m.message.imageMessage.caption || '';
                else if (m.message.videoMessage?.caption) messageText = m.message.videoMessage.caption || '';
            }
            
            if (messageText.trim().startsWith('.') && !autoReactConfig.reactToCommands) return;
            if (this.isRateLimited()) return;
            
            try {
                await sock.sendMessage(chatJid, {
                    react: {
                        text: autoReactConfig.emoji,
                        key: messageKey
                    }
                });
                
                autoReactConfig.activeReactions.add(messageId);
                autoReactConfig.userCooldowns.set(userJid, Date.now());
                
                setTimeout(() => {
                    autoReactConfig.activeReactions.delete(messageId);
                }, 5 * 60 * 1000);
                
            } catch (err) {
                console.error("Failed to react:", err.message);
            }
            
        } catch (err) {
            console.error("Auto-react error:", err.message);
        }
    }

    static status() {
        return {
            enabled: autoReactConfig.enabled,
            emoji: autoReactConfig.emoji,
            reactToDMs: autoReactConfig.reactToDMs,
            reactToGroups: autoReactConfig.reactToGroups,
            reactToCommands: autoReactConfig.reactToCommands,
            activeReactions: autoReactConfig.activeReactions.size,
            rateLimit: `${autoReactConfig.reactionTimestamps.length}/${autoReactConfig.maxReactionsPerMinute}`
        };
    }

    static setEmoji(emoji) {
        if (emoji && emoji.length <= 5) {
            autoReactConfig.emoji = emoji;
            return true;
        }
        return false;
    }

    static toggleDMs() {
        autoReactConfig.reactToDMs = !autoReactConfig.reactToDMs;
        return autoReactConfig.reactToDMs;
    }

    static toggleGroups() {
        autoReactConfig.reactToGroups = !autoReactConfig.reactToGroups;
        return autoReactConfig.reactToGroups;
    }

    static toggleCommands() {
        autoReactConfig.reactToCommands = !autoReactConfig.reactToCommands;
        return autoReactConfig.reactToCommands;
    }

    static setBoth() {
        autoReactConfig.reactToDMs = true;
        autoReactConfig.reactToGroups = true;
    }

    static setDMsOnly() {
        autoReactConfig.reactToDMs = true;
        autoReactConfig.reactToGroups = false;
    }

    static setGroupsOnly() {
        autoReactConfig.reactToDMs = false;
        autoReactConfig.reactToGroups = true;
    }

    static clearAllReactions() {
        autoReactConfig.activeReactions.clear();
        autoReactConfig.userCooldowns.clear();
        autoReactConfig.reactionTimestamps = [];
    }
}

export default {
    name: "autoreact",
    alias: ["autoreaction", "reactauto", "autoemoji", "foxyreact"],
    category: "owner",
    ownerOnly: true,
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        const sendMessage = async (text) => {
            return await sock.sendMessage(chatId, { text }, { quoted: m });
        };
        
        // Owner check
        if (!jidManager.isOwner(m)) {
            return await sock.sendMessage(chatId, {
                react: { text: "👑", key: m.key }
            });
        }
        
        // Initialize
        if (!autoReactConfig.isHooked) {
            AutoReactManager.initialize(sock);
        }
        
        const arg = args[0]?.toLowerCase();
        
        // No args - show status
        if (!arg) {
            const status = AutoReactManager.status();
            return await sendMessage(
                `┌─⧭ *FOXY AUTO REACT* 🦊 ⧭─┐
│
├─⧭ *Status:* ${status.enabled ? '✅ ON' : '❌ OFF'}
├─⧭ *Emoji:* ${status.emoji}
├─⧭ *DMs:* ${status.reactToDMs ? '✅' : '❌'}
├─⧭ *Groups:* ${status.reactToGroups ? '✅' : '❌'}
├─⧭ *Commands:* ${status.reactToCommands ? '✅' : '❌'}
├─⧭ *Rate:* ${status.rateLimit}/min
│
├─⧭ *Commands:*
│ • ${PREFIX}autoreact on
│ • ${PREFIX}autoreact off
│ • ${PREFIX}autoreact set 🦊
│ • ${PREFIX}autoreact dms
│ • ${PREFIX}autoreact groups
│ • ${PREFIX}autoreact both
│ • ${PREFIX}autoreact status
│
└─⧭🦊`
            );
        }
        
        // On
        if (arg === 'on') {
            autoReactConfig.enabled = true;
            return await sendMessage(
                `┌─⧭ *✅ AUTO REACT ENABLED* ⧭─┐
│
├─⧭ Foxy will now react with ${autoReactConfig.emoji}
│
└─⧭🦊`
            );
        }
        
        // Off
        if (arg === 'off') {
            autoReactConfig.enabled = false;
            return await sendMessage(
                `┌─⧭ *❌ AUTO REACT DISABLED* ⧭─┐
│
├─⧭ Foxy will no longer react
│
└─⧭🦊`
            );
        }
        
        // Set emoji
        if (arg === 'set') {
            if (!args[1]) {
                return await sendMessage(
                    `┌─⧭ *SET EMOJI* 🦊 ⧭─┐
│
├─⧭ *Usage:* ${PREFIX}autoreact set 🦊
│
├─⧭ *Examples:*
│ • ${PREFIX}autoreact set ❤️
│ • ${PREFIX}autoreact set 👍
│
└─⧭🦊`
                );
            }
            
            const emoji = args[1];
            if (AutoReactManager.setEmoji(emoji)) {
                return await sendMessage(
                    `┌─⧭ *✅ EMOJI UPDATED* ⧭─┐
│
├─⧭ New emoji: ${emoji}
│
└─⧭🦊`
                );
            } else {
                return await sendMessage(
                    `┌─⧭ *❌ INVALID EMOJI* ⧭─┐
│
├─⧭ Use a single emoji like 🦊 ❤️ 👍
│
└─⧭🦊`
                );
            }
        }
        
        // Toggle DMs
        if (arg === 'dms') {
            const dmsEnabled = AutoReactManager.toggleDMs();
            return await sendMessage(
                `┌─⧭ *DM REACTIONS* 💬 ⧭─┐
│
├─⧭ *Status:* ${dmsEnabled ? '✅ ON' : '❌ OFF'}
│
└─⧭🦊`
            );
        }
        
        // Toggle groups
        if (arg === 'groups') {
            const groupsEnabled = AutoReactManager.toggleGroups();
            return await sendMessage(
                `┌─⧭ *GROUP REACTIONS* 👥 ⧭─┐
│
├─⧭ *Status:* ${groupsEnabled ? '✅ ON' : '❌ OFF'}
│
└─⧭🦊`
            );
        }
        
        // Both
        if (arg === 'both') {
            AutoReactManager.setBoth();
            return await sendMessage(
                `┌─⧭ *✅ REACT EVERYWHERE* ⧭─┐
│
├─⧭ DMs: ✅ ON
├─⧭ Groups: ✅ ON
│
└─⧭🦊`
            );
        }
        
        // DMs only
        if (arg === 'dmsonly') {
            AutoReactManager.setDMsOnly();
            return await sendMessage(
                `┌─⧭ *✅ DMS ONLY* ⧭─┐
│
├─⧭ DMs: ✅ ON
├─⧭ Groups: ❌ OFF
│
└─⧭🦊`
            );
        }
        
        // Groups only
        if (arg === 'groupsonly') {
            AutoReactManager.setGroupsOnly();
            return await sendMessage(
                `┌─⧭ *✅ GROUPS ONLY* ⧭─┐
│
├─⧭ DMs: ❌ OFF
├─⧭ Groups: ✅ ON
│
└─⧭🦊`
            );
        }
        
        // Toggle commands
        if (arg === 'commands') {
            const cmdEnabled = AutoReactManager.toggleCommands();
            return await sendMessage(
                `┌─⧭ *COMMAND REACTIONS* ⌨️ ⧭─┐
│
├─⧭ *Status:* ${cmdEnabled ? '✅ ON' : '❌ OFF'}
│
└─⧭🦊`
            );
        }
        
        // Status
        if (arg === 'status') {
            const status = AutoReactManager.status();
            return await sendMessage(
                `┌─⧭ *📊 AUTO REACT STATUS* ⧭─┐
│
├─⧭ *Enabled:* ${status.enabled ? '✅' : '❌'}
├─⧭ *Emoji:* ${status.emoji}
├─⧭ *DMs:* ${status.reactToDMs ? '✅' : '❌'}
├─⧭ *Groups:* ${status.reactToGroups ? '✅' : '❌'}
├─⧭ *Commands:* ${status.reactToCommands ? '✅' : '❌'}
├─⧭ *Active:* ${status.activeReactions}
├─⧭ *Rate:* ${status.rateLimit}/min
│
└─⧭🦊`
            );
        }
        
        // Clear
        if (arg === 'clear') {
            AutoReactManager.clearAllReactions();
            return await sendMessage(
                `┌─⧭ *🧹 CACHE CLEARED* ⧭─┐
│
├─⧭ All reaction tracking cleared
│
└─⧭🦊`
            );
        }
        
        // Help
        if (arg === 'help') {
            return await sendMessage(
                `┌─⧭ *📖 AUTO REACT HELP* ⧭─┐
│
├─⧭ *Commands:*
│ • ${PREFIX}autoreact on/off
│ • ${PREFIX}autoreact set 🦊
│ • ${PREFIX}autoreact dms
│ • ${PREFIX}autoreact groups
│ • ${PREFIX}autoreact both
│ • ${PREFIX}autoreact dmsonly
│ • ${PREFIX}autoreact groupsonly
│ • ${PREFIX}autoreact commands
│ • ${PREFIX}autoreact status
│ • ${PREFIX}autoreact clear
│
├─⧭ *Modes:*
│ • on/off - Enable/disable
│ • set - Change emoji
│ • dms/groups - Toggle locations
│ • both - React everywhere
│ • dmsonly/groupsonly - Specific
│ • commands - React to commands too
│
└─⧭🦊`
            );
        }
        
        // Invalid
        await sendMessage(
            `┌─⧭ *❓ INVALID COMMAND* ⧭─┐
│
├─⧭ Use ${PREFIX}autoreact help
│
└─⧭🦊`
        );
    }
};