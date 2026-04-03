import axios from "axios";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "imgbb",
  alias: ["upload", "imgurl", "foxypic", "imagehost", "foxyimg"],
  description: "Convert replied image to ImgBB URL directly 📸",
  category: "utility",
  
  async execute(sock, m, args, PREFIX, extra) {
    const chatId = m.key.remoteJid;
    const { jidManager } = extra;
    const sender = m.pushName || 'Friend';
    
    const sendMessage = async (text, editKey = null) => {
      const options = { quoted: m };
      if (editKey) options.edit = editKey;
      return await sock.sendMessage(chatId, { text }, options);
    };
    
    try {
      // Check if message is a reply to an image
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!quoted?.imageMessage) {
        return await sendMessage(
          `┌─⧭ *FOXY IMAGE UPLOADER* 📸 ⧭─┐
│
├─⧭ *What I do:*
│ Upload images to ImgBB and give you a direct URL!
│
├─⧭ *How to use:*
│ 1. Reply to an image
│ 2. Type \`${PREFIX}imgbb\`
│ 3. Get permanent URL instantly
│
├─⧭ *Features:*
│ • 📦 Permanent storage (no expiration)
│ • 🔗 Direct image links
│ • 📱 Works on any device
│ • 🆓 Completely free
│ • 📊 Up to 32MB per image
│
├─⧭ *Examples:*
│ • Reply to image → \`.imgbb\`
│ • Reply to image → \`.upload\`
│ • Reply to image → \`.foxypic\`
│
├─⧭ *Supported formats:*
│ • JPG, JPEG, PNG, GIF, WebP
│
└─⧭🦊 *Foxy hosts your images!*`
        );
      }

      // Get API key
      const apiKey = getImgBBKey();
      
      if (!apiKey || apiKey.length !== 32) {
        return await sendMessage(
          `┌─⧭ *API KEY ISSUE* ❌ ⧭─┐
│
├─⧭ ImgBB API key is not properly configured.
│
├─⧭ *Please contact the bot owner.*
│
└─⧭🦊`
        );
      }

      // Log the action
      const senderJid = m.key.participant || chatId;
      const cleaned = jidManager.cleanJid(senderJid);
      console.log(`🦊 Image upload by: ${cleaned.cleanNumber || 'Unknown'}`);

      // Send initial processing message
      const processingMsg = await sendMessage(
        `┌─⧭ *FOXY UPLOADER* ⧭─┐
│
├─⧭ *Step 1/3:* 📥 Downloading image...
│
│ Please wait while Foxy works! 🦊
│
└─⧭`
      );

      // Download image from WhatsApp
      let imageBuffer;
      try {
        console.log("🦊 Downloading image via Baileys...");
        
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
          throw new Error("Empty image buffer");
        }

        console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

      } catch (err) {
        console.error("❌ Download Error:", err.message);
        return await sendMessage(
          `┌─⧭ *DOWNLOAD FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* Could not download image
│
├─⧭ *Possible reasons:*
│ • Image too old
│ • Media encryption issue
│ • Network problem
│
├─⧭ *Try:*
│ • Send a fresh image
│ • Use a different image
│ • Check connection
│
└─⧭🦊`,
          processingMsg.key
        );
      }

      // Check file size (ImgBB limit is 32MB)
      const fileSizeKB = (imageBuffer.length / 1024).toFixed(1);
      const fileSizeMB = (imageBuffer.length / (1024 * 1024)).toFixed(2);
      
      if (imageBuffer.length > 32 * 1024 * 1024) {
        return await sendMessage(
          `┌─⧭ *FILE TOO LARGE* ⚠️ ⧭─┐
│
├─⧭ *Size:* ${fileSizeMB} MB
├─⧭ *Limit:* 32 MB
│
├─⧭ *Solutions:*
│ • Compress the image
│ • Use a smaller image
│ • Try \`.sticker\` command instead
│
└─⧭🦊`,
          processingMsg.key
        );
      }

      // Check if it's a valid image
      if (!isValidImage(imageBuffer)) {
        return await sendMessage(
          `┌─⧭ *INVALID IMAGE* ❌ ⧭─┐
│
├─⧭ The file doesn't appear to be a valid image.
│
├─⧭ *Supported formats:*
│ • JPG/JPEG
│ • PNG
│ • GIF
│ • WebP
│
└─⧭🦊`,
          processingMsg.key
        );
      }

      // Update status
      await sendMessage(
        `┌─⧭ *FOXY UPLOADER* ⧭─┐
│
├─⧭ *Step 2/3:* 📤 Uploading to ImgBB...
├─⧭ *Size:* ${fileSizeKB} KB (${fileSizeMB} MB)
│
│ Foxy is uploading your image! 🦊
│
└─⧭`,
        processingMsg.key
      );

      // Upload to ImgBB
      const result = await uploadToImgBB(imageBuffer, apiKey);

      if (!result.success) {
        return await sendMessage(
          `┌─⧭ *UPLOAD FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${result.error}
│
├─⧭ *Troubleshooting:*
│ • Try again in a minute
│ • Check image format
│ • Use different image
│
└─⧭🦊`,
          processingMsg.key
        );
      }

      // Success message
      const successText = 
        `┌─⧭ *✅ UPLOAD SUCCESSFUL!* ⧭─┐
│
├─⧭ *📸 Image Details:*
│ • Size: ${fileSizeKB} KB (${fileSizeMB} MB)
│ • Format: ${result.format || 'JPEG'}
│ • Width: ${result.width || 'N/A'}px
│ • Height: ${result.height || 'N/A'}px
│ • Host: ImgBB (Permanent)
│
├─⧭ *🔗 Direct URL:*
│ \`${result.url}\`
│
├─⧭ *🖼️ Thumbnail URL:*
│ \`${result.thumb}\`
│
├─⧭ *🗑️ Delete URL (save this):*
│ \`${result.deleteUrl || 'N/A'}\`
│
├─⧭ *📱 Quick Actions:*
│ • Tap URL to copy
│ • Share anywhere
│ • Use in websites
│
├─⧭ *👤 Uploaded by:* ${sender}
│
└─⧭🦊 *Foxy image hosting complete!*`;

      // Send the success message
      await sendMessage(successText, processingMsg.key);

      // Also send the image with caption
      try {
        await sock.sendMessage(chatId, {
          image: imageBuffer,
          caption: `┌─⧭ *FOXY IMAGE UPLOAD* 🦊 ⧭─┐
│
├─⧭ ✅ Upload successful!
├─⧭ 🔗 ${result.url}
│
│ Tap to copy URL 📋
└─⧭🦊`
        });
      } catch (sendError) {
        console.log("Optional image send failed:", sendError.message);
      }

      console.log(`✅ Image uploaded: ${fileSizeKB}KB by ${cleaned.cleanNumber || 'Unknown'}`);
      
    } catch (err) {
      console.error("🦊 [IMGBB ERROR]:", err);
      
      await sendMessage(
        `┌─⧭ *UNEXPECTED ERROR* ❌ ⧭─┐
│
├─⧭ *Error:* ${err.message || 'Unknown error'}
│
├─⧭ *Try:*
│ • Restart the command
│ • Different image
│ • Check connection
│ • Use \`.sticker\` instead
│
└─⧭🦊`
      );
    }
  }
};

// ============================================
// EMBEDDED API KEY FUNCTION
// ============================================

function getImgBBKey() {
  // Method 1: Character codes array
  const keyCodes = [
    54, 48, 99, 51, 101, 53, 101, 51, // 60c3e5e3
    51, 57, 98, 98, 101, 100, 49, 97, // 39bbed1a
    57, 48, 52, 55, 48, 98, 50, 57,   // 90470b29
    51, 56, 102, 101, 97, 98, 54, 50  // 38feab62
  ];
  
  // Convert character codes to string
  const apiKey = keyCodes.map(c => String.fromCharCode(c)).join('');
  
  // Verify it's correct
  if (apiKey.length === 32 && apiKey.startsWith('60c3e5e3')) {
    return apiKey;
  }
  
  // Alternative method if first fails
  return '60c3e5e339bbed1a90470b2938feab62';
}

// ============================================
// UPLOAD FUNCTION
// ============================================

async function uploadToImgBB(buffer, apiKey) {
  try {
    const base64 = buffer.toString("base64");
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append("key", apiKey);
    formData.append("image", base64);
    formData.append("expiration", "0"); // 0 = never expire
    
    // Upload with timeout
    const res = await axios.post(
      "https://api.imgbb.com/1/upload",
      formData.toString(),
      {
        headers: { 
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json"
        },
        timeout: 45000 // 45 seconds
      }
    );

    console.log("🦊 ImgBB Response received");

    if (res.data.success && res.data.data) {
      const data = res.data.data;
      return {
        success: true,
        url: data.url,
        displayUrl: data.display_url,
        thumb: data.thumb?.url || data.url,
        deleteUrl: data.delete_url,
        id: data.id,
        format: data.image?.extension || data.format,
        width: data.width,
        height: data.height,
        size: data.size,
        time: data.time
      };
    }

    return {
      success: false,
      error: res.data.error?.message || "Unknown ImgBB error",
      code: res.data.error?.code
    };

  } catch (e) {
    console.error("❌ ImgBB Upload Error:", e.response?.data || e.message);
    
    let errorMsg = "Upload failed";
    
    // Handle specific error codes
    if (e.response?.data?.error?.code) {
      const code = e.response.data.error.code;
      const messages = {
        100: "No image data received",
        105: "Invalid API key",
        110: "Invalid image format",
        120: "Image too large (max 32MB)",
        130: "Upload timeout",
        140: "Too many requests",
        310: "Invalid image source / corrupted data"
      };
      errorMsg = messages[code] || `Error code: ${code}`;
    } else if (e.code === 'ECONNABORTED') {
      errorMsg = "Upload timeout (45 seconds)";
    } else if (e.message?.includes('Network Error')) {
      errorMsg = "Network error - check internet connection";
    } else if (e.response?.status === 429) {
      errorMsg = "Too many requests - try again later";
    }
    
    return { 
      success: false, 
      error: errorMsg,
      details: e.message 
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Validate image buffer
function isValidImage(buffer) {
  if (!buffer || buffer.length < 100) return false;
  
  // Check magic bytes for common image formats
  const hex = buffer.slice(0, 8).toString('hex').toUpperCase();
  
  // JPEG: FF D8 FF
  if (hex.startsWith('FFD8FF')) return true;
  
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (hex.startsWith('89504E470D0A1A0A')) return true;
  
  // GIF: 47 49 46 38
  if (hex.startsWith('47494638')) return true;
  
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (hex.startsWith('52494646') && buffer.includes('WEBP')) return true;
  
  return false;
}

// Export utility functions
export const imgbbUtils = {
  upload: async (buffer) => {
    const apiKey = getImgBBKey();
    return await uploadToImgBB(buffer, apiKey);
  },
  
  validate: (buffer) => isValidImage(buffer),
  
  getApiKeyStatus: () => {
    const key = getImgBBKey();
    return {
      configured: key && key.length === 32,
      length: key?.length || 0,
      valid: key?.startsWith('60c3e5e3') || false
    };
  }
};

console.log('📸 ImgBB module loaded');
console.log('🔗 Aliases: .imgbb, .upload, .foxypic, .foxyimg');