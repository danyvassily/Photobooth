import { FacePose } from '@/types';
import {
  CDN_FACE_MODEL,
  LOCAL_FACE_MODEL,
  pickAsset,
  pickVisionWasmDir,
} from '@/lib/mediapipe/assets';

export interface FaceLandmarksResult {
  facePoses: FacePose[];
}

let faceLandmarkerInstance: unknown = null;
let isLandmarkerLoading = false;

/**
 * Initializes Google MediaPipe Face Landmarker
 */
export async function initFaceLandmarker(): Promise<boolean> {
  if (faceLandmarkerInstance) return true;
  if (isLandmarkerLoading) return false;
  isLandmarkerLoading = true;

  if (typeof window === 'undefined') return false;

  try {
    const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision');
    const [wasmDir, modelPath] = await Promise.all([
      pickVisionWasmDir(),
      pickAsset(LOCAL_FACE_MODEL, CDN_FACE_MODEL),
    ]);
    const vision = await FilesetResolver.forVisionTasks(wasmDir);

    faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: modelPath,
        delegate: 'GPU',
      },
      outputFaceBlendshapes: false,
      runningMode: 'VIDEO',
      numFaces: 2,
    });

    console.log('⚡ MediaPipe Face Landmarker ready for AR accessories');
    return true;
  } catch (err) {
    console.warn('MediaPipe Face Landmarker failed to initialize (using manual AR placement fallback):', err);
    faceLandmarkerInstance = null;
    return false;
  } finally {
    isLandmarkerLoading = false;
  }
}

/**
 * Detects face poses from a video element in real time
 */
export function detectFacesFromVideo(video: HTMLVideoElement, timestampMs: number): FacePose[] {
  if (!faceLandmarkerInstance) return [];

  try {
    const landmarker = faceLandmarkerInstance as {
      detectForVideo: (
        video: HTMLVideoElement,
        timestamp: number
      ) => { faceLandmarks?: Array<Array<{ x: number; y: number; z: number }>> };
    };

    const results = landmarker.detectForVideo(video, timestampMs);
    if (!results || !results.faceLandmarks || results.faceLandmarks.length === 0) {
      return [];
    }

    return results.faceLandmarks.map((landmarks) => calculateFacePose(landmarks));
  } catch (e) {
    return [];
  }
}

/**
 * Computes 3D face orientation and anchor points from MediaPipe 468 landmark points
 */
export function calculateFacePose(landmarks: Array<{ x: number; y: number; z: number }>): FacePose {
  // Key landmark indices:
  // 1: Nose tip
  // 33: Left eye outer corner, 133: Left eye inner corner
  // 362: Right eye inner corner, 263: Right eye outer corner
  // 168: Midpoint between eyes (glabella / glasses bridge)
  // 13: Upper lip center, 14: Lower lip center
  const nose = landmarks[1] || { x: 0.5, y: 0.5, z: 0 };
  const bridge = landmarks[168] || { x: 0.5, y: 0.45, z: 0 };
  const leftEyeOuter = landmarks[33] || { x: 0.35, y: 0.45, z: 0 };
  const rightEyeOuter = landmarks[263] || { x: 0.65, y: 0.45, z: 0 };
  const mouth = landmarks[13] || { x: 0.5, y: 0.7, z: 0 };

  const dx = rightEyeOuter.x - leftEyeOuter.x;
  const dy = rightEyeOuter.y - leftEyeOuter.y;
  const eyeDistance = Math.hypot(dx, dy);

  // Roll = 2D rotation angle between eyes
  const roll = Math.atan2(dy, dx);

  // Scale relative to reference eye distance of ~0.3
  const scale = eyeDistance / 0.28;

  // Yaw approximation (face turning left/right)
  const leftDist = Math.abs(nose.x - leftEyeOuter.x);
  const rightDist = Math.abs(rightEyeOuter.x - nose.x);
  const yaw = (rightDist - leftDist) / eyeDistance;

  // Pitch approximation (face tilting up/down)
  const pitch = (nose.y - bridge.y) / (eyeDistance * 0.5) - 1.0;

  return {
    roll,
    pitch,
    yaw,
    center: { x: bridge.x, y: bridge.y },
    eyeDistance,
    leftEye: { x: leftEyeOuter.x, y: leftEyeOuter.y },
    rightEye: { x: rightEyeOuter.x, y: rightEyeOuter.y },
    noseTip: { x: nose.x, y: nose.y },
    mouthCenter: { x: mouth.x, y: mouth.y },
    scale: Math.max(0.4, Math.min(2.5, scale)),
  };
}
