import { writeFileSync, readFileSync, existsSync } from 'fs';

export default {
    name: 'mode',
    alias: ['botmode'],
    category: 'owner',
    ownerOnly: true,
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        
        // Simple modes
        const modes = {
            'public': '🌍 Public Mode - Everyone can use me',
            'silent': '🔇 Silent Mode - Only owner sees me'
        };
        
        // Show current mode
        if (!args[0]) {
            let current = 'public';
            if (existsSync('./bot_mode.json')) {
                try {
                    const data = JSON.parse(readFileSync('./bot_mode.json'));
                    current = data.mode || 'public';
                } catch {}
            }
            
            return sock.sendMessage(chatId, {
                text: `🦊 *Current Mode:* ${modes[current]}\n\nUsage: .mode public or .mode silent`
            }, { quoted: msg });
        }
        
        const mode = args[0].toLowerCase();
        
        if (!modes[mode]) {
            return sock.sendMessage(chatId, {
                text: '❌ Use: .mode public or .mode silent'
            }, { quoted: msg });
        }
        
        // Save mode
        writeFileSync('./bot_mode.json', JSON.stringify({
            mode: mode,
            setAt: new Date().toISOString()
        }));
        
        // Update global
        if (typeof global !== 'undefined') global.BOT_MODE = mode;
        
        await sock.sendMessage(chatId, {
            text: `✅ ${modes[mode]}`
        }, { quoted: msg });
    }
};