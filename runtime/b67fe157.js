import moment from 'moment-timezone';

export default {
    name: 'goodnight',
    alias: ['gn', 'night', 'sleep', 'شب بخیر'],
    category: 'general',
    description: 'Say good night with a beautiful message 🌙',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        const isGroup = chatId.endsWith('@g.us');
        
        // Get current time in different timezones
        const timeJakarta = moment().tz('Asia/Jakarta').format('HH:mm');
        const timeWIB = moment().tz('Asia/Jakarta').format('HH:mm');
        const timeWITA = moment().tz('Asia/Makassar').format('HH:mm');
        const timeWIT = moment().tz('Asia/Jayapura').format('HH:mm');
        
        // Get day name
        const dayName = moment().format('dddd');
        const dateStr = moment().format('MMMM Do YYYY');
        
        // Array of good night messages
        const messages = [
            `🌙 *Good Night, ${sender}!* 🌌\n\nSleep tight and dream big! May tomorrow be even better.`,
            `🌌 *Selamat Malam, ${sender}!* 🌙\n\nIstirahat yang cukup, besok adalah hari baru!`,
            `✨ *Good Night!*\n\nClose your eyes and drift into sweet dreams, ${sender}!`,
            `🌙 *Malam yang tenang, ${sender}!*\n\nSemoga mimpi indah menyertaimu.`,
            `⭐ *Good Night!*\n\nThe stars are watching over you, ${sender}!`,
            `🌌 *Time to rest!*\n\nRest your weary head, tomorrow is a new adventure, ${sender}!`,
            `🌙 *Good Night!*\n\nMay your dreams be filled with happiness!`,
            `✨ *Sweet Dreams!*\n\nSleep well, ${sender}! The fox will guard your dreams 🦊`
        ];
        
        // Pick random message
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        // Build response
        let response = `┌─⧭ *FOXY GOOD NIGHT* 🌙 ⧭─┐
│
├─⧭ ${randomMsg}
│
├─⧭ *📅 Today:* ${dayName}, ${dateStr}
├─⧭ *⏰ Time (WIB):* ${timeWIB}
├─⧭ *⏰ Time (WITA):* ${timeWITA}
├─⧭ *⏰ Time (WIT):* ${timeWIT}
│
├─⧭ *💡 Night Tips:*
│ • Put away your phone 📱
│ • Dim the lights 🕯️
│ • Think positive thoughts 💭
│ • Sleep 7-8 hours 😴
│
└─⧭🦊 *Sweet dreams!*`;

        // Add group specific if in group
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                response = `┌─⧭ *FOXY GOOD NIGHT* 🌙 ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Member:* ${sender}
│
├─⧭ ${randomMsg}
│
├─⧭ *📅 Today:* ${dayName}, ${dateStr}
├─⧭ *⏰ Time (WIB):* ${timeWIB}
│
├─⧭ *💡 Night Tips:*
│ • Rest well 😴
│ • Sweet dreams ✨
│ • See you tomorrow 👋
│
└─⧭🦊 *Good night everyone!*`;
            } catch (e) {}
        }
        
        await sock.sendMessage(chatId, {
            text: response
        }, { quoted: msg });
        
        // Add reaction
        await sock.sendMessage(chatId, {
            react: { text: "🌙", key: msg.key }
        });
    }
};