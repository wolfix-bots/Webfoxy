import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store the current menu style
const stylePath = path.join(__dirname, "current_style.json");

export default {
  name: "menustyle",
  alias: ["setmenustyle", "changemenustyle", "style"],
  description: "Switch between fox menu styles (1–7)",
  category: "owner",
  ownerOnly: true,
  
  async execute(sock, m, args, PREFIX, extra) {
    const jid = m.key.remoteJid;
    const { jidManager } = extra;
    
    // ====== OWNER CHECK ======
    const isOwner = jidManager.isOwner(m);
    const isFromMe = m.key.fromMe;
    const senderJid = m.key.participant || jid;
    const cleaned = jidManager.cleanJid(senderJid);
    
    if (!isOwner) {
      let errorMsg = `❌ *Owner Only Command!*\n\n`;
      errorMsg += `Only the bot owner can change menu styles.\n\n`;
      errorMsg += `🔍 *Debug Info:*\n`;
      errorMsg += `├─ Your JID: ${cleaned.cleanJid}\n`;
      errorMsg += `├─ Your Number: ${cleaned.cleanNumber || 'N/A'}\n`;
      errorMsg += `├─ Type: ${cleaned.isLid ? 'LID 🔗' : 'Regular 📱'}\n`;
      errorMsg += `├─ From Me: ${isFromMe ? '✅ YES' : '❌ NO'}\n`;
      
      const ownerInfo = jidManager.getOwnerInfo ? jidManager.getOwnerInfo() : {};
      errorMsg += `└─ Owner Number: ${ownerInfo.cleanNumber || 'Not set'}\n\n`;
      
      if (cleaned.isLid && isFromMe) {
        errorMsg += `⚠️ *Issue Detected:*\n`;
        errorMsg += `You're using a linked device (LID).\n`;
        errorMsg += `Try using ${PREFIX}fixowner or ${PREFIX}forceownerlid\n`;
      } else if (!ownerInfo.cleanNumber) {
        errorMsg += `⚠️ *Issue Detected:*\n`;
        errorMsg += `Owner not set in jidManager!\n`;
        errorMsg += `Try using ${PREFIX}debugchat fix\n`;
      }
      
      return sock.sendMessage(jid, { 
        text: errorMsg 
      }, { 
        quoted: m
      });
    }
    
    // ====== SHOW CURRENT STYLE IF NO ARGS ======
    if (!args[0]) {
      const currentStyle = getCurrentMenuStyle();
      
      const styleDescriptions = {
        1: 'Image Menu - Menu with image header',
        2: 'Text Only - Minimal text menu',
        3: 'Full Descriptions - Detailed command info',
        4: 'Ad Style - Promotional format',
        5: 'Faded - Faded aesthetic design',
        6: 'Faded + Image - Faded with image',
        7: 'Image + Text - Balanced layout'
      };
      
      let styleList = `🎨 *MENU STYLE MANAGEMENT*\n\n`;
      styleList += `📊 Current Style: Style ${currentStyle}\n`;
      styleList += `📝 ${styleDescriptions[currentStyle]}\n\n`;
      styleList += `📋 Available Styles:\n`;
      
      for (let i = 1; i <= 7; i++) {
        styleList += `${i}. ${styleDescriptions[i]}\n`;
      }
      
      styleList += `\nUsage: ${PREFIX}menustyle <1-7>\n`;
      styleList += `Example: ${PREFIX}menustyle 3\n\n`;
      styleList += `🔧 Changes take effect immediately.`;
      
      return sock.sendMessage(jid, { 
        text: styleList 
      }, { 
        quoted: m
      });
    }
    
    const styleNum = parseInt(args[0]);
    
    // Validate input (1-7 only)
    if (isNaN(styleNum) || styleNum < 1 || styleNum > 7) {
      return sock.sendMessage(
        jid,
        {
          text: `❌ Invalid style number!\n\nValid styles: 1 to 7\n\nUsage: ${PREFIX}menustyle <1-7>\nExample: ${PREFIX}menustyle 3`
        },
        { 
          quoted: m
        }
      );
    }
    
    // Save chosen style
    try {
      const styleData = {
        current: styleNum,
        setBy: cleaned.cleanNumber || 'Unknown',
        setAt: new Date().toISOString(),
        setFrom: cleaned.isLid ? 'LID Device' : 'Regular Device',
        chatType: jid.includes('@g.us') ? 'Group' : 'DM'
      };
      
      fs.writeFileSync(stylePath, JSON.stringify(styleData, null, 2));
      
      // Style descriptions
      const styleDescriptions = {
        1: 'Image Menu - Menu with image header',
        2: 'Text Only - Minimal text menu',
        3: 'Full Descriptions - Detailed command info',
        4: 'Ad Style - Promotional format',
        5: 'Faded - Faded aesthetic design',
        6: 'Faded + Image - Faded with image',
        7: 'Image + Text - Balanced layout'
      };
      
      let successMsg = `✅ *Menu Style Updated*\n\n`;
      successMsg += `🎨 New Style: *Style ${styleNum}*\n`;
      successMsg += `📝 ${styleDescriptions[styleNum]}\n\n`;
      
      // Add image requirements info
      if ([1, 6, 7].includes(styleNum)) {
        successMsg += `🖼️ *Image Styles:* Requires menu image\n`;
        successMsg += `Use ${PREFIX}setmenuimage <url> to set\n`;
      }
      
      successMsg += `\n🔧 Changes applied immediately.\n`;
      successMsg += `Use ${PREFIX}menu to see the new style`;
      
      if (cleaned.isLid) {
        successMsg += `\n📱 *Note:* Changed from linked device`;
      }
      
      await sock.sendMessage(jid, { 
        text: successMsg 
      }, { 
        quoted: m
      });
      
      // Show preview after style change
      setTimeout(async () => {
        try {
          const previewText = `🎨 *Style ${styleNum} Preview*\n\n`;
          previewText += `Here's how your menu will look:\n`;
          previewText += `\`${PREFIX}menu\` - Full menu\n`;
          previewText += `\`${PREFIX}menu styles\` - Style info`;
          
          await sock.sendMessage(jid, { 
            text: previewText 
          }, { 
            quoted: m
          });
        } catch (e) {
          console.log("Preview message failed:", e.message);
        }
      }, 1000);
      
      // Log to console
      console.log(`✅ Menu style changed to ${styleNum} by ${cleaned.cleanJid}`);
      if (cleaned.isLid) {
        console.log(`   ↳ Changed from LID device`);
      }
      
    } catch (err) {
      console.error("❌ Failed to save menu style:", err);
      await sock.sendMessage(
        jid, 
        { 
          text: `❌ Error saving menu style: ${err.message}` 
        }, 
        { 
          quoted: m
        }
      );
    }
  },
};

// 🐾 Helper function to get the current menu style anywhere
export function getCurrentMenuStyle() {
  try {
    if (fs.existsSync(stylePath)) {
      const data = fs.readFileSync(stylePath, "utf8");
      const json = JSON.parse(data);
      return json.current || 1;
    }
    return 1; // Default style
  } catch (err) {
    console.error("❌ Error reading current menu style:", err);
    return 1;
  }
}