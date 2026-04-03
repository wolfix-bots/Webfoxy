// commands/media/sticker.js
export default {
  name: "sticker",
  alias: ["s", "stickerize", "stik"],
  description: "Convert images/videos to stickers ✂️",
  category: "media",
  ownerOnly: false,

  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const isQuotedImage = m.quoted && m.quoted.message && m.quoted.message.imageMessage;
    const isQuotedVideo = m.quoted && m.quoted.message && m.quoted.message.videoMessage;
    
    if (!isQuotedImage && !isQuotedVideo && !m.message?.imageMessage) {
      return sock.sendMessage(jid, {
        text: `✂️ *FOXY STICKER MAKER*\n\n` +
              `*Usage:*\n` +
              `• Send/reply to an image with: ${PREFIX}sticker\n` +
              `• Send/reply to a video with: ${PREFIX}sticker\n` +
              `• Add text: ${PREFIX}sticker Foxy\n\n` +
              `*Options:*\n` +
              `${PREFIX}sticker crop - Crop sticker\n` +
              `${PREFIX}sticker circle - Circular sticker\n` +
              `${PREFIX}sticker removebg - Remove background`
      }, { quoted: m });
    }
    
    try {
      await sock.sendMessage(jid, {
        text: `🦊 *Creating sticker...*`
      }, { quoted: m });
      
      let buffer;
      
      if (m.quoted) {
        buffer = await sock.downloadMediaMessage(m.quoted);
      } else if (m.message?.imageMessage) {
        buffer = await sock.downloadMediaMessage(m);
      }
      
      if (!buffer) {
        throw new Error("Failed to download media");
      }
      
      // Get pack and author name
      const packName = args[0] || 'Foxy Bot';
      const authorName = args[1] || 'Foxy Sticker';
      
      await sock.sendMessage(jid, {
        sticker: buffer,
        stickerName: packName,
        stickerAuthor: authorName,
        stickerCategories: ['foxy', 'sticker']
      }, { quoted: m });
      
    } catch (error) {
      console.error("Sticker error:", error);
      await sock.sendMessage(jid, {
        text: `❌ *Failed to create sticker!*\n\n` +
              `Make sure:\n` +
              `• Image/video is not too large\n` +
              `• Media is supported format\n` +
              `• Try with a different image`
      }, { quoted: m });
    }
  }
};