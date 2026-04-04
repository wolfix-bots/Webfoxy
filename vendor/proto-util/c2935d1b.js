// ===== OWNER REACT CONFIG =====
const ownerReactConfig = {
  enabled: false, // OFF by default
  emoji: "🦊", // Default emoji
  reactToDMs: true,
  reactToGroups: true,
  reactToCommands: true,
  activeReactions: new Set(),
  botSock: null,
  isHooked: false,
  maxReactionsPerMinute: 30,
  reactionTimestamps: [],
  cooldown: 500,
  userCooldowns: new Map(),
  ownerJid: null
};

// ===== OWNER REACT MANAGER =====
class OwnerReactManager {
  static initialize(sock) {
    if (!ownerReactConfig.isHooked && sock) {
      ownerReactConfig.botSock = sock;
      this.hookIntoBot();
      ownerReactConfig.isHooked = true;
      console.log('👑 Owner-react system initialized (OFF by default)!');
      this.loadOwnerJid();
    }
  }
  
  static loadOwnerJid() {
    try {
      const fs = require('fs');
      if (fs.existsSync('./owner.json')) {
        const ownerData = JSON.parse(fs.readFileSync('./owner.json', 'utf8'));
        ownerReactConfig.ownerJid = ownerData.OWNER_JID || ownerData.OWNER_CLEAN_JID;
        console.log('👑 Owner JID loaded');
      }
    } catch (err) {
      console.log('⚠️ Could not load owner JID');
    }
  }

  static hookIntoBot() {
    if (!ownerReactConfig.botSock || !ownerReactConfig.botSock.ev) return;
    
    ownerReactConfig.botSock.ev.on('messages.upsert', async (data) => {
      await this.handleIncomingMessage(data);
    });
    
    console.log('✅ Owner-react hooked into message events');
  }

  static isRateLimited() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    ownerReactConfig.reactionTimestamps = ownerReactConfig.reactionTimestamps.filter(
      timestamp => timestamp > oneMinuteAgo
    );
    
    return ownerReactConfig.reactionTimestamps.length >= ownerReactConfig.maxReactionsPerMinute;
  }

  static isFromOwner(msg) {
    try {
      if (!msg || !msg.key) return false;
      if (msg.key.fromMe) return true;
      
      const senderJid = msg.key.participant || msg.key.remoteJid;
      if (!senderJid) return false;
      
      if (ownerReactConfig.ownerJid) {
        const senderNumber = senderJid.split('@')[0].split(':')[0];
        const ownerNumber = ownerReactConfig.ownerJid.split('@')[0].split(':')[0];
        return senderNumber === ownerNumber;
      }
      
      if (global.jidManager) {
        return global.jidManager.isOwner({ key: msg.key });
      }
      
      return false;
    } catch {
      return false;
    }
  }

  static shouldReact(data) {
    try {
      if (!data || !data.messages || data.messages.length === 0) return false;
      
      const m = data.messages[0];
      
      if (!ownerReactConfig.enabled) return false;
      if (!m || !m.key) return false;
      if (!this.isFromOwner(m)) return false;
      
      const chatId = m.key.remoteJid;
      const messageId = `${chatId}_${m.key.id}`;
      
      if (ownerReactConfig.activeReactions.has(messageId)) return false;
      
      const isGroup = chatId.includes('@g.us');
      const isDM = !isGroup;
      
      if (isDM && !ownerReactConfig.reactToDMs) return false;
      if (isGroup && !ownerReactConfig.reactToGroups) return false;
      
      let messageText = '';
      if (m.message) {
        if (m.message.conversation) messageText = m.message.conversation;
        else if (m.message.extendedTextMessage?.text) messageText = m.message.extendedTextMessage.text;
        else if (m.message.imageMessage?.caption) messageText = m.message.imageMessage.caption || '';
        else if (m.message.videoMessage?.caption) messageText = m.message.videoMessage.caption || '';
      }
      
      const isCommand = messageText.trim().startsWith('.');
      if (isCommand && !ownerReactConfig.reactToCommands) return false;
      
      if (this.isRateLimited()) return false;
      
      return {
        should: true,
        msg: m,
        chatId,
        messageId,
        isCommand
      };
      
    } catch {
      return false;
    }
  }

  static async handleIncomingMessage(data) {
    try {
      const check = this.shouldReact(data);
      if (!check) return;
      
      const { msg, chatId, messageId } = check;
      const sock = ownerReactConfig.botSock;
      
      ownerReactConfig.activeReactions.add(messageId);
      
      setTimeout(() => {
        ownerReactConfig.activeReactions.delete(messageId);
      }, 5 * 60 * 1000);
      
      await sock.sendMessage(chatId, {
        react: {
          text: ownerReactConfig.emoji,
          key: msg.key
        }
      });
      
      ownerReactConfig.reactionTimestamps.push(Date.now());
      
      console.log(`👑 Reacted ${ownerReactConfig.emoji} to owner's message`);
      
    } catch (err) {
      console.error("Owner-react error:", err.message);
    }
  }

  static status() {
    return {
      enabled: ownerReactConfig.enabled,
      emoji: ownerReactConfig.emoji,
      reactToDMs: ownerReactConfig.reactToDMs,
      reactToGroups: ownerReactConfig.reactToGroups,
      reactToCommands: ownerReactConfig.reactToCommands,
      isHooked: ownerReactConfig.isHooked,
      activeReactions: ownerReactConfig.activeReactions.size,
      rateLimit: `${ownerReactConfig.reactionTimestamps.length}/${ownerReactConfig.maxReactionsPerMinute}`,
      ownerJid: ownerReactConfig.ownerJid ? '✅ Loaded' : '❌ Not loaded'
    };
  }

  static toggle() {
    ownerReactConfig.enabled = !ownerReactConfig.enabled;
    return ownerReactConfig.enabled;
  }

  static setEmoji(emoji) {
    if (emoji && emoji.length <= 5) {
      ownerReactConfig.emoji = emoji;
      return true;
    }
    return false;
  }

  static toggleDMs() {
    ownerReactConfig.reactToDMs = !ownerReactConfig.reactToDMs;
    return ownerReactConfig.reactToDMs;
  }

  static toggleGroups() {
    ownerReactConfig.reactToGroups = !ownerReactConfig.reactToGroups;
    return ownerReactConfig.reactToGroups;
  }

  static toggleCommands() {
    ownerReactConfig.reactToCommands = !ownerReactConfig.reactToCommands;
    return ownerReactConfig.reactToCommands;
  }

  static setBoth() {
    ownerReactConfig.reactToDMs = true;
    ownerReactConfig.reactToGroups = true;
  }

  static setDMsOnly() {
    ownerReactConfig.reactToDMs = true;
    ownerReactConfig.reactToGroups = false;
  }

  static setGroupsOnly() {
    ownerReactConfig.reactToDMs = false;
    ownerReactConfig.reactToGroups = true;
  }

  static clearAllReactions() {
    ownerReactConfig.activeReactions.clear();
    ownerReactConfig.reactionTimestamps = [];
  }
}

// ===== MAIN COMMAND EXPORT =====
export default {
  name: "ownerreact",
  alias: ["oreact", "ownreact", "oreaction", "foxyreact", "ore"],
  desc: "Auto-react to OWNER's messages only 👑",
  category: "owner",
  ownerOnly: true,
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    try {
      // ===== OWNER CHECK =====
      const isOwner = jidManager.isOwner(m);
      
      if (!isOwner) {
        return await sendMessage(
          `┌─⧭ *OWNER ONLY* 👑 ⧭─┐
│
├─⧭ This command is for the bot owner only.
├─⧭ It auto-reacts to OWNER's messages.
│
├─⧭ *Current Status:*
│ ${ownerReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}
│
└─⧭🦊`
        );
      }
      
      // Initialize on first command use
      if (!ownerReactConfig.isHooked) {
        OwnerReactManager.initialize(sock);
        
        if (jidManager && jidManager.owner) {
          ownerReactConfig.ownerJid = jidManager.owner.cleanJid || jidManager.owner.rawJid;
        }
        
        console.log('👑 Owner-react system initialized!');
      }
      
      // No args - show status
      if (args.length === 0) {
        const status = OwnerReactManager.status();
        
        await sendMessage(
          `┌─⧭ *OWNER REACT* 👑 ⧭─┐
│
├─⧭ *Status:* ${status.enabled ? '🟢 ON' : '🔴 OFF'}
├─⧭ *Emoji:* ${status.emoji}
├─⧭ *DMs:* ${status.reactToDMs ? '✅' : '❌'}
├─⧭ *Groups:* ${status.reactToGroups ? '✅' : '❌'}
├─⧭ *Commands:* ${status.reactToCommands ? '✅' : '❌'}
├─⧭ *Active:* ${status.activeReactions}
├─⧭ *Rate:* ${status.rateLimit}
│
├─⧭ *Commands:*
│ • \`${PREFIX}ore on\` - Enable
│ • \`${PREFIX}ore off\` - Disable
│ • \`${PREFIX}ore set 🦊\` - Set emoji
│ • \`${PREFIX}ore dms\` - Toggle DMs
│ • \`${PREFIX}ore groups\` - Toggle groups
│ • \`${PREFIX}ore both\` - React everywhere
│ • \`${PREFIX}ore status\` - Full status
│ • \`${PREFIX}ore test\` - Test reaction
│ • \`${PREFIX}ore help\` - Full help
│
└─⧭🦊`
        );
        return;
      }
      
      const arg = args[0].toLowerCase();
      
      // Toggle on/off
      if (arg === 'on' || arg === 'enable') {
        ownerReactConfig.enabled = true;
        
        await sendMessage(
          `┌─⧭ *OWNER REACT ENABLED* ✅ ⧭─┐
│
├─⧭ Foxy will now react to ALL your messages!
│
├─⧭ *Settings:*
│ • Emoji: ${ownerReactConfig.emoji}
│ • DMs: ${ownerReactConfig.reactToDMs ? '✅' : '❌'}
│ • Groups: ${ownerReactConfig.reactToGroups ? '✅' : '❌'}
│ • Commands: ${ownerReactConfig.reactToCommands ? '✅' : '❌'}
│
├─⧭ Try sending any message!
│
└─⧭🦊`
        );
        return;
      }
      
      if (arg === 'off' || arg === 'disable') {
        ownerReactConfig.enabled = false;
        
        await sendMessage(
          `┌─⧭ *OWNER REACT DISABLED* ❌ ⧭─┐
│
├─⧭ Foxy will no longer react to your messages.
│
├─⧭ Use \`${PREFIX}ore on\` to enable again.
│
└─⧭🦊`
        );
        return;
      }
      
      // Set emoji
      if (arg === 'set' || arg === 'emoji') {
        if (!args[1]) {
          return await sendMessage(
            `┌─⧭ *MISSING EMOJI* ⚠️ ⧭─┐
│
├─⧭ Usage: \`${PREFIX}ore set 🦊\`
│
├─⧭ *Examples:*
│ • ${PREFIX}ore set ❤️
│ • ${PREFIX}ore set 👍
│ • ${PREFIX}ore set 👑
│
└─⧭🦊`
          );
        }
        
        const emoji = args[1];
        const success = OwnerReactManager.setEmoji(emoji);
        
        if (success) {
          await sendMessage(
            `┌─⧭ *EMOJI UPDATED* ✅ ⧭─┐
│
├─⧭ New reaction emoji: ${emoji}
│
├─⧭ Foxy will now react with ${emoji}!
│
└─⧭🦊`
          );
        } else {
          await sendMessage(
            `┌─⧭ *INVALID EMOJI* ❌ ⧭─┐
│
├─⧭ Please use a single emoji.
│
├─⧭ *Example:* ${PREFIX}ore set 🦊
│
└─⧭🦊`
          );
        }
        return;
      }
      
      // Toggle DMs
      if (arg === 'dms' || arg === 'dm') {
        const dmsEnabled = OwnerReactManager.toggleDMs();
        
        await sendMessage(
          `┌─⧭ *DM REACTIONS* 💬 ⧭─┐
│
├─⧭ *Status:* ${dmsEnabled ? '✅ ENABLED' : '❌ DISABLED'}
│
├─⧭ ${dmsEnabled ? 
      'Foxy will react to your DMs.' : 
      'Foxy will NOT react in DMs.'}
│
└─⧭🦊`
        );
        return;
      }
      
      // Toggle groups
      if (arg === 'groups' || arg === 'group') {
        const groupsEnabled = OwnerReactManager.toggleGroups();
        
        await sendMessage(
          `┌─⧭ *GROUP REACTIONS* 👥 ⧭─┐
│
├─⧭ *Status:* ${groupsEnabled ? '✅ ENABLED' : '❌ DISABLED'}
│
├─⧭ ${groupsEnabled ? 
      'Foxy will react in groups.' : 
      'Foxy will NOT react in groups.'}
│
└─⧭🦊`
        );
        return;
      }
      
      // Toggle commands
      if (arg === 'commands' || arg === 'cmd') {
        const cmdEnabled = OwnerReactManager.toggleCommands();
        
        await sendMessage(
          `┌─⧭ *COMMAND REACTIONS* ⌨️ ⧭─┐
│
├─⧭ *Status:* ${cmdEnabled ? '✅ ENABLED' : '❌ DISABLED'}
│
├─⧭ ${cmdEnabled ? 
      'Foxy will react to your commands.' : 
      'Foxy will ignore your commands.'}
│
└─⧭🦊`
        );
        return;
      }
      
      // Set both
      if (arg === 'both' || arg === 'all') {
        OwnerReactManager.setBoth();
        
        await sendMessage(
          `┌─⧭ *REACT EVERYWHERE* 🌍 ⧭─┐
│
├─⧭ Foxy will react in BOTH DMs and Groups!
│
├─⧭ *DMs:* ✅ ON
├─⧭ *Groups:* ✅ ON
│
└─⧭🦊`
        );
        return;
      }
      
      // Set DMs only
      if (arg === 'dmsonly' || arg === 'onlydms') {
        OwnerReactManager.setDMsOnly();
        
        await sendMessage(
          `┌─⧭ *DMS ONLY MODE* 💬 ⧭─┐
│
├─⧭ Foxy will ONLY react in DMs.
├─⧭ Groups reactions: ❌ OFF
│
└─⧭🦊`
        );
        return;
      }
      
      // Set groups only
      if (arg === 'groupsonly' || arg === 'onlygroups') {
        OwnerReactManager.setGroupsOnly();
        
        await sendMessage(
          `┌─⧭ *GROUPS ONLY MODE* 👥 ⧭─┐
│
├─⧭ Foxy will ONLY react in Groups.
├─⧭ DMs reactions: ❌ OFF
│
└─⧭🦊`
        );
        return;
      }
      
      // Test reaction
      if (arg === 'test') {
        try {
          await sock.sendMessage(chatId, {
            react: {
              text: args[1] || ownerReactConfig.emoji,
              key: m.key
            }
          });
          
          await sendMessage(
            `┌─⧭ *TEST REACTION* ✅ ⧭─┐
│
├─⧭ Reacted with ${args[1] || ownerReactConfig.emoji}
│
├─⧭ *Status:* ${ownerReactConfig.enabled ? '🟢 ON' : '🔴 OFF'}
├─⧭ *Emoji:* ${ownerReactConfig.emoji}
│
└─⧭🦊`
          );
        } catch (err) {
          await sendMessage(`❌ Test failed: ${err.message}`);
        }
        return;
      }
      
      // Clear tracking
      if (arg === 'clear' || arg === 'reset') {
        OwnerReactManager.clearAllReactions();
        
        await sendMessage(
          `┌─⧭ *CACHE CLEARED* 🧹 ⧭─┐
│
├─⧭ Cleared all active reaction tracking.
├─⧭ Foxy starts fresh!
│
└─⧭🦊`
        );
        return;
      }
      
      // Detailed status
      if (arg === 'status' || arg === 'stats') {
        const status = OwnerReactManager.status();
        
        await sendMessage(
          `┌─⧭ *OWNER REACT STATUS* 📊 ⧭─┐
│
├─⧭ *System:* ${status.enabled ? '🟢 ON' : '🔴 OFF'}
├─⧭ *Hooked:* ${status.isHooked ? '✅' : '❌'}
├─⧭ *Owner JID:* ${status.ownerJid}
├─⧭ *Emoji:* ${status.emoji}
├─⧭ *DMs:* ${status.reactToDMs ? '✅' : '❌'}
├─⧭ *Groups:* ${status.reactToGroups ? '✅' : '❌'}
├─⧭ *Commands:* ${status.reactToCommands ? '✅' : '❌'}
├─⧭ *Active:* ${status.activeReactions}
├─⧭ *Rate:* ${status.rateLimit}/min
│
└─⧭🦊`
        );
        return;
      }
      
      // Help
      if (arg === 'help') {
        await sendMessage(
          `┌─⧭ *OWNER REACT HELP* 📖 ⧭─┐
│
├─⧭ *What it does:*
│ • Auto-reacts to YOUR messages (owner only)
│ • OFF by default - you must enable it
│
├─⧭ *Commands:*
│ • \`.ore on/off\` - Toggle system
│ • \`.ore set 🦊\` - Change emoji
│ • \`.ore dms\` - Toggle DMs
│ • \`.ore groups\` - Toggle groups
│ • \`.ore commands\` - Toggle commands
│ • \`.ore both\` - React everywhere
│ • \`.ore dmsonly\` - Only in DMs
│ • \`.ore groupsonly\` - Only in groups
│ • \`.ore test\` - Test reaction
│ • \`.ore status\` - Detailed status
│ • \`.ore clear\` - Clear tracking
│
├─⧭ *Examples:*
│ • \`.ore on\` - Enable
│ • \`.ore set ❤️\` - Heart emoji
│ • \`.ore dmsonly\` - Only DMs
│
└─⧭🦊`
        );
        return;
      }
      
      // Invalid command
      await sendMessage(
        `┌─⧭ *INVALID COMMAND* ❓ ⧭─┐
│
├─⧭ Use \`.ore help\` for available commands.
│
└─⧭🦊`
      );
      
    } catch (err) {
      console.error("👑 OwnerReact error:", err);
      await sendMessage(
        `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ ${err.message}
│
└─⧭🦊`
      );
    }
  }
};

console.log('👑 Owner-React module loaded (OFF by default)');