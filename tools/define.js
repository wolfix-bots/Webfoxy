import axios from 'axios';

export default {
  name: "dictionary",
  alias: ["dict", "define", "meaning", "word"],
  description: "Look up definitions, pronunciations, and more for any English word 📖",
  category: "tools",
  usage: ".dictionary <word>",

  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    // Simple start reaction
    await sock.sendMessage(chatId, {
      react: { text: "📚", key: m.key }
    });
    
    try {
      const query = args.join(' ').trim();
      
      if (!query) {
        await sock.sendMessage(chatId, {
          react: { text: "❓", key: m.key }
        });
        
        setTimeout(async () => {
          await sendMessage(
            `┌─⧭ *FOXY DICTIONARY* 📖 ⧭─┐
│
├─⧭ *Usage:*
│ ${PREFIX}dictionary <word>
│
├─⧭ *Examples:*
│ • ${PREFIX}dictionary cat
│ • ${PREFIX}dictionary beautiful
│ • ${PREFIX}dictionary entrepreneur
│
├─⧭ *What you get:*
│ • Definitions
│ • Pronunciation
│ • Synonyms
│ • Audio (if available)
│
└─⧭🦊`
          );
        }, 300);
        return;
      }
      
      // Searching reaction
      await sock.sendMessage(chatId, {
        react: { text: "🔍", key: m.key }
      });
      
      try {
        // Call the dictionary API
        const response = await axios.get(`https://apiskeith.vercel.app/education/dictionary?q=${encodeURIComponent(query)}`, {
          timeout: 10000
        });
        
        const data = response.data;
        
        if (!data.status || !data.result) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage(
            `┌─⧭ *WORD NOT FOUND* ❌ ⧭─┐
│
├─⧭ "${query}" not found.
│
├─⧭ *Try:*
│ • Check spelling
│ • Different word
│ • Shorter word
│
└─⧭🦊`
          );
          return;
        }
        
        const result = data.result;
        
        // Success reaction
        await sock.sendMessage(chatId, {
          react: { text: "✅", key: m.key }
        });
        
        // Build the response message
        let message = `┌─⧭ *FOXY DICTIONARY* 📖 ⧭─┐
│
├─⧭ *Word:* ${result.word.toUpperCase()}\n`;
        
        // Add phonetics if available
        if (result.phonetics && result.phonetics.length > 0) {
          const ukAudio = result.phonetics.find(p => p.audio?.includes('uk'));
          const usAudio = result.phonetics.find(p => p.audio?.includes('us'));
          
          if (ukAudio?.text) message += `├─⧭ *🇬🇧 UK:* ${ukAudio.text}\n`;
          if (usAudio?.text) message += `├─⧭ *🇺🇸 US:* ${usAudio.text}\n`;
        }
        
        message += `│\n`;
        
        // Add meanings
        if (result.meanings && result.meanings.length > 0) {
          result.meanings.slice(0, 2).forEach((meaning) => {
            message += `├─⧭ *${meaning.partOfSpeech.toUpperCase()}*\n`;
            
            // Show first 2 definitions
            meaning.definitions.slice(0, 2).forEach((def, i) => {
              message += `│ ${i+1}. ${def.definition}\n`;
            });
            
            // Add synonyms if available
            if (meaning.synonyms && meaning.synonyms.length > 0) {
              const shortSynonyms = meaning.synonyms.slice(0, 3);
              message += `│ 🔄 *Synonyms:* ${shortSynonyms.join(', ')}`;
              if (meaning.synonyms.length > 3) message += ` +${meaning.synonyms.length-3}`;
              message += `\n`;
            }
            
            message += `│\n`;
          });
          
          if (result.meanings.length > 2) {
            message += `├─⧭ *+${result.meanings.length-2} more meanings*\n`;
          }
        }
        
        // Add source
        message += `│\n├─⧭ *Requested by:* ${m.pushName || 'Friend'}\n`;
        message += `│\n└─⧭🦊 *Foxy knows words!*`;
        
        // Send the dictionary result
        await sendMessage(message);
        
        // Send audio pronunciation if available
        if (result.phonetics && result.phonetics.length > 0) {
          const audio = result.phonetics.find(p => p.audio)?.audio;
          if (audio) {
            setTimeout(async () => {
              try {
                await sock.sendMessage(chatId, {
                  audio: { url: audio },
                  mimetype: 'audio/mpeg',
                  ptt: true,
                  fileName: `${result.word}.mp3`
                });
              } catch (audioError) {
                // Silent fail
              }
            }, 500);
          }
        }
        
        // Log usage
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`📖 Dictionary: "${result.word}" by ${cleaned.cleanNumber || 'Anonymous'}`);
        
      } catch (apiError) {
        console.error('API error:', apiError);
        
        await sock.sendMessage(chatId, {
          react: { text: "❌", key: m.key }
        });
        
        if (apiError.response?.status === 404) {
          await sendMessage(
            `┌─⧭ *WORD NOT FOUND* ❌ ⧭─┐
│
├─⧭ "${query}" not found.
│
├─⧭ *Try:*
│ • Check spelling
│ • Different word
│
└─⧭🦊`
          );
        } else {
          await sendMessage(
            `┌─⧭ *DICTIONARY ERROR* ❌ ⧭─┐
│
├─⧭ Service unavailable
│
├─⧭ *Try again later*
│
└─⧭🦊`
          );
        }
      }
      
    } catch (error) {
      console.error('Command error:', error);
      
      await sock.sendMessage(chatId, {
        react: { text: "💥", key: m.key }
      });
      
      await sendMessage(
        `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Something went wrong!
│
└─⧭🦊`
      );
    }
  }
};