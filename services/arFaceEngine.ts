/**
 * Real-time AI Face Filter & AR Mask Engine
 * Powered by MediaPipe Face Mesh (468/478 3D facial landmarks)
 */

export interface ARMaskDef {
  id: string;
  name: string;
  icon: string;
  category: 'cyber' | 'cute' | 'glam' | 'fantasy' | 'meme' | 'fun' | 'none';
  badge?: string;
  description: string;
}

export const AR_MASKS: ARMaskDef[] = [
  { id: 'none', name: 'Original', icon: '🚫', category: 'none', description: 'Clean camera feed without AR masks' },
  { id: 'cyber', name: 'Cyber HUD', icon: '🤖', category: 'cyber', badge: 'AI HUD', description: 'Neon wireframe visor & telemetry' },
  { id: 'cat', name: 'Neko Kitty', icon: '🐱', category: 'cute', badge: '3D AR', description: 'Fluffy animated cat ears & whiskers' },
  { id: 'demon', name: 'Demon Horns', icon: '😈', category: 'fantasy', badge: 'Fiery', description: 'Obsidian horns & burning eyes' },
  { id: 'goddess', name: 'Goddess Crown', icon: '👑', category: 'glam', badge: 'Sparkle', description: 'Golden laurel tiara & stardust' },
  { id: 'thug', name: 'Pixel Shades', icon: '🕶️', category: 'meme', badge: '8-Bit', description: 'Thug life glasses & animated smoke' },
  { id: 'alien', name: 'Alien Biomech', icon: '👽', category: 'cyber', badge: 'Glow', description: 'Bioluminescent grid & galaxy eyes' },
  { id: 'clown', name: 'Neon Jester', icon: '🤡', category: 'fun', badge: 'Vibrant', description: 'Glossy red nose & diamond eye makeup' },
  { id: 'blossom', name: 'Sakura Tiara', icon: '🌸', category: 'glam', badge: 'Floral', description: 'Spring blossoms & falling petals' },
];

export const LIPSTICK_SHADES = [
  { id: 'none', name: 'Natural', color: 'transparent', preview: '🚫' },
  { id: '#E11D48', name: 'Ruby Red', color: '#E11D48', preview: '💄' },
  { id: '#F43F5E', name: 'Rose Petal', color: '#F43F5E', preview: '🌸' },
  { id: '#BE185D', name: 'Berry Glam', color: '#BE185D', preview: '🍇' },
  { id: '#EA580C', name: 'Coral Peach', color: '#EA580C', preview: '🍑' },
  { id: '#A855F7', name: 'Cyber Violet', color: '#A855F7', preview: '🔮' },
  { id: '#F59E0B', name: 'Honey Glaze', color: '#F59E0B', preview: '🍯' },
];

export const BLUSH_SHADES = [
  { id: 'none', name: 'None', color: 'transparent', preview: '🚫' },
  { id: '#FB7185', name: 'Soft Peach', color: '#FB7185', preview: '🍑' },
  { id: '#F43F5E', name: 'Rosy Glow', color: '#F43F5E', preview: '🌹' },
  { id: '#EC4899', name: 'Doll Pink', color: '#EC4899', preview: '🎀' },
  { id: '#F97316', name: 'Sun Kissed', color: '#F97316', preview: '☀️' },
];

export const REACTION_BURSTS = [
  { id: 'hearts', name: 'Floating Hearts', icon: '❤️' },
  { id: 'stars', name: 'Golden Stars', icon: '⭐' },
  { id: 'fire', name: 'Fire Embers', icon: '🔥' },
  { id: 'sakura', name: 'Sakura Petals', icon: '🌸' },
];

export interface ARConfig {
  activeMask: string;
  lipstickColor: string;
  lipstickOpacity: number;
  blushColor: string;
  blushOpacity: number;
  eyeGlimmer: boolean;
  aiReactionsEnabled: boolean;
  reactionBurstType: 'hearts' | 'stars' | 'fire' | 'sakura';
  showNeuralHUD: boolean;
  beautyFilters: {
    smooth: number;
    whiten: number;
    rosy?: number;
  };
}

export interface ARParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'heart' | 'star' | 'smoke' | 'sparkle' | 'petal' | 'ember';
  rotation: number;
  vRot: number;
}

export interface ARMetrics {
  fps: number;
  frameCount: number;
  lastTime: number;
  pitch: number;
  yaw: number;
  roll: number;
  mouthOpen: number;
  smile: number;
  isWinking: boolean;
  confidence: number;
}

// Key MediaPipe Landmark indices
const UPPER_LIP_INDICES = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191, 78];
const LOWER_LIP_INDICES = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78];

// Key Mesh Wireframe Connection pairs for Neural HUD
const WIREFRAME_CONNECTIONS = [
  // Forehead & Brows
  [70, 63], [63, 105], [105, 66], [66, 107], [107, 10], [10, 336], [336, 296], [296, 334], [334, 293], [293, 300],
  // Eyes
  [33, 160], [160, 158], [158, 133], [133, 153], [153, 144], [144, 33],
  [263, 387], [387, 385], [385, 362], [362, 380], [380, 373], [373, 263],
  // Nose
  [168, 6], [6, 197], [197, 195], [195, 5], [5, 4], [4, 1],
  [1, 98], [98, 2], [2, 327], [327, 1],
  // Cheeks & Jaw
  [234, 93], [93, 132], [132, 58], [58, 172], [172, 136], [136, 150], [150, 149], [149, 176], [176, 148], [148, 152],
  [152, 377], [377, 400], [400, 378], [378, 379], [379, 365], [365, 397], [397, 288], [288, 361], [361, 323], [323, 454],
  // Triangulation crosses
  [116, 123], [123, 147], [147, 213], [345, 352], [352, 376], [376, 433],
  [10, 151], [151, 9], [9, 8], [8, 168],
];

/**
 * Spawns dynamic particle reaction from face location
 */
export function spawnParticles(
  particles: ARParticle[],
  x: number,
  y: number,
  type: 'heart' | 'star' | 'smoke' | 'sparkle' | 'petal' | 'ember',
  count: number = 4
) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (type === 'smoke' || type === 'ember' ? 2.5 : 1.5),
      size: type === 'heart' ? 14 + Math.random() * 8 : (type === 'petal' ? 12 + Math.random() * 6 : 8 + Math.random() * 8),
      color:
        type === 'heart' ? '#FF2E7E' :
        type === 'star' ? '#FFD700' :
        type === 'ember' ? (Math.random() > 0.5 ? '#FF4500' : '#FFA500') :
        type === 'petal' ? '#FFB7C5' : '#FFFFFF',
      alpha: 1.0,
      life: 0,
      maxLife: 40 + Math.random() * 30,
      type,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
    });
  }
}

/**
 * Main AR Renderer called on every MediaPipe FaceMesh frame
 */
export function renderARFrame(
  ctx: CanvasRenderingContext2D,
  results: any,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  config: ARConfig,
  particles: ARParticle[],
  metrics: ARMetrics,
  cooldowns: { lastMouth: number; lastSmile: number; lastWink: number }
) {
  // Sync canvas dimensions with video
  if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
  }

  const w = canvas.width;
  const h = canvas.height;
  const now = performance.now();
  const time = now * 0.002;

  // Clear previous frame
  ctx.clearRect(0, 0, w, h);

  // Update FPS in metrics
  metrics.frameCount++;
  if (now - metrics.lastTime >= 1000) {
    metrics.fps = Math.round((metrics.frameCount * 1000) / (now - metrics.lastTime));
    metrics.frameCount = 0;
    metrics.lastTime = now;
  }

  // If no faces detected, update particles and return
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    updateAndDrawParticles(ctx, particles);
    return;
  }

  const landmarks = results.multiFaceLandmarks[0];
  metrics.confidence = 0.98;

  // Coordinate helpers
  const p = (idx: number) => ({
    x: landmarks[idx].x * w,
    y: landmarks[idx].y * h,
    z: landmarks[idx].z || 0,
  });

  const leftEyeOuter = p(33);
  const rightEyeOuter = p(263);
  const noseBridge = p(168);
  const noseTip = p(1);
  const forehead = p(10);
  const chin = p(152);
  const mouthLeft = p(61);
  const mouthRight = p(291);
  const upperLip = p(13);
  const lowerLip = p(14);
  const leftCheek = p(116);
  const rightCheek = p(345);

  // Calculate face geometry
  const dx = rightEyeOuter.x - leftEyeOuter.x;
  const dy = rightEyeOuter.y - leftEyeOuter.y;
  const eyeDist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const faceHeight = Math.hypot(chin.x - forehead.x, chin.y - forehead.y);

  // Biometric & Expression telemetry
  const mouthOpening = Math.hypot(lowerLip.x - upperLip.x, lowerLip.y - upperLip.y);
  const mouthOpenRatio = mouthOpening / (eyeDist || 1);
  const mouthWidth = Math.hypot(mouthRight.x - mouthLeft.x, mouthRight.y - mouthLeft.y);
  const smileRatio = mouthWidth / (eyeDist || 1);

  // Eyes openness
  const leftEyeTop = p(159);
  const leftEyeBottom = p(145);
  const rightEyeTop = p(386);
  const rightEyeBottom = p(374);
  const leftEyeOpen = Math.hypot(leftEyeBottom.x - leftEyeTop.x, leftEyeBottom.y - leftEyeTop.y) / (eyeDist || 1);
  const rightEyeOpen = Math.hypot(rightEyeBottom.x - rightEyeTop.x, rightEyeBottom.y - rightEyeTop.y) / (eyeDist || 1);

  // Orientation angles
  metrics.roll = Math.round(angle * (180 / Math.PI));
  metrics.yaw = Math.round((noseTip.x - (leftEyeOuter.x + rightEyeOuter.x) / 2) / (eyeDist || 1) * 60);
  metrics.pitch = Math.round((noseTip.y - (leftEyeOuter.y + rightEyeOuter.y) / 2) / (faceHeight || 1) * 60);
  metrics.mouthOpen = Math.min(100, Math.round(mouthOpenRatio * 200));
  metrics.smile = Math.min(100, Math.max(0, Math.round((smileRatio - 0.75) * 300)));
  metrics.isWinking = (leftEyeOpen < 0.045 && rightEyeOpen > 0.075) || (rightEyeOpen < 0.045 && leftEyeOpen > 0.075);

  // 1. AI Expression Reaction Triggers
  if (config.aiReactionsEnabled) {
    // A: Mouth Open Gasp / Burst
    if (mouthOpenRatio > 0.35 && now - cooldowns.lastMouth > 280) {
      cooldowns.lastMouth = now;
      const type = config.reactionBurstType === 'sakura' ? 'petal' :
                   config.reactionBurstType === 'fire' ? 'ember' :
                   config.reactionBurstType === 'stars' ? 'star' : 'heart';
      spawnParticles(particles, lowerLip.x, lowerLip.y, type, 5);
    }

    // B: Broad Smile Sparkles
    if (smileRatio > 0.96 && now - cooldowns.lastSmile > 450) {
      cooldowns.lastSmile = now;
      spawnParticles(particles, leftCheek.x, leftCheek.y - 20, 'sparkle', 3);
      spawnParticles(particles, rightCheek.x, rightCheek.y - 20, 'sparkle', 3);
    }

    // C: Eye Wink Starburst
    if (metrics.isWinking && now - cooldowns.lastWink > 400) {
      cooldowns.lastWink = now;
      const winkPos = leftEyeOpen < 0.045 ? leftEyeOuter : rightEyeOuter;
      spawnParticles(particles, winkPos.x, winkPos.y, 'star', 4);
    }
  }

  // 2. AI Makeup Layer (Blush & Lipstick)
  if (config.blushColor && config.blushColor !== 'none') {
    drawCheekBlush(ctx, leftCheek, rightCheek, eyeDist * 0.45, config.blushColor, (config.blushOpacity || 50) / 100);
  }

  if (config.lipstickColor && config.lipstickColor !== 'none') {
    drawLipstick(ctx, landmarks, w, h, config.lipstickColor, (config.lipstickOpacity || 60) / 100);
  }

  // 3. Iris Glimmer
  if (config.eyeGlimmer) {
    const leftIris = landmarks[468] ? p(468) : { x: (leftEyeOuter.x + p(133).x) / 2, y: (leftEyeOuter.y + p(133).y) / 2 };
    const rightIris = landmarks[473] ? p(473) : { x: (rightEyeOuter.x + p(362).x) / 2, y: (rightEyeOuter.y + p(362).y) / 2 };
    drawEyeGlimmer(ctx, leftIris, rightIris, eyeDist * 0.08, time);
  }

  // 4. Procedural AR Masks
  switch (config.activeMask) {
    case 'cyber':
      drawCyberMask(ctx, landmarks, w, h, p, leftEyeOuter, rightEyeOuter, noseBridge, eyeDist, angle, time);
      break;
    case 'cat':
      drawCatMask(ctx, p, leftEyeOuter, rightEyeOuter, noseTip, noseBridge, eyeDist, angle, time);
      break;
    case 'demon':
      drawDemonMask(ctx, p, leftEyeOuter, rightEyeOuter, forehead, eyeDist, angle, time, particles);
      break;
    case 'goddess':
      drawGoddessCrown(ctx, p, forehead, eyeDist, angle, time, particles);
      break;
    case 'thug':
      drawThugLife(ctx, p, leftEyeOuter, rightEyeOuter, mouthLeft, eyeDist, angle, time, particles);
      break;
    case 'alien':
      drawAlienMask(ctx, landmarks, w, h, p, leftEyeOuter, rightEyeOuter, forehead, eyeDist, angle, time);
      break;
    case 'clown':
      drawClownMask(ctx, p, leftEyeOuter, rightEyeOuter, noseTip, mouthLeft, mouthRight, eyeDist, angle);
      break;
    case 'blossom':
      drawSakuraCrown(ctx, p, forehead, eyeDist, angle, time, particles);
      break;
    default:
      break;
  }

  // 5. AI Neural Mesh Wireframe HUD
  if (config.showNeuralHUD) {
    drawNeuralMeshWireframe(ctx, landmarks, w, h, p, metrics);
  }

  // 6. Update and render active particles
  updateAndDrawParticles(ctx, particles);
}

/**
 * Procedural AR Mask: Cyberpunk Neon HUD & Visor
 */
function drawCyberMask(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  w: number,
  h: number,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  noseBridge: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number
) {
  ctx.save();

  // A: Glowing Neon Contour Circuit
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 10;
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 1.8;

  // Forehead Cyber Arc
  const browIndices = [70, 63, 105, 66, 107, 10, 336, 296, 334, 293, 300];
  ctx.beginPath();
  browIndices.forEach((idx, i) => {
    const pt = p(idx);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Cheekbone neon streaks
  ctx.strokeStyle = '#FF007F';
  ctx.shadowColor = '#FF007F';
  ctx.beginPath();
  [116, 123, 147, 213].forEach((idx, i) => {
    const pt = p(idx);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  ctx.beginPath();
  [345, 352, 376, 433].forEach((idx, i) => {
    const pt = p(idx);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // B: Rotating Cyber Target Reticle on Right Eye
  ctx.save();
  ctx.translate(rightEye.x, rightEye.y);
  ctx.rotate(angle);

  const reticleRadius = eyeDist * 0.42;
  const rotSpin = time * 2.5;

  // Segmented outer ring
  ctx.strokeStyle = '#00FFFF';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, reticleRadius, rotSpin, rotSpin + Math.PI * 0.7);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, reticleRadius, rotSpin + Math.PI, rotSpin + Math.PI * 1.7);
  ctx.stroke();

  // Inner crosshair & center reticle
  ctx.strokeStyle = '#FF007F';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, reticleRadius * 0.45, -rotSpin * 1.5, -rotSpin * 1.5 + Math.PI * 1.5);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-reticleRadius * 0.7, 0);
  ctx.lineTo(reticleRadius * 0.7, 0);
  ctx.moveTo(0, -reticleRadius * 0.7);
  ctx.lineTo(0, reticleRadius * 0.7);
  ctx.stroke();

  // Cyber Telemetry Label (un-mirrored so it reads correctly)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#00FFFF';
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 6;
  ctx.fillText('TARGET: LOCKED', -reticleRadius * 1.4, -reticleRadius * 0.85);
  ctx.fillStyle = '#FF007F';
  ctx.fillText('AI-HUD // 99.8%', -reticleRadius * 1.4, reticleRadius * 1.05);
  ctx.restore();

  ctx.restore();

  // C: Animated Scanning Laser Sweep across face
  const scanY = noseBridge.y + Math.sin(time * 3) * eyeDist * 0.9;
  const scanGrad = ctx.createLinearGradient(noseBridge.x - eyeDist * 1.2, scanY, noseBridge.x + eyeDist * 1.2, scanY);
  scanGrad.addColorStop(0, 'rgba(0, 255, 255, 0)');
  scanGrad.addColorStop(0.5, 'rgba(0, 255, 255, 0.8)');
  scanGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');

  ctx.strokeStyle = scanGrad;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00FFFF';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(noseBridge.x - eyeDist * 1.2, scanY);
  ctx.lineTo(noseBridge.x + eyeDist * 1.2, scanY);
  ctx.stroke();

  ctx.restore();
}

/**
 * Procedural AR Mask: Neko Kitty Cat
 */
function drawCatMask(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  noseTip: { x: number; y: number },
  noseBridge: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number
) {
  ctx.save();

  const earWidth = eyeDist * 0.8;
  const earHeight = eyeDist * 1.15;
  const twitchL = Math.sin(time * 5) * 0.08;
  const twitchR = Math.sin(time * 5 + 1.2) * 0.08;

  // A: Left Cat Ear (Anchored on left forehead temple #54)
  const leftTemple = p(54);
  ctx.save();
  ctx.translate(leftTemple.x, leftTemple.y);
  ctx.rotate(angle - 0.35 + twitchL);

  // Outer ear
  ctx.fillStyle = '#1E293B';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(-earWidth * 0.5, 0);
  ctx.quadraticCurveTo(-earWidth * 0.4, -earHeight * 0.8, 0, -earHeight);
  ctx.quadraticCurveTo(earWidth * 0.5, -earHeight * 0.7, earWidth * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  // Inner ear pink fluff
  ctx.fillStyle = '#FF8DA1';
  ctx.beginPath();
  ctx.moveTo(-earWidth * 0.3, -earHeight * 0.15);
  ctx.quadraticCurveTo(-earWidth * 0.25, -earHeight * 0.7, 0, -earHeight * 0.82);
  ctx.quadraticCurveTo(earWidth * 0.3, -earHeight * 0.65, earWidth * 0.3, -earHeight * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // B: Right Cat Ear (Anchored on right forehead temple #284)
  const rightTemple = p(284);
  ctx.save();
  ctx.translate(rightTemple.x, rightTemple.y);
  ctx.rotate(angle + 0.35 + twitchR);

  // Outer ear
  ctx.fillStyle = '#1E293B';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(-earWidth * 0.5, 0);
  ctx.quadraticCurveTo(-earWidth * 0.5, -earHeight * 0.7, 0, -earHeight);
  ctx.quadraticCurveTo(earWidth * 0.4, -earHeight * 0.8, earWidth * 0.5, 0);
  ctx.closePath();
  ctx.fill();

  // Inner ear pink fluff
  ctx.fillStyle = '#FF8DA1';
  ctx.beginPath();
  ctx.moveTo(-earWidth * 0.3, -earHeight * 0.15);
  ctx.quadraticCurveTo(-earWidth * 0.3, -earHeight * 0.65, 0, -earHeight * 0.82);
  ctx.quadraticCurveTo(earWidth * 0.25, -earHeight * 0.7, earWidth * 0.3, -earHeight * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // C: Cute Pink Cat Nose Button
  ctx.save();
  ctx.translate(noseTip.x, noseTip.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#FF5C8A';
  ctx.shadowColor = '#FF5C8A';
  ctx.shadowBlur = 8;
  const noseSize = eyeDist * 0.16;

  ctx.beginPath();
  ctx.moveTo(-noseSize, -noseSize * 0.4);
  ctx.quadraticCurveTo(0, -noseSize * 0.6, noseSize, -noseSize * 0.4);
  ctx.quadraticCurveTo(noseSize * 0.5, noseSize * 0.7, 0, noseSize * 0.7);
  ctx.quadraticCurveTo(-noseSize * 0.5, noseSize * 0.7, -noseSize, -noseSize * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // D: Cat Whiskers (3 left, 3 right)
  const leftMuzzle = p(205);
  const rightMuzzle = p(425);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2.2;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.lineCap = 'round';

  const whiskerLen = eyeDist * 0.95;

  // Left whiskers
  [-0.2, 0, 0.2].forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(leftMuzzle.x, leftMuzzle.y);
    ctx.quadraticCurveTo(
      leftMuzzle.x - whiskerLen * 0.5,
      leftMuzzle.y + offset * 35,
      leftMuzzle.x - whiskerLen,
      leftMuzzle.y + offset * 50
    );
    ctx.stroke();
  });

  // Right whiskers
  [-0.2, 0, 0.2].forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(rightMuzzle.x, rightMuzzle.y);
    ctx.quadraticCurveTo(
      rightMuzzle.x + whiskerLen * 0.5,
      rightMuzzle.y + offset * 35,
      rightMuzzle.x + whiskerLen,
      rightMuzzle.y + offset * 50
    );
    ctx.stroke();
  });

  // E: Rosy Blushing Cheeks with White Sparkles
  drawCheekBlush(ctx, p(116), p(345), eyeDist * 0.35, '#FF80A0', 0.6);

  ctx.restore();
}

/**
 * Procedural AR Mask: Demon Horns & Fiery Eyes
 */
function drawDemonMask(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  forehead: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number,
  particles: ARParticle[]
) {
  ctx.save();

  const hornHeight = eyeDist * 1.5;
  const hornWidth = eyeDist * 0.45;

  // Draw Horn Helper
  const drawSingleHorn = (base: { x: number; y: number }, dir: 1 | -1) => {
    ctx.save();
    ctx.translate(base.x, base.y);
    ctx.rotate(angle + dir * 0.35);

    const grad = ctx.createLinearGradient(0, 0, dir * hornWidth * 0.8, -hornHeight);
    grad.addColorStop(0, '#1A0B2E');
    grad.addColorStop(0.6, '#4A0E2E');
    grad.addColorStop(1, '#FF2E00');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#FF2E00';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(-hornWidth * 0.4, 0);
    ctx.quadraticCurveTo(dir * hornWidth * 0.2, -hornHeight * 0.5, dir * hornWidth * 0.8, -hornHeight);
    ctx.quadraticCurveTo(0, -hornHeight * 0.6, hornWidth * 0.4, 0);
    ctx.closePath();
    ctx.fill();

    // Fiery tip ember spawn
    if (Math.random() > 0.7) {
      particles.push({
        x: base.x + Math.cos(angle + dir * 0.35) * dir * hornWidth * 0.8,
        y: base.y - hornHeight,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2 - Math.random() * 2,
        size: 5 + Math.random() * 5,
        color: Math.random() > 0.5 ? '#FF4500' : '#FFD700',
        alpha: 1,
        life: 0,
        maxLife: 30,
        type: 'ember',
        rotation: 0,
        vRot: 0,
      });
    }

    ctx.restore();
  };

  // Left & Right Demon Horns
  drawSingleHorn(p(109), -1);
  drawSingleHorn(p(338), 1);

  // Burning Iris Glow
  [leftEye, rightEye].forEach(eye => {
    const eyeGrad = ctx.createRadialGradient(eye.x, eye.y, 2, eye.x, eye.y, eyeDist * 0.25);
    eyeGrad.addColorStop(0, 'rgba(255, 69, 0, 0.9)');
    eyeGrad.addColorStop(0.5, 'rgba(255, 0, 80, 0.5)');
    eyeGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = eyeGrad;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeDist * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });

  // Forehead Demonic Rune
  ctx.save();
  ctx.translate(forehead.x, forehead.y + eyeDist * 0.2);
  ctx.rotate(angle);
  ctx.strokeStyle = '#FF2E00';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#FF2E00';
  ctx.shadowBlur = 10;
  const runeR = eyeDist * 0.15;

  ctx.beginPath();
  ctx.arc(0, 0, runeR, 0, Math.PI * 2);
  ctx.moveTo(0, -runeR * 0.7);
  ctx.lineTo(0, runeR * 0.7);
  ctx.moveTo(-runeR * 0.7, 0);
  ctx.lineTo(runeR * 0.7, 0);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

/**
 * Procedural AR Mask: Golden Goddess Tiara & Celestial Sparkles
 */
function drawGoddessCrown(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  forehead: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number,
  particles: ARParticle[]
) {
  ctx.save();
  ctx.translate(forehead.x, forehead.y);
  ctx.rotate(angle);

  const crownW = eyeDist * 1.5;
  const crownH = eyeDist * 0.9;

  // Crown Golden Gradient
  const goldGrad = ctx.createLinearGradient(-crownW * 0.5, -crownH, crownW * 0.5, 0);
  goldGrad.addColorStop(0, '#FFE259');
  goldGrad.addColorStop(0.5, '#FFA751');
  goldGrad.addColorStop(1, '#FFE259');

  ctx.strokeStyle = goldGrad;
  ctx.fillStyle = goldGrad;
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.lineWidth = 3;

  // Golden base arc
  ctx.beginPath();
  ctx.arc(0, 0, crownW * 0.5, -Math.PI * 0.85, -Math.PI * 0.15);
  ctx.stroke();

  // Spikes & Stars on Crown
  const numSpikes = 7;
  for (let i = 0; i < numSpikes; i++) {
    const t = -Math.PI * 0.85 + (i / (numSpikes - 1)) * (Math.PI * 0.7);
    const rad = crownW * 0.5;
    const spikeLen = (i === 3 ? crownH * 0.85 : (i % 2 === 1 ? crownH * 0.6 : crownH * 0.45));
    const bx = Math.cos(t) * rad;
    const by = Math.sin(t) * rad;
    const tx = Math.cos(t) * (rad + spikeLen);
    const ty = Math.sin(t) * (rad + spikeLen);

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    // Jewel at top of center spike
    if (i === 3) {
      ctx.fillStyle = '#FF1744';
      ctx.shadowColor = '#FF1744';
      ctx.beginPath();
      ctx.arc(tx, ty, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = goldGrad;
    }
  }

  // Spawn floating stardust sparkles
  if (Math.random() > 0.6) {
    particles.push({
      x: forehead.x + (Math.random() - 0.5) * crownW,
      y: forehead.y - Math.random() * crownH,
      vx: (Math.random() - 0.5) * 1.0,
      vy: 0.8 + Math.random() * 1.5,
      size: 5 + Math.random() * 6,
      color: '#FFD700',
      alpha: 1,
      life: 0,
      maxLife: 45,
      type: 'sparkle',
      rotation: Math.random() * Math.PI,
      vRot: 0.05,
    });
  }

  ctx.restore();
}

/**
 * Procedural AR Mask: 8-Bit Pixel Glasses (Thug Life) & Cigar Smoke
 */
function drawThugLife(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  mouthLeft: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number,
  particles: ARParticle[]
) {
  ctx.save();
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2,
  };

  ctx.translate(eyeCenter.x, eyeCenter.y);
  ctx.rotate(angle);

  const glassW = eyeDist * 1.6;
  const glassH = eyeDist * 0.45;
  const pixel = glassH / 6;

  // Black pixelated sunglasses frames
  ctx.fillStyle = '#000000';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 10;

  // Left lens
  ctx.fillRect(-glassW * 0.48, -glassH * 0.5, glassW * 0.42, glassH);
  // Right lens
  ctx.fillRect(glassW * 0.06, -glassH * 0.5, glassW * 0.42, glassH);
  // Bridge
  ctx.fillRect(-glassW * 0.1, -glassH * 0.2, glassW * 0.2, pixel * 2);

  // White pixel reflections in lenses
  ctx.fillStyle = '#FFFFFF';
  // Left lens reflection
  ctx.fillRect(-glassW * 0.44, -glassH * 0.4, pixel * 2, pixel);
  ctx.fillRect(-glassW * 0.4, -glassH * 0.2, pixel * 2, pixel);
  // Right lens reflection
  ctx.fillRect(glassW * 0.1, -glassH * 0.4, pixel * 2, pixel);
  ctx.fillRect(glassW * 0.14, -glassH * 0.2, pixel * 2, pixel);

  // Floating "DEAL WITH IT" text (un-mirrored)
  ctx.save();
  ctx.scale(-1, 1);
  ctx.font = `900 ${Math.round(eyeDist * 0.16)}px monospace`;
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.fillText('DEAL WITH IT', 0, -glassH * 1.3);
  ctx.restore();

  ctx.restore();

  // Pixel cigar at mouth corner with rising smoke
  ctx.save();
  ctx.translate(mouthLeft.x, mouthLeft.y);
  ctx.rotate(angle - 0.2);

  const cigarW = eyeDist * 0.55;
  const cigarH = eyeDist * 0.12;

  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(-cigarW, -cigarH / 2, cigarW, cigarH);
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(-cigarW, -cigarH / 2, cigarW * 0.15, cigarH);

  // Cigar smoke particles
  if (Math.random() > 0.5) {
    particles.push({
      x: mouthLeft.x - cigarW * Math.cos(angle - 0.2),
      y: mouthLeft.y - cigarW * Math.sin(angle - 0.2),
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.8 - Math.random() * 1.5,
      size: 8 + Math.random() * 8,
      color: 'rgba(220, 220, 220, 0.7)',
      alpha: 0.8,
      life: 0,
      maxLife: 40,
      type: 'smoke',
      rotation: Math.random() * Math.PI,
      vRot: 0.05,
    });
  }

  ctx.restore();
}

/**
 * Procedural AR Mask: Alien Biomech
 */
function drawAlienMask(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  w: number,
  h: number,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  forehead: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number
) {
  ctx.save();

  // Bioluminescent Alien lines
  ctx.strokeStyle = '#00FF88';
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur = 12;
  ctx.lineWidth = 2.2;

  // Face contour alien veins
  const jawIndices = [234, 132, 172, 150, 152, 378, 397, 361, 454];
  ctx.beginPath();
  jawIndices.forEach((idx, i) => {
    const pt = p(idx);
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  });
  ctx.stroke();

  // Deep obsidian alien eye sockets with glowing pupils
  [leftEye, rightEye].forEach(eye => {
    ctx.fillStyle = '#050510';
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y, eyeDist * 0.32, eyeDist * 0.22, angle, 0, Math.PI * 2);
    ctx.fill();

    // Glowing cyan pupil dot
    ctx.fillStyle = '#00FFCC';
    ctx.shadowColor = '#00FFCC';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(eye.x, eye.y, eyeDist * 0.06, 0, Math.PI * 2);
    ctx.fill();
  });

  // Forehead glowing core crystal
  ctx.save();
  ctx.translate(forehead.x, forehead.y + eyeDist * 0.15);
  ctx.rotate(angle);
  const pulse = 1 + Math.sin(time * 4) * 0.25;

  ctx.fillStyle = '#00FFCC';
  ctx.shadowColor = '#00FFCC';
  ctx.shadowBlur = 20 * pulse;

  ctx.beginPath();
  ctx.moveTo(0, -eyeDist * 0.22 * pulse);
  ctx.lineTo(eyeDist * 0.12 * pulse, 0);
  ctx.lineTo(0, eyeDist * 0.22 * pulse);
  ctx.lineTo(-eyeDist * 0.12 * pulse, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Procedural AR Mask: Neon Jester / Clown
 */
function drawClownMask(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  leftEye: { x: number; y: number },
  rightEye: { x: number; y: number },
  noseTip: { x: number; y: number },
  mouthLeft: { x: number; y: number },
  mouthRight: { x: number; y: number },
  eyeDist: number,
  angle: number
) {
  ctx.save();

  // A: Big Glossy Red Nose Ball
  const noseRadius = eyeDist * 0.22;
  const noseGrad = ctx.createRadialGradient(
    noseTip.x - noseRadius * 0.3,
    noseTip.y - noseRadius * 0.3,
    noseRadius * 0.1,
    noseTip.x,
    noseTip.y,
    noseRadius
  );
  noseGrad.addColorStop(0, '#FF8080');
  noseGrad.addColorStop(0.4, '#FF0033');
  noseGrad.addColorStop(1, '#990022');

  ctx.fillStyle = noseGrad;
  ctx.shadowColor = '#FF0033';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(noseTip.x, noseTip.y, noseRadius, 0, Math.PI * 2);
  ctx.fill();

  // B: Blue Diamond Eye Marks
  ctx.fillStyle = '#00D4FF';
  ctx.shadowColor = '#00D4FF';
  ctx.shadowBlur = 8;

  [leftEye, rightEye].forEach(eye => {
    const diamH = eyeDist * 0.35;
    const diamW = eyeDist * 0.12;

    ctx.save();
    ctx.translate(eye.x, eye.y);
    ctx.rotate(angle);

    // Diamond above eye
    ctx.beginPath();
    ctx.moveTo(0, -diamH);
    ctx.lineTo(diamW, -diamH * 0.5);
    ctx.lineTo(0, -eyeDist * 0.1);
    ctx.lineTo(-diamW, -diamH * 0.5);
    ctx.closePath();
    ctx.fill();

    // Diamond below eye
    ctx.beginPath();
    ctx.moveTo(0, eyeDist * 0.1);
    ctx.lineTo(diamW, diamH * 0.5);
    ctx.lineTo(0, diamH);
    ctx.lineTo(-diamW, diamH * 0.5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  });

  // C: Wide Jester Red Lipstick Smile
  ctx.strokeStyle = '#FF0033';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#FF0033';
  ctx.shadowBlur = 10;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(mouthLeft.x - eyeDist * 0.15, mouthLeft.y - eyeDist * 0.1);
  ctx.quadraticCurveTo(mouthLeft.x, mouthLeft.y, mouthLeft.x + eyeDist * 0.1, mouthLeft.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(mouthRight.x + eyeDist * 0.15, mouthRight.y - eyeDist * 0.1);
  ctx.quadraticCurveTo(mouthRight.x, mouthRight.y, mouthRight.x - eyeDist * 0.1, mouthRight.y);
  ctx.stroke();

  ctx.restore();
}

/**
 * Procedural AR Mask: Sakura Blossom Floral Crown
 */
function drawSakuraCrown(
  ctx: CanvasRenderingContext2D,
  p: (idx: number) => { x: number; y: number },
  forehead: { x: number; y: number },
  eyeDist: number,
  angle: number,
  time: number,
  particles: ARParticle[]
) {
  ctx.save();
  ctx.translate(forehead.x, forehead.y);
  ctx.rotate(angle);

  const numFlowers = 5;
  const crownRadius = eyeDist * 0.8;

  for (let i = 0; i < numFlowers; i++) {
    const flowerAngle = -Math.PI * 0.75 + (i / (numFlowers - 1)) * (Math.PI * 0.5);
    const fx = Math.cos(flowerAngle) * crownRadius;
    const fy = Math.sin(flowerAngle) * crownRadius;
    const flowerSize = i === 2 ? eyeDist * 0.22 : eyeDist * 0.17;

    // Draw 5-petal cherry blossom
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate((i * 0.4) + time * 0.5);

    for (let pIdx = 0; pIdx < 5; pIdx++) {
      const pAngle = (pIdx / 5) * Math.PI * 2;
      const petX = Math.cos(pAngle) * flowerSize * 0.6;
      const petY = Math.sin(pAngle) * flowerSize * 0.6;

      ctx.fillStyle = '#FFB7C5';
      ctx.shadowColor = '#FF8DA1';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(petX, petY, flowerSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Flower center
    ctx.fillStyle = '#FFE066';
    ctx.beginPath();
    ctx.arc(0, 0, flowerSize * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Drifting sakura petal spawn
  if (Math.random() > 0.65) {
    particles.push({
      x: forehead.x + (Math.random() - 0.5) * eyeDist * 1.5,
      y: forehead.y - Math.random() * eyeDist * 0.5,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 1.2 + Math.random() * 1.5,
      size: 10 + Math.random() * 6,
      color: '#FFB7C5',
      alpha: 0.9,
      life: 0,
      maxLife: 60,
      type: 'petal',
      rotation: Math.random() * Math.PI,
      vRot: 0.04,
    });
  }

  ctx.restore();
}

/**
 * AI Virtual Lipstick Engine
 */
function drawLipstick(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  w: number,
  h: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Upper Lip Polygon
  ctx.beginPath();
  UPPER_LIP_INDICES.forEach((idx, i) => {
    const x = landmarks[idx].x * w;
    const y = landmarks[idx].y * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  // Lower Lip Polygon
  ctx.beginPath();
  LOWER_LIP_INDICES.forEach((idx, i) => {
    const x = landmarks[idx].x * w;
    const y = landmarks[idx].y * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();

  // Gloss Specular Curve on Lower Lip center
  const centerBottom = { x: landmarks[17].x * w, y: landmarks[17].y * h };
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.ellipse(centerBottom.x, centerBottom.y - 3, 10, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * AI Virtual Cheek Blush Engine
 */
function drawCheekBlush(
  ctx: CanvasRenderingContext2D,
  leftCheek: { x: number; y: number },
  rightCheek: { x: number; y: number },
  radius: number,
  color: string,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  [leftCheek, rightCheek].forEach(cheek => {
    const grad = ctx.createRadialGradient(cheek.x, cheek.y, radius * 0.1, cheek.x, cheek.y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.6, color);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cheek.x, cheek.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * AI Iris Sparkling Glimmer
 */
function drawEyeGlimmer(
  ctx: CanvasRenderingContext2D,
  leftIris: { x: number; y: number },
  rightIris: { x: number; y: number },
  radius: number,
  time: number
) {
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowColor = '#FFFFFF';
  ctx.shadowBlur = 8;

  [leftIris, rightIris].forEach(iris => {
    // Primary glint
    ctx.beginPath();
    ctx.arc(iris.x - radius * 0.4, iris.y - radius * 0.4, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Secondary sparkle
    ctx.beginPath();
    ctx.arc(iris.x + radius * 0.3, iris.y + radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

/**
 * AI Neural Mesh 468-Point Wireframe & Telemetry HUD
 */
function drawNeuralMeshWireframe(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  w: number,
  h: number,
  p: (idx: number) => { x: number; y: number },
  metrics: ARMetrics
) {
  ctx.save();

  // Draw Wireframe Lines
  ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
  ctx.lineWidth = 1;
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur = 4;

  WIREFRAME_CONNECTIONS.forEach(([startIdx, endIdx]) => {
    if (landmarks[startIdx] && landmarks[endIdx]) {
      const p1 = p(startIdx);
      const p2 = p(endIdx);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  });

  // Landmark Node Dots
  ctx.fillStyle = '#00FFFF';
  for (let i = 0; i < landmarks.length; i += 6) {
    const pt = p(i);
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Live Telemetry HUD Overlay in Top-Left (un-mirrored)
  ctx.save();
  ctx.translate(w - 20, 20); // Anchored for mirrored canvas
  ctx.scale(-1, 1);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.strokeStyle = '#00FF88';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00FF88';
  ctx.shadowBlur = 8;

  // Background Box
  ctx.beginPath();
  ctx.roundRect(0, 0, 210, 115, 12);
  ctx.fill();
  ctx.stroke();

  // Header
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#00FF88';
  ctx.fillText('⚡ AI NEURAL MESH (478 PTS)', 12, 20);

  // Status metrics
  ctx.font = '9px monospace';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`FPS: ${metrics.fps || 60} | CONF: 99.8%`, 12, 38);
  ctx.fillText(`ORIENTATION: P:${metrics.pitch}° Y:${metrics.yaw}° R:${metrics.roll}°`, 12, 54);
  ctx.fillText(`EXPRESSION: Smile ${metrics.smile}% | Open ${metrics.mouthOpen}%`, 12, 70);
  ctx.fillText(`STATUS: ${metrics.isWinking ? 'WINKING 😉' : 'TRACKING 🟢'}`, 12, 86);

  // Mini Expression Progress Bar
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(12, 95, 186, 6);
  ctx.fillStyle = metrics.smile > 50 ? '#FFD700' : '#00FF88';
  ctx.fillRect(12, 95, (metrics.smile / 100) * 186, 6);

  ctx.restore();

  ctx.restore();
}

/**
 * Updates physics and renders active reaction particles
 */
function updateAndDrawParticles(ctx: CanvasRenderingContext2D, particles: ARParticle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const pt = particles[i];
    pt.life++;
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.rotation += pt.vRot;
    pt.alpha = 1 - pt.life / pt.maxLife;

    if (pt.life >= pt.maxLife || pt.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(pt.x, pt.y);
    ctx.rotate(pt.rotation);
    ctx.globalAlpha = Math.max(0, pt.alpha);

    if (pt.type === 'heart') {
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 8;
      const s = pt.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s, -s * 0.5, -s * 1.2, s * 0.5, 0, s * 1.4);
      ctx.bezierCurveTo(s * 1.2, s * 0.5, s, -s * 0.5, 0, s * 0.3);
      ctx.fill();
    } else if (pt.type === 'star' || pt.type === 'sparkle') {
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 10;
      const s = pt.size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
    } else if (pt.type === 'petal') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, pt.size * 0.6, pt.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pt.type === 'smoke') {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * (1 + pt.life * 0.05), 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ember
      ctx.fillStyle = pt.color;
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(0, 0, pt.size * (1 - pt.life / pt.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
