import axios from 'axios';

export default {
    name: 'quote',
    alias: ['quotes', '💬', 'inspire'],
    category: 'fun',
    description: 'Get an inspiring quote 💬',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        // Local quotes (for when API fails)
        const localQuotes = [
            {
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs"
            },
            {
                text: "Life is what happens when you're busy making other plans.",
                author: "John Lennon"
            },
            {
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt"
            },
            {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill"
            },
            {
                text: "Believe you can and you're halfway there.",
                author: "Theodore Roosevelt"
            },
            {
                text: "It does not matter how slowly you go as long as you do not stop.",
                author: "Confucius"
            },
            {
                text: "Everything you've ever wanted is on the other side of fear.",
                author: "George Addair"
            },
            {
                text: "The best time to plant a tree was 20 years ago. The second best time is now.",
                author: "Chinese Proverb"
            },
            {
                text: "You miss 100% of the shots you don't take.",
                author: "Wayne Gretzky"
            },
            {
                text: "Happiness is not something ready made. It comes from your own actions.",
                author: "Dalai Lama"
            }
        ];
        
        // Fox-themed quotes
        const foxQuotes = [
            {
                text: "Be sly like a fox, but kind like a friend.",
                author: "Foxy Wisdom"
            },
            {
                text: "A fox knows many things, but a hedgehog knows one big thing.",
                author: "Archilochus"
            },
            {
                text: "The quick brown fox jumps over the lazy dog.",
                author: "Typing Lesson"
            },
            {
                text: "Even a fox can be tamed with love and patience.",
                author: "Foxy Bot"
            }
        ];
        
        await sock.sendMessage(chatId, {
            text: `┌─⧭ *FOXY QUOTES* 💬 ⧭─┐
│
│ 📖 Searching for wisdom...
│
└─⧭🦊`
        }, { quoted: msg });
        
        try {
            // Try to fetch from API first
            const response = await axios.get('https://api.quotable.io/random', {
                timeout: 5000
            });
            
            if (response.data && response.data.content) {
                const quote = response.data;
                
                setTimeout(async () => {
                    await sock.sendMessage(chatId, {
                        text: `┌─⧭ *FOXY QUOTES* 💬 ⧭─┐
│
├─⧭ *"${quote.content}"*
│
├─⧭ — ${quote.author || 'Unknown'}
│
├─⧭ *For:* ${sender}
│
└─⧭🦊 *Stay inspired!*`
                    }, { quoted: msg });
                    
                    await sock.sendMessage(chatId, {
                        react: { text: "💬", key: msg.key }
                    });
                }, 1000);
                
                return;
            }
            
            throw new Error('API failed');
            
        } catch (error) {
            // Use local quotes if API fails
            const allQuotes = [...localQuotes, ...foxQuotes];
            const randomQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)];
            
            setTimeout(async () => {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *FOXY QUOTES* 💬 ⧭─┐
│
├─⧭ *"${randomQuote.text}"*
│
├─⧭ — ${randomQuote.author}
│
├─⧭ *For:* ${sender}
│
└─⧭🦊 *Foxy wisdom for you!*`
                }, { quoted: msg });
                
                await sock.sendMessage(chatId, {
                    react: { text: "💬", key: msg.key }
                });
            }, 1000);
        }
    }
};