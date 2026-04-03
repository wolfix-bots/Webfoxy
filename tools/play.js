import axios from "axios";
import ytdl from "ytdl-core";
import fs from "fs";
import path from "path";

export default {
  name: "play",
  alias: ["p", "song", "audio", "ytmp3"],
  desc: "Download and play audio from YouTube or search",
  category: "downloader",
  usage: ".play [song name or YouTube URL]",

  async execute(sock, m, args) {
    try {
      const chatId = m.key.remoteJid;
      const query = args.join(" ");
      
      if (!query) {
        await sock.sendMessage(chatId, {
          text: "🎵 *Please provide a song name or YouTube URL!*\n\nExample: `.play Ordinary Alex Warren`\nExample: `.play https://youtu.be/xxxx`",
        });
        return;
      }

      // Send initial status
      const statusMsg = await sock.sendMessage(chatId, { 
        text: "🔍 *Searching for audio...* Please wait." 
      });

      let audioUrl = null;
      let title = null;
      let thumbnail = null;
      let duration = null;

      // Check if input is a YouTube URL
      const isUrl = query.match(/(youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
      
      if (isUrl) {
        // Direct YouTube URL
        try {
          const videoId = isUrl[2];
          const info = await ytdl.getInfo(videoId);
          title = info.videoDetails.title;
          thumbnail = info.videoDetails.thumbnails[0]?.url;
          duration = info.videoDetails.lengthSeconds;
          
          // Get audio stream
          audioUrl = ytdl(videoId, {
            quality: 'highestaudio',
            filter: 'audioonly'
          });
          
        } catch (err) {
          throw new Error("Invalid YouTube URL");
        }
      } 
      else {
        // Search using API
        const searchUrl = `https://apis.xwolf.space/download/mp3?q=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl);
        
        if (!response.data?.success) {
          throw new Error("No results found");
        }
        
        const data = response.data;
        title = data.title || data.searchResult?.title;
        thumbnail = data.thumbnail || data.thumbnailMq;
        duration = data.searchResult?.duration;
        
        // Get download URL
        if (data.downloadUrl) {
          // Download the file first
          const audioResponse = await axios.get(data.downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
          });
          audioUrl = Buffer.from(audioResponse.data);
        } else if (data.proxyUrl) {
          const audioResponse = await axios.get(data.proxyUrl, {
            responseType: 'arraybuffer',
            timeout: 60000
          });
          audioUrl = Buffer.from(audioResponse.data);
        } else {
          throw new Error("No download URL found");
        }
      }

      // Format duration
      const durationText = duration ? formatDuration(duration) : "Unknown";

      // Send audio with metadata
      await sock.sendMessage(chatId, {
        audio: audioUrl,
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        caption: `🎵 *Now Playing:*\n📌 *Title:* ${title}\n⏱️ *Duration:* ${durationText}\n\n🎧 *Enjoy the music!*`,
        ptt: false, // Set to true for voice note style
      }, {
        quoted: m
      });

      // Delete status message
      await sock.sendMessage(chatId, { delete: statusMsg.key });

    } catch (error) {
      console.error("🎵 Error in play command:", error);
      
      let errorMessage = "❌ *Failed to play audio!*\n\n";
      
      if (error.message === "No results found") {
        errorMessage += "No audio found for your search. Please try a different song name.";
      } 
      else if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
        errorMessage += "⏱️ Download timeout! The audio might be too large or the server is slow.";
      }
      else if (error.response?.status === 404) {
        errorMessage += "Audio not found. The link might be broken or removed.";
      }
      else {
        errorMessage += `Could not process your request. Please try again later.\n\n🔍 *Debug:* ${error.message.substring(0, 100)}`;
      }
      
      errorMessage += "\n\n💡 *Tips:*\n";
      errorMessage += "• Use more specific song names\n";
      errorMessage += "• Try with artist name\n";
      errorMessage += "• Use YouTube URL for better results";
      
      await sock.sendMessage(chatId, { text: errorMessage });
    }
  },
};

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds) return "Unknown";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}