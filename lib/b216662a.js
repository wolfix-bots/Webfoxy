import axios from 'axios';

export default {
    name: "meme",
    alias: ["memes", "😂", "dankmeme"],
    description: "Get random memes from Reddit 🎭",
    category: "media",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        
        // Show help if no subcommand
        if (args[0]?.toLowerCase() === 'help') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY MEMES* 🎭 ⧭─┐
│
├─⧭ *Usage:*
│ • ${PREFIX}meme - Random meme
│ • ${PREFIX}meme <subreddit>
│
├─⧭ *Examples:*
│ • ${PREFIX}meme
│ • ${PREFIX}meme memes
│ • ${PREFIX}meme dankmemes
│ • ${PREFIX}meme programmingmemes
│
├─⧭ *Popular Subreddits:*
│ • memes
│ • dankmemes
│ • wholesomememes
│ • me_irl
│ • ProgrammerHumor
│
└─⧭🦊`
            }, { quoted: m });
        }
        
        try {
            // Determine subreddit
            let subreddit = 'memes';
            if (args[0] && !args[0].startsWith('http')) {
                subreddit = args[0].toLowerCase();
            }
            
            // Fetch meme from Reddit
            const response = await axios.get(`https://meme-api.com/gimme/${subreddit}`, {
                timeout: 8000
            });
            
            const meme = response.data;
            
            if (!meme || !meme.url) {
                throw new Error('No meme found');
            }
            
            // Determine if it's image or video/gif
            const isGif = meme.url.includes('.gif') || meme.url.includes('.mp4');
            
            // Send meme
            if (isGif) {
                await sock.sendMessage(jid, {
                    video: { url: meme.url },
                    caption: `┌─⧭ *FOXY MEME* 🎭 ⧭─┐
│
├─⧭ *Title:* ${meme.title}
├─⧭ *Subreddit:* r/${meme.subreddit}
├─⧭ *Author:* u/${meme.author}
├─⧭ *Upvotes:* ⬆️ ${meme.ups || 'N/A'}
│
└─⧭🦊`,
                    gifPlayback: true
                }, { quoted: m });
            } else {
                await sock.sendMessage(jid, {
                    image: { url: meme.url },
                    caption: `┌─⧭ *FOXY MEME* 🎭 ⧭─┐
│
├─⧭ *Title:* ${meme.title}
├─⧭ *Subreddit:* r/${meme.subreddit}
├─⧭ *Author:* u/${meme.author}
├─⧭ *Upvotes:* ⬆️ ${meme.ups || 'N/A'}
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Add reaction
            await sock.sendMessage(jid, {
                react: { text: "😂", key: m.key }
            });
            
        } catch (error) {
            console.error('Meme error:', error.message);
            
            // Try fallback API if first fails
            try {
                const fallback = await axios.get('https://meme-api.herokuapp.com/gimme', {
                    timeout: 5000
                });
                
                const meme = fallback.data;
                
                await sock.sendMessage(jid, {
                    image: { url: meme.url },
                    caption: `┌─⧭ *FOXY MEME* 🎭 ⧭─┐
│
├─⧭ *Title:* ${meme.title}
├─⧭ *Subreddit:* r/${meme.subreddit}
├─⧭ *Author:* u/${meme.author}
│
└─⧭🦊`
                }, { quoted: m });
                
                await sock.sendMessage(jid, {
                    react: { text: "😂", key: m.key }
                });
                
            } catch (fallbackError) {
                // Silent fail - just react with ❌
                await sock.sendMessage(jid, {
                    react: { text: "❌", key: m.key }
                });
            }
        }
    }
};