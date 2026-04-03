// AutoTyping Manager
const autoTypingConfig = {
    enabled: false,
    duration: 10,
    autoReply: false,
    activeTypers: new Map(),
    botSock: null,
    isHooked: false
};

class AutoTypingManager {
    static initialize(sock) {
        if (!autoTypingConfig.isHooked && sock) {
            autoTypingConfig.botSock = sock;
            this.hookIntoBot();
            autoTypingConfig.isHooked = true;
            console.log('🦊 Auto-typing system initialized!');
        }
    }

    static hookIntoBot() {
        if (!autoTypingConfig.botSock || !autoTypingConfig.botSock.ev) return;
        
        autoTypingConfig.botSock.ev.on('messages.upsert', async (data) => {
            await this.handleIncomingMessage(data);
        });
        
        console.log('✅ Auto-typing hooked into message events');
    }

    static async handleIncomingMessage(data) {
        try {
            if (!data || !data.messages || data.messages.length === 0) return;
            if (!autoTypingConfig.enabled) return;
            
            const m = data.messages[0];
            if (!m || !m.key || m.key.fromMe) return;
            
            const messageText = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || 
                               m.message?.imageMessage?.caption || '';
            
            if (messageText.trim().startsWith('.')) return;
            
            const chatJid = m.key.remoteJid;
            if (!chatJid) return;
            
            const now = Date.now();
            
            if (autoTypingConfig.activeTypers.has(chatJid)) {
                const typerData = autoTypingConfig.activeTypers.get(chatJid);
                
                typerData.lastMessageTime = now;
                typerData.userCount++;
                
                if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
                
                typerData.timeoutId = setTimeout(async () => {
                    await this.stopTypingInChat(chatJid);
                }, autoTypingConfig.duration * 1000);
                
                autoTypingConfig.activeTypers.set(chatJid, typerData);
                return;
            }
            
            await this.startTyping(chatJid);
            
        } catch (err) {
            console.error("Auto-typing error:", err);
        }
    }

    static async startTyping(chatJid) {
        try {
            const sock = autoTypingConfig.botSock;
            
            await sock.sendPresenceUpdate('composing', chatJid);
            
            let isTyping = true;
            
            const keepTypingAlive = async () => {
                if (isTyping && autoTypingConfig.enabled) {
                    try {
                        await sock.sendPresenceUpdate('composing', chatJid);
                    } catch (err) {}
                }
            };
            
            const typingInterval = setInterval(keepTypingAlive, 2000);
            
            const timeoutId = setTimeout(async () => {
                isTyping = false;
                await this.stopTypingInChat(chatJid);
            }, autoTypingConfig.duration * 1000);
            
            autoTypingConfig.activeTypers.set(chatJid, {
                intervalId: typingInterval,
                timeoutId: timeoutId,
                userCount: 1,
                startTime: now,
                lastMessageTime: now,
                isTyping: true
            });
            
        } catch (err) {
            console.error("Start typing error:", err);
        }
    }

    static async stopTypingInChat(chatJid) {
        try {
            if (!autoTypingConfig.activeTypers.has(chatJid)) return;
            
            const typerData = autoTypingConfig.activeTypers.get(chatJid);
            const sock = autoTypingConfig.botSock;
            
            clearInterval(typerData.intervalId);
            if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
            
            autoTypingConfig.activeTypers.delete(chatJid);
            
            try {
                await sock.sendPresenceUpdate('paused', chatJid);
            } catch (err) {}
            
            if (autoTypingConfig.autoReply && autoTypingConfig.enabled) {
                try {
                    await sock.sendMessage(chatJid, {
                        text: `🦊 *Foxy was typing for ${autoTypingConfig.duration} seconds!*`
                    });
                } catch (err) {}
            }
            
        } catch (err) {
            console.error("Stop typing error:", err);
        }
    }

    static toggle() {
        autoTypingConfig.enabled = !autoTypingConfig.enabled;
        if (!autoTypingConfig.enabled) this.clearAllTypers();
        return autoTypingConfig.enabled;
    }

    static status() {
        return {
            enabled: autoTypingConfig.enabled,
            duration: autoTypingConfig.duration,
            autoReply: autoTypingConfig.autoReply,
            activeSessions: autoTypingConfig.activeTypers.size,
            isHooked: autoTypingConfig.isHooked
        };
    }

    static setDuration(seconds) {
        if (seconds >= 1 && seconds <= 60) {
            autoTypingConfig.duration = seconds;
            return true;
        }
        return false;
    }

    static toggleAutoReply() {
        autoTypingConfig.autoReply = !autoTypingConfig.autoReply;
        return autoTypingConfig.autoReply;
    }

    static clearAllTypers() {
        autoTypingConfig.activeTypers.forEach((typerData) => {
            clearInterval(typerData.intervalId);
            if (typerData.timeoutId) clearTimeout(typerData.timeoutId);
        });
        autoTypingConfig.activeTypers.clear();
    }
}

export default {
    name: "autotyping",
    alias: ["autotype", "typing", "foxytype"],
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
        if (!autoTypingConfig.isHooked) {
            autoTypingConfig.botSock = sock;
            AutoTypingManager.initialize(sock);
        }
        
        const arg = args[0]?.toLowerCase();
        
        // No args - show status
        if (!arg) {
            const status = AutoTypingManager.status();
            return await sendMessage(
                `┌─⧭ *FOXY AUTO TYPING* ⌨️ ⧭─┐
│
├─⧭ *Status:* ${status.enabled ? '✅ ON' : '❌ OFF'}
├─⧭ *Duration:* ${status.duration}s
├─⧭ *Auto Reply:* ${status.autoReply ? '✅' : '❌'}
├─⧭ *Active:* ${status.activeSessions}
│
├─⧭ *Commands:*
│ • ${PREFIX}autotyping on
│ • ${PREFIX}autotyping off
│ • ${PREFIX}autotyping 15
│ • ${PREFIX}autotyping reply
│ • ${PREFIX}autotyping status
│ • ${PREFIX}autotyping help
│
└─⧭🦊`
            );
        }
        
        // On
        if (arg === 'on') {
            AutoTypingManager.toggle();
            return await sendMessage(
                `┌─⧭ *✅ AUTO TYPING ON* ⧭─┐
│
├─⧭ Foxy will now show typing
├─⧭ Duration: ${autoTypingConfig.duration}s
│
└─⧭🦊`
            );
        }
        
        // Off
        if (arg === 'off') {
            AutoTypingManager.toggle();
            return await sendMessage(
                `┌─⧭ *❌ AUTO TYPING OFF* ⧭─┐
│
├─⧭ Foxy stopped typing
│
└─⧭🦊`
            );
        }
        
        // Set duration
        const duration = parseInt(arg);
        if (!isNaN(duration) && duration >= 1 && duration <= 60) {
            AutoTypingManager.setDuration(duration);
            return await sendMessage(
                `┌─⧭ *✅ DURATION SET* ⧭─┐
│
├─⧭ ${duration} seconds
│
└─⧭🦊`
            );
        }
        
        // Toggle auto reply
        if (arg === 'reply') {
            const autoReply = AutoTypingManager.toggleAutoReply();
            return await sendMessage(
                `┌─⧭ *✅ AUTO REPLY* ⧭─┐
│
├─⧭ *Status:* ${autoReply ? '✅ ON' : '❌ OFF'}
│
└─⧭🦊`
            );
        }
        
        // Status
        if (arg === 'status') {
            const status = AutoTypingManager.status();
            return await sendMessage(
                `┌─⧭ *📊 TYPING STATUS* ⧭─┐
│
├─⧭ *Enabled:* ${status.enabled ? '✅' : '❌'}
├─⧭ *Duration:* ${status.duration}s
├─⧭ *Auto Reply:* ${status.autoReply ? '✅' : '❌'}
├─⧭ *Active:* ${status.activeSessions}
│
└─⧭🦊`
            );
        }
        
        // Test typing
        if (arg === 'test') {
            const testDuration = args[1] ? parseInt(args[1]) : 5;
            if (isNaN(testDuration) || testDuration < 1 || testDuration > 30) {
                return await sendMessage(
                    `┌─⧭ *⚠️ INVALID* ⧭─┐
│
├─⧭ Use 1-30 seconds
├─⧭ Example: ${PREFIX}autotyping test 10
│
└─⧭🦊`
                );
            }
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *⌨️ TEST TYPING* ⧭─┐
│
├─⧭ Typing for ${testDuration}s...
│
└─⧭🦊`
            }, { quoted: m });
            
            await sock.sendPresenceUpdate('composing', chatId);
            
            setTimeout(async () => {
                await sock.sendPresenceUpdate('paused', chatId);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ TEST COMPLETE* ⧭─┐
│
├─⧭ Typed for ${testDuration}s
│
└─⧭🦊`
                }, { quoted: m });
            }, testDuration * 1000);
            
            return;
        }
        
        // Help
        if (arg === 'help') {
            return await sendMessage(
                `┌─⧭ *📖 TYPING HELP* ⧭─┐
│
├─⧭ *Commands:*
│ • ${PREFIX}autotyping on
│ • ${PREFIX}autotyping off
│ • ${PREFIX}autotyping 15
│ • ${PREFIX}autotyping reply
│ • ${PREFIX}autotyping status
│ • ${PREFIX}autotyping test 10
│ • ${PREFIX}autotyping help
│
├─⧭ *Duration:*
│ • 1-60 seconds
│ • Default: 10s
│
└─⧭🦊`
            );
        }
        
        // Invalid
        await sendMessage(
            `┌─⧭ *❓ INVALID COMMAND* ⧭─┐
│
├─⧭ Use ${PREFIX}autotyping help
│
└─⧭🦊`
        );
    }
};