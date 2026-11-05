'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ColorStudioBackground,
  FormatId,
  ImageAdjustments,
  PhotoCapture,
  PlacedAccessory,
  SessionStep,
  ThemeId,
} from '@/types';
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
  restoredAdjustments?: ImageAdjustments;
  restoredAccessories?: PlacedAccessory[];
  restoredCustomText?: string;
  restoredColorStudioBg?: ColorStudioBackground;
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
  const countdownRemainingRef = useRef(0);
  const countdownCallbackRef = useRef<(() => void) | null>(null);

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
    countdownCallbackRef.current = null;
    countdownRemainingRef.current = 0;
    setState((prev) => ({
      ...prev,
      step: 'idle',
      photos: [],
      currentPhotoIndex: 0,
      isPaused: false,
      flashActive: false,
      retakeTargetIndex: null,
      restoredAdjustments: undefined,
      restoredAccessories: undefined,
      restoredCustomText: undefined,
      restoredColorStudioBg: undefined,
    }));
  }, [clearCountdown]);

  const startTicker = useCallback(() => {
    clearCountdown();
    countdownIntervalRef.current = setInterval(() => {
      countdownRemainingRef.current -= 1;

      if (countdownRemainingRef.current > 0) {
        playTone(523.25, 0.1); // C5 beep
        setState((prev) => ({ ...prev, countdownSeconds: countdownRemainingRef.current }));
        return;
      }

      const onComplete = countdownCallbackRef.current;
      clearCountdown();
      countdownCallbackRef.current = null;
      countdownRemainingRef.current = 0;
      playTone(880, 0.2, 'triangle'); // A5 shutter beep
      setState((prev) => ({ ...prev, countdownSeconds: 0 }));
      onComplete?.();
    }, 1000);
  }, [clearCountdown, playTone]);

  const pauseSession = useCallback(() => {
    clearCountdown();
    setState((prev) => ({ ...prev, isPaused: true }));
  }, [clearCountdown]);

  const resumeSession = useCallback(() => {
    const shouldResumeCountdown =
      state.step === 'countdown' &&
      countdownRemainingRef.current > 0 &&
      countdownCallbackRef.current !== null;

    setState((prev) => ({ ...prev, isPaused: false }));
    if (shouldResumeCountdown) startTicker();
  }, [state.step, startTicker]);

  const startCountdown = useCallback(
    (onComplete: () => void) => {
      clearCountdown();
      countdownCallbackRef.current = onComplete;
      countdownRemainingRef.current = state.timerDuration;

      setState((prev) => ({
        ...prev,
        step: 'countdown',
        countdownSeconds: countdownRemainingRef.current,
        isPaused: false,
      }));

      playTone(523.25, 0.1); // C5 beep
      startTicker();
    },
    [state.timerDuration, clearCountdown, playTone, startTicker]
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

  const makePhotos = useCallback(
    (incoming: Array<{ blob: Blob; dataUrl: string; width: number; height: number }>): PhotoCapture[] =>
      incoming.slice(0, 4).map((photo, index) => ({
        id: 'photo-' + Date.now() + '-' + index + '-' + Math.random().toString(36).substring(2, 6),
        index,
        ...photo,
        timestamp: Date.now(),
      })),
    []
  );

  const loadPhotos = useCallback(
    (incoming: Array<{ blob: Blob; dataUrl: string; width: number; height: number }>) => {
      clearCountdown();
      countdownCallbackRef.current = null;
      countdownRemainingRef.current = 0;
      const photos = makePhotos(incoming);
      setState((prev) => ({
        ...prev,
        step: photos.length > 0 ? 'reviewing' : 'idle',
        photos,
        currentPhotoIndex: photos.length,
        retakeTargetIndex: null,
        isPaused: false,
        restoredAdjustments: undefined,
        restoredAccessories: undefined,
        restoredCustomText: undefined,
        restoredColorStudioBg: undefined,
      }));
    },
    [clearCountdown, makePhotos]
  );

  const loadPrintIntoSession = useCallback(
    (
      incoming: Array<{ blob: Blob; dataUrl: string; width: number; height: number }>,
      options: {
        themeId?: ThemeId;
        formatId?: FormatId;
        adjustments?: ImageAdjustments;
        accessories?: PlacedAccessory[];
        customText?: string;
        colorStudioBg?: ColorStudioBackground;
      } = {}
    ) => {
      clearCountdown();
      countdownCallbackRef.current = null;
      countdownRemainingRef.current = 0;
      const photos = makePhotos(incoming);
      setState((prev) => ({
        ...prev,
        step: 'editing',
        themeId: options.themeId ?? prev.themeId,
        formatId: options.formatId ?? prev.formatId,
        photos,
        currentPhotoIndex: photos.length,
        retakeTargetIndex: null,
        isPaused: false,
        restoredAdjustments: options.adjustments,
        restoredAccessories: options.accessories,
        restoredCustomText: options.customText,
        restoredColorStudioBg: options.colorStudioBg,
      }));
    },
    [clearCountdown, makePhotos]
  );

  const start4PhotoSession = useCallback(() => {
    clearCountdown();
    countdownCallbackRef.current = null;
    countdownRemainingRef.current = 0;
    setState((prev) => ({
      ...prev,
      step: 'preparing',
      photos: [],
      currentPhotoIndex: 0,
      retakeTargetIndex: null,
      isPaused: false,
      restoredAdjustments: undefined,
      restoredAccessories: undefined,
      restoredCustomText: undefined,
      restoredColorStudioBg: undefined,
    }));
  }, [clearCountdown]);

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
    countdownCallbackRef.current = null;
    countdownRemainingRef.current = 0;
    setState((prev) => ({
      ...prev,
      step: 'idle',
      photos: [],
      currentPhotoIndex: 0,
      retakeTargetIndex: null,
      isPaused: false,
      flashActive: false,
      restoredAdjustments: undefined,
      restoredAccessories: undefined,
      restoredCustomText: undefined,
      restoredColorStudioBg: undefined,
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
    loadPhotos,
    loadPrintIntoSession,
    retakeSinglePhoto,
    pauseSession,
    resumeSession,
    cancelSession,
    goToEditor,
    updatePhotosOrder,
    resetToNewSession,
  };
}
