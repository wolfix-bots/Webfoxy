import { createCanvas } from 'canvas';

export default {
  name: "glasstext",
  alias: ["glass", "crystal"],
  description: "Create transparent glass/frosted text effects",
  async execute(sock, m, args) {
    const jid = m.key.remoteJid;

    try {
      if (args.length === 0) {
        await sock.sendMessage(jid, { 
          text: `🥃 *Glass Text*\n\nUsage: glasstext <text>\n\n*Examples:*\n• glasstext CRYSTAL\n• glasstext FROST\n• glasstext CLEAR` 
        }, { quoted: m });
        return;
      }

      const text = args.join(" ");
      
      if (text.length > 12) {
        await sock.sendMessage(jid, { 
          text: `⚠️ Short text works best for glass effect!` 
        }, { quoted: m });
        return;
      }

      await sock.sendMessage(jid, { 
        text: `🥃 Crafting glass text: "${text}"...` 
      }, { quoted: m });

      const logoBuffer = await generateGlassText(text);
      
      await sock.sendMessage(jid, {
        image: logoBuffer,
        caption: `🥃 *Glass Text*\n"${text}"\n💎 Transparent with refraction`
      }, { quoted: m });

    } catch (error) {
      console.error("❌ [GLASSTEXT] ERROR:", error);
      await sock.sendMessage(jid, { 
        text: `❌ Error: ${error.message}` 
      }, { quoted: m });
    }
  },
};

async function generateGlassText(text) {
  const width = 800;
  const height = 400;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background with gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#1e3c72');
  bgGradient.addColorStop(1, '#2a5298');
  
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Add background pattern (for refraction effect)
  drawBackgroundPattern(ctx, width, height);

  // Create glass text
  drawGlassEffect(ctx, text, width, height);

  // Add light reflections
  addGlassReflections(ctx, width, height);

  return canvas.toBuffer('image/png');
}

function drawBackgroundPattern(ctx, width, height) {
  // Draw distorted background (simulating refraction)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  
  // Grid of circles (distorted by "glass")
  for (let y = 50; y < height - 50; y += 60) {
    for (let x = 50; x < width - 50; x += 60) {
      // Distort position based on where text will be
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const distortion = Math.sin(distance / 50) * 10;
      
      const distortedX = x + distortion;
      const distortedY = y + distortion;
      
      ctx.beginPath();
      ctx.arc(distortedX, distortedY, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawGlassEffect(ctx, text, width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 120px "Arial"';
  
  // Text shadow (for depth)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillText(text.toUpperCase(), centerX + 5, centerY + 5);
  
  // Glass fill (semi-transparent)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillText(text.toUpperCase(), centerX, centerY);
  
  // Glass edges (white highlight)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 3;
  ctx.strokeText(text.toUpperCase(), centerX, centerY);
  
  // Inner glass highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeText(text.toUpperCase(), centerX - 1, centerY - 1);
  
  // Create refraction distortion inside text
  ctx.save();
  ctx.clip(); // Clip to text shape
  
  // Draw distorted background inside text
  ctx.globalAlpha = 0.3;
  drawDistortedPattern(ctx, width, height, centerX, centerY);
  ctx.globalAlpha = 1.0;
  
  ctx.restore();
  
  // Add condensation droplets
  addCondensation(ctx, text, centerX, centerY);
}

function drawDistortedPattern(ctx, width, height, centerX, centerY) {
  // Draw pattern that appears distorted through glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  
  for (let i = 0; i < 100; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    // Apply distortion
    const distortion = Math.sin(angle * 5) * 5;
    
    ctx.beginPath();
    ctx.arc(x + distortion, y + distortion, Math.random() * 4 + 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function addCondensation(ctx, text, centerX, centerY) {
  // Add water droplets on glass
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 100;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    const size = Math.random() * 6 + 2;
    
    // Draw droplet with highlight
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Droplet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x - size/3, y - size/3, size/3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function addGlassReflections(ctx, width, height) {
  // Add light reflections on glass surface
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  
  // Main light source reflection
  const lightX = width * 0.3;
  const lightY = height * 0.3;
  
  const lightGradient = ctx.createRadialGradient(
    lightX, lightY, 0,
    lightX, lightY, 150
  );
  lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  lightGradient.addColorStop(1, 'transparent');
  
  ctx.fillStyle = lightGradient;
  ctx.fillRect(0, 0, width, height);
  
  // Secondary reflections
  for (let i = 0; i < 3; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 80 + 40;
    
    const reflection = ctx.createRadialGradient(x, y, 0, x, y, size);
    reflection.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    reflection.addColorStop(1, 'transparent');
    
    ctx.fillStyle = reflection;
    ctx.fillRect(0, 0, width, height);
  }
}