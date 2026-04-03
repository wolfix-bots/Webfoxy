import axios from "axios";
import fs from "fs";
import path from "path";

export default {
  name: "mp3",
  alias: ["audio", "ytmp3", "song"],
  desc: "Download audio/mp3 from YouTube directly 🎵",
  category: "downloader",
  usage: ".mp3 [YouTube URL or song name]",

  async execute(sock, m, args) {
    try {
      const chatId = m.key.remoteJid;
      const query = args.join(" ").trim();

      if (!query) {
        await sock.sendMessage(chatId, {
          text: "🎵 *Please provide a YouTube URL or song name!*\n\nExample: `.mp3 Ordinary`\nExample: `.mp3 https://youtu.be/xxx`",
        });
        return;
      }

      // Send initial processing message
      await sock.sendMessage(chatId, { 
        text: "🎵 *Fetching audio... Please wait.*" 
      });

      // Call the API with the query (works with both URLs and search terms)
      const apiUrl = `https://apis.xwolf.space/download/mp3?url=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl, { 
        timeout: 30000,
        responseType: "json"
      });

      const data = response.data;

      if (!data.success) {
        await sock.sendMessage(chatId, {
          text: "❌ Failed to fetch audio. Try a different URL or search term.",
        });
        return;
      }

      // Extract information
      const title = data.title || "Unknown Title";
      const downloadUrl = data.downloadUrl;
      const thumbnail = data.thumbnail;
      const quality = data.quality || "192kbps";
      const streamUrl = data.streamUrl; // For future use if needed
      
      // Update user
      await sock.sendMessage(chatId, { 
        text: `🎵 *Downloading:* ${title}\n⏳ Quality: ${quality}` 
      });

      // Download the actual audio file
      const audioResponse = await axios.get(downloadUrl, { 
        responseType: "arraybuffer",
        timeout: 60000, // 60 seconds for download
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const audioBuffer = Buffer.from(audioResponse.data);

      // Try to get thumbnail
      let thumbnailBuffer = null;
      try {
        const thumbResponse = await axios.get(thumbnail, { 
          responseType: "arraybuffer",
          timeout: 5000 
        });
        thumbnailBuffer = Buffer.from(thumbResponse.data);
      } catch (thumbError) {
        console.log("Could not fetch thumbnail");
      }

      // Prepare caption
      const caption = `🎵 *${title}*\n📊 Quality: ${quality}\n📡 Source: YouTube`;

      // Send with thumbnail if available
      if (thumbnailBuffer) {
        // Send thumbnail first
        await sock.sendMessage(chatId, {
          image: thumbnailBuffer,
          caption: caption,
        });
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Send audio
        await sock.sendMessage(chatId, {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          fileName: `${title.replace(/[^a-z0-9]/gi, '_')}.mp3`,
        });
      } else {
        // Send audio with caption
        await sock.sendMessage(chatId, {
          audio: audioBuffer,
          mimetype: "audio/mpeg",
          fileName: `${title.replace(/[^a-z0-9]/gi, '_')}.mp3`,
          caption: caption,
        });
      }

    } catch (error) {
      console.error("🎵 Error in mp3 command:", error);

      let errorMessage = "❌ Failed to download audio!";

      if (error.code === "ECONNABORTED") {
        errorMessage = "⏱️ Download timeout! The file might be too large.";
      } else if (error.response?.status === 400) {
        errorMessage = "❌ Invalid request. Please check your URL or search term.";
      } else if (error.response?.status === 404) {
        errorMessage = "❌ Audio not found.";
      }

      await sock.sendMessage(m.key.remoteJid, {
        text: errorMessage,
      });
    }
  },
};