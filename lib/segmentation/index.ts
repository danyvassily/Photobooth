import {
  CDN_SEGMENTER_MODEL,
  LOCAL_SEGMENTER_MODEL,
  pickAsset,
  pickVisionWasmDir,
} from '@/lib/mediapipe/assets';

let segmenterInstance: unknown = null;
let isSegmenterLoading = false;

export async function initImageSegmenter(): Promise<boolean> {
  if (segmenterInstance) return true;
  if (isSegmenterLoading) return false;
  isSegmenterLoading = true;

  if (typeof window === 'undefined') return false;

  try {
    const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
    const [wasmDir, modelPath] = await Promise.all([
      pickVisionWasmDir(),
      pickAsset(LOCAL_SEGMENTER_MODEL, CDN_SEGMENTER_MODEL),
    ]);
    const vision = await FilesetResolver.forVisionTasks(wasmDir);

    segmenterInstance = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'GPU',
      },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });

    console.log('⚡ MediaPipe Image Segmenter ready for Color Studio');
    return true;
  } catch (err) {
    console.warn('MediaPipe Image Segmenter failed to initialize (using color frame fallback):', err);
    segmenterInstance = null;
    return false;
  } finally {
    isSegmenterLoading = false;
  }
}

export function isSegmenterReady(): boolean {
  return segmenterInstance !== null;
}

/**
 * Segments an image and returns a 1-byte-per-pixel Uint8Array mask
 * (255 = person foreground, 0 = background)
 */
export async function segmentPerson(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<Uint8Array | null> {
  if (!segmenterInstance) {
    await initImageSegmenter();
  }
  if (!segmenterInstance) return null;

  try {
    const segmenter = segmenterInstance as {
      segment: (image: HTMLImageElement | HTMLCanvasElement) => {
        categoryMask?: { getAsUint8Array: () => Uint8Array };
      };
    };

    const result = segmenter.segment(imageElement);
    if (!result.categoryMask) return null;

    const rawMask = result.categoryMask.getAsUint8Array();
    const mask = new Uint8Array(rawMask.length);
    // category 0 = background, category 1 = person
    for (let i = 0; i < rawMask.length; i++) {
      mask[i] = rawMask[i] === 1 ? 255 : 0;
    }
    return mask;
  } catch (err) {
    console.warn('Error during person segmentation:', err);
    return null;
  }
}
