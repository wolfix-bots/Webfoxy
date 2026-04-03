// AutoRecording Manager
const autoRecordingConfig = {
    enabled: false,
    duration: 10,
    activeRecorders: new Map(),
    botSock: null,
    isHooked: false
};

class AutoRecordingManager {
    static initialize(sock) {
        if (!autoRecordingConfig.isHooked && sock) {
            autoRecordingConfig.botSock = sock;
            this.hookIntoBot();
            autoRecordingConfig.isHooked = true;
            console.log('🦊 Auto-recording system initialized!');
        }
    }

    static hookIntoBot() {
        if (!autoRecordingConfig.botSock || !autoRecordingConfig.botSock.ev) return;
        
        autoRecordingConfig.botSock.ev.on('messages.upsert', async (data) => {
            await this.handleIncomingMessage(data);
        });
        
        console.log('✅ Auto-recording hooked into message events');
    }

    static async handleIncomingMessage(data) {
        try {
            if (!data || !data.messages || data.messages.length === 0) return;
            if (!autoRecordingConfig.enabled) return;
            
            const m = data.messages[0];
            if (!m || !m.key || m.key.fromMe) return;
            
            const messageText = m.message?.conversation || 
                               m.message?.extendedTextMessage?.text || 
                               m.message?.imageMessage?.caption || '';
            
            if (messageText.trim().startsWith('.')) return;
            
            const chatJid = m.key.remoteJid;
            if (!chatJid) return;
            
            if (autoRecordingConfig.activeRecorders.has(chatJid)) {
                const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
                
                if (recorderData.timeoutId) clearTimeout(recorderData.timeoutId);
                
                recorderData.userCount++;
                recorderData.lastMessageTime = Date.now();
                
                recorderData.timeoutId = setTimeout(async () => {
                    await this.stopRecording(chatJid);
                }, autoRecordingConfig.duration * 1000);
                
                autoRecordingConfig.activeRecorders.set(chatJid, recorderData);
                return;
            }
            
            await this.startRecording(chatJid);
            
        } catch (err) {
            console.error("Auto-recording error:", err);
        }
    }

    static async startRecording(chatJid) {
        try {
            const sock = autoRecordingConfig.botSock;
            
            await sock.sendPresenceUpdate('recording', chatJid);
            
            let isRecording = true;
            
            const keepRecordingAlive = async () => {
                if (isRecording && autoRecordingConfig.enabled) {
                    try {
                        await sock.sendPresenceUpdate('recording', chatJid);
                    } catch (err) {}
                }
            };
            
            const recordingInterval = setInterval(keepRecordingAlive, 2000);
            
            const timeoutId = setTimeout(async () => {
                await this.stopRecording(chatJid);
            }, autoRecordingConfig.duration * 1000);
            
            autoRecordingConfig.activeRecorders.set(chatJid, {
                intervalId: recordingInterval,
                userCount: 1,
                startTime: Date.now(),
                lastMessageTime: Date.now(),
                timeoutId: timeoutId,
                isRecording: true
            });
            
        } catch (err) {
            console.error("Start recording error:", err);
        }
    }

    static async stopRecording(chatJid) {
        try {
            if (!autoRecordingConfig.activeRecorders.has(chatJid)) return;
            
            const recorderData = autoRecordingConfig.activeRecorders.get(chatJid);
            const sock = autoRecordingConfig.botSock;
            
            clearInterval(recorderData.intervalId);
            if (recorderData.timeoutId) clearTimeout(recorderData.timeoutId);
            
            autoRecordingConfig.activeRecorders.delete(chatJid);
            
            try {
                await sock.sendPresenceUpdate('paused', chatJid);
            } catch (err) {}
            
        } catch (err) {
            console.error("Stop recording error:", err);
        }
    }

    static toggle() {
        autoRecordingConfig.enabled = !autoRecordingConfig.enabled;
        if (!autoRecordingConfig.enabled) this.clearAllRecorders();
        return autoRecordingConfig.enabled;
    }

    static status() {
        return {
            enabled: autoRecordingConfig.enabled,
            duration: autoRecordingConfig.duration,
            activeSessions: autoRecordingConfig.activeRecorders.size,
            isHooked: autoRecordingConfig.isHooked
        };
    }

    static setDuration(seconds) {
        if (seconds >= 1 && seconds <= 120) {
            autoRecordingConfig.duration = seconds;
            return true;
        }
        return false;
    }

    static clearAllRecorders() {
        autoRecordingConfig.activeRecorders.forEach((recorderData, chatJid) => {
            clearInterval(recorderData.intervalId);
            if (recorderData.timeoutId) clearTimeout(recorderData.timeoutId);
        });
        autoRecordingConfig.activeRecorders.clear();
    }
}

export default {
    name: "autorecording",
    alias: ["record", "recording", "rec", "foxyrecord"],
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
        if (!autoRecordingConfig.isHooked) {
            autoRecordingConfig.botSock = sock;
            AutoRecordingManager.initialize(sock);
        }
        
        const arg = args[0]?.toLowerCase();
        
        // No args - show status
        if (!arg) {
            const status = AutoRecordingManager.status();
            return await sendMessage(
                `┌─⧭ *FOXY AUTO RECORD* 🎤 ⧭─┐
│
├─⧭ *Status:* ${status.enabled ? '✅ ON' : '❌ OFF'}
├─⧭ *Duration:* ${status.duration}s
├─⧭ *Active:* ${status.activeSessions}
│
├─⧭ *Commands:*
│ • ${PREFIX}autorecording on
│ • ${PREFIX}autorecording off
│ • ${PREFIX}autorecording 30
│ • ${PREFIX}autorecording status
│ • ${PREFIX}autorecording help
│
└─⧭🦊`
            );
        }
        
        // On
        if (arg === 'on') {
            AutoRecordingManager.toggle();
            return await sendMessage(
                `┌─⧭ *✅ AUTO RECORD ON* ⧭─┐
│
├─⧭ Foxy will now show recording
├─⧭ Duration: ${autoRecordingConfig.duration}s
│
└─⧭🦊`
            );
        }
        
        // Off
        if (arg === 'off') {
            AutoRecordingManager.toggle();
            return await sendMessage(
                `┌─⧭ *❌ AUTO RECORD OFF* ⧭─┐
│
├─⧭ Foxy stopped recording
│
└─⧭🦊`
            );
        }
        
        // Set duration
        const duration = parseInt(arg);
        if (!isNaN(duration) && duration >= 1 && duration <= 120) {
            AutoRecordingManager.setDuration(duration);
            return await sendMessage(
                `┌─⧭ *✅ DURATION SET* ⧭─┐
│
├─⧭ ${duration} seconds
│
└─⧭🦊`
            );
        }
        
        // Status
        if (arg === 'status') {
            const status = AutoRecordingManager.status();
            return await sendMessage(
                `┌─⧭ *📊 RECORD STATUS* ⧭─┐
│
├─⧭ *Enabled:* ${status.enabled ? '✅' : '❌'}
├─⧭ *Duration:* ${status.duration}s
├─⧭ *Active:* ${status.activeSessions}
│
└─⧭🦊`
            );
        }
        
        // Test recording
        if (arg === 'test') {
            const testDuration = args[1] ? parseInt(args[1]) : 10;
            if (isNaN(testDuration) || testDuration < 1 || testDuration > 120) {
                return await sendMessage(
                    `┌─⧭ *⚠️ INVALID* ⧭─┐
│
├─⧭ Use 1-120 seconds
├─⧭ Example: ${PREFIX}autorecording test 15
│
└─⧭🦊`
                );
            }
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *🎤 TEST RECORDING* ⧭─┐
│
├─⧭ Recording for ${testDuration}s...
│
└─⧭🦊`
            }, { quoted: m });
            
            await sock.sendPresenceUpdate('recording', chatId);
            
            setTimeout(async () => {
                await sock.sendPresenceUpdate('paused', chatId);
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *✅ TEST COMPLETE* ⧭─┐
│
├─⧭ Recorded for ${testDuration}s
│
└─⧭🦊`
                }, { quoted: m });
            }, testDuration * 1000);
            
            return;
        }
        
        // Help
        if (arg === 'help') {
            return await sendMessage(
                `┌─⧭ *📖 RECORD HELP* ⧭─┐
│
├─⧭ *Commands:*
│ • ${PREFIX}autorecording on
│ • ${PREFIX}autorecording off
│ • ${PREFIX}autorecording 30
│ • ${PREFIX}autorecording status
│ • ${PREFIX}autorecording test 15
│ • ${PREFIX}autorecording help
│
├─⧭ *Duration:*
│ • 1-120 seconds
│ • Default: 10s
│
└─⧭🦊`
            );
        }
        
        // Invalid
        await sendMessage(
            `┌─⧭ *❓ INVALID COMMAND* ⧭─┐
│
├─⧭ Use ${PREFIX}autorecording help
│
└─⧭🦊`
        );
    }
};