// commands/downloader/7clouds.js
import axios from 'axios';

export default {
  name: "7clouds",
  alias: ["7c", "foxy7c", "lyricvideo", "karaoke", "musicvideo"],
  description: "Download music videos from 7clouds with lyrics",
  category: "Downloader",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    
    const sendReaction = async (emoji) => {
      try {
        await sock.sendMessage(chatId, {
          react: { text: emoji, key: m.key }
        });
      } catch {}
    };
    
    try {
      const q = args.join(' ');
      
      if (!q) {
        await sendReaction("❓");
        await sock.sendMessage(chatId, {
          text: `*Usage:* ${PREFIX}7clouds <song name>\n*Example:* ${PREFIX}7clouds believer`,
          quoted: m
        });
        return;
      }
      
      // Start with music note reaction
      await sendReaction("🎶");
      
      // Clean and prepare search query
      const searchQueries = [
        `${q} 7clouds`,
        `${q} 7clouds lyrics`,
        `${q} lyric video`,
        `${q} official lyric video`,
        `${q} official music video`
      ];
      
      let videoData = null;
      let isFrom7clouds = false;
      
      // Try multiple search strategies
      for (const query of searchQueries) {
        try {
          console.log(`Trying search: ${query}`);
          
          // First try Keith API
          let searchResponse = null;
          
          try {
            searchResponse = await axios.get(
              `https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`,
              { timeout: 8000 }
            );
          } catch (e1) {
            // Try YouTube search as fallback
            searchResponse = await axios.get(
              `https://apiskeith.vercel.app/youtube/search?q=${encodeURIComponent(query)}`,
              { timeout: 8000 }
            );
          }
          
          const videos = searchResponse?.data?.result || searchResponse?.data?.videos || [];
          
          if (videos.length > 0) {
            // Look for 7clouds specifically
            const sevenCloudsVideos = videos.filter(video => {
              const title = (video.title || '').toLowerCase();
              const channel = (video.channel || '').toLowerCase();
              const desc = (video.description || '').toLowerCase();
              
              return (
                title.includes('7clouds') ||
                channel.includes('7clouds') ||
                (title.includes('lyric') && (title.includes('7') || channel.includes('7'))) ||
                (title.includes('lyrics') && title.includes('video')) ||
                channel.includes('lyric video')
              );
            });
            
            if (sevenCloudsVideos.length > 0) {
              videoData = sevenCloudsVideos[0];
              isFrom7clouds = true;
              console.log(`Found 7clouds video: ${videoData.title}`);
              break;
            } else if (query.includes('7clouds') && videos.length > 0) {
              // If we searched for 7clouds but didn't find channel name, take first result
              videoData = videos[0];
              console.log(`Found video (maybe 7clouds): ${videoData.title}`);
              break;
            }
          }
        } catch (searchError) {
          console.log(`Search failed for: ${query}`, searchError.message);
          continue;
        }
      }
      
      // If still no video found, try one more direct approach
      if (!videoData) {
        try {
          console.log('Trying direct YouTube search...');
          const directSearch = await axios.get(
            `https://apiskeith.vercel.app/youtube/search?q=${encodeURIComponent(q + " official music video")}`,
            { timeout: 10000 }
          );
          
          const videos = directSearch?.data?.videos || directSearch?.data?.result || [];
          if (videos.length > 0) {
            videoData = videos[0];
            console.log(`Found general video: ${videoData.title}`);
          }
        } catch (directError) {
          console.log('Direct search failed:', directError.message);
        }
      }
      
      if (!videoData || !videoData.url) {
        await sendReaction("❌");
        await sock.sendMessage(chatId, {
          text: `❌ No video found for "${q}"\nTry a different song title or check if it exists on YouTube`,
          quoted: m
        });
        return;
      }
      
      // Found it reaction
      await sendReaction("✅");
      
      // Downloading reaction
      await sendReaction("📥");
      
      // Try to download the video
      let downloadUrl = null;
      const videoId = videoData.url.includes('watch?v=') 
        ? videoData.url.split('watch?v=')[1].split('&')[0]
        : null;
      
      // Try multiple download methods
      if (videoId) {
        // Method 1: Direct YouTube download
        try {
          const ytDownload = await axios.get(
            `https://apiskeith.vercel.app/api/youtube/video?id=${videoId}`,
            { timeout: 30000 }
          );
          
          if (ytDownload.data?.result || ytDownload.data?.url) {
            downloadUrl = ytDownload.data.result || ytDownload.data.url;
          }
        } catch {}
        
        // Method 2: Alternative API
        if (!downloadUrl) {
          try {
            const altDownload = await axios.get(
              `https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoData.url)}&quality=360`,
              { timeout: 30000 }
            );
            if (altDownload.data?.result) downloadUrl = altDownload.data.result;
          } catch {}
        }
        
        // Method 3: Another alternative
        if (!downloadUrl) {
          try {
            const anotherDownload = await axios.get(
              `https://apiskeith.vercel.app/api/youtube/videomp4?url=${encodeURIComponent(videoData.url)}`,
              { timeout: 30000 }
            );
            if (anotherDownload.data?.url) downloadUrl = anotherDownload.data.url;
          } catch {}
        }
      }
      
      // Fallback: Use the original URL if no download URL found
      if (!downloadUrl) {
        downloadUrl = videoData.url;
      }
      
      // Prepare to send
      await sendReaction("🚀");
      
      // Clean filename
      const cleanTitle = (videoData.title || `${q} music video`)
        .replace(/[^\w\s.-]/gi, '')
        .substring(0, 50);
      
      // 💥 BOOM! Send video directly
      setTimeout(async () => {
        try {
          const caption = isFrom7clouds ? 
            `🎬 *7CLOUDS* - ${cleanTitle}\n🎤 Lyrics | 🎶 Music Video` :
            `🎬 *Music Video* - ${cleanTitle}\n📥 Downloaded via Bot`;
          
          await sock.sendMessage(chatId, {
            video: { 
              url: downloadUrl,
              mimetype: "video/mp4"
            },
            caption: caption,
            fileName: `${cleanTitle}.mp4`,
            gifPlayback: false
          }, { quoted: m });
          
          // Success reaction
          setTimeout(() => sendReaction("✅"), 1000);
          
        } catch (sendError) {
          console.error('Send error:', sendError);
          await sendReaction("❌");
          
          // If video failed, send link instead
          await sock.sendMessage(chatId, {
            text: `📎 *Video Link:*\n${videoData.url}\n\nDownload manually or try again.`,
            quoted: m
          });
        }
      }, 500);
      
    } catch (error) {
      console.error('7clouds error:', error);
      await sendReaction("❌");
      await sock.sendMessage(chatId, {
        text: `❌ Server error. Try: ${PREFIX}ytmp4 ${args.join(' ') || 'song'}`,
        quoted: m
      });
    }
  }
};