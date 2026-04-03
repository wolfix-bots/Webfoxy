import { createCanvas } from 'canvas';

export default {
  name: "glitchtext",
  alias: ["glitch", "glitchlogo"],
  description: "Create glitch/distortion effect text logos",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🌀 *Glitch Text*\n\nUsage: glitchtext <text>\n\n*Examples:*\n• glitchtext ERROR\n• glitchtext GLITCH\n• glitchtext SYSTEM` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 20) {
        await sock.sendMessage(jid, { 
          text: `⚠️ Text too long! Max 20 characters.\n(Currently: ${text.length})` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `🌀 Generating glitch effect for: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateGlitchText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🌀 *Glitch Text Generated!*\nText: ${text}`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [GLITCHTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateGlitchText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark tech background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, width, height);

  // Add binary code background
  drawBinaryBackground(ctx, width, height);

  // Main glitch text
  drawGlitchEffect(ctx, text, width, height);

  // Add scanlines and noise
  addGlitchArtifacts(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawBinaryBackground(ctx, width, height) {
  ctx.fillStyle = 'rgba(0, 255, 0, 0.05)';
  ctx.font = '12px monospace';
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const binary = Math.random() > 0.5 ? '1' : '0';
    
    ctx.fillText(binary, x, y);
  }
}

function drawGlitchEffect(ctx, text, width, height) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 90px "Courier New"';
  
  // Create multiple offset layers for glitch effect
  const colors = ['#00FF00', '#FF00FF', '#00FFFF', '#FFFF00'];
  
  // Base text (green)
  ctx.fillStyle = '#00FF00';
  ctx.fillText(text.toUpperCase(), width / 2, height / 2);
  
  // Glitch offset layers
  for (let i = 0; i < 5; i++) {
    const offsetX = (Math.random() - 0.5) * 15;
    const offsetY = (Math.random() - 0.5) * 10;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillText(text.toUpperCase(), width / 2 + offsetX, height / 2 + offsetY);
  }
  
  ctx.globalAlpha = 1.0;
  
  // Add "corrupted" effect with missing parts
  ctx.fillStyle = '#0a0a0f';
  for (let i = 0; i < 10; i++) {
    const x = width / 2 - ctx.measureText(text).width / 2 + Math.random() * ctx.measureText(text).width;
    const y = height / 2 - 40;
    const w = Math.random() * 30 + 5;
    const h = 90;
    
    ctx.fillRect(x, y, w, h);
  }
}

function addGlitchArtifacts(ctx, width, height) {
  // Scanlines
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.lineWidth = 1;
  
  for (let y = 0; y < height; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Random noise pixels
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2;
    
    ctx.fillRect(x, y, size, size);
  }
  
  // Glitch bars
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 3; i++) {
    const y = Math.random() * height;
    const h = Math.random() * 30 + 10;
    
    ctx.fillStyle = i % 2 === 0 ? '#FF00FF' : '#00FFFF';
    ctx.fillRect(0, y, width, h);
  }
  ctx.globalAlpha = 1.0;
}