import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache directory for TTS files
const CACHE_DIR = path.join(process.cwd(), 'temp', 'tts_cache');
if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Language database
const LANGUAGES = {
    'en': { name: 'English', flag: '🇺🇸', code: 'en' },
    'id': { name: 'Indonesian', flag: '🇮🇩', code: 'id' },
    'es': { name: 'Spanish', flag: '🇪🇸', code: 'es' },
    'fr': { name: 'French', flag: '🇫🇷', code: 'fr' },
    'de': { name: 'German', flag: '🇩🇪', code: 'de' },
    'it': { name: 'Italian', flag: '🇮🇹', code: 'it' },
    'pt': { name: 'Portuguese', flag: '🇵🇹', code: 'pt' },
    'ru': { name: 'Russian', flag: '🇷🇺', code: 'ru' },
    'ja': { name: 'Japanese', flag: '🇯🇵', code: 'ja' },
    'ko': { name: 'Korean', flag: '🇰🇷', code: 'ko' },
    'zh': { name: 'Chinese', flag: '🇨🇳', code: 'zh' },
    'ar': { name: 'Arabic', flag: '🇸🇦', code: 'ar' },
    'hi': { name: 'Hindi', flag: '🇮🇳', code: 'hi' },
    'nl': { name: 'Dutch', flag: '🇳🇱', code: 'nl' },
    'pl': { name: 'Polish', flag: '🇵🇱', code: 'pl' },
    'tr': { name: 'Turkish', flag: '🇹🇷', code: 'tr' },
    'vi': { name: 'Vietnamese', flag: '🇻🇳', code: 'vi' },
    'th': { name: 'Thai', flag: '🇹🇭', code: 'th' },
    'el': { name: 'Greek', flag: '🇬🇷', code: 'el' },
    'he': { name: 'Hebrew', flag: '🇮🇱', code: 'he' },
    'sv': { name: 'Swedish', flag: '🇸🇪', code: 'sv' },
    'da': { name: 'Danish', flag: '🇩🇰', code: 'da' },
    'fi': { name: 'Finnish', flag: '🇫🇮', code: 'fi' },
    'no': { name: 'Norwegian', flag: '🇳🇴', code: 'no' },
    'cs': { name: 'Czech', flag: '🇨🇿', code: 'cs' },
    'hu': { name: 'Hungarian', flag: '🇭🇺', code: 'hu' },
    'ro': { name: 'Romanian', flag: '🇷🇴', code: 'ro' },
    'bg': { name: 'Bulgarian', flag: '🇧🇬', code: 'bg' },
    'uk': { name: 'Ukrainian', flag: '🇺🇦', code: 'uk' }
};

// Auto-cleanup old files (older than 1 hour)
setInterval(() => {
    try {
        const files = fs.readdirSync(CACHE_DIR);
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > oneHour) {
                fs.unlinkSync(filePath);
                console.log(`🧹 Cleaned TTS cache: ${file}`);
            }
        }
    } catch (error) {
        console.error('TTS cleanup error:', error.message);
    }
}, 30 * 60 * 1000); // Run every 30 minutes

export default {
    name: "tts",
    alias: ["speak", "say", "voice", "talk"],
    description: "Convert text to speech with multiple languages 🔊",
    category: "utilities",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        const sender = m.pushName || 'Friend';
        
        // No arguments - show help
        if (args.length === 0) {
            // Create language list for display
            const langList = Object.entries(LANGUAGES)
                .map(([code, lang]) => `${lang.flag} ${code} - ${lang.name}`)
                .slice(0, 10) // Show first 10
                .join('\n│ ');
            
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOX TEXT TO SPEECH* 🦊 🔊 ⧭─┐
│
├─⧭ *What I do:*
│ Convert your text to spoken audio!
│
├─⧭ *Usage:*
│ ${PREFIX}tts Hello world
│ ${PREFIX}tts lang=id Halo teman
│
├─⧭ *Popular Languages:*
│ ${langList}
│
├─⧭ *All Languages:*
│ ${PREFIX}tts languages
│
├─⧭ *Examples:*
│ ${PREFIX}tts I love Foxy Bot
│ ${PREFIX}tts lang=es Hola amigos
│ ${PREFIX}tts lang=ja こんにちは
│
├─⧭ *Note:*
│ • Max 200 characters
│ • Audio sent as voice message
│ • Auto-cleanup after 1 hour
│
└─⧭🦊 *Say it with Fox!*`
            }, { quoted: m });
        }
        
        // Show all languages
        if (args[0].toLowerCase() === 'languages' || args[0].toLowerCase() === 'langs') {
            const langList = Object.entries(LANGUAGES)
                .map(([code, lang]) => `${lang.flag} ${code} - ${lang.name}`)
                .join('\n│ ');
            
            return sock.sendMessage(jid, {
                text: `┌─⧭ *ALL SUPPORTED LANGUAGES* 🦊 ⧭─┐
│
├─⧭ ${Object.keys(LANGUAGES).length} Languages Available:
│
│ ${langList}
│
├─⧭ *Usage:*
│ ${PREFIX}tts lang=code text
│
├─⧭ *Example:*
│ ${PREFIX}tts lang=fr Bonjour
│
└─⧭🦊 *Fox speaks many tongues!*`
            }, { quoted: m });
        }
        
        try {
            // Parse language and text
            let lang = 'en';
            let text = args.join(' ');
            
            // Check for language parameter
            if (args[0].startsWith('lang=')) {
                const langParam = args[0].split('=')[1];
                if (LANGUAGES[langParam]) {
                    lang = langParam;
                    text = args.slice(1).join(' ');
                } else {
                    return sock.sendMessage(jid, {
                        text: `┌─⧭ *INVALID LANGUAGE* ⧭─┐
│
├─⧭ "${langParam}" not supported
│
├─⧭ *Use:* ${PREFIX}tts languages
│ to see all available languages
│
└─⧭🦊`
                    }, { quoted: m });
                }
            }
            
            // Clean text (remove extra spaces)
            text = text.trim();
            
            if (text.length === 0) {
                return sock.sendMessage(jid, {
                    text: "❌ *Empty text!*\n\nPlease provide some text to speak."
                }, { quoted: m });
            }
            
            if (text.length > 200) {
                return sock.sendMessage(jid, {
                    text: `┌─⧭ *TEXT TOO LONG* ⧭─┐
│
├─⧭ *Length:* ${text.length} chars
├─⧭ *Max allowed:* 200 chars
│
│ Please shorten your text!
│
└─⧭🦊`
                }, { quoted: m });
            }
            
            // Show processing message
            const processingMsg = await sock.sendMessage(jid, {
                text: `┌─⧭ *FOX IS SPEAKING* 🎤 ⧭─┐
│
├─⧭ *Language:* ${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}
├─⧭ *Text:* ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}
│
│ 🎵 Generating voice message...
│ Please wait a moment
│
└─⧭🦊`
            }, { quoted: m });
            
            // Generate cache key
            const cacheKey = `${lang}_${Buffer.from(text).toString('base64').substring(0, 50)}`;
            const cacheFile = path.join(CACHE_DIR, `${cacheKey}.mp3`);
            
            let audioBuffer;
            
            // Check cache first
            if (fs.existsSync(cacheFile)) {
                audioBuffer = fs.readFileSync(cacheFile);
                console.log(`✅ TTS cache hit: ${cacheKey.substring(0, 30)}...`);
            } else {
                // Google TTS URL
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
                
                // Download TTS audio with timeout
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);
                
                try {
                    const response = await fetch(ttsUrl, { signal: controller.signal });
                    clearTimeout(timeout);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    audioBuffer = Buffer.from(await response.arrayBuffer());
                    
                    // Save to cache
                    fs.writeFileSync(cacheFile, audioBuffer);
                    console.log(`💾 TTS cached: ${cacheKey.substring(0, 30)}...`);
                    
                } catch (fetchError) {
                    clearTimeout(timeout);
                    throw fetchError;
                }
            }
            
            if (!audioBuffer || audioBuffer.length === 0) {
                throw new Error('Empty audio response');
            }
            
            // Send as audio message (PTT - Push to Talk style)
            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: true, // Voice note format
                fileName: `fox_tts_${lang}_${Date.now()}.mp3`
            });
            
            // Send success message
            await sock.sendMessage(jid, {
                text: `┌─⧭ *TTS DELIVERED* ✅ ⧭─┐
│
├─⧭ *Language:* ${LANGUAGES[lang].flag} ${LANGUAGES[lang].name}
├─⧭ *Text:* ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}
├─⧭ *Length:* ${text.length} chars
├─⧭ *Requested by:* ${sender}
│
│ 🔊 Voice message sent!
│
├─⧭ *Try another:*
│ ${PREFIX}tts <your text>
│
└─⧭🦊 *Fox voice activated!*`
            });
            
            // Delete processing message
            if (processingMsg?.key?.id) {
                await sock.sendMessage(jid, {
                    delete: processingMsg.key
                });
            }
            
        } catch (error) {
            console.error("TTS error:", error);
            
            // Check for specific errors
            let errorMessage = "• Network connection issue\n• Try again later";
            
            if (error.message.includes('abort')) {
                errorMessage = "• Request timeout\n• Server too slow";
            } else if (error.message.includes('HTTP 429')) {
                errorMessage = "• Too many requests\n• Wait a moment";
            } else if (error.message.includes('ENOTFOUND')) {
                errorMessage = "• No internet connection\n• Check your network";
            }
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *TTS FAILED* ❌ ⧭─┐
│
├─⧭ *Possible issues:*
│ ${errorMessage}
│
├─⧭ *Tips:*
│ • Use shorter text
│ • Try English first
│ • Check language code
│
├─⧭ *Example that works:*
│ ${PREFIX}tts Hello world
│
└─⧭🦊 *Even foxes have bad voice days!*`
            }, { quoted: m });
        }
    }
};

console.log('🔊 TTS Module loaded');
console.log(`📁 Cache directory: ${CACHE_DIR}`);
console.log(`🗣️ Languages: ${Object.keys(LANGUAGES).length} supported`);