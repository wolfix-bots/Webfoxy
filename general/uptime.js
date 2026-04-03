import os from 'os';
import moment from 'moment-timezone';

export default {
    name: 'uptime',
    alias: ['runtime', 'online', 'up'],
    category: 'general',
    description: 'Show how long the bot has been running ⏱️',
    
    async execute(sock, msg, args, PREFIX, extra) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        // Get bot start time from context or calculate from process.uptime()
        const startTime = extra?.startTime || Date.now() - (process.uptime() * 1000);
        const now = Date.now();
        const diffMs = now - startTime;
        
        // Calculate uptime components
        const diffSeconds = Math.floor(diffMs / 1000);
        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;
        
        // Format uptime string
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0 || days > 0) uptimeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;
        
        // Get bot start time in readable format
        const startDate = new Date(startTime);
        const startDateStr = startDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const startTimeStr = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        // Get system info
        const memoryUsage = process.memoryUsage();
        const memoryUsedMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
        const memoryHeapMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotalHeapMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        
        const cpuCores = os.cpus().length;
        const cpuModel = os.cpus()[0]?.model || 'Unknown';
        const loadAvg = os.loadavg().map(l => l.toFixed(2)).join(', ');
        
        const platform = os.platform();
        const arch = os.arch();
        const hostname = os.hostname();
        
        // Get different timezones
        const timeWIB = moment().tz('Asia/Jakarta').format('HH:mm:ss');
        const timeWITA = moment().tz('Asia/Makassar').format('HH:mm:ss');
        const timeWIT = moment().tz('Asia/Jayapura').format('HH:mm:ss');
        const timeUTC = moment().utc().format('HH:mm:ss');
        
        // Build response
        const response = `┌─⧭ *FOXY UPTIME* ⏱️ ⧭─┐
│
├─⧭ *🤖 Bot Uptime:*
│ • ${uptimeString}
│
├─⧭ *📅 Started on:*
│ • ${startDateStr}
│ • ${startTimeStr}
│
├─⧭ *⏰ Current Time:*
│ • WIB: ${timeWIB}
│ • WITA: ${timeWITA}
│ • WIT: ${timeWIT}
│ • UTC: ${timeUTC}
│
├─⧭ *💾 Memory Usage:*
│ • RSS: ${memoryUsedMB} MB
│ • Heap: ${memoryHeapMB} MB / ${memoryTotalHeapMB} MB
│ • ${((memoryHeapMB / memoryTotalHeapMB) * 100).toFixed(1)}% used
│
├─⧭ *🖥️ System Info:*
│ • Platform: ${platform} (${arch})
│ • CPU: ${cpuCores} cores
│ • Load: ${loadAvg}
│ • Host: ${hostname}
│
├─⧭ *📊 Stats:*
│ • Days: ${days}
│ • Hours: ${hours}
│ • Minutes: ${minutes}
│ • Seconds: ${seconds}
│ • Total: ${diffSeconds} seconds
│
├─⧭ *👤 Requested by:* ${sender}
│
└─⧭🦊 *Foxy is still running!*`;

        await sock.sendMessage(chatId, {
            text: response
        }, { quoted: msg });
        
        // Add reaction
        await sock.sendMessage(chatId, {
            react: { text: "⏱️", key: msg.key }
        });
    }
};