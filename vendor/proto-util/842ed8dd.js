// commands/media/trailer.js
import axios from 'axios';

export default {
    name: "trailer",
    alias: ["movie-trailer", "showtrailer", "foxytrailer", "preview"],
    category: "media",
    
    async execute(sock, m, args, prefix, extra) {
        const jid = m.key.remoteJid;
        const msgId = m.key.id;
        
        // React with 🔍 immediately
        await sock.sendMessage(jid, {
            react: { text: "🔍", key: m.key }
        });
        
        if (!args.length) {
            await sock.sendMessage(jid, {
                react: { text: "❓", key: m.key }
            });
            
            setTimeout(() => {
                sock.sendMessage(jid, {
                    text: `${prefix}trailer <movie name>\nExample: ${prefix}trailer spykids`
                }, { quoted: m });
            }, 300);
            return;
        }
        
        const query = args.join(' ');
        
        try {
            // **FIXED API CALL** - Using correct endpoint
            const searchResponse = await axios.get(
                `https://apiskeith.vercel.app/api/youtube/search?q=${encodeURIComponent(query + " trailer")}`,
                { 
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                }
            );
            
            // Debug log
            console.log("Search response:", searchResponse.data);
            
            let videos = [];
            
            // Try different response structures
            if (searchResponse.data?.videos) {
                videos = searchResponse.data.videos;
            } else if (searchResponse.data?.result) {
                videos = searchResponse.data.result;
            } else if (Array.isArray(searchResponse.data)) {
                videos = searchResponse.data;
            }
            
            if (!videos || videos.length === 0) {
                // Try alternative API
                const altResponse = await axios.get(
                    `https://apiskeith.vercel.app/youtube/search?query=${encodeURIComponent(query)}`,
                    { timeout: 10000 }
                );
                
                videos = altResponse.data?.videos || altResponse.data || [];
            }
            
            if (videos.length === 0) {
                await sock.sendMessage(jid, {
                    react: { text: "❌", key: m.key }
                });
                
                setTimeout(() => {
                    sock.sendMessage(jid, {
                        text: `No results for "${query}"`
                    }, { quoted: m });
                }, 300);
                return;
            }
            
            // Change reaction to downloading
            await sock.sendMessage(jid, {
                react: { text: "📥", key: m.key }
            });
            
            // Find best video (prioritize trailers)
            const trailer = videos.find(v => 
                v.title?.toLowerCase().includes('trailer') ||
                v.title?.toLowerCase().includes('official')
            ) || videos[0];
            
            const videoUrl = trailer.url || `https://youtube.com/watch?v=${trailer.id}`;
            const videoTitle = trailer.title || `${query} Trailer`;
            
            console.log("Selected video:", videoTitle, videoUrl);
            
            // **FIXED DOWNLOAD CALL**
            const downloadResponse = await axios.get(
                `https://apiskeith.vercel.app/api/youtube/download?url=${encodeURIComponent(videoUrl)}`,
                { 
                    timeout: 35000,
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            
            const downloadData = downloadResponse.data;
            console.log("Download response:", downloadData);
            
            // Try different response structures
            const downloadUrl = downloadData?.url || 
                               downloadData?.result || 
                               downloadData?.downloadUrl ||
                               downloadData?.videoUrl;
            
            if (!downloadUrl) {
                throw new Error("No download URL received");
            }
            
            // Final reaction before delivery
            await sock.sendMessage(jid, {
                react: { text: "🎬", key: m.key }
            });
            
            // **FIXED: Wait a moment then send video**
            setTimeout(async () => {
                try {
                    await sock.sendMessage(jid, {
                        video: { 
                            url: downloadUrl,
                            mimetype: 'video/mp4'
                        },
                        caption: `🎬 ${videoTitle}`,
                        fileName: `${videoTitle.substring(0, 40)}.mp4`.replace(/[<>:"/\\|?*]/g, ''),
                        gifPlayback: false
                    }, { quoted: m });
                    
                    // Success reaction
                    setTimeout(() => {
                        sock.sendMessage(jid, {
                            react: { text: "✅", key: m.key }
                        });
                    }, 1000);
                    
                } catch (sendError) {
                    console.error("Send error:", sendError);
                    await sock.sendMessage(jid, {
                        react: { text: "😞", key: m.key }
                    });
                    
                    sock.sendMessage(jid, {
                        text: `Downloaded but failed to send: ${videoTitle}`
                    }, { quoted: m });
                }
            }, 800);
            
        } catch (error) {
            console.error("Trailer command error:", error.message);
            console.error("Error stack:", error.stack);
            
            let errorEmoji = "❌";
            let errorMsg = `Failed: "${query}"`;
            
            if (error.code === 'ECONNREFUSED') {
                errorEmoji = "🔌";
                errorMsg = "API is down";
            } else if (error.message.includes('timeout')) {
                errorEmoji = "⏰";
                errorMsg = "Took too long";
            } else if (error.message.includes('404')) {
                errorEmoji = "🔍";
                errorMsg = "Not found";
            }
            
            await sock.sendMessage(jid, {
                react: { text: errorEmoji, key: m.key }
            });
            
            setTimeout(() => {
                sock.sendMessage(jid, {
                    text: errorMsg
                }, { quoted: m });
            }, 300);
        }
    }
};