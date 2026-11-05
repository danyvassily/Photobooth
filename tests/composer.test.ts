import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { composePrint } from '@/lib/export/composer';
import { THEMES } from '@/lib/themes';
import { FORMATS } from '@/lib/formats';
import { PhotoCapture } from '@/types';

describe('Print Strip Composition Engine', () => {
  const samplePhotos: PhotoCapture[] = [
    { id: '1', index: 0, blob: new Blob([]), dataUrl: 'data:image/jpeg;base64,test1', width: 640, height: 480, timestamp: 1 },
    { id: '2', index: 1, blob: new Blob([]), dataUrl: 'data:image/jpeg;base64,test2', width: 640, height: 480, timestamp: 2 },
    { id: '3', index: 2, blob: new Blob([]), dataUrl: 'data:image/jpeg;base64,test3', width: 640, height: 480, timestamp: 3 },
    { id: '4', index: 3, blob: new Blob([]), dataUrl: 'data:image/jpeg;base64,test4', width: 640, height: 480, timestamp: 4 },
  ];

  // In jsdom Image onload needs triggering or mock
  beforeEach(() => {
    vi.spyOn(global, 'Image').mockImplementation(() => {
      const img = {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 800,
        height: 600,
        onload: null as (() => void) | null,
        onerror: null as ((e: unknown) => void) | null,
        set src(_v: string) {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        },
      };
      return img as unknown as HTMLImageElement;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a vertical strip layout successfully', async () => {
    const result = await composePrint({
      photos: samplePhotos,
      theme: THEMES['classic'],
      format: FORMATS['strip-vertical'],
      adjustments: {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        sepia: 0,
        grayscale: false,
        vignette: 0,
        grain: 0,
        filterPreset: 'natural',
      },
    });

    expect(result).toBeDefined();
    expect(result.width).toBe(1200);
    expect(result.height).toBe(3600);
    expect(result.blob).toBeInstanceOf(Blob);
    expect(result.dataUrl).toContain('data:image/jpeg');
  });

  it('renders all 6 print formats without error', async () => {
    const formatKeys = Object.keys(FORMATS) as (keyof typeof FORMATS)[];

    for (const key of formatKeys) {
      const format = FORMATS[key];
      const result = await composePrint({
        photos: samplePhotos,
        theme: THEMES['korean-life4cuts'],
        format,
        adjustments: {
          brightness: 0,
          contrast: 0,
          saturation: 0,
          temperature: 0,
          sepia: 0,
          grayscale: false,
          vignette: 0,
          grain: 0,
          filterPreset: 'soft',
        },
        accessories: [
          {
            id: 'acc1',
            accessoryId: 'aviator-sunglasses',
            x: 0.5,
            y: 0.35,
            scale: 1,
            rotation: 0,
          },
        ],
      });

      expect(result.width).toBe(format.canvasWidth);
      expect(result.height).toBe(format.canvasHeight);
    }
  });
});
