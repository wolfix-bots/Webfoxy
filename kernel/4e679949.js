import axios from "axios";
import fs from "fs";
import path from "path";

export default {
  name: "mp4",
  alias: ["video", "download", "ytmp4"],
  desc: "Download video from various platforms (YouTube, Facebook, etc.)",
  category: "downloader",
  usage: ".mp4 [video URL]",

  async execute(sock, m, args) {
    try {
      const chatId = m.key.remoteJid;
      const videoUrl = args[0]?.trim();

      if (!videoUrl) {
        await sock.sendMessage(chatId, {
          text: "🎥 *Please provide a video URL!*\n\nExample: `.mp4 https://youtu.be/xxxx`",
        });
        return;
      }

      await sock.sendMessage(chatId, { text: "⏬ *Downloading video... Please wait.*" });

      // Call the download API
      const apiUrl = `https://apis.xwolf.space/download/mp4?url=${encodeURIComponent(videoUrl)}`;
      const response = await axios.get(apiUrl, { 
        timeout: 60000, // Longer timeout for downloads
        responseType: "json" 
      });

      // --- IMPORTANT: ADAPT THIS PART ---
      // You need to check the actual response format from the API
      // It might return a direct download link or the video file itself.
      
      // Option 1: API returns a download URL
      if (response.data?.downloadUrl) {
        await sock.sendMessage(chatId, {
          video: { url: response.data.downloadUrl },
          caption: "✅ Here's your video!",
        });
      } 
      // Option 2: API returns base64 or buffer data
      else if (response.data?.buffer) {
        await sock.sendMessage(chatId, {
          video: Buffer.from(response.data.buffer, 'base64'),
          caption: "✅ Here's your video!",
        });
      }
      // Option 3: Handle other formats
      else {
        await sock.sendMessage(chatId, { 
          text: "⚠️ Could not process video. Please check the URL or try another one." 
        });
      }

    } catch (error) {
      console.error("🎥 Error in mp4 command:", error);
      
      let errorMessage = "❌ Failed to download video!";
      if (error.response?.status === 400) {
        errorMessage = "❌ Invalid URL or unsupported platform. Please check the link.";
      } else if (error.code === "ECONNABORTED") {
        errorMessage = "⏱️ Download timeout! The file might be too large.";
      }
      
      await sock.sendMessage(m.key.remoteJid, { text: errorMessage });
    }
  },
};