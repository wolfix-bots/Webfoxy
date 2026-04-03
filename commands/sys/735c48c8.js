import { createCanvas } from 'canvas';

export default {
  name: "stonetext",
  alias: ["stone", "carved", "engraved"],
  description: "Create stone/carved/engraved text effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🪨 *Stone Text*\n\nUsage: stonetext <text>\n\n*Examples:*\n• stonetetch ANCIENT\n• stonetext CARVED\n• stonetext STONE\n• stonetetch RUNES` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 15) {
        await sock.sendMessage(jid, { 
          text: `🪨 Short texts work best for carving effect!` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `🪨 Carving text into stone: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateStoneText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🪨 *Stone Text*\n"${text}"\n⛏️ Ancient carved stone effect`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [STONETEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateStoneText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Stone wall background
  drawStoneWall(ctx, width, height);

  // Carved text effect
  drawCarvedText(ctx, text, width, height);

  // Add moss and weathering
  addWeathering(ctx, width, height);

  // Add stone texture overlay
  addStoneTexture(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawStoneWall(ctx, width, height) {
  // Draw stone blocks
  const stoneColors = ['#8a7f8d', '#7a6f7d', '#6a5f6d', '#5a4f5d'];
  const blockSize = 60;
  
  // Stone blocks pattern
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      // Random stone color
      const color = stoneColors[Math.floor(Math.random() * stoneColors.length)];
      ctx.fillStyle = color;
      
      // Slightly randomize block position for natural look
      const offsetX = (Math.random() - 0.5) * 10;
      const offsetY = (Math.random() - 0.5) * 10;
      const sizeVariation = (Math.random() - 0.5) * 10;
      
      // Draw stone block
      ctx.fillRect(
        x + offsetX,
        y + offsetY,
        blockSize + sizeVariation,
        blockSize + sizeVariation
      );
      
      // Stone block highlights (edges)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + offsetX,
        y + offsetY,
        blockSize + sizeVariation,
        blockSize + sizeVariation
      );
      
      // Add mortar lines
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
      ctx.lineWidth = 3;
      
      // Vertical mortar
      if (x > 0) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, y + offsetY);
        ctx.lineTo(x + offsetX, y + offsetY + blockSize);
        ctx.stroke();
      }
      
      // Horizontal mortar
      if (y > 0) {
        ctx.beginPath();
        ctx.moveTo(x + offsetX, y + offsetY);
        ctx.lineTo(x + offsetX + blockSize, y + offsetY);
        ctx.stroke();
      }
    }
  }
  
  // Add stone grain texture
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 1;
    
    ctx.fillRect(x, y, size, size);
  }
}

function drawCarvedText(ctx, text, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 100px "Times New Roman"';
  
  // Carved effect (recessed text)
  // First, draw shadow (deep part of carving)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillText(text.toUpperCase(), centerX + 4, centerY + 4);
  
  // Draw highlight (top edge of carving)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillText(text.toUpperCase(), centerX - 2, centerY - 2);
  
  // Draw inner carved area (stone color)
  ctx.fillStyle = '#5a4f5d'; // Dark stone color
  ctx.fillText(text.toUpperCase(), centerX, centerY);
  
  // Add chisel marks around letters
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.lineWidth = 1;
  
  const textWidth = ctx.measureText(text).width;
  const textHeight = 80;
  const textLeft = centerX - textWidth / 2;
  const textTop = centerY - textHeight / 2;
  
  // Add random chisel marks around text
  for (let i = 0; i < 50; i++) {
    // Position around text perimeter
    let x, y;
    
    if (Math.random() > 0.5) {
      // Horizontal edge
      x = textLeft + Math.random() * textWidth;
      y = Math.random() > 0.5 ? textTop - 5 : textTop + textHeight + 5;
    } else {
      // Vertical edge
      x = Math.random() > 0.5 ? textLeft - 5 : textLeft + textWidth + 5;
      y = textTop + Math.random() * textHeight;
    }
    
    // Draw small chisel mark
    const angle = Math.random() * Math.PI;
    const length = Math.random() * 8 + 4;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.stroke();
  }
  
  // Add cracks from carving
  drawStoneCracks(ctx, centerX, centerY, textWidth, textHeight);
}

function drawStoneCracks(ctx, centerX, centerY, textWidth, textHeight) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 2;
  
  // Draw cracks radiating from text
  for (let i = 0; i < 10; i++) {
    const startAngle = Math.random() * Math.PI * 2;
    const startDist = Math.random() * 20 + 10;
    
    const startX = centerX + Math.cos(startAngle) * (textWidth/2 + startDist);
    const startY = centerY + Math.sin(startAngle) * (textHeight/2 + startDist);
    
    // Create jagged crack line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    let currentX = startX;
    let currentY = startY;
    let segments = Math.floor(Math.random() * 5) + 3;
    
    for (let s = 0; s < segments; s++) {
      const length = Math.random() * 30 + 10;
      const angle = Math.random() * Math.PI * 2;
      
      currentX += Math.cos(angle) * length;
      currentY += Math.sin(angle) * length;
      
      ctx.lineTo(currentX, currentY);
    }
    
    ctx.stroke();
  }
}

function addWeathering(ctx, width, height) {
  // Add moss and weathering effects
  ctx.fillStyle = 'rgba(50, 100, 50, 0.3)'; // Moss color
  
  // Moss in corners and edges
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 40 + 20;
    
    // Moss patches
    const mossGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    mossGradient.addColorStop(0, 'rgba(50, 100, 50, 0.5)');
    mossGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = mossGradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Water stains
  ctx.fillStyle = 'rgba(80, 60, 40, 0.2)';
  for (let i = 0; i < 5; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const widthStain = Math.random() * 100 + 50;
    const heightStain = Math.random() * 30 + 10;
    
    // Stains run downward
    const stainGradient = ctx.createLinearGradient(x, y, x, y + heightStain);
    stainGradient.addColorStop(0, 'rgba(80, 60, 40, 0.3)');
    stainGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = stainGradient;
    ctx.fillRect(x, y, widthStain, heightStain);
  }
}

function addStoneTexture(ctx, width, height) {
  // Add final stone texture overlay
  ctx.globalAlpha = 0.05;
  
  // Add random mineral flecks
  const mineralColors = ['rgba(255, 255, 0, 0.5)', 'rgba(0, 255, 255, 0.3)', 'rgba(255, 0, 255, 0.3)'];
  
  for (let i = 0; i < 100; i++) {
    const color = mineralColors[Math.floor(Math.random() * mineralColors.length)];
    ctx.fillStyle = color;
    
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 3 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.globalAlpha = 1.0;
  
  // Add dust/sand overlay
  ctx.fillStyle = 'rgba(200, 180, 150, 0.05)';
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    ctx.fillRect(x, y, 1, 1);
  }
}