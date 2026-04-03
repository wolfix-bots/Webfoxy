import { createCanvas } from 'canvas';

export default {
  name: "metallictext",
  alias: ["metal", "chrome"],
  description: "Create shiny metallic/chrome text effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🔩 *Metallic Text*\n\nUsage: metallictext <text>\n\n*Examples:*\n• metallictext CHROME\n• metallictext STEEL\n• metallictext SILVER` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ").toUpperCase();
      
      if (text.length > 15) {
        await sock.sendMessage(jid, { 
          text: `⚠️ Keep text short for best metallic effect!` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `🔩 Forging metallic text: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateMetallicText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🔩 *Metallic Text*\n"${text}"\n✨ Chrome finish with reflections`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [METALLICTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateMetallicText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark industrial background
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Add metal plate texture
  drawMetalBackground(ctx, width, height);

  // Create metallic text
  drawMetallicEffect(ctx, text, width, height);

  // Add bolts and industrial elements
  addIndustrialElements(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawMetalBackground(ctx, width, height) {
  // Metal plate pattern
  ctx.fillStyle = '#2a2a2a';
  for (let y = 0; y < height; y += 20) {
    for (let x = 0; x < width; x += 20) {
      if ((x + y) % 40 === 0) {
        ctx.fillRect(x, y, 20, 20);
      }
    }
  }

  // Add brushed metal effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 10, height);
    ctx.stroke();
  }
}

function drawMetallicEffect(ctx, text, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px "Impact"';
  
  // Create chrome gradient
  const chromeGradient = ctx.createLinearGradient(
    0, centerY - 60,
    0, centerY + 60
  );
  chromeGradient.addColorStop(0, '#E0E0E0');
  chromeGradient.addColorStop(0.25, '#FFFFFF');
  chromeGradient.addColorStop(0.5, '#A0A0A0');
  chromeGradient.addColorStop(0.75, '#FFFFFF');
  chromeGradient.addColorStop(1, '#808080');
  
  // Draw text with embossed effect
  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillText(text, centerX + 4, centerY + 4);
  
  // Main chrome text
  ctx.fillStyle = chromeGradient;
  ctx.fillText(text, centerX, centerY);
  
  // Add metallic shine lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  
  const textWidth = ctx.measureText(text).width;
  const textHeight = 80;
  const textLeft = centerX - textWidth / 2;
  
  // Horizontal shine lines
  for (let i = 0; i < 5; i++) {
    const y = centerY - textHeight/2 + i * (textHeight / 4);
    ctx.beginPath();
    ctx.moveTo(textLeft, y);
    ctx.lineTo(textLeft + textWidth, y);
    ctx.stroke();
  }
  
  // Add bolt heads on text
  ctx.fillStyle = '#FFD700'; // Gold bolts
  const boltSize = 8;
  
  // Top bolts
  ctx.fillRect(textLeft + 20, centerY - 40, boltSize, boltSize);
  ctx.fillRect(textLeft + textWidth - 30, centerY - 40, boltSize, boltSize);
  
  // Bottom bolts
  ctx.fillRect(textLeft + 20, centerY + 30, boltSize, boltSize);
  ctx.fillRect(textLeft + textWidth - 30, centerY + 30, boltSize, boltSize);
}

function addIndustrialElements(ctx, width, height) {
  // Add rivets around edges
  ctx.fillStyle = '#666666';
  const rivetSize = 6;
  const spacing = 40;
  
  // Top row
  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.arc(x, 20, rivetSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Bottom row
  for (let x = spacing; x < width; x += spacing) {
    ctx.beginPath();
    ctx.arc(x, height - 20, rivetSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Left side
  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.arc(20, y, rivetSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Right side
  for (let y = spacing; y < height; y += spacing) {
    ctx.beginPath();
    ctx.arc(width - 20, y, rivetSize, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add welding spots
  ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 15 + 5;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}