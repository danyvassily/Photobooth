'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RotateCcw,
  FlipHorizontal,
  Play,
  Pause,
  X,
  Upload,
  AlertCircle,
  Timer,
  Sparkles,
} from 'lucide-react';
import { useCamera } from '@/lib/camera/use-camera';
import { usePhotoboothSession } from '@/hooks/use-photobooth-session';
import { AccessoryId, PlacedAccessory, ThemeId } from '@/types';
import { detectFacesFromVideo, initFaceLandmarker } from '@/lib/face-tracking';
import { drawAccessory } from '@/lib/accessories/renderer';
import { THEMES } from '@/lib/themes';

interface CameraViewProps {
  session: ReturnType<typeof usePhotoboothSession>;
  onPhotosReady: () => void;
  onOpenThemes: () => void;
  activeAccessoryId?: AccessoryId;
}

export function CameraView({
  session,
  onPhotosReady,
  onOpenThemes,
  activeAccessoryId = 'aviator-sunglasses',
}: CameraViewProps) {
  const { state: camState, videoRef, startStream, toggleFacingMode, capturePhoto } = useCamera();
  const [isMirror, setIsMirror] = useState(true);
  const [arTrackingActive, setArTrackingActive] = useState(false);

  const canvasArRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);

  const { state: sessState } = session;

  // Initialize camera stream on mount
  useEffect(() => {
    startStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Face Landmarker for real-time AR
  useEffect(() => {
    let mounted = true;
    initFaceLandmarker().then((ready) => {
      if (mounted) setArTrackingActive(ready);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Live AR Overlay loop
  const renderArLoop = useCallback(() => {
    if (
      canvasArRef.current &&
      videoRef.current &&
      videoRef.current.readyState >= 2 &&
      sessState.themeId === 'fun-ar'
    ) {
      const video = videoRef.current;
      const canvas = canvasArRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Detect face landmarks
        const faces = detectFacesFromVideo(video, performance.now());

        faces.forEach((face) => {
          // Adjust coordinates for canvas size and mirroring
          const x = isMirror ? (1 - face.center.x) * canvas.width : face.center.x * canvas.width;
          const y = face.center.y * canvas.height;
          const rotation = isMirror ? -face.roll : face.roll;

          const placed: PlacedAccessory = {
            id: 'live-ar',
            accessoryId: activeAccessoryId,
            x,
            y,
            scale: face.scale * (canvas.width / 500),
            rotation,
          };
          drawAccessory(ctx, placed);
        });
      }
    }
    animationFrameRef.current = requestAnimationFrame(renderArLoop);
  }, [sessState.themeId, activeAccessoryId, isMirror, videoRef]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(renderArLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [renderArLoop]);

  // Sync canvas size with video element
  const handleVideoLoaded = () => {
    if (videoRef.current && canvasArRef.current) {
      canvasArRef.current.width = videoRef.current.videoWidth || 1280;
      canvasArRef.current.height = videoRef.current.videoHeight || 720;
    }
  };

  // Perform single photo capture
  const handlePerformCapture = useCallback(async () => {
    try {
      session.triggerFlash();
      const photo = await capturePhoto();
      session.addCapturedPhoto(photo);
    } catch (err) {
      console.error('Capture error:', err);
    }
  }, [capturePhoto, session]);

  // Advance photo sequence when in 'preparing' step
  useEffect(() => {
    if (sessState.step === 'preparing' && !sessState.isPaused) {
      const now = Date.now();
      if (now - lastCaptureTimeRef.current < 800) return;
      lastCaptureTimeRef.current = now;

      session.startCountdown(() => {
        handlePerformCapture();
      });
    } else if (sessState.step === 'reviewing') {
      onPhotosReady();
    }
  }, [sessState.step, sessState.isPaused, session, handlePerformCapture, onPhotosReady]);

  // File import fallback for photos
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          session.addCapturedPhoto({
            blob: file,
            dataUrl: reader.result,
            width: 1280,
            height: 960,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const currentTheme = THEMES[sessState.themeId];

  return (
    <div className="relative w-full h-[calc(100vh-65px)] h-[calc(100dvh-65px)] flex flex-col items-center justify-between bg-black overflow-hidden select-none">
      {/* Flash overlay */}
      {sessState.flashActive && (
        <div className="absolute inset-0 z-50 bg-white flash-screen pointer-events-none" />
      )}

      {/* Main Video Viewport */}
      <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Permission Denied / Error view */}
        {camState.permission === 'denied' && (
          <div className="p-6 text-center max-w-md mx-auto z-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Accès caméra requis</h3>
            <p className="text-sm text-slate-400 mb-6">
              {camState.error || 'Veuillez autoriser l’accès à la caméra pour démarrer la séance photomaton.'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => startStream()}
                className="w-full py-3 px-5 rounded-xl font-semibold bg-pink-600 hover:bg-pink-500 text-white transition shadow-lg shadow-pink-600/30"
              >
                Autoriser la caméra
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Importer des photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* Video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={handleVideoLoaded}
          className={`w-full h-full object-cover transition-transform ${
            isMirror && camState.facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Real-time AR Canvas for accessories (aviator glasses, etc.) */}
        <canvas
          ref={canvasArRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Active Countdown Big Display */}
        {sessState.step === 'countdown' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
            <div className="flex flex-col items-center">
              <div className="text-8xl md:text-9xl font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse-fast">
                {sessState.countdownSeconds}
              </div>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-pink-500/80 text-white font-bold text-sm tracking-wider uppercase">
                Photo {sessState.photos.length + 1} / 4
              </div>
            </div>
          </div>
        )}

        {/* Top Control Bar over video */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          {/* Progress pill 1/4 to 4/4 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span>
              {sessState.step === 'idle'
                ? 'Prêt pour 4 prises'
                : `Prise ${Math.min(4, sessState.photos.length + 1)} / 4`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mirror mode toggle */}
            <button
              onClick={() => setIsMirror(!isMirror)}
              title="Mode Miroir"
              className={`p-2.5 rounded-full backdrop-blur-md border transition ${
                isMirror
                  ? 'bg-white/20 text-white border-white/30'
                  : 'bg-black/40 text-white/70 border-white/10 hover:text-white'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Switch Camera */}
            <button
              onClick={toggleFacingMode}
              title="Changer de caméra"
              className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/10 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Photobooth Thumbnails Tray (bottom of video during session) */}
        {sessState.photos.length > 0 && sessState.step !== 'idle' && (
          <div className="absolute bottom-24 left-4 right-4 z-20 flex items-center justify-center gap-2">
            {[0, 1, 2, 3].map((idx) => {
              const photo = sessState.photos[idx];
              return (
                <div
                  key={idx}
                  className={`w-12 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    photo
                      ? 'border-pink-500 bg-slate-800 shadow-md scale-100'
                      : 'border-white/20 bg-black/40 backdrop-blur-sm'
                  }`}
                >
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.dataUrl}
                      alt={`Miniature ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/50 font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-900 px-6 py-4 pb-safe flex flex-col gap-3">
        {sessState.step === 'idle' ? (
          <div className="flex items-center justify-between max-w-xl mx-auto w-full gap-4">
            {/* Timer duration toggle */}
            <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
              {([3, 5, 10] as const).map((dur) => (
                <button
                  key={dur}
                  onClick={() => session.setTimerDuration(dur)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    sessState.timerDuration === dur
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {dur}s
                </button>
              ))}
            </div>

            {/* Giant Main Start Button */}
            <button
              onClick={() => session.start4PhotoSession()}
              className="relative group px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-extrabold text-base tracking-wide shadow-xl shadow-pink-500/30 hover:shadow-pink-500/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5"
            >
              <Camera className="w-5 h-5" />
              <span>Démarrer (4 photos)</span>
            </button>

            {/* Theme switcher button */}
            <button
              onClick={onOpenThemes}
              aria-label="Choisir un thème"
              title="Choisir un thème"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="hidden sm:inline">Thème</span>
            </button>
          </div>
        ) : (
          /* Active session controls (Pause, Resume, Cancel) */
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto w-full">
            <button
              onClick={sessState.isPaused ? session.resumeSession : session.pauseSession}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white font-semibold text-sm flex items-center gap-2 transition"
            >
              {sessState.isPaused ? (
                <>
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>Reprendre</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span>Pause</span>
                </>
              )}
            </button>

            <button
              onClick={session.cancelSession}
              className="px-5 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-800/50 text-red-300 font-semibold text-sm flex items-center gap-2 transition"
            >
              <X className="w-4 h-4" />
              <span>Annuler la séance</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
