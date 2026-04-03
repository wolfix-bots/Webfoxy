import axios from 'axios';

export default {
    name: 'joke',
    alias: ['jokes', '😂', 'laugh'],
    category: 'fun',
    description: 'Get a random joke to make you laugh 😂',
    
    async execute(sock, msg, args, PREFIX) {
        const chatId = msg.key.remoteJid;
        const sender = msg.pushName || 'Friend';
        
        // Array of programming jokes (for when API fails)
        const localJokes = [
            {
                setup: "Why do programmers prefer dark mode?",
                punchline: "Because light attracts bugs! 🐛"
            },
            {
                setup: "What's a programmer's favorite place?",
                punchline: "Foo Bar! 🍻"
            },
            {
                setup: "Why did the programmer quit his job?",
                punchline: "He didn't get arrays! 😂"
            },
            {
                setup: "What do you call a programmer from Finland?",
                punchline: "Nerdic! 🇫🇮"
            },
            {
                setup: "Why do Java developers wear glasses?",
                punchline: "Because they can't C#! 👓"
            },
            {
                setup: "What's the best thing about Switzerland?",
                punchline: "I don't know, but the flag is a big plus! 🇨🇭"
            },
            {
                setup: "Why don't scientists trust atoms?",
                punchline: "Because they make up everything! ⚛️"
            },
            {
                setup: "What do you call a fake noodle?",
                punchline: "An impasta! 🍝"
            },
            {
                setup: "Why did the scarecrow win an award?",
                punchline: "He was outstanding in his field! 🌾"
            },
            {
                setup: "What do you call a bear with no teeth?",
                punchline: "A gummy bear! 🐻"
            },
            {
                setup: "Why don't skeletons fight each other?",
                punchline: "They don't have the guts! 💀"
            },
            {
                setup: "What's brown and sticky?",
                punchline: "A stick! 🌿"
            },
            {
                setup: "Why did the bicycle fall over?",
                punchline: "Because it was two-tired! 🚲"
            },
            {
                setup: "What do you call a fish with no eyes?",
                punchline: "A fsh! 🐟"
            },
            {
                setup: "Why did the coffee file a police report?",
                punchline: "It got mugged! ☕"
            }
        ];
        
        // Fox-themed jokes
        const foxJokes = [
            {
                setup: "What does a fox say?",
                punchline: "Ring-ding-ding-ding-dingeringeding! 🦊"
            },
            {
                setup: "Why did the fox cross the road?",
                punchline: "To get to the other side of the forest! 🌲"
            },
            {
                setup: "What's a fox's favorite game?",
                punchline: "Hide and sneak! 🦊"
            },
            {
                setup: "How do foxes greet each other?",
                punchline: "What's poppin'? 🦊"
            }
        ];
        
        await sock.sendMessage(chatId, {
            text: `┌─⧭ *FOXY JOKES* 😂 ⧭─┐
│
│ 🤔 Thinking of a funny joke...
│
└─⧭🦊`
        }, { quoted: msg });
        
        try {
            // Try to fetch from API first
            const response = await axios.get('https://v2.jokeapi.dev/joke/Any?type=twopart', {
                timeout: 5000
            });
            
            if (response.data && response.data.setup && response.data.delivery) {
                const joke = response.data;
                
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *FOXY JOKES* 😂 ⧭─┐
│
├─⧭ *Setup:*
│ ${joke.setup}
│
├─⧭ *Punchline:*
│ ${joke.delivery}
│
├─⧭ *Category:* ${joke.category}
│
└─⧭🦊 *Laugh out loud!*`
                }, { quoted: msg });
                
                await sock.sendMessage(chatId, {
                    react: { text: "😂", key: msg.key }
                });
                return;
            }
            
            throw new Error('API failed');
            
        } catch (error) {
            // Use local jokes if API fails
            const allJokes = [...localJokes, ...foxJokes];
            const randomJoke = allJokes[Math.floor(Math.random() * allJokes.length)];
            
            // Add a small delay for effect
            setTimeout(async () => {
                await sock.sendMessage(chatId, {
                    text: `┌─⧭ *FOXY JOKES* 😂 ⧭─┐
│
├─⧭ *Setup:*
│ ${randomJoke.setup}
│
├─⧭ *Punchline:*
│ ${randomJoke.punchline}
│
├─⧭ *Told to:* ${sender}
│
└─⧭🦊 *Hope that made you laugh!*`
                }, { quoted: msg });
                
                await sock.sendMessage(chatId, {
                    react: { text: "😂", key: msg.key }
                });
            }, 1000);
        }
    }
};