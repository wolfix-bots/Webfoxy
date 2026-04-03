import axios from 'axios';

export default {
  name: "playdoc",
  alias: ["ytdoc", "audiodoc", "mp3doc", "foxyplaydoc"],
  description: "Download audio from YouTube as document file",
  category: "Downloader",
  usage: ".playdoc <song name or youtube url>\nExample: .playdoc Believer",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    
    const sendMessage = async (text) => {
      return await sock.sendMessage(chatId, { text }, { quoted: m });
    };
    
    // Start reaction
    await sock.sendMessage(chatId, {
      react: { text: "📁", key: m.key }
    });
    
    try {
      const q = args.join(' ');
      
      if (!q) {
        await sendMessage(
          `📁 *AUDIO DOCUMENT DOWNLOADER* 🦊\n\n` +
          `*Usage:* ${PREFIX}playdoc <song>\n\n` +
          `*Examples:*\n` +
          `• ${PREFIX}playdoc Believer\n` +
          `• ${PREFIX}playdoc https://youtube.com/...\n` +
          `• ${PREFIX}playdoc https://youtube.com/shorts/...\n\n` +
          `*Downloads as MP3 document file*`
        );
        return;
      }
      
      // Searching
      await sock.sendMessage(chatId, {
        react: { text: "🔍", key: m.key }
      });
      
      let videoUrl;
      let videoTitle;
      let videoId;

      // Check if input is a YouTube URL
      if (q.match(/(youtube\.com|youtu\.be)/i)) {
        videoUrl = q;
        
        // Extract video ID from various YouTube URL formats
        const urlPatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^"&?\/\s]{11})/i,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/i,
            /youtube\.com\/live\/([^"&?\/\s]{11})/i,
            /youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)([^"&?\/\s]{11})/i
        ];
        
        for (const pattern of urlPatterns) {
            const match = q.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                break;
            }
        }
        
        if (!videoId) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage("❌ Invalid YouTube URL format\n\nSupported:\n• youtube.com/watch?v=...\n• youtu.be/...\n• youtube.com/shorts/...\n• youtube.com/live/...");
          return;
        }
        
        videoTitle = "YouTube Audio";
      } else {
        // Search for video
        try {
          const searchResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(q)}`, {
            timeout: 15000
          });
          
          const videos = searchResponse.data?.result;
          
          if (!Array.isArray(videos) || videos.length === 0) {
            await sock.sendMessage(chatId, {
              react: { text: "❌", key: m.key }
            });
            await sendMessage(`❌ No results for "${q}"`);
            return;
          }

          const firstVideo = videos[0];
          videoUrl = firstVideo.url;
          videoTitle = firstVideo.title || "Unknown Song";
          
        } catch (searchError) {
          console.error('Search error:', searchError);
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage("❌ Search failed. Try again.");
          return;
        }
      }

      // Download
      await sock.sendMessage(chatId, {
        react: { text: "📥", key: m.key }
      });

      try {
        const downloadResponse = await axios.get(`https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`, {
          timeout: 30000
        });
        
        const downloadUrl = downloadResponse.data?.result;
        
        if (!downloadUrl) {
          await sock.sendMessage(chatId, {
            react: { text: "❌", key: m.key }
          });
          await sendMessage("❌ Download failed - API returned no audio URL");
          return;
        }

        // Clean filename
        const fileName = `${videoTitle.substring(0, 50)}.mp3`.replace(/[^\w\s.-]/gi, '');
        
        // Send as document
        await sock.sendMessage(chatId, {
          react: { text: "✅", key: m.key }
        });
        
        await sock.sendMessage(chatId, {
          document: { url: downloadUrl },
          mimetype: "audio/mpeg",
          fileName: fileName,
          caption: `📁 ${videoTitle}`
        }, { quoted: m });

        // Log
        const senderJid = m.key.participant || chatId;
        const cleaned = jidManager.cleanJid(senderJid);
        console.log(`📁 Audio doc by: ${cleaned.cleanNumber} - "${videoTitle}"`);
        
      } catch (downloadError) {
        console.error('Download error:', downloadError);
        await sock.sendMessage(chatId, {
          react: { text: "❌", key: m.key }
        });
        await sendMessage("❌ Download failed. Try different song.");
      }
      
    } catch (error) {
      console.error('Playdoc error:', error);
      await sock.sendMessage(chatId, {
        react: { text: "💥", key: m.key }
      });
      await sendMessage(`❌ Error: ${error.message}`);
    }
  }
};