import acrcloud from "acrcloud";
import yts from "yt-search";
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract audio from video buffer
function extractAudioFromVideo(videoBuffer) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(__dirname, 'temp_shazam');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const inputFile = path.join(tempDir, `input_${Date.now()}.mp4`);
        const outputFile = path.join(tempDir, `audio_${Date.now()}.mp3`);
        
        // Write video buffer to file
        fs.writeFileSync(inputFile, videoBuffer);
        
        ffmpeg(inputFile)
            .output(outputFile)
            .audioCodec('libmp3lame')
            .audioBitrate('128k')
            .on('end', () => {
                // Read the extracted audio
                const audioBuffer = fs.readFileSync(outputFile);
                
                // Clean up temp files
                fs.unlinkSync(inputFile);
                fs.unlinkSync(outputFile);
                
                resolve(audioBuffer);
            })
            .on('error', (err) => {
                // Clean up on error
                if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
                if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
                reject(new Error(`FFmpeg error: ${err.message}`));
            })
            .run();
    });
}

export default {
    name: 'shazam',
    alias: ['whatsong', 'identifysong', 'musicid', 'findsong'],
    description: 'Identify songs from audio or video messages',
    category: 'Search',
    
    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;
        
        const sendMessage = async (text) => {
            return await sock.sendMessage(chatId, { text }, { quoted: m });
        };
        
        try {
            // Check if message is a reply
            const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            
            // Help message
            if (args.length === 0 && !quoted) {
                await sock.sendMessage(chatId, {
                    react: { text: "🎵", key: m.key }
                });
                
                await sendMessage(
                    `🎵 *Shazam Music Identifier* 🦊\n\n` +
                    `*Identify songs from:*\n` +
                    `• Reply to audio messages 🔊\n` +
                    `• Reply to video messages 🎬\n` +
                    `• Or search by song name 🔍\n\n` +
                    `*Usage:*\n` +
                    `• ${PREFIX}shazam (reply to audio/video)\n` +
                    `• ${PREFIX}shazam shape of you\n` +
                    `• ${PREFIX}shazam blinding lights\n\n` +
                    `*Note:* Works with both audio AND video messages!`
                );
                return;
            }
            
            // Text search mode
            if (args.length > 0 && !quoted) {
                const searchQuery = args.join(' ');
                
                await sock.sendMessage(chatId, {
                    react: { text: "🔍", key: m.key }
                });
                
                const processingMsg = await sendMessage(`🔍 Searching for: "${searchQuery}"...`);
                
                try {
                    const searchResults = await yts(searchQuery);
                    
                    if (!searchResults.videos || searchResults.videos.length === 0) {
                        await sock.sendMessage(chatId, {
                            text: `❌ No results found for "${searchQuery}"`,
                            edit: processingMsg.key
                        });
                        return;
                    }
                    
                    const video = searchResults.videos[0];
                    
                    const resultText = 
                        `🎵 *Song Found!* 🦊\n\n` +
                        `*Title:* ${video.title}\n` +
                        `*Duration:* ${video.timestamp}\n` +
                        `*Artist:* ${video.author.name}\n` +
                        `*Views:* ${video.views}\n` +
                        `*Uploaded:* ${video.ago}\n\n` +
                        `🔗 *YouTube:* ${video.url}\n\n` +
                        `*Source:* YouTube Search`;
                    
                    await sock.sendMessage(chatId, {
                        text: resultText,
                        edit: processingMsg.key
                    });
                    
                    // Try to send thumbnail
                    try {
                        const imageResponse = await fetch(video.thumbnail);
                        if (imageResponse.ok) {
                            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                            
                            await sock.sendMessage(chatId, {
                                image: imageBuffer,
                                caption: `🎵 ${video.title}`
                            });
                        }
                    } catch (imageError) {
                        // Silent fail for thumbnail
                    }
                    
                    return;
                    
                } catch (searchError) {
                    console.error('Search error:', searchError);
                    await sock.sendMessage(chatId, {
                        text: '❌ Search failed. Try again.',
                        edit: processingMsg.key
                    });
                    return;
                }
            }
            
            // Audio/Video recognition mode
            if (!quoted) {
                await sendMessage('❌ Please reply to an audio or video message!');
                return;
            }
            
            // Check if quoted message has audio or video
            const hasAudio = quoted.audioMessage;
            const hasVideo = quoted.videoMessage;
            
            if (!hasAudio && !hasVideo) {
                await sendMessage('❌ Please reply to an audio or video message only!');
                return;
            }
            
            // Start recognition process
            await sock.sendMessage(chatId, {
                react: { text: "🎵", key: m.key }
            });
            
            const processingMsg = await sendMessage(
                `🎵 *Processing ${hasVideo ? 'video' : 'audio'}...*\n\n` +
                `Extracting audio... Please wait.`
            );
            
            try {
                // Download the media
                const mediaBuffer = await downloadMediaMessage(
                    {
                        key: {
                            remoteJid: chatId,
                            id: m.message?.extendedTextMessage?.contextInfo?.stanzaId
                        },
                        message: quoted
                    },
                    'buffer',
                    {},
                    { reuploadRequest: sock.updateMediaMessage }
                );
                
                if (!mediaBuffer || mediaBuffer.length === 0) {
                    throw new Error('Failed to download media');
                }
                
                let audioBuffer = mediaBuffer;
                
                // If it's a video, extract audio first
                if (hasVideo) {
                    await sock.sendMessage(chatId, {
                        text: `🎬 *Extracting audio from video...*\n\nThis may take a moment.`,
                        edit: processingMsg.key
                    });
                    
                    try {
                        audioBuffer = await extractAudioFromVideo(mediaBuffer);
                    } catch (ffmpegError) {
                        console.error('FFmpeg error:', ffmpegError);
                        await sock.sendMessage(chatId, {
                            text: '❌ Failed to extract audio from video.\nTry with audio message instead.',
                            edit: processingMsg.key
                        });
                        return;
                    }
                }
                
                // Update status
                await sock.sendMessage(chatId, {
                    text: `🔍 *Identifying song...*\n\nAnalyzing audio sample...`,
                    edit: processingMsg.key
                });
                
                // Initialize ACRCloud
                const acr = new acrcloud({
                    host: 'identify-ap-southeast-1.acrcloud.com',
                    access_key: '26afd4eec96b0f5e5ab16a7e6e05ab37',
                    access_secret: 'wXOZIqdMNZmaHJP1YDWVyeQLg579uK2CfY6hWMN8'
                });
                
                // Identify song (send first 10 seconds)
                const sampleAudio = audioBuffer.slice(0, Math.min(audioBuffer.length, 1024 * 1024)); // First 1MB max
                
                const { status, metadata } = await acr.identify(sampleAudio);
                
                if (status.code !== 0 || !metadata?.music?.length) {
                    await sock.sendMessage(chatId, {
                        text: `❌ *Could not identify song*\n\n` +
                              `*Possible reasons:*\n` +
                              `• Audio too short/noisy\n` +
                              `• Song not in database\n` +
                              `• Multiple songs playing\n\n` +
                              `*Try:*\n` +
                              `• Clearer audio (10-15 seconds)\n` +
                              `• ${PREFIX}shazam <song name> (text search)`,
                        edit: processingMsg.key
                    });
                    return;
                }
                
                const music = metadata.music[0];
                const { title, artists, album, release_date } = music;
                
                // Search YouTube for more info
                const query = `${title} ${artists?.[0]?.name || ''}`;
                let youtubeInfo = null;
                
                try {
                    const searchResults = await yts(query);
                    if (searchResults.videos && searchResults.videos.length > 0) {
                        youtubeInfo = searchResults.videos[0];
                    }
                } catch (searchError) {
                    console.log('YouTube search failed:', searchError.message);
                }
                
                // Build result message
                let resultText = `✅ *Song Identified!* 🦊\n\n`;
                resultText += `🎵 *Title:* ${title || 'Unknown'}\n`;
                
                if (artists && artists.length > 0) {
                    resultText += `👤 *Artist:* ${artists.map(a => a.name).join(', ')}\n`;
                }
                
                if (album?.name) {
                    resultText += `💿 *Album:* ${album.name}\n`;
                }
                
                if (release_date) {
                    resultText += `📅 *Released:* ${release_date}\n`;
                }
                
                if (youtubeInfo) {
                    resultText += `\n🔗 *YouTube:* ${youtubeInfo.url}\n`;
                    resultText += `⏱️ *Duration:* ${youtubeInfo.timestamp}\n`;
                    resultText += `👁️ *Views:* ${youtubeInfo.views}\n`;
                }
                
                // Add search links
                const encodedQuery = encodeURIComponent(query);
                resultText += `\n*Search Online:*\n`;
                resultText += `• YouTube: youtube.com/results?search_query=${encodedQuery}\n`;
                resultText += `• Spotify: open.spotify.com/search/${encodedQuery}\n`;
                resultText += `• Google: google.com/search?q=${encodedQuery}`;
                
                // Send result
                await sock.sendMessage(chatId, {
                    text: resultText,
                    edit: processingMsg.key
                });
                
                // Try to send album art or thumbnail
                try {
                    let imageBuffer = null;
                    
                    if (album?.cover) {
                        const imageResponse = await fetch(album.cover);
                        if (imageResponse.ok) {
                            imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                        }
                    } else if (youtubeInfo?.thumbnail) {
                        const imageResponse = await fetch(youtubeInfo.thumbnail);
                        if (imageResponse.ok) {
                            imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
                        }
                    }
                    
                    if (imageBuffer) {
                        await sock.sendMessage(chatId, {
                            image: imageBuffer,
                            caption: `🎵 ${title}`
                        });
                    }
                } catch (imageError) {
                    // Silent fail for image
                }
                
                // Log success
                console.log(`🎵 Shazam identified: ${title} - ${artists?.[0]?.name || 'Unknown'}`);
                
            } catch (error) {
                console.error('Shazam recognition error:', error);
                
                await sock.sendMessage(chatId, {
                    text: `❌ *Recognition failed*\n\nError: ${error.message}\n\nTry with clearer audio or text search.`,
                    edit: processingMsg.key
                });
            }
            
        } catch (error) {
            console.error('Shazam command error:', error);
            
            await sock.sendMessage(chatId, {
                react: { text: "❌", key: m.key }
            });
            
            await sendMessage(`❌ Command failed: ${error.message}`);
        }
    }
};