import { createCanvas } from 'canvas';

export default {
  name: "cyberpunktext",
  alias: ["cyber", "future", "neonoir"],
  description: "Create cyberpunk/futuristic neon text",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🌃 *Cyberpunk Text*\n\nUsage: cyberpunktext <text>\n\n*Examples:*\n• cyberpunktext SYNTH\n• cyberpunktext CYBER\n• cyberpunktext FUTURE\n• cyberpunktext NEON` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 20) {
        text = text.substring(0, 17) + '...';
      }

      await sock.sendMessage(jid, { 
        text: `🌃 Rendering cyberpunk text: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateCyberpunkText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🌃 *Cyberpunk Text*\n"${text}"\n🤖 Futuristic neon dystopia`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [CYBERPUNKTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateCyberpunkText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark futuristic city background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, width, height);

  // Add cityscape
  drawCyberpunkCity(ctx, width, height);

  // Add rain effect
  drawCyberpunkRain(ctx, width, height);

  // Main cyberpunk text
  drawCyberpunkEffect(ctx, text, width, height);

  // Add holographic glitches
  addCyberGlitches(ctx, width, height);

  // Add scanlines
  drawScanlines(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawCyberpunkCity(ctx, width, height) {
  // Draw futuristic city skyline
  ctx.fillStyle = '#001122';
  
  // Tall buildings
  const buildingCount = 15;
  for (let i = 0; i < buildingCount; i++) {
    const x = (width / buildingCount) * i;
    const buildingWidth = Math.random() * 40 + 20;
    const buildingHeight = Math.random() * 200 + 100;
    
    // Building base
    ctx.fillRect(x, height - buildingHeight, buildingWidth, buildingHeight);
    
    // Building windows
    ctx.fillStyle = '#00aaff';
    const windowRows = Math.floor(buildingHeight / 20);
    const windowCols = Math.floor(buildingWidth / 15);
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.6) { // Random windows
          const windowX = x + col * 15 + 5;
          const windowY = height - buildingHeight + row * 20 + 5;
          
          ctx.fillRect(windowX, windowY, 8, 12);
        }
      }
    }
    
    ctx.fillStyle = '#001122';
  }
  
  // Add flying cars/vehicles
  ctx.fillStyle = '#ff00ff';
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * (height - 200);
    const size = Math.random() * 20 + 10;
    
    // Vehicle body
    ctx.fillRect(x, y, size * 2, size);
    
    // Glow
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.fillRect(x - 5, y - 5, size * 2 + 10, size + 10);
    ctx.fillStyle = '#ff00ff';
  }
}

function drawCyberpunkRain(ctx, width, height) {
  // Digital rain effect (matrix style)
  ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
  ctx.font = '12px monospace';
  
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    let y = Math.random() * height;
    
    // Draw 3-5 characters in a column
    const chars = Math.floor(Math.random() * 3) + 3;
    for (let j = 0; j < chars; j++) {
      // Random katakana or numbers
      const characters = '0123456789アイウエオカキクケコサシスセソ';
      const char = characters[Math.floor(Math.random() * characters.length)];
      
      // Fade out as it goes down
      const alpha = 1 - (j / chars);
      ctx.fillStyle = `rgba(0, 255, 0, ${alpha * 0.7})`;
      
      ctx.fillText(char, x, y + j * 15);
    }
  }
}

function drawCyberpunkEffect(ctx, text, width, height) {
  const centerX = width / 2;
  const centerY = height / 2 - 50; // Higher for city view
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 80px "Courier New"';
  
  // Multiple neon layers with different colors
  const neonLayers = [
    { color: '#00ffff', offset: -2, blur: 20 },
    { color: '#ff00ff', offset: 2, blur: 15 },
    { color: '#00ff00', offset: 0, blur: 25 }
  ];
  
  // Draw glow layers
  for (const layer of neonLayers) {
    ctx.shadowColor = layer.color;
    ctx.shadowBlur = layer.blur;
    ctx.fillStyle = layer.color;
    ctx.fillText(text.toUpperCase(), centerX + layer.offset, centerY + layer.offset);
  }
  
  // Clear shadow for main text
  ctx.shadowBlur = 0;
  
  // Main text (bright white)
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text.toUpperCase(), centerX, centerY);
  
  // Add circuit board lines under text
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  
  const textWidth = ctx.measureText(text).width;
  const startX = centerX - textWidth / 2;
  const endX = centerX + textWidth / 2;
  const lineY = centerY + 60;
  
  // Horizontal circuit line
  ctx.beginPath();
  ctx.moveTo(startX - 20, lineY);
  ctx.lineTo(endX + 20, lineY);
  ctx.stroke();
  
  // Vertical connectors
  for (let i = 0; i < 5; i++) {
    const x = startX + (textWidth / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, lineY);
    ctx.lineTo(x, lineY + 30);
    ctx.stroke();
    
    // Circuit nodes
    ctx.fillStyle = '#ff00ff';
    ctx.beginPath();
    ctx.arc(x, lineY + 30, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function addCyberGlitches(ctx, width, height) {
  // Add digital glitch effects
  ctx.globalAlpha = 0.3;
  
  // Horizontal glitch bars
  for (let i = 0; i < 5; i++) {
    const y = Math.random() * height;
    const h = Math.random() * 20 + 5;
    
    // Random glitch color
    const colors = ['#ff00ff', '#00ffff', '#00ff00'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillStyle = color;
    
    // Offset part of the bar for glitch effect
    const offset = (Math.random() - 0.5) * 30;
    ctx.fillRect(0, y, width/2 + offset, h);
    ctx.fillRect(width/2 - offset, y, width/2, h);
  }
  
  ctx.globalAlpha = 1.0;
  
  // Add binary code floating
  ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
  ctx.font = '10px monospace';
  
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const binary = Math.random() > 0.5 ? '1' : '0';
    
    ctx.fillText(binary, x, y);
  }
}

function drawScanlines(ctx, width, height) {
  // CRT monitor scanlines
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.lineWidth = 1;
  
  for (let y = 0; y < height; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  
  // Vignette effect
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(0.7, 'transparent');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}