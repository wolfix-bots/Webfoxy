export default {
    name: 'weather',
    alias: ['wea', 'forecast', 'temp'],
    category: 'tools',
    desc: 'Get real-time weather for any city',

    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        const city = args.join(' ').trim();

        if (!city) {
            return sock.sendMessage(chatId, {
                text: `🌤️ *WEATHER*\n\n*Usage:* ${PREFIX||''}weather <city>\n*Example:* ${PREFIX||''}weather Nairobi`
            }, { quoted: m });
        }

        try {
            const res = await fetch('https://apis.xwolf.space/api/tools/weather?city=' + encodeURIComponent(city), {
                signal: AbortSignal.timeout(15000)
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'City not found');
            const r = data.result;

            const LINE = '━━━━━━━━━━━━━━━━━━━━';
            return sock.sendMessage(chatId, {
                text: `🌤️ *Weather: ${r.location || city}*\n${LINE}\n\n🌡️ *Temperature:* ${r.temperature}\n💧 *Humidity:* ${r.humidity}\n💨 *Wind:* ${r.wind_speed}\n☁️ *Condition:* ${r.description || r.condition}\n\n${LINE}`
            }, { quoted: m });
        } catch (e) {
            return sock.sendMessage(chatId, { text: `❌ Could not get weather for *${city}*. Check the city name and try again.` }, { quoted: m });
        }
    }
};
