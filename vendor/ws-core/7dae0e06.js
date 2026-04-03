// commands/search/lyrics.js

import axios from 'axios';

// ===== GIFTEDTECH LYRICS API =====
const API_CONFIG = {
    url: 'https://api.giftedtech.co.ke/api/search/lyricsv2',
    key: 'gifted'
};

export default {
    name: "lyrics",
    alias: ["lyric", "songlyrics", "songtext", "words"],
    category: "search",
    
    async execute(sock, m, args, PREFIX) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *Lyrics Finder*\n` +
                      `│ Get song lyrics instantly\n` +
                      `│\n` +
                      `│ Usage: ${PREFIX}lyrics <song name> <artist>\n` +
                      `│ Example: ${PREFIX}lyrics Faded Alan Walker\n` +
                      `│ Example: ${PREFIX}lyrics Shape of You Ed Sheeran\n` +
                      `│ Example: ${PREFIX}lyrics Believer Imagine Dragons\n` +
                      `└─⧭`
            }, { quoted: m });
        }
        
        const query = args.join(' ');
        
        await sock.sendMessage(jid, {
            text: `┌─⧭ *Searching lyrics*\n` +
                  `│ "${query}"\n` +
                  `│ Please wait...\n` +
                  `└─⧭`
        }, { quoted: m });
        
        try {
            // Call the API
            const url = `${API_CONFIG.url}?apikey=${API_CONFIG.key}&query=${encodeURIComponent(query)}`;
            
            const response = await axios.get(url, { timeout: 10000 });
            const data = response.data;
            
            if (data.success && data.result) {
                const { title, artist, lyrics } = data.result;
                
                // Format lyrics nicely (limit to avoid message too long)
                let formattedLyrics = lyrics;
                if (lyrics.length > 3000) {
                    formattedLyrics = lyrics.substring(0, 3000) + '...\n\n[Lyrics truncated, too long]';
                }
                
                const lyricsMessage = `┌─⧭ *🎵 ${title}* 🎵⧭─┐
│
├─⧭ *Artist:* ${artist}
├─⧭ *Song:* ${title}
│
├─⧭ *Lyrics:* ⧭─
│
${formattedLyrics.split('\n').map(line => `│ ${line}`).join('\n')}
│
│ ✨ Powered by GiftedTech
└─⧭🦊 *Foxy Lyrics* ⧭─`;
                
                await sock.sendMessage(jid, {
                    text: lyricsMessage
                }, { quoted: m });
                
            } else {
                throw new Error('Lyrics not found');
            }
            
        } catch (error) {
            console.error('Lyrics error:', error);
            
            let errorMsg = `┌─⧭ *Error*\n` +
                          `│ ❌ Could not find lyrics for "${query}"\n` +
                          `│\n` +
                          `│ Try:\n` +
                          `│ • Check spelling\n` +
                          `│ • Include artist name\n` +
                          `│ • Try a different song\n` +
                          `└─⧭`;
            
            await sock.sendMessage(jid, {
                text: errorMsg
            }, { quoted: m });
        }
    }
};