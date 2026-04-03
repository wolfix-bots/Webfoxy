import axios from 'axios';

export default {
    name: 'quran',
    alias: ['quranverse', 'koran', 'islam', '🕋'],
    category: 'general',
    description: 'Get Quran verses and scripture 🕋',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        
        // Show help
        if (args[0]?.toLowerCase() === 'help') {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY QURAN* 🕋 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}quran random
│ • ${PREFIX}quran 1:1
│ • ${PREFIX}quran 36
│ • ${PREFIX}quran Al-Fatiha
│
├─⧭ *Examples:*
│ • ${PREFIX}quran random
│ • ${PREFIX}quran 1:1
│ • ${PREFIX}quran 36:1-5
│ • ${PREFIX}quran Al-Ikhlas
│
├─⧭ *Translations:*
│ • English (default)
│ • Arabic (add -ar)
│
└─⧭🦊 *Holy Quran*`
            }, { quoted: msg });
        }
        
        try {
            // Check for Arabic option
            const isArabic = args.includes('-ar') || args.includes('arabic');
            const cleanArgs = args.filter(arg => arg !== '-ar' && arg !== 'arabic');
            
            let surah = '';
            let ayah = '';
            let translation = '';
            
            // Random verse
            if (cleanArgs[0]?.toLowerCase() === 'random' || cleanArgs.length === 0) {
                const randomSurah = Math.floor(Math.random() * 114) + 1;
                const response = await axios.get(`http://api.alquran.cloud/v1/surah/${randomSurah}`, {
                    timeout: 8000
                });
                
                const surahData = response.data.data;
                const randomAyah = Math.floor(Math.random() * surahData.numberOfAyahs) + 1;
                
                const ayahResponse = await axios.get(`http://api.alquran.cloud/v1/ayah/${randomSurah}:${randomAyah}/en.sahih`, {
                    timeout: 8000
                });
                
                surah = surahData.englishName;
                ayah = `${surahData.number}:${randomAyah}`;
                translation = ayahResponse.data.data.text;
            }
            // Specific surah/ayah
            else {
                const query = cleanArgs.join(' ').replace(/\s+/g, '');
                
                // Handle format like "1:1" or "36" or "Al-Fatiha"
                let apiUrl = '';
                if (query.includes(':')) {
                    // Specific verse
                    apiUrl = `http://api.alquran.cloud/v1/ayah/${query}/en.sahih`;
                } else if (!isNaN(query)) {
                    // Just surah number
                    const surahNum = parseInt(query);
                    const response = await axios.get(`http://api.alquran.cloud/v1/surah/${surahNum}`, {
                        timeout: 8000
                    });
                    
                    const surahData = response.data.data;
                    const firstAyah = await axios.get(`http://api.alquran.cloud/v1/ayah/${surahNum}:1/en.sahih`, {
                        timeout: 8000
                    });
                    
                    surah = surahData.englishName;
                    ayah = `${surahNum}:1`;
                    translation = firstAyah.data.data.text;
                } else {
                    // Surah name
                    const response = await axios.get(`http://api.alquran.cloud/v1/surah/${encodeURIComponent(query)}`, {
                        timeout: 8000
                    });
                    
                    const surahData = response.data.data;
                    const firstAyah = await axios.get(`http://api.alquran.cloud/v1/ayah/${surahData.number}:1/en.sahih`, {
                        timeout: 8000
                    });
                    
                    surah = surahData.englishName;
                    ayah = `${surahData.number}:1`;
                    translation = firstAyah.data.data.text;
                }
                
                if (apiUrl) {
                    const response = await axios.get(apiUrl, { timeout: 8000 });
                    const data = response.data.data;
                    
                    surah = data.surah.englishName;
                    ayah = `${data.surah.number}:${data.numberInSurah}`;
                    translation = data.text;
                }
            }
            
            // Get Arabic if requested
            let arabicText = '';
            if (isArabic) {
                try {
                    const arabicResponse = await axios.get(`http://api.alquran.cloud/v1/ayah/${ayah}/ar`, {
                        timeout: 5000
                    });
                    arabicText = arabicResponse.data.data.text;
                } catch (e) {}
            }
            
            // Build message
            let message = `┌─⧭ *FOXY QURAN* 🕋 ⧭─┐
│
├─⧭ *Surah ${surah}*
├─⧭ *Ayah ${ayah}*
│
├─⧭ "${translation}"
│
├─⧭ *Translation:* Sahih International
│
└─⧭🦊 *Bismillah*`;
            
            if (arabicText) {
                message = `┌─⧭ *FOXY QURAN* 🕋 ⧭─┐
│
├─⧭ *سورة ${surah}*
├─⧭ *آية ${ayah}*
│
├─⧭ *Arabic:*
│ ${arabicText}
│
├─⧭ *Translation:*
│ "${translation}"
│
├─⧭ *Translation:* Sahih International
│
└─⧭🦊 *بسم الله*`;
            }
            
            await sock.sendMessage(chatId, {
                text: message
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: "🕋", key: msg.key }
            });
            
        } catch (error) {
            console.error('Quran error:', error.message);
            
            // Fallback verses
            const fallbackVerses = [
                { surah: 'Al-Fatiha', ayah: '1:1', text: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
                { surah: 'Al-Ikhlas', ayah: '112:1-4', text: 'Say, "He is Allah, [who is] One, Allah, the Eternal Refuge. He neither begets nor is born, Nor is there to Him any equivalent."' },
                { surah: 'Ayat al-Kursi', ayah: '2:255', text: 'Allah! There is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth.' },
                { surah: 'Al-Asr', ayah: '103:1-3', text: 'By time, Indeed, mankind is in loss, Except for those who have believed and done righteous deeds and advised each other to truth and advised each other to patience.' }
            ];
            
            const random = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY QURAN* 🕋 ⧭─┐
│
├─⧭ *Surah ${random.surah}*
├─⧭ *Ayah ${random.ayah}*
│
├─⧭ "${random.text}"
│
└─⧭🦊 *Bismillah*`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: "🕋", key: msg.key }
            });
        }
    }
};