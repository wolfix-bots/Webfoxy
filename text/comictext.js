import { createCanvas } from 'canvas';

export default {
  name: "comictext",
  alias: ["comic", "pow", "bam"],
  description: "Create comic book style text with POW/BAM effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `💥 *Comic Text*\n\nUsage: comictext <text>\n\n*Examples:*\n• comictext POW!\n• comictext BAM!\n• comictext KABOOM!\n• comictext SMASH!` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ").toUpperCase();
      
      if (text.length > 20) {
        await sock.sendMessage(jid, { 
          text: `💥 Shorter text = Bigger impact!` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `💥 Drawing comic text: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateComicText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `💥 *Comic Text*\n"${text}"\n📚 Classic comic book style`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [COMICTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateComicText(text) {
  const width = 800;
  const height = 500; // Taller for comic effects
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Bright comic book background
  ctx.fillStyle = '#FFD700'; // Yellow background
  ctx.fillRect(0, 0, width, height);

  // Add comic dots pattern (Ben-Day dots)
  drawComicDots(ctx, width, height);

  // Main comic text
  drawComicEffect(ctx, text, width, height);

  // Add explosion/starburst effects
  addComicEffects(ctx, width, height);

  // Add comic border
  drawComicBorder(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawComicDots(ctx, width, height) {
  // Classic Ben-Day dots pattern
  const dotSize = 4;
  const spacing = 12;
  
  ctx.fillStyle = 'rgba(255, 0, 0, 0.2)'; // Red dots
  
  for (let y = spacing; y < height; y += spacing) {
    for (let x = spacing; x < width; x += spacing) {
      if ((x + y) % (spacing * 2) === 0) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawComicEffect(ctx, text, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Use comic-style font (bold and italic)
  ctx.font = 'italic bold 120px "Impact"';
  
  // Text outline (thick black)
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 12;
  ctx.strokeText(text, centerX, centerY);
  
  // Text fill (bright color)
  const textColor = getComicColor(text);
  ctx.fillStyle = textColor;
  ctx.fillText(text, centerX, centerY);
  
  // Inner highlight (white)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'italic bold 115px "Impact"';
  ctx.fillText(text, centerX - 3, centerY - 3);
  
  // Add speed lines behind text
  drawSpeedLines(ctx, centerX, centerY, text);
  
  // Add "impact lines" around text
  drawImpactLines(ctx, centerX, centerY, text);
}

function getComicColor(text) {
  // Different colors for different comic words
  const colorMap = {
    'POW': '#FF0000',    // Red
    'BAM': '#0000FF',    // Blue
    'BOOM': '#FF9900',   // Orange
    'KABOOM': '#FF0000', // Red
    'SMASH': '#008000',  // Green
    'WHAM': '#800080',   // Purple
    'ZAP': '#00FFFF',    // Cyan
    'BANG': '#FF4500',   // OrangeRed
    'CRASH': '#8B4513',  // Brown
    'KAPOW': '#FF00FF'   // Magenta
  };
  
  // Check if text matches any comic word
  for (const [word, color] of Object.entries(colorMap)) {
    if (text.includes(word)) {
      return color;
    }
  }
  
  // Default comic colors
  const comicColors = ['#FF0000', '#0000FF', '#FF9900', '#008000', '#800080'];
  return comicColors[Math.floor(Math.random() * comicColors.length)];
}

function drawSpeedLines(ctx, centerX, centerY, text) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  
  const textWidth = ctx.measureText(text).width;
  const lineCount = 20;
  
  for (let i = 0; i < lineCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = Math.random() * 100 + 50;
    
    // Start from text edge
    const startX = centerX + (Math.cos(angle) * textWidth/2);
    const startY = centerY + (Math.sin(angle) * 60);
    
    // End point
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawImpactLines(ctx, centerX, centerY, text) {
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  
  // Jagged lines around text for impact
  const textWidth = ctx.measureText(text).width;
  const textHeight = 100;
  
  // Top impact lines
  for (let i = 0; i < 3; i++) {
    const startX = centerX - textWidth/2 - 20 + i * 40;
    const startY = centerY - textHeight/2 - 30;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX - 10, startY - 20);
    ctx.lineTo(startX + 10, startY - 40);
    ctx.lineTo(startX + 30, startY - 30);
    ctx.stroke();
  }
  
  // Bottom impact lines
  for (let i = 0; i < 3; i++) {
    const startX = centerX - textWidth/2 - 20 + i * 40;
    const startY = centerY + textHeight/2 + 30;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX - 10, startY + 20);
    ctx.lineTo(startX + 10, startY + 40);
    ctx.lineTo(startX + 30, startY + 30);
    ctx.stroke();
  }
}

function addComicEffects(ctx, width, height) {
  // Add starburst explosion
  ctx.strokeStyle = '#FF0000';
  ctx.lineWidth = 3;
  
  const burstX = width * 0.7;
  const burstY = height * 0.3;
  
  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const length = 60;
    
    ctx.beginPath();
    ctx.moveTo(burstX, burstY);
    ctx.lineTo(
      burstX + Math.cos(angle) * length,
      burstY + Math.sin(angle) * length
    );
    ctx.stroke();
    
    // Add small lines between main lines
    const smallAngle = angle + Math.PI / 12;
    ctx.beginPath();
    ctx.moveTo(burstX, burstY);
    ctx.lineTo(
      burstX + Math.cos(smallAngle) * length/2,
      burstY + Math.sin(smallAngle) * length/2
    );
    ctx.stroke();
  }
  
  // Add "BOOM" text in corner
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 40px "Impact"';
  ctx.fillText('BOOM!', width - 100, 50);
  
  // Add "KAPOW" text
  ctx.fillText('KAPOW!', 100, height - 50);
}

function drawComicBorder(ctx, width, height) {
  // Classic comic panel border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  
  // Inner border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, width - 60, height - 60);
  
  // Corner decorations
  ctx.fillStyle = '#000000';
  const cornerSize = 20;
  
  // Top-left corner
  ctx.fillRect(20, 20, cornerSize, 8);
  ctx.fillRect(20, 20, 8, cornerSize);
  
  // Top-right corner
  ctx.fillRect(width - 20 - cornerSize, 20, cornerSize, 8);
  ctx.fillRect(width - 28, 20, 8, cornerSize);
  
  // Bottom-left corner
  ctx.fillRect(20, height - 28, cornerSize, 8);
  ctx.fillRect(20, height - 20 - cornerSize, 8, cornerSize);
  
  // Bottom-right corner
  ctx.fillRect(width - 20 - cornerSize, height - 28, cornerSize, 8);
  ctx.fillRect(width - 28, height - 20 - cornerSize, 8, cornerSize);
}