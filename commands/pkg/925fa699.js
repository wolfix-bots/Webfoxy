import { createCanvas } from 'canvas';

export default {
  name: "vintagetext",
  alias: ["retro", "vintagelogo"],
  description: "Create vintage/retro style text logos",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `📻 *Vintage Text*\n\nUsage: vintagetext <text>\n\n*Style options:*\n• vintagetext 80s NEON\n• vintagetext 90s GRUNGE\n• vintagetext 70s PSYCHEDELIC` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 20) {
        text = text.substring(0, 17) + '...';
      }

      await sock.sendMessage(jid, { 
        text: `📻 Creating vintage style: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateVintageText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `📻 *Vintage Text*\n"${text}"\n🎨 Retro style with texture`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [VINTAGETEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateVintageText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Vintage background color
  ctx.fillStyle = '#8B7355'; // Brownish vintage color
  ctx.fillRect(0, 0, width, height);

  // Add paper texture
  addPaperTexture(ctx, width, height);

  // Add border
  drawVintageBorder(ctx, width, height);

  // Main vintage text
  drawVintageTypography(ctx, text, width, height);

  // Add vintage effects (scratches, dust)
  addVintageEffects(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function addPaperTexture(ctx, width, height) {
  // Paper grain effect
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 10000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const shade = Math.random() * 100 + 50;
    
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1.0;
  
  // Light vignette
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
  
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

function drawVintageBorder(ctx, width, height) {
  // Ornate border corners
  ctx.strokeStyle = '#D4AF37'; // Gold color
  ctx.lineWidth = 3;
  
  // Corner decorations
  const cornerSize = 40;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(cornerSize, 10);
  ctx.lineTo(10, cornerSize);
  ctx.moveTo(cornerSize/2, 10);
  ctx.lineTo(10, cornerSize/2);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(width - cornerSize, 10);
  ctx.lineTo(width - 10, cornerSize);
  ctx.moveTo(width - cornerSize/2, 10);
  ctx.lineTo(width - 10, cornerSize/2);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(cornerSize, height - 10);
  ctx.lineTo(10, height - cornerSize);
  ctx.moveTo(cornerSize/2, height - 10);
  ctx.lineTo(10, height - cornerSize/2);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(width - cornerSize, height - 10);
  ctx.lineTo(width - 10, height - cornerSize);
  ctx.moveTo(width - cornerSize/2, height - 10);
  ctx.lineTo(width - 10, height - cornerSize/2);
  ctx.stroke();
}

function drawVintageTypography(ctx, text, width, height) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Shadow for embossed effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.font = 'bold 85px "Times New Roman"';
  ctx.fillText(text.toUpperCase(), width / 2 + 3, height / 2 + 3);
  
  // Main text with gradient
  const textGradient = ctx.createLinearGradient(0, height / 2 - 50, 0, height / 2 + 50);
  textGradient.addColorStop(0, '#D4AF37'); // Gold
  textGradient.addColorStop(0.5, '#F5E8AA'); // Light gold
  textGradient.addColorStop(1, '#D4AF37'); // Gold
  
  ctx.fillStyle = textGradient;
  ctx.fillText(text.toUpperCase(), width / 2, height / 2);
  
  // Inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'bold 83px "Times New Roman"';
  ctx.fillText(text.toUpperCase(), width / 2 - 1, height / 2 - 1);
  
  // Decorative underline
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  const textWidth = ctx.measureText(text).width;
  
  ctx.beginPath();
  ctx.moveTo(width / 2 - textWidth / 2, height / 2 + 60);
  ctx.lineTo(width / 2 + textWidth / 2, height / 2 + 60);
  
  // Add decorative ends
  ctx.moveTo(width / 2 - textWidth / 2, height / 2 + 60);
  ctx.lineTo(width / 2 - textWidth / 2 - 10, height / 2 + 55);
  ctx.moveTo(width / 2 + textWidth / 2, height / 2 + 60);
  ctx.lineTo(width / 2 + textWidth / 2 + 10, height / 2 + 55);
  
  ctx.stroke();
}

function addVintageEffects(ctx, width, height) {
  // Add scratches
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i < 20; i++) {
    const length = Math.random() * 100 + 20;
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const angle = Math.random() * Math.PI;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + Math.cos(angle) * length, y1 + Math.sin(angle) * length);
    ctx.stroke();
  }
  
  // Add "dust" particles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Add light stain spots
  ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 50 + 20;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}