'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface CameraState {
  isStreaming: boolean;
  permission: 'prompt' | 'granted' | 'denied';
  facingMode: 'user' | 'environment';
  devices: MediaDeviceInfo[];
  selectedDeviceId?: string;
  error?: string;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isStreaming: false,
    permission: 'prompt',
    facingMode: 'user',
    devices: [],
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  const startStream = useCallback(
    async (facing: 'user' | 'environment' = state.facingMode, deviceId?: string) => {
      stopStream();

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setState((prev) => ({
          ...prev,
          permission: 'denied',
          error: 'Caméra non supportée par ce navigateur',
        }));
        return;
      }

      try {
        const constraints: MediaStreamConstraints = {
          audio: false, // Strict rule: never request microphone!
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : {
                facingMode: facing,
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        // Enumerate devices once permission is granted
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');

        setState((prev) => ({
          ...prev,
          isStreaming: true,
          permission: 'granted',
          facingMode: facing,
          selectedDeviceId: deviceId,
          devices: videoDevices,
          error: undefined,
        }));
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        const errMsg = err instanceof Error ? err.message : 'Erreur accès caméra';
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          permission: 'denied',
          error: errMsg,
        }));
      }
    },
    [state.facingMode, stopStream]
  );

  const toggleFacingMode = useCallback(() => {
    const nextFacing = state.facingMode === 'user' ? 'environment' : 'user';
    startStream(nextFacing);
  }, [state.facingMode, startStream]);

  const capturePhoto = useCallback(async (): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> => {
    if (!videoRef.current || !streamRef.current) {
      throw new Error('Camera stream not active');
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');

    // If front camera, mirror image
    if (state.facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to capture blob'));
        },
        'image/jpeg',
        0.95
      );
    });

    return { blob, dataUrl, width, height };
  }, [state.facingMode]);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    state,
    videoRef,
    startStream,
    stopStream,
    toggleFacingMode,
    capturePhoto,
  };
}
