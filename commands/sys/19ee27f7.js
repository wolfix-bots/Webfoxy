// commands/ai/flux.js - FIXED VERSION
export default {
    name: "flux",
    alias: ["ai", "generate", "aiimage"],
    category: "ai",
    
    async execute(sock, m, args, PREFIX, extra) {
        const jid = m.key.remoteJid;
        
        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `${PREFIX}flux <prompt>\nExample: ${PREFIX}flux cute anime cat`
            }, { quoted: m });
        }
        
        const prompt = args.join(' ');
        
        try {
            // Send generating message
            await sock.sendMessage(jid, {
                text: `🎨 Generating: "${prompt}"\n⏳ Please wait...`
            }, { quoted: m });
            
            // Encode the prompt
            const encodedPrompt = encodeURIComponent(prompt);
            const apiUrl = `https://apiskeith.vercel.app/ai/flux?q=${encodedPrompt}`;
            
            console.log(`🌐 Fetching from: ${apiUrl}`);
            
            // Fetch the image directly (it returns image, not JSON)
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // Get the image as buffer
            const arrayBuffer = await response.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);
            
            // Check if we actually got an image
            if (imageBuffer.length < 1024) {
                throw new Error('Image too small or invalid');
            }
            
            // Check if it's a valid image by checking magic bytes
            const magicBytes = imageBuffer.slice(0, 4).toString('hex');
            const isJpeg = magicBytes.startsWith('ffd8');
            const isPng = magicBytes.startsWith('89504e47');
            const isWebP = magicBytes.startsWith('52494646'); // RIFF
            const isGif = magicBytes.startsWith('47494638'); // GIF8
            
            if (!isJpeg && !isPng && !isWebP && !isGif) {
                console.log('Magic bytes:', magicBytes);
                throw new Error('Not a valid image format');
            }
            
            // Send the image
            await sock.sendMessage(jid, {
                image: imageBuffer,
                caption: `🎨 ${prompt}`
            });
            
            console.log(`✅ Image sent (${(imageBuffer.length / 1024).toFixed(1)}KB)`);
            
        } catch (error) {
            console.error("❌ Flux error:", error.message);
            
            let errorMsg = `❌ Failed to generate\n\n`;
            
            if (error.message.includes('timeout')) {
                errorMsg += 'The API is taking too long.\n';
                errorMsg += 'Try a simpler prompt.';
            } else if (error.message.includes('HTTP')) {
                errorMsg += `API error: ${error.message}\n`;
                errorMsg += 'The service might be down.';
            } else if (error.message.includes('invalid')) {
                errorMsg += 'Invalid image received.\n';
                errorMsg += 'Try again.';
            } else {
                errorMsg += error.message;
            }
            
            await sock.sendMessage(jid, {
                text: errorMsg
            }, { quoted: m });
        }
    }
};