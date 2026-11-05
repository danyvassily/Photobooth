import {
  ColorStudioBackground,
  ImageAdjustments,
  PhotoCapture,
  PlacedAccessory,
  PrintFormatConfig,
  ThemeConfig,
} from '@/types';
import { drawAccessory } from '@/lib/accessories/renderer';
import { processImage } from '@/lib/image-processing';

export interface ComposeOptions {
  photos: PhotoCapture[];
  theme: ThemeConfig;
  format: PrintFormatConfig;
  adjustments: ImageAdjustments;
  accessories?: PlacedAccessory[];
  customText?: string;
  eventName?: string;
  colorStudioBg?: ColorStudioBackground;
  quality?: number; // 0.85 to 0.98
}

export interface ComposeResult {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Creates an HTMLImageElement or loads an ImageBitmap from a Blob/DataURL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load photo image for composition: ' + e));
    img.src = src;
  });
}

/**
 * Main print strip composition engine
 */
export async function composePrint(options: ComposeOptions): Promise<ComposeResult> {
  const {
    photos,
    theme,
    format,
    adjustments,
    accessories = [],
    customText,
    eventName,
    colorStudioBg,
    quality = 0.94,
  } = options;

  if (typeof document === 'undefined') {
    throw new Error('Canvas composition requires browser document context');
  }

  const canvas = document.createElement('canvas');
  canvas.width = format.canvasWidth;
  canvas.height = format.canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Failed to create 2D canvas context');
  }

  // 1. Draw Strip Background
  drawBackground(ctx, format, theme, colorStudioBg);

  // 2. Pre-load all photo images
  const loadedPhotos = await Promise.all(
    photos.slice(0, 4).map((p) => loadImage(p.dataUrl))
  );

  // If no photos or less than slots, repeat photos if necessary
  const activePhotos = loadedPhotos.length > 0 ? loadedPhotos : [];

  // 3. Render each photo slot with filters and adjustments
  for (let slotIndex = 0; slotIndex < format.photoSlots.length; slotIndex++) {
    const slot = format.photoSlots[slotIndex];
    const photoImg = activePhotos[slotIndex % Math.max(1, activePhotos.length)];
    if (!photoImg) continue;

    await drawProcessedPhotoSlot(
      ctx,
      photoImg,
      slot,
      adjustments,
      theme,
      slotIndex,
      colorStudioBg
    );

    // Render accessories tied to this photo slot (or general accessories)
    const slotAccessories = accessories.filter(
      (a) => a.photoIndex === undefined || a.photoIndex === (slotIndex % 4)
    );
    for (const acc of slotAccessories) {
      // Calculate absolute coordinate on master canvas
      const absAcc: PlacedAccessory = {
        ...acc,
        x: slot.x + slot.width * acc.x,
        y: slot.y + slot.height * acc.y,
        scale: acc.scale * (slot.width / 800), // Scale relative to slot width
      };
      drawAccessory(ctx, absAcc);
    }
  }

  // 4. Render Theme Decorative Overlays (Frames, Dividers, Stickers, Timestamps)
  drawThemeDecorations(ctx, format, theme, customText || eventName);

  // 5. Generate high-quality JPEG Blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to convert canvas to JPEG Blob'));
      },
      'image/jpeg',
      quality
    );
  });

  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  return {
    blob,
    dataUrl,
    width: format.canvasWidth,
    height: format.canvasHeight,
  };
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  format: PrintFormatConfig,
  theme: ThemeConfig,
  colorStudioBg?: ColorStudioBackground
): void {
  const { canvasWidth, canvasHeight } = format;

  if (theme.id === 'color-studio' && colorStudioBg) {
    if (colorStudioBg.type === 'linear-gradient') {
      const grad = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
      grad.addColorStop(0, colorStudioBg.primaryColor);
      grad.addColorStop(1, colorStudioBg.secondaryColor || '#ffffff');
      ctx.fillStyle = grad;
    } else if (colorStudioBg.type === 'radial-gradient') {
      const grad = ctx.createRadialGradient(
        canvasWidth / 2,
        canvasHeight / 2,
        100,
        canvasWidth / 2,
        canvasHeight / 2,
        canvasWidth
      );
      grad.addColorStop(0, colorStudioBg.primaryColor);
      grad.addColorStop(1, colorStudioBg.secondaryColor || '#000000');
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = colorStudioBg.primaryColor;
    }
  } else {
    ctx.fillStyle = theme.backgroundColor;
  }

  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle paper texture or border for vintage / photomaton
  if (theme.decorations?.subtleBorder) {
    ctx.strokeStyle = theme.frameBorderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);
  }
}

async function drawProcessedPhotoSlot(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  slot: PrintFormatConfig['photoSlots'][0],
  adjustments: ImageAdjustments,
  theme: ThemeConfig,
  slotIndex: number,
  colorStudioBg?: ColorStudioBackground
): Promise<void> {
  const offscreen = document.createElement('canvas');
  offscreen.width = slot.width;
  offscreen.height = slot.height;
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return;

  // Aspect fill photo into slot
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const slotAspect = slot.width / slot.height;

  let sx = 0;
  let sy = 0;
  let sWidth = img.naturalWidth;
  let sHeight = img.naturalHeight;

  if (imgAspect > slotAspect) {
    sWidth = img.naturalHeight * slotAspect;
    sx = (img.naturalWidth - sWidth) / 2;
  } else {
    sHeight = img.naturalWidth / slotAspect;
    sy = (img.naturalHeight - sHeight) / 2;
  }

  // Draw base cropped image
  offCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, slot.width, slot.height);

  // Apply Pixel adjustments and Filter via WASM (or fallback JS)
  const imgData = offCtx.getImageData(0, 0, slot.width, slot.height);
  await processImage(imgData.data, slot.width, slot.height, adjustments);
  offCtx.putImageData(imgData, 0, 0);

  // Render slot onto master canvas (handling rotation if Polaroid)
  ctx.save();
  ctx.translate(slot.x + slot.width / 2, slot.y + slot.height / 2);
  if (slot.rotation) {
    ctx.rotate(slot.rotation);
  }

  // Draw Polaroid paper card if applicable
  if (theme.decorations?.polaroidBottom) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
    // Polaroid card extends 120px lower for caption area
    ctx.fillRect(
      -slot.width / 2 - 20,
      -slot.height / 2 - 20,
      slot.width + 40,
      slot.height + 140
    );
    ctx.shadowColor = 'transparent';
  }

  // Draw photo
  ctx.drawImage(offscreen, -slot.width / 2, -slot.height / 2);

  // Retro 90s film orange timestamp in bottom right
  if (theme.id === 'film-90s') {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const timeStr = `'${yy} ${mm} ${dd}`;

    ctx.fillStyle = '#f97316';
    ctx.font = 'bold 36px monospace';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(timeStr, slot.width / 2 - 210, slot.height / 2 - 30);
    ctx.shadowColor = 'transparent';
  }

  ctx.restore();
}

function drawThemeDecorations(
  ctx: CanvasRenderingContext2D,
  format: PrintFormatConfig,
  theme: ThemeConfig,
  customText?: string
): void {
  const { canvasWidth, canvasHeight, headerHeight, footerHeight } = format;

  ctx.save();

  // 1. Footer Typography (Date / Event / Custom Message)
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

  const title = customText || theme.name.toUpperCase();

  ctx.fillStyle = theme.textColor;
  ctx.textAlign = 'center';

  if (theme.id === 'korean-life4cuts') {
    // Cute pastel header and footer
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(title, canvasWidth / 2, canvasHeight - footerHeight / 2 - 10);

    ctx.font = '32px sans-serif';
    ctx.fillText('💖 PHOTOBOOTH • ' + dateStr + ' ✨', canvasWidth / 2, canvasHeight - footerHeight / 2 + 38);

    // Decorative stickers
    ctx.font = '48px sans-serif';
    ctx.fillText('🌸', 120, canvasHeight - footerHeight / 2 + 10);
    ctx.fillText('⭐️', canvasWidth - 120, canvasHeight - footerHeight / 2 + 10);
  } else if (theme.id === 'party') {
    // Confetti particles
    drawFestiveConfetti(ctx, canvasWidth, canvasHeight);

    ctx.font = '900 52px sans-serif';
    ctx.fillText('🎉 ' + title + ' 🎉', canvasWidth / 2, canvasHeight - footerHeight / 2);
    ctx.font = '32px sans-serif';
    ctx.fillText(dateStr, canvasWidth / 2, canvasHeight - footerHeight / 2 + 45);
  } else if (theme.id === 'elegant-black') {
    // Double Gold divider lines
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth * 0.25, canvasHeight - footerHeight + 30);
    ctx.lineTo(canvasWidth * 0.75, canvasHeight - footerHeight + 30);
    ctx.stroke();

    ctx.font = 'italic 46px serif';
    ctx.fillText(title, canvasWidth / 2, canvasHeight - footerHeight / 2 + 10);
    ctx.font = '28px serif';
    ctx.fillText('— ' + dateStr + ' —', canvasWidth / 2, canvasHeight - footerHeight / 2 + 55);
  } else if (theme.id === 'romantic') {
    ctx.font = 'italic 48px serif';
    ctx.fillText('💌 ' + title + ' 🌹', canvasWidth / 2, canvasHeight - footerHeight / 2);
    ctx.font = '30px serif';
    ctx.fillText(dateStr, canvasWidth / 2, canvasHeight - footerHeight / 2 + 45);
  } else {
    // Standard Photobooth stamp
    ctx.font = 'bold 42px monospace';
    ctx.fillText(title, canvasWidth / 2, canvasHeight - footerHeight / 2);
    if (theme.showDate) {
      ctx.font = '28px monospace';
      ctx.fillText(dateStr, canvasWidth / 2, canvasHeight - footerHeight / 2 + 40);
    }
  }

  // Draw cut line between strips for 'double-strip' format
  if (format.id === 'double-strip') {
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([16, 12]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 40);
    ctx.lineTo(canvasWidth / 2, canvasHeight - 40);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

function drawFestiveConfetti(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const colors = ['#f43f5e', '#ec4899', '#eab308', '#38bdf8', '#a855f7', '#22c55e'];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  ctx.save();
  for (let i = 0; i < 70; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 6 + rand() * 12;
    const color = colors[Math.floor(rand() * colors.length)];

    ctx.fillStyle = color;
    ctx.beginPath();
    if (i % 2 === 0) {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    } else {
      ctx.fillRect(x - r, y - r, r * 1.8, r * 1.8);
    }
    ctx.fill();
  }
  ctx.restore();
}
