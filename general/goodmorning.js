import moment from 'moment-timezone';

export default {
    name: 'goodmorning',
    alias: ['gm', 'morning', 'صبح بخیر'],
    category: 'general',
    description: 'Say good morning with a beautiful message 🌅',
    
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
        
        // Array of good morning messages
        const messages = [
            `🌅 *Good Morning, ${sender}!* ☀️\n\nRise and shine! May your day be filled with joy and success.`,
            `☀️ *Selamat Pagi, ${sender}!* 🌅\n\nSemoga harimu menyenangkan dan penuh berkah!`,
            `🌄 *Morning, ${sender}!*\n\nWake up and make today amazing!`,
            `🌤️ *Good Morning!*\n\nAnother beautiful day to be awesome, ${sender}!`,
            `☀️ *Pagi yang cerah, ${sender}!*\n\nJangan lupa sarapan dan bersyukur hari ini!`,
            `🌅 *Good Morning!*\n\nYour coffee is waiting, ${sender}! ☕`,
            `🌄 *Rise and Shine!*\n\nThe early fox catches the worm, ${sender}! 🦊`,
            `☀️ *Good Morning!*\n\nToday is going to be your best day yet, ${sender}!`
        ];
        
        // Pick random message
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        
        // Build response
        let response = `┌─⧭ *FOXY GOOD MORNING* 🌅 ⧭─┐
│
├─⧭ ${randomMsg}
│
├─⧭ *📅 Today:* ${dayName}, ${dateStr}
├─⧭ *⏰ Time (WIB):* ${timeWIB}
├─⧭ *⏰ Time (WITA):* ${timeWITA}
├─⧭ *⏰ Time (WIT):* ${timeWIT}
│
├─⧭ *💡 Morning Tips:*
│ • Drink a glass of water 💧
│ • Stretch your body 🧘
│ • Smile to yourself 😊
│ • Be productive today! 💪
│
└─⧭🦊 *Have a great day!*`;

        // Add group specific if in group
        if (isGroup) {
            try {
                const groupMetadata = await sock.groupMetadata(chatId);
                response = `┌─⧭ *FOXY GOOD MORNING* 🌅 ⧭─┐
│
├─⧭ *Group:* ${groupMetadata.subject}
├─⧭ *Member:* ${sender}
│
├─⧭ ${randomMsg}
│
├─⧭ *📅 Today:* ${dayName}, ${dateStr}
├─⧭ *⏰ Time (WIB):* ${timeWIB}
│
├─⧭ *💡 Morning Tips:*
│ • Drink water 💧
│ • Stay positive ✨
│ • Be kind to others 💝
│
└─⧭🦊 *Good morning everyone!*`;
            } catch (e) {}
        }
        
        await sock.sendMessage(chatId, {
            text: response
        }, { quoted: msg });
        
        // Add reaction
        await sock.sendMessage(chatId, {
            react: { text: "🌅", key: msg.key }
        });
    }
};