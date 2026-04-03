// File: commands/downloader/instagram.js
import axios from 'axios';

export default {
  name: "instagram",
  alias: ["insta", "igdl", "ig", "igvideo"],
  description: "Download Instagram videos",
  category: "Downloader",
  usage: ".instagram <instagram_url>",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    const sendReaction = async (emoji) => {
      try {
        await sock.sendMessage(chatId, {
          react: { text: emoji, key: m.key }
        });
      } catch (err) {
        console.log('Reaction failed:', err.message);
      }
    };
    
    try {
      const q = args.join(' ').trim();
      
      if (!q) {
        return sendMessage(
          `📸 *Instagram Video Downloader* 🦊\n\n` +
          `Download videos from Instagram\n\n` +
          `📝 *Usage:*\n` +
          `▸ ${PREFIX}instagram <instagram_url>\n\n` +
          `🔗 *Examples:*\n` +
          `▸ ${PREFIX}instagram https://www.instagram.com/reel/xyz/\n` +
          `▸ ${PREFIX}instagram https://www.instagram.com/p/xyz/\n` +
          `▸ ${PREFIX}instagram https://www.instagram.com/tv/xyz/\n\n` +
          `💡 *Supported:*\n` +
          `• Reels\n• Posts\n• IGTV\n• Stories`
        );
      }
      
      // Validate Instagram URL
      const instaRegex = /^(https?:\/\/)?(www\.)?instagram\.com\/(reel|p|tv|stories)\/[a-zA-Z0-9_-]+\/?/i;
      
      if (!instaRegex.test(q)) {
        return sendMessage(
          `❌ *Invalid Instagram URL*\n\n` +
          `Please provide a valid Instagram URL.\n\n` +
          `✅ *Valid formats:*\n` +
          `• https://www.instagram.com/reel/xyz/\n` +
          `• https://www.instagram.com/p/xyz/\n` +
          `• https://www.instagram.com/tv/xyz/\n` +
          `• https://www.instagram.com/stories/username/xyz/`
        );
      }
      
      // Start downloading
      await sendReaction("📥");
      await sendMessage(`📥 *Processing Instagram link...*\n\n🔗 ${q}`);
      
      // Try multiple endpoints
      let videoUrl = null;
      const endpoints = [
        `https://apiskeith.vercel.app/download/instadl?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/api/instagram?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/ig/dl?url=${encodeURIComponent(q)}`,
        `https://apiskeith.vercel.app/social/instagram?url=${encodeURIComponent(q)}`
      ];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying Instagram endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            timeout: 60000, // 1 minute timeout
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/json'
            }
          });
          
          // Check different response structures
          if (response.data?.result) {
            videoUrl = response.data.result;
            break;
          } else if (response.data?.url) {
            videoUrl = response.data.url;
            break;
          } else if (response.data?.videoUrl) {
            videoUrl = response.data.videoUrl;
            break;
          } else if (response.data?.downloadUrl) {
            videoUrl = response.data.downloadUrl;
            break;
          } else if (response.data?.links && Array.isArray(response.data.links)) {
            // Multiple quality options
            const videos = response.data.links.filter(link => 
              link.quality && link.url.includes('.mp4')
            );
            if (videos.length > 0) {
              videoUrl = videos[0].url; // Take highest quality first
              break;
            }
          }
        } catch (err) {
          console.log(`Instagram endpoint failed: ${err.message}`);
          continue;
        }
      }
      
      if (!videoUrl) {
        await sendReaction("❌");
        return sendMessage(
          `❌ *Failed to download Instagram video*\n\n` +
          `Possible reasons:\n` +
          `• Video is private\n` +
          `• Account is private\n` +
          `• Instagram rate limit\n` +
          `• Video too large\n\n` +
          `💡 *Try:*\n` +
          `• Public videos only\n` +
          `• Try again later\n` +
          `• Different video`
        );
      }
      
      // Send the video
      await sendReaction("🚀");
      await sendMessage(`✅ *Video found!*\n\n📤 Sending video...`);
      
      try {
        await sock.sendMessage(chatId, {
          video: { 
            url: videoUrl,
            mimetype: "video/mp4",
            caption: `📸 *Instagram Video*\n\n` +
                     `🔗 *Original:* ${q}\n` +
                     `⬇️ Downloaded via Keith Bot 🦊`
          },
          gifPlayback: false
        }, { quoted: m });
        
        await sendReaction("✅");
        
        // Log success
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`✅ Instagram video downloaded by: ${cleaned.cleanNumber || 'Unknown'}`);
        
      } catch (sendError) {
        console.error('Video send error:', sendError);
        
        // Check error type
        if (sendError.message?.includes('too large') || sendError.message?.includes('size')) {
          await sendReaction("📦");
          await sendMessage(
            `❌ *Video too large for WhatsApp*\n\n` +
            `WhatsApp limit: 64MB\n\n` +
            `🔗 *Download link:*\n${videoUrl}\n\n` +
            `💡 *Try:*\n` +
            `• Shorter video\n` +
            `• Copy link above\n` +
            `• Download manually`
          );
        } else {
          await sendReaction("❌");
          await sendMessage(
            `❌ *Failed to send video*\n\n` +
            `🔗 *Direct download link:*\n${videoUrl}\n\n` +
            `💡 Copy the link above to download manually.`
          );
        }
      }
      
    } catch (error) {
      console.error('Instagram command error:', error);
      await sendReaction("❌");
      
      let errorMsg = "❌ Failed to download Instagram video.";
      
      if (error.message?.includes('timeout')) {
        errorMsg = "❌ Request timeout. Try again.";
      } else if (error.message?.includes('Network Error')) {
        errorMsg = "❌ Network error. Check your connection.";
      } else if (error.message?.includes('ENOTFOUND')) {
        errorMsg = "❌ Server unavailable. Try again later.";
      }
      
      await sendMessage(`${errorMsg}\n\n💡 Make sure the Instagram URL is correct and the video is public.`);
    }
  }
};