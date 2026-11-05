import { AccessoryId, PlacedAccessory } from '@/types';

export interface AccessoryMeta {
  id: AccessoryId;
  name: string;
  icon: string;
  category: 'glasses' | 'hat' | 'fun';
}

export const ACCESSORIES_META: AccessoryMeta[] = [
  { id: 'aviator-sunglasses', name: 'Lunettes Aviateur', icon: '🕶️', category: 'glasses' },
  { id: 'wayfarer-sunglasses', name: 'Wayfarer Noir', icon: '🕶️', category: 'glasses' },
  { id: 'round-retro-sunglasses', name: 'Rondes Rétro', icon: '👓', category: 'glasses' },
  { id: 'futuristic-visor', name: 'Visière Cyberpunk', icon: '🥽', category: 'glasses' },
  { id: 'heart-sunglasses', name: 'Lunettes Cœur', icon: '❤️', category: 'glasses' },
  { id: 'cowboy-hat', name: 'Chapeau Cowboy', icon: '🤠', category: 'hat' },
  { id: 'party-hat', name: 'Chapeau Fête', icon: '🥳', category: 'hat' },
  { id: 'crown', name: 'Couronne Royale', icon: '👑', category: 'hat' },
  { id: 'mustache', name: 'Moustache Rétro', icon: '🥸', category: 'fun' },
  { id: 'cat-ears', name: 'Oreilles de Chat', icon: '🐱', category: 'fun' },
  { id: 'wig', name: 'Perruque', icon: '💇', category: 'fun' },
];

/**
 * Draws vector accessory directly onto a Canvas 2D context at the given coordinates,
 * scale, and rotation angle (in radians).
 */
export function drawAccessory(
  ctx: CanvasRenderingContext2D,
  accessory: PlacedAccessory
): void {
  const { accessoryId, x, y, scale, rotation } = accessory;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation || 0);
  ctx.scale(scale, scale);

  switch (accessoryId) {
    case 'aviator-sunglasses':
      drawAviatorSunglasses(ctx);
      break;
    case 'wayfarer-sunglasses':
      drawWayfarerSunglasses(ctx);
      break;
    case 'round-retro-sunglasses':
      drawRoundRetroSunglasses(ctx);
      break;
    case 'futuristic-visor':
      drawFuturisticVisor(ctx);
      break;
    case 'heart-sunglasses':
      drawHeartSunglasses(ctx);
      break;
    case 'cowboy-hat':
      drawCowboyHat(ctx);
      break;
    case 'party-hat':
      drawPartyHat(ctx);
      break;
    case 'crown':
      drawCrown(ctx);
      break;
    case 'mustache':
      drawMustache(ctx);
      break;
    case 'cat-ears':
      drawCatEars(ctx);
      break;
    case 'wig':
      drawWig(ctx);
      break;
  }

  ctx.restore();
}

/**
 * Realistic Aviator sunglasses with golden metal double bridge,
 * teardrop shaped gradient lenses, and glass reflection highlights.
 */
function drawAviatorSunglasses(ctx: CanvasRenderingContext2D): void {
  const goldStroke = '#d4af37';
  const goldHighlight = '#fff2a8';

  // Left lens
  drawTeardropLens(ctx, -55, 0, false);
  // Right lens
  drawTeardropLens(ctx, 55, 0, true);

  // Top Brow Bar (Double bridge)
  ctx.lineWidth = 4;
  ctx.strokeStyle = goldStroke;
  ctx.beginPath();
  ctx.moveTo(-75, -28);
  ctx.quadraticCurveTo(0, -32, 75, -28);
  ctx.stroke();

  // Highlight on brow bar
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = goldHighlight;
  ctx.beginPath();
  ctx.moveTo(-40, -30);
  ctx.quadraticCurveTo(0, -32, 40, -30);
  ctx.stroke();

  // Lower Bridge
  ctx.lineWidth = 4;
  ctx.strokeStyle = goldStroke;
  ctx.beginPath();
  ctx.moveTo(-20, -10);
  ctx.quadraticCurveTo(0, -16, 20, -10);
  ctx.stroke();

  // Temples (Sides)
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-100, -18);
  ctx.lineTo(-125, -24);
  ctx.moveTo(100, -18);
  ctx.lineTo(125, -24);
  ctx.stroke();
}

function drawTeardropLens(ctx: CanvasRenderingContext2D, cx: number, cy: number, isRight: boolean): void {
  ctx.save();
  ctx.translate(cx, cy);

  // Teardrop path
  ctx.beginPath();
  ctx.moveTo(-45, -24);
  ctx.bezierCurveTo(-45, -28, 45, -28, 45, -24);
  ctx.bezierCurveTo(50, 5, isRight ? 35 : 42, 38, 0, 42);
  ctx.bezierCurveTo(isRight ? -42 : -35, 38, -50, 5, -45, -24);
  ctx.closePath();

  // Gradient tint (Brown / Smoke to Amber)
  const grad = ctx.createLinearGradient(0, -25, 0, 42);
  grad.addColorStop(0, 'rgba(25, 20, 15, 0.92)');
  grad.addColorStop(0.65, 'rgba(65, 45, 25, 0.85)');
  grad.addColorStop(1, 'rgba(160, 110, 50, 0.70)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Realistic diagonal glass reflection highlight
  const refl = ctx.createLinearGradient(-35, -20, 25, 25);
  refl.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
  refl.addColorStop(0.3, 'rgba(255, 255, 255, 0.12)');
  refl.addColorStop(0.6, 'rgba(255, 255, 255, 0.0)');
  ctx.fillStyle = refl;
  ctx.fill();

  // Golden Frame
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = '#d4af37';
  ctx.stroke();

  ctx.restore();
}

function drawWayfarerSunglasses(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#111827';
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;

  // Bridge
  ctx.fillRect(-18, -16, 36, 12);

  // Left frame
  ctx.beginPath();
  ctx.roundRect(-105, -26, 90, 64, [10, 6, 22, 16]);
  ctx.fill();
  ctx.stroke();

  // Right frame
  ctx.beginPath();
  ctx.roundRect(15, -26, 90, 64, [6, 10, 16, 22]);
  ctx.fill();
  ctx.stroke();

  // Lenses (Dark polarized)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.roundRect(-97, -18, 74, 48, [6, 4, 18, 12]);
  ctx.fill();

  ctx.beginPath();
  ctx.roundRect(23, -18, 74, 48, [4, 6, 12, 18]);
  ctx.fill();

  // Silver Rivets
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-102, -20, 6, 4);
  ctx.fillRect(96, -20, 6, 4);
}

function drawRoundRetroSunglasses(ctx: CanvasRenderingContext2D): void {
  const wireColor = '#b45309'; // Copper wire
  ctx.strokeStyle = wireColor;
  ctx.lineWidth = 4;

  // Bridge
  ctx.beginPath();
  ctx.arc(0, -6, 20, Math.PI, 0, false);
  ctx.stroke();

  // Left lens
  ctx.beginPath();
  ctx.arc(-55, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(30, 27, 24, 0.90)';
  ctx.fill();
  ctx.stroke();

  // Right lens
  ctx.beginPath();
  ctx.arc(55, 0, 42, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(30, 27, 24, 0.90)';
  ctx.fill();
  ctx.stroke();
}

function drawFuturisticVisor(ctx: CanvasRenderingContext2D): void {
  const grad = ctx.createLinearGradient(-110, 0, 110, 0);
  grad.addColorStop(0, 'rgba(236, 72, 153, 0.85)'); // Hot pink
  grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.88)'); // Cyan
  grad.addColorStop(1, 'rgba(168, 85, 247, 0.85)'); // Purple

  ctx.fillStyle = grad;
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(-115, -22, 230, 46, [14, 14, 20, 20]);
  ctx.fill();
  ctx.stroke();

  // Neon scanline
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-105, -6);
  ctx.lineTo(105, -6);
  ctx.stroke();
}

function drawHeartSunglasses(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#f43f5e'; // Vibrant rose
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;

  // Left Heart
  drawHeartShape(ctx, -55, -4, 46);
  // Right Heart
  drawHeartShape(ctx, 55, -4, 46);

  // Bridge
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-15, -12);
  ctx.lineTo(15, -12);
  ctx.stroke();
}

function drawHeartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  const s = size / 30;

  ctx.beginPath();
  ctx.moveTo(0, 15 * s);
  ctx.bezierCurveTo(-25 * s, -5 * s, -30 * s, -25 * s, 0, -22 * s);
  ctx.bezierCurveTo(30 * s, -25 * s, 25 * s, -5 * s, 0, 15 * s);
  ctx.fill();
  ctx.stroke();

  // Inner tinted lens
  ctx.fillStyle = 'rgba(60, 10, 25, 0.82)';
  ctx.beginPath();
  ctx.moveTo(0, 12 * s);
  ctx.bezierCurveTo(-20 * s, -3 * s, -24 * s, -20 * s, 0, -18 * s);
  ctx.bezierCurveTo(24 * s, -20 * s, 20 * s, -3 * s, 0, 12 * s);
  ctx.fill();

  ctx.restore();
}

function drawCowboyHat(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(0, -95);

  // Brim
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.ellipse(0, 32, 130, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#451a03';
  ctx.stroke();

  // Crown
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.moveTo(-60, 25);
  ctx.quadraticCurveTo(-70, -45, -35, -55);
  ctx.quadraticCurveTo(0, -35, 35, -55);
  ctx.quadraticCurveTo(70, -45, 60, 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Hatband
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.roundRect(-62, 16, 124, 12, 4);
  ctx.fill();

  ctx.restore();
}

function drawPartyHat(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(0, -90);

  // Cone
  const coneGrad = ctx.createLinearGradient(-45, 0, 45, 0);
  coneGrad.addColorStop(0, '#ec4899');
  coneGrad.addColorStop(0.5, '#eab308');
  coneGrad.addColorStop(1, '#3b82f6');

  ctx.fillStyle = coneGrad;
  ctx.beginPath();
  ctx.moveTo(0, -75);
  ctx.lineTo(50, 30);
  ctx.quadraticCurveTo(0, 42, -50, 30);
  ctx.closePath();
  ctx.fill();

  // Pom-pom on top
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(0, -80, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCrown(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(0, -95);

  const gold = ctx.createLinearGradient(-70, 0, 70, 0);
  gold.addColorStop(0, '#d97706');
  gold.addColorStop(0.5, '#fde047');
  gold.addColorStop(1, '#b45309');

  ctx.fillStyle = gold;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(-70, 20);
  ctx.lineTo(-75, -35); // Left peak
  ctx.lineTo(-35, -10);
  ctx.lineTo(0, -50); // Middle peak
  ctx.lineTo(35, -10);
  ctx.lineTo(75, -35); // Right peak
  ctx.lineTo(70, 20);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Jewels
  ctx.fillStyle = '#ef4444'; // Ruby
  ctx.beginPath();
  ctx.arc(0, -48, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3b82f6'; // Sapphire
  ctx.beginPath();
  ctx.arc(-72, -33, 5, 0, Math.PI * 2);
  ctx.arc(72, -33, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMustache(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(0, 50);

  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(0, -8);
  ctx.bezierCurveTo(-22, -22, -62, -18, -68, 6);
  ctx.bezierCurveTo(-62, 14, -28, 12, 0, 0);
  ctx.bezierCurveTo(28, 12, 62, 14, 68, 6);
  ctx.bezierCurveTo(62, -18, 22, -22, 0, -8);
  ctx.fill();

  ctx.restore();
}

function drawCatEars(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(0, -90);

  // Headband
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 30, 80, Math.PI * 0.8, Math.PI * 0.2, false);
  ctx.stroke();

  // Left ear
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(-75, 10);
  ctx.lineTo(-65, -55);
  ctx.lineTo(-20, -10);
  ctx.closePath();
  ctx.fill();

  // Left ear inside pink
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(-68, 6);
  ctx.lineTo(-62, -45);
  ctx.lineTo(-28, -8);
  ctx.closePath();
  ctx.fill();

  // Right ear
  ctx.fillStyle = '#18181b';
  ctx.beginPath();
  ctx.moveTo(75, 10);
  ctx.lineTo(65, -55);
  ctx.lineTo(20, -10);
  ctx.closePath();
  ctx.fill();

  // Right ear inside pink
  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.moveTo(68, 6);
  ctx.lineTo(62, -45);
  ctx.lineTo(28, -8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Long wavy wig: hair mass framing the face, drawn around the origin so that a
 * face-centred placement (mediapipe landmark centre) puts the hair behind the
 * forehead and over the shoulders.
 */
function drawWig(ctx: CanvasRenderingContext2D): void {
  const hairDark = '#2b1a12';
  const hairLight = '#4a2c1d';

  // Back mass (behind the head)
  const back = ctx.createLinearGradient(-90, -70, 90, 130);
  back.addColorStop(0, hairLight);
  back.addColorStop(1, hairDark);
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.moveTo(-80, -40);
  ctx.quadraticCurveTo(-96, 60, -70, 130);
  ctx.quadraticCurveTo(-40, 150, 0, 140);
  ctx.quadraticCurveTo(40, 150, 70, 130);
  ctx.quadraticCurveTo(96, 60, 80, -40);
  ctx.quadraticCurveTo(0, -78, -80, -40);
  ctx.closePath();
  ctx.fill();

  // Fringe / hairline over the forehead
  ctx.fillStyle = hairDark;
  ctx.beginPath();
  ctx.moveTo(-76, -46);
  ctx.quadraticCurveTo(-50, -78, 0, -74);
  ctx.quadraticCurveTo(50, -78, 76, -46);
  ctx.quadraticCurveTo(58, -20, 36, -28);
  ctx.quadraticCurveTo(16, -8, -4, -26);
  ctx.quadraticCurveTo(-30, -6, -44, -28);
  ctx.quadraticCurveTo(-62, -18, -76, -46);
  ctx.closePath();
  ctx.fill();

  // Side strands (kept outside the eye area so the face stays visible)
  ctx.strokeStyle = hairLight;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * 74, -30);
    ctx.quadraticCurveTo(side * 92, 40, side * 78, 116);
    ctx.stroke();
  });

  // Soft sheen
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-40, -62);
  ctx.quadraticCurveTo(-10, -70, 26, -60);
  ctx.stroke();
}
