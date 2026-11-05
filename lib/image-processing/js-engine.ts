import { FilterPresetId, ImageAdjustments } from '@/types';

function clampU8(v: number): number {
  return v <= 0 ? 0 : v >= 255 ? 255 : Math.round(v);
}

export function jsProcessPixels(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  adjustments: ImageAdjustments
): void {
  const { brightness, contrast, saturation, temperature, sepia, grayscale, vignette, grain } = adjustments;

  const bOffset = brightness * 2.55;
  const cFactor = (100 + contrast) / 100;
  const sFactor = (100 + saturation) / 100;
  const tShift = temperature * 0.4;
  const sepiaFactor = Math.max(0, Math.min(1, sepia / 100));
  const vigStrength = Math.max(0, Math.min(1, vignette / 100));

  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistSq = Math.max(1, centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    const dy = y - centerY;
    const dySq = dy * dy;
    const rowOffset = y * width * 4;

    for (let x = 0; x < width; x++) {
      const idx = rowOffset + x * 4;
      let r = pixels[idx];
      let g = pixels[idx + 1];
      let b = pixels[idx + 2];

      // Brightness
      if (brightness !== 0) {
        r += bOffset;
        g += bOffset;
        b += bOffset;
      }

      // Contrast
      if (contrast !== 0) {
        r = (r - 128) * cFactor + 128;
        g = (g - 128) * cFactor + 128;
        b = (b - 128) * cFactor + 128;
      }

      // Temperature
      if (temperature !== 0) {
        r += tShift;
        b -= tShift;
      }

      // Saturation / Grayscale
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      if (grayscale) {
        r = luma;
        g = luma;
        b = luma;
      } else if (saturation !== 0) {
        r = luma + (r - luma) * sFactor;
        g = luma + (g - luma) * sFactor;
        b = luma + (b - luma) * sFactor;
      }

      // Sepia
      if (sepiaFactor > 0) {
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r * (1 - sepiaFactor) + sr * sepiaFactor;
        g = g * (1 - sepiaFactor) + sg * sepiaFactor;
        b = b * (1 - sepiaFactor) + sb * sepiaFactor;
      }

      // Vignette
      if (vigStrength > 0) {
        const dx = x - centerX;
        const distSq = dx * dx + dySq;
        const vig = Math.max(0, Math.min(1, 1 - (distSq / maxDistSq) * vigStrength));
        r *= vig;
        g *= vig;
        b *= vig;
      }

      pixels[idx] = clampU8(r);
      pixels[idx + 1] = clampU8(g);
      pixels[idx + 2] = clampU8(b);
    }
  }

  // Grain
  if (grain > 0) {
    jsApplyGrain(pixels, width, height, grain);
  }
}

export function jsApplyGrain(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  intensity: number
): void {
  const factor = Math.max(0, Math.min(1, intensity / 100)) * 40;
  let state = 123456789;
  const total = width * height * 4;

  for (let i = 0; i < total; i += 4) {
    state = (Math.imul(state, 1664525) + 1013904223) | 0;
    const randVal = (state >>> 16) & 0xff;
    const noise = (randVal / 255 - 0.5) * factor;

    pixels[i] = clampU8(pixels[i] + noise);
    pixels[i + 1] = clampU8(pixels[i + 1] + noise);
    pixels[i + 2] = clampU8(pixels[i + 2] + noise);
  }
}

export function jsApplyFilter(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  preset: FilterPresetId
): void {
  const base: ImageAdjustments = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    sepia: 0,
    grayscale: false,
    vignette: 0,
    grain: 0,
    filterPreset: preset,
  };

  switch (preset) {
    case 'black-and-white':
      jsProcessPixels(pixels, width, height, { ...base, grayscale: true, contrast: 20, vignette: 15, grain: 15 });
      break;
    case 'sepia':
      jsProcessPixels(pixels, width, height, { ...base, brightness: 5, contrast: 10, saturation: -10, temperature: 15, sepia: 80, vignette: 25 });
      break;
    case 'vintage':
      jsProcessPixels(pixels, width, height, { ...base, brightness: 5, contrast: 15, saturation: -15, temperature: 25, sepia: 35, vignette: 35, grain: 25 });
      break;
    case 'film-grain':
      jsProcessPixels(pixels, width, height, { ...base, brightness: -2, contrast: 12, saturation: -5, temperature: 10, sepia: 10, vignette: 20, grain: 40 });
      break;
    case 'warm':
      jsProcessPixels(pixels, width, height, { ...base, brightness: 5, contrast: 8, saturation: 10, temperature: 30 });
      break;
    case 'cool':
      jsProcessPixels(pixels, width, height, { ...base, contrast: 5, saturation: -5, temperature: -30 });
      break;
    case 'soft':
      jsProcessPixels(pixels, width, height, { ...base, brightness: 8, contrast: -15, saturation: -10, temperature: 5, sepia: 5, vignette: 10 });
      break;
    case 'high-contrast':
      jsProcessPixels(pixels, width, height, { ...base, contrast: 45, saturation: 15, vignette: 15 });
      break;
    case 'faded':
      jsProcessPixels(pixels, width, height, { ...base, brightness: 12, contrast: -20, saturation: -25, temperature: 10, sepia: 15, vignette: 25, grain: 20 });
      break;
    case 'cinematic':
      // Split toning
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const shadowWeight = Math.pow(1 - luma, 1.5);
        const highlightWeight = Math.pow(luma, 1.5);

        pixels[i] = clampU8(r + highlightWeight * 25 - shadowWeight * 15);
        pixels[i + 1] = clampU8(g + highlightWeight * 10 + shadowWeight * 5);
        pixels[i + 2] = clampU8(b - highlightWeight * 20 + shadowWeight * 25);
      }
      jsApplyGrain(pixels, width, height, 15);
      break;
    case 'natural':
    default:
      jsProcessPixels(pixels, width, height, { ...base, brightness: 2, contrast: 5, saturation: 5 });
      break;
  }
}

export function jsBlendMask(
  subject: Uint8ClampedArray,
  background: Uint8ClampedArray,
  mask: Uint8Array,
  output: Uint8ClampedArray,
  width: number,
  height: number
): void {
  const numPixels = width * height;
  for (let i = 0; i < numPixels; i++) {
    const maskVal = mask[i] / 255;
    const invMask = 1 - maskVal;
    const px = i * 4;

    const sr = subject[px];
    const sg = subject[px + 1];
    const sb = subject[px + 2];
    const sa = subject[px + 3] / 255;

    const br = background[px];
    const bg = background[px + 1];
    const bb = background[px + 2];
    const ba = background[px + 3] / 255;

    const finalAlpha = maskVal * sa + invMask * ba;
    if (finalAlpha > 0) {
      output[px] = clampU8((sr * maskVal * sa + br * invMask * ba) / finalAlpha);
      output[px + 1] = clampU8((sg * maskVal * sa + bg * invMask * ba) / finalAlpha);
      output[px + 2] = clampU8((sb * maskVal * sa + bb * invMask * ba) / finalAlpha);
      output[px + 3] = clampU8(finalAlpha * 255);
    } else {
      output[px] = 0;
      output[px + 1] = 0;
      output[px + 2] = 0;
      output[px + 3] = 0;
    }
  }
}
