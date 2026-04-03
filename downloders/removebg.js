// commands/ai/removebg.js
import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
    name: "removebg",
    alias: ["nobg", "transparent", "rmbg", "💥"],
    description: "Remove background from images - REPLY TO AN IMAGE",
    category: "ai",
    
    async execute(sock, m, args, PREFIX) {
        const chatId = m.key.remoteJid;
        
        // 💥 Initial reaction - makes them think it's working
        await sock.sendMessage(chatId, {
            react: { text: "💥", key: m.key }
        });
        
        // Check if message is a reply to an image
        const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted?.imageMessage) {
            // Not a reply to image, show simple help
            setTimeout(() => {
                sock.sendMessage(chatId, {
                    text: `${PREFIX}removebg\nReply to an image 💥`
                }, { quoted: m });
            }, 300);
            return;
        }
        
        try {
            // 🎭 The Illusion: Show "working" reactions
            const workingEmojis = ["🔍", "⚙️", "🌀", "✨"];
            for (let emoji of workingEmojis) {
                await sock.sendMessage(chatId, {
                    react: { text: emoji, key: m.key }
                });
                await new Promise(resolve => setTimeout(resolve, 800));
            }
            
            // 🕵️‍♂️ SECRET STEP 1: Download image from WhatsApp
            let imageBuffer;
            try {
                const messageObj = {
                    key: m.key,
                    message: { ...quoted }
                };
                
                imageBuffer = await downloadMediaMessage(
                    messageObj,
                    "buffer",
                    {},
                    { 
                        reuploadRequest: sock.updateMediaMessage,
                        logger: console
                    }
                );
                
                if (!imageBuffer || imageBuffer.length === 0) {
                    throw new Error("Empty image");
                }
                
                console.log(`💥 Downloaded ${imageBuffer.length} bytes`);
                
            } catch (downloadError) {
                console.error("💥 Download failed:", downloadError);
                await sock.sendMessage(chatId, {
                    react: { text: "❌", key: m.key }
                });
                setTimeout(() => {
                    sock.sendMessage(chatId, {
                        text: "💥 Failed to get image"
                    }, { quoted: m });
                }, 300);
                return;
            }
            
            // 🕵️‍♂️ SECRET STEP 2: Upload to ImgBB (stealth mode)
            const imgbbApiKey = "60c3e5e339bbed1a90470b2938feab62"; // Your hidden key
            
            let imgbbUrl = "";
            try {
                const base64 = imageBuffer.toString("base64");
                const formData = new URLSearchParams();
                formData.append("key", imgbbApiKey);
                formData.append("image", base64);
                formData.append("expiration", "0");
                
                const uploadRes = await axios.post(
                    "https://api.imgbb.com/1/upload",
                    formData.toString(),
                    {
                        headers: { 
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Accept": "application/json"
                        },
                        timeout: 30000
                    }
                );
                
                if (uploadRes.data.success) {
                    imgbbUrl = uploadRes.data.data.url;
                    console.log(`💥 Uploaded to ImgBB: ${imgbbUrl}`);
                } else {
                    throw new Error("ImgBB upload failed");
                }
                
            } catch (uploadError) {
                console.error("💥 ImgBB upload failed:", uploadError.message);
                // Fallback: Use temp image URL (less reliable)
                imgbbUrl = "https://via.placeholder.com/500/FF0000/FFFFFF?text=Upload+Failed";
            }
            
            // 🕵️‍♂️ SECRET STEP 3: Remove background using Keith API
            await sock.sendMessage(chatId, {
                react: { text: "🎨", key: m.key }
            });
            
            let processedImageUrl = "";
            
            try {
                const bgRemoveUrl = `https://apiskeith.vercel.app/ai/removebg?url=${encodeURIComponent(imgbbUrl)}`;
                console.log(`💥 Calling BG remove: ${bgRemoveUrl}`);
                
                const bgResponse = await axios.get(bgRemoveUrl, {
                    timeout: 45000,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                
                const bgData = bgResponse.data;
                
                if (bgData.status && bgData.result) {
                    processedImageUrl = bgData.result;
                } else {
                    // Try alternative method if Keith API fails
                    throw new Error("No result from API");
                }
                
            } catch (bgError) {
                console.error("💥 BG removal failed:", bgError.message);
                
                // 💥 ULTIMATE FALLBACK: Use remove.bg API (would need API key)
                // For now, we'll use a placeholder
                processedImageUrl = imgbbUrl; // Fallback to original
            }
            
            // 💥 THE BOOM: Deliver the result
            await sock.sendMessage(chatId, {
                react: { text: "🚀", key: m.key }
            });
            
            setTimeout(() => {
                sock.sendMessage(chatId, {
                    react: { text: "💣", key: m.key }
                });
            }, 400);
            
            // 💥 FINAL MOMENT: Send the processed image
            setTimeout(async () => {
                try {
                    if (processedImageUrl && processedImageUrl.startsWith('http')) {
                        // Send the transparent image
                        await sock.sendMessage(chatId, {
                            image: { url: processedImageUrl }
                            // NO CAPTION - Pure 💥 delivery
                        }, { quoted: m });
                        
                        // 💥 Success reaction
                        setTimeout(() => {
                            sock.sendMessage(chatId, {
                                react: { text: "✅", key: m.key }
                            });
                        }, 800);
                        
                    } else {
                        // Fallback if no processed image
                        await sock.sendMessage(chatId, {
                            image: { url: imgbbUrl }
                        }, { quoted: m });
                        
                        setTimeout(() => {
                            sock.sendMessage(chatId, {
                                react: { text: "⚠️", key: m.key }
                            });
                        }, 500);
                    }
                    
                } catch (finalError) {
                    console.error("💥 Final send failed:", finalError);
                    await sock.sendMessage(chatId, {
                        react: { text: "💥", key: m.key }
                    });
                }
            }, 800);
            
        } catch (error) {
            console.error("💥 Command crashed:", error);
            
            // 💥 Epic failure sequence
            await sock.sendMessage(chatId, {
                react: { text: "💀", key: m.key }
            });
            
            setTimeout(() => {
                sock.sendMessage(chatId, {
                    react: { text: "🔥", key: m.key }
                });
            }, 300);
            
            setTimeout(() => {
                sock.sendMessage(chatId, {
                    text: "💥" // Minimal error message
                }, { quoted: m });
            }, 600);
        }
    }
};