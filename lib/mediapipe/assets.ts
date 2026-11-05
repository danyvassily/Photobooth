/**
 * MediaPipe asset locations.
 *
 * All heavy assets (wasm runtime + models) are served from this origin so that
 * AR / segmentation keeps working offline and no third-party CDN is required at
 * runtime. CDN URLs are kept only as a last-resort fallback when the local
 * assets are missing (e.g. a stripped-down build).
 */

export const LOCAL_MEDIAPIPE_WASM_DIR = '/mediapipe/wasm';
export const LOCAL_FACE_MODEL = '/models/face_landmarker.task';
export const LOCAL_SEGMENTER_MODEL = '/models/selfie_segmenter.tflite';

export const CDN_MEDIAPIPE_WASM_DIR =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
export const CDN_FACE_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
export const CDN_SEGMENTER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';

/**
 * Returns the first reachable asset candidate, starting with the local copy.
 * A HEAD request is used because these files are large; we only need to know
 * whether they exist.
 */
export async function pickAsset(local: string, cdn: string): Promise<string> {
  try {
    const res = await fetch(local, { method: 'HEAD', cache: 'no-store' });
    if (res.ok) return local;
  } catch {
    /* fall through to CDN */
  }
  return cdn;
}

/** Same idea for the wasm runtime directory (checked via one known file). */
export async function pickVisionWasmDir(): Promise<string> {
  try {
    const res = await fetch(`${LOCAL_MEDIAPIPE_WASM_DIR}/vision_wasm_internal.js`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    if (res.ok) return LOCAL_MEDIAPIPE_WASM_DIR;
  } catch {
    /* fall through to CDN */
  }
  return CDN_MEDIAPIPE_WASM_DIR;
}
