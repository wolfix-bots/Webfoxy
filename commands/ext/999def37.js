import fs from "fs";
import path from "path";
import axios from "axios";

// Temp directory
const TMP_DIR = path.join(process.cwd(), "tmp", "getpp");
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

// Default profile picture
const DEFAULT_PP = "https://files.catbox.moe/lvcwnf.jpg";

export default {
    name: "getpp",
    alias: ["getprofilepic", "profilepic", "pp", "avatar", "getavatar", "foxpp"],
    desc: "Fetch someone's profile picture 🦊",
    category: "tools",
    usage: ".getpp [@user | reply to message]",

    async execute(sock, m, args, PREFIX, extra) {
        const chatId = m.key.remoteJid;
        const { jidManager } = extra;

        try {
            // Identify target user
            let target = null;
            
            const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
            const quoted = m.message?.extendedTextMessage?.contextInfo?.participant;
            
            if (args[0] && args[0].match(/^\d+$/)) {
                target = args[0] + '@s.whatsapp.net';
            }
            
            target = mentioned || quoted || target;

            if (!target) {
                return await sock.sendMessage(chatId, {
                    text: `┌─⧭ *FOXY PROFILE FETCHER* 🦊 ⧭─┐
│
├─⧭ *Usage:*
│ • .getpp @user
│ • .getpp (reply to message)
│ • .getpp 1234567890
│
└─⧭🦊`
                }, { quoted: m });
            }

            const cleaned = jidManager.cleanJid(target);
            const targetName = cleaned.cleanNumber;

            // Fetch profile picture
            let ppUrl;
            let usingDefault = false;
            
            try {
                ppUrl = await sock.profilePictureUrl(target, "image");
            } catch {
                ppUrl = DEFAULT_PP;
                usingDefault = true;
            }

            // Download image
            const filePath = path.join(TMP_DIR, `fox_pp_${Date.now()}.jpg`);
            const response = await axios.get(ppUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, Buffer.from(response.data));

            // Send profile picture
            await sock.sendMessage(chatId, {
                image: { url: filePath },
                caption: `┌─⧭ *🦊 PROFILE PICTURE* ⧭─┐
│
├─⧭ *User:* @${targetName}
${usingDefault ? '├─⧭ *Note:* Default image\n' : ''}│
└─⧭🦊`,
                mentions: [target]
            }, { quoted: m });

            // Clean up
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error("🦊 Error:", error);
            await sock.sendMessage(m.key.remoteJid, {
                text: `┌─⧭ *ERROR* ❌ ⧭─┐
│
├─⧭ Failed to get profile picture!
│
└─⧭🦊`
            }, { quoted: m });
        }
    }
};