import { FilterPresetId, ImageAdjustments } from '@/types';
import { jsApplyFilter, jsBlendMask, jsProcessPixels } from './js-engine';

export interface BenchmarkResult {
  width: number;
  height: number;
  iterations: number;
  wasmTimeMs: number;
  jsTimeMs: number;
  speedup: number;
  wasmAvailable: boolean;
}

let wasmModule: typeof import('@/public/wasm/photobooth_core') | null = null;
let isWasmLoaded = false;
let isWasmAttempted = false;

export async function initWasm(): Promise<boolean> {
  if (isWasmLoaded) return true;
  if (isWasmAttempted) return isWasmLoaded;
  isWasmAttempted = true;

  if (typeof window === 'undefined') {
    return false; // Server environment
  }

  try {
    const wasm = await import('@/public/wasm/photobooth_core');
    await wasm.default('/wasm/photobooth_core_bg.wasm');
    if (wasm.is_wasm_ready && wasm.is_wasm_ready()) {
      wasmModule = wasm;
      isWasmLoaded = true;
      console.log('⚡ Photobooth Rust/WASM engine loaded successfully');
      return true;
    }
  } catch (err) {
    console.warn('WASM initialization failed or not supported in this context, falling back to JS/Canvas 2D:', err);
    wasmModule = null;
    isWasmLoaded = false;
  }
  return false;
}

export function isWasmActive(): boolean {
  return isWasmLoaded && wasmModule !== null;
}

export async function processImage(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  adjustments: ImageAdjustments,
  forceEngine?: 'wasm' | 'js'
): Promise<void> {
  const useWasm = forceEngine !== 'js' && (isWasmLoaded || (await initWasm())) && wasmModule !== null;

  if (useWasm && wasmModule) {
    const { brightness, contrast, saturation, temperature, sepia, grayscale, vignette, grain } = adjustments;
    wasmModule.wasm_process_image(
      pixels as unknown as Uint8Array,
      width,
      height,
      brightness,
      contrast,
      saturation,
      temperature,
      sepia,
      grayscale,
      vignette,
      grain
    );
  } else {
    jsProcessPixels(pixels, width, height, adjustments);
  }

  // Apply the selected look after the manual sliders so presets are always
  // visible in the composed print and never silently ignored.
  if (adjustments.filterPreset) {
    await applyFilterPreset(pixels, width, height, adjustments.filterPreset, forceEngine);
  }
}

export async function applyFilterPreset(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  preset: FilterPresetId,
  forceEngine?: 'wasm' | 'js'
): Promise<void> {
  const useWasm = forceEngine !== 'js' && (isWasmLoaded || (await initWasm())) && wasmModule !== null;

  if (useWasm && wasmModule) {
    wasmModule.wasm_apply_filter(pixels as unknown as Uint8Array, width, height, preset);
  } else {
    jsApplyFilter(pixels, width, height, preset);
  }
}

export async function blendSegmentedMask(
  subject: Uint8ClampedArray,
  background: Uint8ClampedArray,
  mask: Uint8Array,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  forceEngine?: 'wasm' | 'js'
): Promise<void> {
  const useWasm = forceEngine !== 'js' && (isWasmLoaded || (await initWasm())) && wasmModule !== null;

  if (useWasm && wasmModule) {
    wasmModule.wasm_blend_mask(
      subject as unknown as Uint8Array,
      background as unknown as Uint8Array,
      mask,
      output as unknown as Uint8Array,
      width,
      height
    );
  } else {
    jsBlendMask(subject, background, mask, output, width, height);
  }
}

export async function runBenchmark(
  width = 1200,
  height = 1600,
  iterations = 5
): Promise<BenchmarkResult> {
  const wasmReady = await initWasm();
  const testPixelsJs = new Uint8ClampedArray(width * height * 4);
  const testPixelsWasm = new Uint8ClampedArray(width * height * 4);

  // Fill sample pixel data
  for (let i = 0; i < testPixelsJs.length; i += 4) {
    const val = (i % 256);
    testPixelsJs[i] = val;
    testPixelsJs[i + 1] = 255 - val;
    testPixelsJs[i + 2] = (val * 2) % 256;
    testPixelsJs[i + 3] = 255;
    testPixelsWasm[i] = testPixelsJs[i];
    testPixelsWasm[i + 1] = testPixelsJs[i + 1];
    testPixelsWasm[i + 2] = testPixelsJs[i + 2];
    testPixelsWasm[i + 3] = 255;
  }

  const sampleAdjustments: ImageAdjustments = {
    brightness: 15,
    contrast: 20,
    saturation: 10,
    temperature: -15,
    sepia: 25,
    grayscale: false,
    vignette: 30,
    grain: 20,
    filterPreset: 'vintage',
  };

  // 1. Measure JS
  const startJs = performance.now();
  for (let i = 0; i < iterations; i++) {
    jsProcessPixels(testPixelsJs, width, height, sampleAdjustments);
  }
  const jsTimeMs = performance.now() - startJs;

  // 2. Measure WASM if available
  let wasmTimeMs = 0;
  let speedup = 1.0;

  if (wasmReady && wasmModule) {
    const startWasm = performance.now();
    for (let i = 0; i < iterations; i++) {
      wasmModule.wasm_process_image(
        testPixelsWasm as unknown as Uint8Array,
        width,
        height,
        sampleAdjustments.brightness,
        sampleAdjustments.contrast,
        sampleAdjustments.saturation,
        sampleAdjustments.temperature,
        sampleAdjustments.sepia,
        sampleAdjustments.grayscale,
        sampleAdjustments.vignette,
        sampleAdjustments.grain
      );
    }
    wasmTimeMs = performance.now() - startWasm;
    speedup = jsTimeMs / Math.max(0.01, wasmTimeMs);
  }

  return {
    width,
    height,
    iterations,
    wasmTimeMs,
    jsTimeMs,
    speedup,
    wasmAvailable: wasmReady,
  };
}
