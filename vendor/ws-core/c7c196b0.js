// ===== API CONFIG =====
const API_URL = 'https://apis.xwolf.space/api/ai/gpt';

export default {
    name: "story",
    alias: ["storygen", "createstory", "tellstory", "write"],
    category: "ai",
    description: "Generate creative stories on any topic",
    usage: ".story <topic> [genre] [length]\n.story list-genres\n.story help",
    
    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const userName = m.pushName || 'Friend';
        
        // Show help if no arguments
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY STORY GENERATOR* ⧭─┐
│
├─⧭ *What can I do?*
│ I can generate creative stories on any topic!
│
├─⧭ *Usage:*
│ ${PREFIX}story <topic> - Quick story
│ ${PREFIX}story <topic> <genre> - Specific genre
│ ${PREFIX}story <topic> <genre> <length> - Custom length
│ ${PREFIX}story list-genres - See all genres
│ ${PREFIX}story help - More details
│
├─⧭ *Examples:*
│ ${PREFIX}story a brave knight
│ ${PREFIX}story alien invasion comedy
│ ${PREFIX}story lost in space adventure long
│
├─⧭ *Genres:*
│ fantasy • scifi • horror • romance • comedy
│ adventure • mystery • thriller • drama • fairy
│
└─⧭🦊`
            }, { quoted: m });
        }

        // Show available genres
        if (args[0].toLowerCase() === 'list-genres') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *AVAILABLE GENRES* ⧭─┐
│
├─⧭ *Main Genres:*
│ • fantasy 🧚 - Magic, mythical creatures
│ • scifi 🚀 - Future, technology, space
│ • horror 👻 - Scary, suspenseful
│ • romance 💕 - Love stories
│ • comedy 😂 - Funny, humorous
│ • adventure 🗺️ - Exciting journeys
│ • mystery 🔍 - Puzzles, detective
│ • thriller 🔪 - Suspense, tension
│ • drama 🎭 - Emotional, realistic
│ • fairy ✨ - Magical tales
│
├─⧭ *Example:*
│ ${PREFIX}story lost treasure adventure
│ ${PREFIX}story haunted house horror
│
└─⧭🦊`
            }, { quoted: m });
        }

        // Show detailed help
        if (args[0].toLowerCase() === 'help') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *DETAILED HELP* ⧭─┐
│
├─⧭ *How to use:*
│ 1. Just tell me a topic!
│ 2. Add genre for style
│ 3. Add length (short/medium/long)
│
├─⧭ *Length Options:*
│ • short (1-2 paragraphs)
│ • medium (3-5 paragraphs) [default]
│ • long (full story with chapters)
│
├─⧭ *Pro Tips:*
│ • Be specific: "story wizard finds magic sword"
│ • Add characters: "story brave princess and dragon"
│ • Set mood: "story mysterious forest at night"
│ • Mix genres: "story zombie apocalypse comedy"
│
├─⧭ *Examples:*
│ ${PREFIX}story detective solves murder mystery
│ ${PREFIX}story time traveler meets dinosaurs scifi long
│ ${PREFIX}story two enemies fall in love romance short
│
└─⧭🦊`
            }, { quoted: m });
        }

        // Parse arguments
        let topic = args.join(' ');
        let genre = 'fantasy';
        let length = 'medium';
        
        // Check for genre and length at the end
        const genres = ['fantasy', 'scifi', 'sci-fi', 'horror', 'romance', 'comedy', 'adventure', 'mystery', 'thriller', 'drama', 'fairy'];
        const lengths = ['short', 'medium', 'long'];
        
        const lastWord = args[args.length - 1].toLowerCase();
        const secondLastWord = args.length > 1 ? args[args.length - 2].toLowerCase() : '';
        
        // Check if last word is length
        if (lengths.includes(lastWord)) {
            length = lastWord;
            topic = args.slice(0, -1).join(' ');
        }
        
        // Check if last word is genre (if not already used as length)
        if (genres.includes(lastWord) && !lengths.includes(lastWord)) {
            genre = lastWord;
            topic = args.slice(0, -1).join(' ');
        }
        
        // Check if second last is genre and last is length
        if (genres.includes(secondLastWord) && lengths.includes(lastWord)) {
            genre = secondLastWord;
            length = lastWord;
            topic = args.slice(0, -2).join(' ');
        }

        // Clean up genre
        if (genre === 'sci-fi') genre = 'scifi';
        
        // Length descriptions
        const lengthDesc = {
            short: 'Write a SHORT story (1-2 paragraphs)',
            medium: 'Write a MEDIUM length story (3-5 paragraphs) with proper structure',
            long: 'Write a LONG, detailed story with multiple paragraphs, character development, and a complete plot'
        };

        await sock.sendMessage(jid, { react: { text: '🦊', key: m.key } });

        try {
            // Build the story prompt
            let prompt = `You are a creative storyteller. Write a ${genre} story about: "${topic}". `;
            prompt += `${lengthDesc[length]}. `;
            prompt += `Make it engaging with vivid descriptions and interesting characters. `;
            prompt += `The story should be complete and satisfying. `;
            prompt += `Use proper paragraphs and formatting.\n\n`;
            prompt += `Title: (create a catchy title)\n\n`;
            prompt += `Story:\n`;

            const url = `${API_URL}?q=${encodeURIComponent(prompt)}`;
            const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
            const response = await res.json();

            if (response.result) {
                let story = response.result;
                
                // Format the story nicely
                story = story.replace(/Title:/gi, '📖 *Title:*')
                           .replace(/Story:/gi, '')
                           .replace(/\n\n/g, '\n\n│ ');
                
                // Split long responses into multiple messages if needed
                const maxLength = 4000;
                if (story.length > maxLength) {
                    const parts = [];
                    for (let i = 0; i < story.length; i += maxLength) {
                        parts.push(story.substring(i, i + maxLength));
                    }
                    
                    // Send first part
                    await sock.sendMessage(jid, {
                        text: `┌─⧭ *YOUR STORY* (Part 1/${parts.length}) ⧭─┐
│
├─⧭ *Topic:* ${topic}
├─⧭ *Genre:* ${genre}
│
${parts[0].split('\n').map(line => `│ ${line}`).join('\n')}
│
└─⧭🦊`
                    }, { quoted: m });
                    
                    // Send remaining parts
                    for (let i = 1; i < parts.length; i++) {
                        await sock.sendMessage(jid, {
                            text: `┌─⧭ *CONTINUED* (Part ${i+1}/${parts.length}) ⧭─┐
│
${parts[i].split('\n').map(line => `│ ${line}`).join('\n')}
│
└─⧭🦊`
                        }, { quoted: m });
                    }
                } else {
                    // Send as single message
                    await sock.sendMessage(jid, {
                        text: `┌─⧭ *YOUR STORY* ⧭─┐
│
├─⧭ *Topic:* ${topic}
├─⧭ *Genre:* ${genre}
├─⧭ *Length:* ${length}
│
${story.split('\n').map(line => `│ ${line}`).join('\n')}
│
└─⧭🦊 *The End*`
                    }, { quoted: m });
                }
                
                // Add reaction
                await sock.sendMessage(jid, {
                    react: { text: "📖", key: m.key }
                });
                
            } else {
                throw new Error('Failed to generate story');
            }

        } catch (error) {
            console.error('Story error:', error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *STORY FAILED* ⧭─┐
│
├─⧭ *Oops!* Something went wrong
│
│ ❌ Error: ${error.message}
│
│ Try:
│ • Different topic
│ • Shorter request
│ • Check spelling
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};