'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormatId, PhotoCapture, SessionStep, ThemeId } from '@/types';
import { THEMES } from '@/lib/themes';

export interface PhotoboothSessionState {
  step: SessionStep;
  themeId: ThemeId;
  formatId: FormatId;
  timerDuration: 3 | 5 | 10;
  countdownSeconds: number;
  photos: PhotoCapture[];
  currentPhotoIndex: number;
  isPaused: boolean;
  flashActive: boolean;
  retakeTargetIndex: number | null;
  error?: string;
}

export function usePhotoboothSession(initialTheme: ThemeId = 'classic') {
  const [state, setState] = useState<PhotoboothSessionState>({
    step: 'idle',
    themeId: initialTheme,
    formatId: THEMES[initialTheme].defaultFormat,
    timerDuration: 3,
    countdownSeconds: 3,
    photos: [],
    currentPhotoIndex: 0,
    isPaused: false,
    flashActive: false,
    retakeTargetIndex: null,
  });

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio tone synthesizer for countdown and shutter
  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // Audio autoplay policy or unavailable, ignore
    }
  }, []);

  const setTheme = useCallback((themeId: ThemeId) => {
    setState((prev) => ({
      ...prev,
      themeId,
      formatId: THEMES[themeId].defaultFormat,
    }));
  }, []);

  const setFormat = useCallback((formatId: FormatId) => {
    setState((prev) => ({ ...prev, formatId }));
  }, []);

  const setTimerDuration = useCallback((duration: 3 | 5 | 10) => {
    setState((prev) => ({ ...prev, timerDuration: duration, countdownSeconds: duration }));
  }, []);

  const clearCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const cancelSession = useCallback(() => {
    clearCountdown();
    setState((prev) => ({
      ...prev,
      step: 'idle',
      photos: [],
      currentPhotoIndex: 0,
      isPaused: false,
      flashActive: false,
      retakeTargetIndex: null,
    }));
  }, [clearCountdown]);

  const pauseSession = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  const resumeSession = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  const startCountdown = useCallback(
    (onComplete: () => void) => {
      clearCountdown();
      let remaining = state.timerDuration;
      setState((prev) => ({
        ...prev,
        step: 'countdown',
        countdownSeconds: remaining,
        isPaused: false,
      }));

      playTone(523.25, 0.1); // C5 beep

      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining > 0) {
          playTone(523.25, 0.1); // C5 beep
          setState((prev) => ({ ...prev, countdownSeconds: remaining }));
        } else {
          clearCountdown();
          playTone(880, 0.2, 'triangle'); // A5 shutter beep
          onComplete();
        }
      }, 1000);
    },
    [state.timerDuration, clearCountdown, playTone]
  );

  const triggerFlash = useCallback((callback?: () => void) => {
    setState((prev) => ({ ...prev, flashActive: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, flashActive: false }));
      if (callback) callback();
    }, 450);
  }, []);

  const addCapturedPhoto = useCallback(
    (photo: { blob: Blob; dataUrl: string; width: number; height: number }) => {
      setState((prev) => {
        const newPhoto: PhotoCapture = {
          id: 'photo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          index: prev.retakeTargetIndex !== null ? prev.retakeTargetIndex : prev.currentPhotoIndex,
          ...photo,
          timestamp: Date.now(),
        };

        let updatedPhotos: PhotoCapture[];
        if (prev.retakeTargetIndex !== null) {
          // Replacing a specific photo
          updatedPhotos = [...prev.photos];
          updatedPhotos[prev.retakeTargetIndex] = newPhoto;
          return {
            ...prev,
            photos: updatedPhotos,
            retakeTargetIndex: null,
            step: 'reviewing',
          };
        } else {
          // Sequential session
          updatedPhotos = [...prev.photos, newPhoto];
          const nextIndex = prev.currentPhotoIndex + 1;
          const isFinished = nextIndex >= 4;

          return {
            ...prev,
            photos: updatedPhotos,
            currentPhotoIndex: nextIndex,
            step: isFinished ? 'reviewing' : 'preparing',
          };
        }
      });
    },
    []
  );

  const start4PhotoSession = useCallback(() => {
    setState((prev) => ({
      ...prev,
      step: 'preparing',
      photos: [],
      currentPhotoIndex: 0,
      retakeTargetIndex: null,
      isPaused: false,
    }));
  }, []);

  const retakeSinglePhoto = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      retakeTargetIndex: index,
      step: 'preparing',
      isPaused: false,
    }));
  }, []);

  const goToEditor = useCallback(() => {
    setState((prev) => ({ ...prev, step: 'editing' }));
  }, []);

  const updatePhotosOrder = useCallback((reordered: PhotoCapture[]) => {
    setState((prev) => ({
      ...prev,
      photos: reordered.map((p, idx) => ({ ...p, index: idx })),
    }));
  }, []);

  const resetToNewSession = useCallback(() => {
    clearCountdown();
    setState((prev) => ({
      ...prev,
      step: 'idle',
      photos: [],
      currentPhotoIndex: 0,
      retakeTargetIndex: null,
      isPaused: false,
      flashActive: false,
    }));
  }, [clearCountdown]);

  useEffect(() => {
    return () => {
      clearCountdown();
    };
  }, [clearCountdown]);

  return {
    state,
    setTheme,
    setFormat,
    setTimerDuration,
    start4PhotoSession,
    startCountdown,
    triggerFlash,
    addCapturedPhoto,
    retakeSinglePhoto,
    pauseSession,
    resumeSession,
    cancelSession,
    goToEditor,
    updatePhotosOrder,
    resetToNewSession,
  };
}
