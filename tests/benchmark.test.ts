import { describe, it, expect } from 'vitest';
import { jsProcessPixels, jsApplyFilter } from '@/lib/image-processing/js-engine';
import { ImageAdjustments } from '@/types';

describe('Performance Benchmarks (Representative Photo Processing)', () => {
  const resolutions = [
    { label: 'HD 720p', width: 1280, height: 720 },
    { label: 'Full HD 1080p', width: 1920, height: 1080 },
    { label: 'Strip 4K Print', width: 1200, height: 3600 },
  ];

  const sampleAdjustments: ImageAdjustments = {
    brightness: 12,
    contrast: 18,
    saturation: 15,
    temperature: -10,
    sepia: 20,
    grayscale: false,
    vignette: 25,
    grain: 15,
    filterPreset: 'vintage',
  };

  for (const res of resolutions) {
    it(`measures pixel adjustment throughput on ${res.label} (${res.width}x${res.height})`, () => {
      const pixels = new Uint8ClampedArray(res.width * res.height * 4);
      // Fill pattern
      for (let i = 0; i < pixels.length; i += 16) {
        pixels[i] = 120;
        pixels[i + 1] = 140;
        pixels[i + 2] = 160;
        pixels[i + 3] = 255;
      }

      const start = performance.now();
      jsProcessPixels(pixels, res.width, res.height, sampleAdjustments);
      const elapsedMs = performance.now() - start;

      const megapixels = (res.width * res.height) / 1_000_000;
      const mpPerSec = (megapixels / (elapsedMs / 1000)).toFixed(1);

      console.log(`[BENCHMARK] ${res.label}: ${elapsedMs.toFixed(2)} ms (${mpPerSec} MP/s)`);

      expect(elapsedMs).toBeGreaterThan(0);
      // In JS engine, processing 1080p should take less than 150ms on modern machine
      expect(elapsedMs).toBeLessThan(500);
    });
  }

  it('measures filter preset application execution speed across multiple passes', () => {
    const width = 1000;
    const height = 1000;
    const pixels = new Uint8ClampedArray(width * height * 4);

    const start = performance.now();
    for (let i = 0; i < 5; i++) {
      jsApplyFilter(pixels, width, height, 'cinematic');
    }
    const elapsedMs = performance.now() - start;
    const avgPassMs = (elapsedMs / 5).toFixed(2);

    console.log(`[BENCHMARK] Cinematic filter preset (1000x1000, 5 passes): avg ${avgPassMs} ms/pass`);
    expect(elapsedMs).toBeLessThan(1000);
  });
});
