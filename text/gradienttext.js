import { createCanvas } from 'canvas';

export default {
  name: "gradienttext",
  alias: ["gradient", "gradientlogo"],
  description: "Create beautiful gradient text effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🌈 *Gradient Text*\n\nUsage: gradienttext <text>\n\n*Color options:*\n• gradienttext blue red Hello\n• gradienttext #FF00FF #00FFFF Text\n• gradienttext rainbow Gradient` 
        }, { quoted: m });
        return;
      }

      // Parse color arguments
      let colors = ['#FF6B6B', '#4ECDC4']; // Default sunset gradient
      let text = args.join(' ');
      
      // Check for color arguments
      const colorKeywords = ['rainbow', 'sunset', 'ocean', 'fire', 'forest', 'berry', 'cotton', 'neon'];
      const firstWord = args[0].toLowerCase();
      
      if (colorKeywords.includes(firstWord)) {
        colors = getGradientColors(firstWord);
        text = args.slice(1).join(' ');
      } else if (args[0].startsWith('#') && args.length >= 2 && args[1].startsWith('#')) {
        colors = [args[0], args[1]];
        text = args.slice(2).join(' ');
      }
      
      if (!text.trim()) {
        text = "GRADIENT";
      }
      
      if (text.length > 25) {
        text = text.substring(0, 22) + '...';
      }

      await sock.sendMessage(jid, { 
        text: `🌈 Creating gradient: ${colors.join(' → ')}\nText: "${text}"` 
      }, { quoted: m });

      const logoBuffer = await generateGradientText(text, colors);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🌈 *Gradient Text*\nText: ${text}\nColors: ${colors.join(' → ')}`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [GRADIENTTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

function getGradientColors(keyword) {
  const gradients = {
    rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'],
    sunset: ['#FF6B6B', '#FFE66D', '#4ECDC4'],
    ocean: ['#0077B6', '#00B4D8', '#90E0EF'],
    fire: ['#FF0000', '#FF4500', '#FFD700'],
    forest: ['#2E8B57', '#3CB371', '#90EE90'],
    berry: ['#8A2BE2', '#DA70D6', '#FF69B4'],
    cotton: ['#FFAFCC', '#FFC8DD', '#FFE5EC'],
    neon: ['#00FFFF', '#FF00FF', '#FFFF00']
  };
  
  return gradients[keyword] || gradients.sunset;
}

async function generateGradientText(text, colors) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Clean white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  
  // Add color stops
  const step = 1 / (colors.length - 1);
  colors.forEach((color, index) => {
    gradient.addColorStop(index * step, color);
  });

  // Draw text with gradient
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px "Arial"';
  
  // Add subtle shadow for depth
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 3;
  
  ctx.fillStyle = gradient;
  ctx.fillText(text.toUpperCase(), width / 2, height / 2);
  
  // Remove shadow for outline
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Add outline for crispness
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.strokeText(text.toUpperCase(), width / 2, height / 2);

  // Add decorative elements
  addGradientDecorations(ctx, width, height, colors);

  return canvas.toBuffer('image/png');
}

function addGradientDecorations(ctx, width, height, colors) {
  // Add color swatches
  const swatchSize = 30;
  const spacing = 40;
  const startX = width / 2 - ((colors.length - 1) * spacing) / 2;
  
  colors.forEach((color, index) => {
    const x = startX + index * spacing;
    const y = height - 80;
    
    // Swatch
    ctx.fillStyle = color;
    ctx.fillRect(x - swatchSize/2, y - swatchSize/2, swatchSize, swatchSize);
    
    // Swatch border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - swatchSize/2, y - swatchSize/2, swatchSize, swatchSize);
  });
  
  // Add subtle pattern
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < colors.length; i++) {
    ctx.fillStyle = colors[i];
    for (let j = 0; j < 20; j++) {
      const size = Math.random() * 20 + 10;
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;
}