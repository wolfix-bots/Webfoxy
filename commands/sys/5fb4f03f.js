import axios from "axios";
import sharp from "sharp"; // Optional: for adding fox logo to QR

export default {
    name: "qr",
    alias: ["qrcode", "qrgen", "makeqr", "foxqr"],
    description: "Generate QR codes from text/URL 📱",
    category: "tools",
    ownerOnly: false,

    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        const sender = m.pushName || 'Friend';
        
        // Show help if no arguments
        if (args.length === 0) {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY QR GENERATOR* 📱 ⧭─┐
│
├─⧭ *What I do:*
│ Generate QR codes from text or URLs!
│
├─⧭ *Usage:*
│ • \`${PREFIX}qr <text/url>\`
│ • \`${PREFIX}qr wifi <ssid> <password>\`
│ • \`${PREFIX}qr contact <name> <phone>\`
│ • \`${PREFIX}qr email <email> <subject> <body>\`
│ • \`${PREFIX}qr location <lat> <lng> <name>\`
│
├─⧭ *Examples:*
│ • \`.qr https://github.com\`
│ • \`.qr Hello World!\`
│ • \`.qr wifi MyWiFi mypassword123\`
│ • \`.qr contact John 1234567890\`
│ • \`.qr email info@foxy.com Hello\`
│ • \`.qr location -6.2 106.8 Jakarta\`
│
├─⧭ *Special Formats:*
│ • \`wifi\` - WiFi network QR
│ • \`contact\` - Contact info (vCard)
│ • \`email\` - Email message
│ • \`location\` - GPS coordinates
│ • \`phone\` - Phone number
│ • \`sms\` - SMS message
│
├─⧭ *More info:*
│ • \`${PREFIX}qr help\` - Detailed guide
│
└─⧭🦊 *Foxy makes QR codes!*`
            }, { quoted: m });
        }
        
        // Show detailed help
        if (args[0].toLowerCase() === 'help') {
            return sock.sendMessage(jid, {
                text: `┌─⧭ *QR CODE GUIDE* 📖 ⧭─┐
│
├─⧭ *WiFi QR:*
│ \`.qr wifi MyWiFi pass123\`
│ • T:WPA/WEP/nopass
│ • Hidden SSID? Add H:true
│
├─⧭ *Contact QR (vCard):*
│ \`.qr contact John 1234567890\`
│ • Name, Phone required
│ • Email optional: \`.qr contact John 123 john@email.com\`
│
├─⧭ *Email QR:*
│ \`.qr email to@email.com Subject Body here\`
│ • Creates mailto: link
│
├─⧭ *Location QR:*
│ \`.qr location -6.2 106.8 Jakarta\`
│ • Latitude, Longitude, Label
│
├─⧭ *Phone QR:*
│ \`.qr phone +1234567890\`
│ • tel: link
│
├─⧭ *SMS QR:*
│ \`.qr sms +1234567890 Hello\`
│ • sms: link with message
│
├─⧭ *Plain Text/URL:*
│ Just type any text or URL!
│ • URLs become clickable
│ • Text is encoded directly
│
└─⧭🦊 *Scan away!*`
            }, { quoted: m });
        }
        
        try {
            const text = args.join(' ');
            
            // Send processing message
            const processingMsg = await sock.sendMessage(jid, {
                text: `┌─⧭ *FOXY QR GENERATOR* 📱 ⧭─┐
│
├─⧭ *Generating QR code...*
│
│ • Content: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}
│ • Size: 500x500
│ • Format: PNG
│
│ Please wait, Foxy is working! 🦊
│
└─⧭`
            }, { quoted: m });
            
            // Handle different QR types
            let qrContent = text;
            let qrTitle = "FOXY QR CODE";
            let qrSubtitle = "";
            
            // WiFi QR
            if (args[0].toLowerCase() === 'wifi' && args.length >= 2) {
                const ssid = args[1];
                const password = args[2] || '';
                const encryption = args[3] || 'WPA';
                
                qrContent = `WIFI:S:${ssid};T:${encryption};P:${password};;`;
                qrTitle = "FOXY WiFi QR";
                qrSubtitle = `📶 *SSID:* ${ssid}\n🔐 *Password:* ${password || 'Open'}\n🔒 *Encryption:* ${encryption}`;
            }
            
            // Contact QR (vCard)
            else if (args[0].toLowerCase() === 'contact' && args.length >= 3) {
                const name = args[1];
                const phone = args[2];
                const email = args[3] || '';
                
                qrContent = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}`;
                if (email) qrContent += `\nEMAIL:${email}`;
                qrContent += `\nEND:VCARD`;
                
                qrTitle = "FOXY CONTACT QR";
                qrSubtitle = `👤 *Name:* ${name}\n📞 *Phone:* ${phone}\n${email ? `📧 *Email:* ${email}` : ''}`;
            }
            
            // Email QR
            else if (args[0].toLowerCase() === 'email' && args.length >= 2) {
                const email = args[1];
                const subject = args[2] || '';
                const body = args.slice(3).join(' ') || '';
                
                qrContent = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                qrTitle = "FOXY EMAIL QR";
                qrSubtitle = `📧 *To:* ${email}\n📝 *Subject:* ${subject || '(none)'}`;
            }
            
            // Location QR
            else if (args[0].toLowerCase() === 'location' && args.length >= 3) {
                const lat = args[1];
                const lng = args[2];
                const label = args.slice(3).join(' ') || 'Location';
                
                qrContent = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
                qrTitle = "FOXY LOCATION QR";
                qrSubtitle = `📍 *Location:* ${label}\n🌐 *Coordinates:* ${lat}, ${lng}`;
            }
            
            // Phone QR
            else if (args[0].toLowerCase() === 'phone' && args.length >= 2) {
                const phone = args[1];
                qrContent = `tel:${phone}`;
                qrTitle = "FOXY PHONE QR";
                qrSubtitle = `📞 *Phone:* ${phone}`;
            }
            
            // SMS QR
            else if (args[0].toLowerCase() === 'sms' && args.length >= 2) {
                const phone = args[1];
                const message = args.slice(2).join(' ') || '';
                qrContent = `sms:${phone}?body=${encodeURIComponent(message)}`;
                qrTitle = "FOXY SMS QR";
                qrSubtitle = `📱 *To:* ${phone}\n💬 *Message:* ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`;
            }
            
            // Default: plain text/URL
            else {
                // Check if it's a URL
                if (text.match(/^(http|https|ftp):\/\//)) {
                    qrTitle = "FOXY URL QR";
                    qrSubtitle = `🔗 *URL:* ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
                } else {
                    qrTitle = "FOXY TEXT QR";
                    qrSubtitle = `📝 *Text:* ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`;
                }
            }
            
            // Generate QR code using multiple APIs (fallback)
            let qrUrl;
            const encodedData = encodeURIComponent(qrContent);
            
            // Try primary API
            qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodedData}`;
            
            // Try to add Fox logo to QR (optional - requires sharp)
            let imageBuffer;
            try {
                const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(response.data);
                
                // Optional: Add small fox logo to center (commented out as it requires sharp)
                /*
                try {
                    const foxLogo = await axios.get('https://i.ibb.co/fox-logo.png', { responseType: 'arraybuffer' });
                    const logoBuffer = Buffer.from(foxLogo.data);
                    
                    const qrWithLogo = await sharp(imageBuffer)
                        .composite([{
                            input: logoBuffer,
                            gravity: 'centre',
                            blend: 'over'
                        }])
                        .png()
                        .toBuffer();
                    
                    imageBuffer = qrWithLogo;
                } catch (logoErr) {}
                */
                
            } catch (apiError) {
                // Fallback to alternative API
                qrUrl = `https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=${encodedData}`;
                const response = await axios.get(qrUrl, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(response.data);
            }
            
            // Delete processing message
            await sock.sendMessage(jid, {
                delete: processingMsg.key
            });
            
            // Prepare caption
            const caption = `┌─⧭ *${qrTitle}* 📱 ⧭─┐
│
${qrSubtitle ? `├─⧭ ${qrSubtitle}\n│\n` : ''}
├─⧭ *Generated by:* ${sender}
├─⧭ *Size:* 500x500
│
│ Scan the QR code below!
│
└─⧭🦊 *Foxy QR generator*`;
            
            // Send QR image
            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: caption,
                mimetype: 'image/png'
            }, { quoted: m });
            
            // Also send the raw content for copying
            if (qrContent.length < 200) {
                await sock.sendMessage(jid, {
                    text: `📋 *Raw Content:*\n\`${qrContent}\``
                });
            }
            
        } catch (error) {
            console.error("QR Generator Error:", error);
            
            await sock.sendMessage(jid, {
                text: `┌─⧭ *QR GENERATION FAILED* ❌ ⧭─┐
│
├─⧭ *Error:* ${error.message.substring(0, 100)}
│
├─⧭ *Possible reasons:*
│ • Text too long
│ • Invalid characters
│ • API unavailable
│ • Network issue
│
├─⧭ *Try:*
│ • Shorter text
│ • Different format
│ • Check special chars
│ • Try again later
│
├─⧭ *Example that works:*
│ \`${PREFIX}qr https://github.com\`
│
└─⧭🦊 *Even foxes make QR mistakes!*`
            }, { quoted: m });
        }
    }
};

console.log('📱 QR Generator module loaded - Fox themed!');