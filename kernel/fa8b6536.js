// commands/tools/ping.js - Simple version
import { foxCanUse, foxMode } from '../../utils/foxMaster.js';

export default {
    name: 'ping',
    alias: ['pong', 'speed', 'latency', 'test'],
    category: 'tools',
    description: 'Check bot response time 🏓',
    
    async execute(sock, msg, args, prefix) {
        if (!foxCanUse(msg, 'ping')) {
            const message = foxMode.getMessage();
            if (message) await sock.sendMessage(msg.key.remoteJid, { text: message });
            return;
        }
        
        const start = Date.now();
        
        // Send "Pinging..." message first
        const sentMsg = await sock.sendMessage(msg.key.remoteJid, {
            text: `🏓 *Pinging...* 🦊`
        });
        
        const end = Date.now();
        const latency = end - start;
        
        // Random funny responses
        const responses = [
            `🏓 *PONG!* ${latency}ms ok I'm active now what.. are you using me or what? 🦊`,
            `🏓 *PONG!* ${latency}ms - Fast like a fox! 🦊`,
            `🏓 *PONG!* ${latency}ms - Boop! I'm here! 🦊`,
            `🏓 *PONG!* ${latency}ms - You called? 🦊`,
            `🏓 *PONG!* ${latency}ms - Still alive! 🦊`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        // Edit the message to show PONG!
        await sock.sendMessage(msg.key.remoteJid, {
            text: randomResponse,
            edit: sentMsg.key
        });
    }
};