import axios from 'axios';

export default {
    name: 'bible',
    alias: ['bibleverse', 'scripture', 'wordofgod', '📖'],
    category: 'general',
    description: 'Get Bible verses and scripture 📖',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        
        // Show help
        if (args[0]?.toLowerCase() === 'help') {
            return sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY BIBLE* 📖 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}bible random
│ • ${PREFIX}bible John 3:16
│ • ${PREFIX}bible Psalm 23
│ • ${PREFIX}bible search love
│
├─⧭ *Examples:*
│ • ${PREFIX}bible random
│ • ${PREFIX}bible John 3:16
│ • ${PREFIX}bible Genesis 1:1
│ • ${PREFIX}bible Psalm 23:4
│
└─⧭🦊 *Scripture for the soul*`
            }, { quoted: msg });
        }
        
        try {
            let verse = '';
            let reference = '';
            
            // Random verse
            if (args[0]?.toLowerCase() === 'random' || args.length === 0) {
                const response = await axios.get('https://labs.bible.org/api/?passage=random&type=json', {
                    timeout: 8000
                });
                
                const data = response.data[0];
                reference = `${data.bookname} ${data.chapter}:${data.verse}`;
                verse = data.text;
            }
            // Specific verse
            else {
                const query = args.join(' ').replace(/[^\w\s:]/g, '');
                const response = await axios.get(`https://labs.bible.org/api/?passage=${encodeURIComponent(query)}&type=json`, {
                    timeout: 8000
                });
                
                if (response.data && response.data[0]) {
                    const data = response.data[0];
                    reference = `${data.bookname} ${data.chapter}:${data.verse}`;
                    verse = data.text;
                } else {
                    throw new Error('Verse not found');
                }
            }
            
            // Clean up verse text
            verse = verse.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY BIBLE* 📖 ⧭─┐
│
├─⧭ *${reference}*
│
├─⧭ "${verse}"
│
└─⧭🦊 *Amen*`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: "📖", key: msg.key }
            });
            
        } catch (error) {
            console.error('Bible error:', error.message);
            
            // Fallback verses
            const fallbackVerses = [
                { ref: 'John 3:16', text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.' },
                { ref: 'Psalm 23:1', text: 'The Lord is my shepherd; I shall not want.' },
                { ref: 'Philippians 4:13', text: 'I can do all things through Christ who strengthens me.' },
                { ref: 'Jeremiah 29:11', text: 'For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, plans to give you hope and a future.' },
                { ref: 'Romans 8:28', text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.' },
                { ref: 'Proverbs 3:5-6', text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.' },
                { ref: 'Isaiah 41:10', text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.' },
                { ref: 'Joshua 1:9', text: 'Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.' }
            ];
            
            const random = fallbackVerses[Math.floor(Math.random() * fallbackVerses.length)];
            
            await sock.sendMessage(chatId, {
                text: `┌─⧭ *FOXY BIBLE* 📖 ⧭─┐
│
├─⧭ *${random.ref}*
│
├─⧭ "${random.text}"
│
└─⧭🦊 *Amen*`
            }, { quoted: msg });
            
            await sock.sendMessage(chatId, {
                react: { text: "📖", key: msg.key }
            });
        }
    }
};