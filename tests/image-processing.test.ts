import { describe, it, expect } from 'vitest';
import { jsProcessPixels, jsApplyFilter, jsBlendMask, jsApplyGrain } from '@/lib/image-processing/js-engine';
import { FilterPresetId } from '@/types';

describe('Image Processing Engine (JS Fallback & Logic)', () => {
  it('modifies pixel brightness and contrast accurately', () => {
    const width = 10;
    const height = 10;
    const pixels = new Uint8ClampedArray(width * height * 4);
    // Fill with mid gray (128)
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 128;
      pixels[i + 1] = 128;
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }

    jsProcessPixels(pixels, width, height, {
      brightness: 20,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      sepia: 0,
      grayscale: false,
      vignette: 0,
      grain: 0,
      filterPreset: 'natural',
    });

    // 128 + 20 * 2.55 = 128 + 51 = 179
    expect(pixels[0]).toBeGreaterThan(170);
    expect(pixels[0]).toBeLessThan(185);
    expect(pixels[3]).toBe(255); // Alpha preserved
  });

  it('converts to grayscale accurately using REC 601 luma formula', () => {
    const width = 2;
    const height = 2;
    const pixels = new Uint8ClampedArray(width * height * 4);
    // Pure Red (255, 0, 0) -> Luma = 0.299 * 255 = 76.245
    pixels[0] = 255;
    pixels[1] = 0;
    pixels[2] = 0;
    pixels[3] = 255;

    jsProcessPixels(pixels, width, height, {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      sepia: 0,
      grayscale: true,
      vignette: 0,
      grain: 0,
      filterPreset: 'black-and-white',
    });

    expect(pixels[0]).toBe(76);
    expect(pixels[1]).toBe(76);
    expect(pixels[2]).toBe(76);
  });

  it('applies all 12 preset filters without runtime errors', () => {
    const presets: FilterPresetId[] = [
      'natural',
      'black-and-white',
      'sepia',
      'vintage',
      'film-grain',
      'warm',
      'cool',
      'soft',
      'high-contrast',
      'faded',
      'cinematic',
    ];

    const width = 8;
    const height = 8;

    for (const preset of presets) {
      const pixels = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 120;
        pixels[i + 1] = 140;
        pixels[i + 2] = 160;
        pixels[i + 3] = 255;
      }

      expect(() => jsApplyFilter(pixels, width, height, preset)).not.toThrow();
      expect(pixels[3]).toBe(255); // Alpha intact
    }
  });

  it('blends subject over background using mask', () => {
    const width = 2;
    const height = 1;
    const subject = new Uint8ClampedArray([255, 0, 0, 255, 255, 0, 0, 255]); // 2 red pixels
    const background = new Uint8ClampedArray([0, 0, 255, 255, 0, 0, 255, 255]); // 2 blue pixels
    const mask = new Uint8Array([255, 0]); // First pixel = subject, second = background
    const output = new Uint8ClampedArray(8);

    jsBlendMask(subject, background, mask, output, width, height);

    // Pixel 0 is 100% subject (Red)
    expect(output[0]).toBe(255);
    expect(output[1]).toBe(0);
    expect(output[2]).toBe(0);

    // Pixel 1 is 100% background (Blue)
    expect(output[4]).toBe(0);
    expect(output[5]).toBe(0);
    expect(output[6]).toBe(255);
  });
});
