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
import { ACCESSORIES_META, drawAccessory } from '@/lib/accessories/renderer';
import { THEMES } from '@/lib/themes';
import { ThemePreview } from './theme-preview';
import { AccessoryIcon } from './accessory-icon';

interface CameraViewProps {
  session: ReturnType<typeof usePhotoboothSession>;
  onPhotosReady: () => void;
  onOpenThemes: () => void;
  activeAccessoryId?: AccessoryId | null;
}

const ACC_SHORT_LABEL: Record<string, string> = {
  'aviator-sunglasses': 'AVIATEUR',
  'wayfarer-sunglasses': 'WAYFARER',
  'round-retro-sunglasses': 'RONDES',
  'futuristic-visor': 'VISIÈRE',
  'heart-sunglasses': 'CŒUR',
  'cowboy-hat': 'COWBOY',
  'party-hat': 'FÊTE',
  crown: 'COURONNE',
  mustache: 'MOUSTACHE',
  'cat-ears': 'OREILLES',
  wig: 'PERRUQUE',
};

export function CameraView({
  session,
  onPhotosReady,
  onOpenThemes,
  activeAccessoryId: initialAccessoryId = null,
}: CameraViewProps) {
  const { state: camState, videoRef, startStream, toggleFacingMode, capturePhoto } = useCamera();
  const [isMirror, setIsMirror] = useState(true);
  const [arTrackingActive, setArTrackingActive] = useState(false);
  // Aucun accessoire actif au démarrage : l'utilisateur choisit explicitement.
  const [activeAccessoryId, setActiveAccessoryId] = useState<AccessoryId | null>(
    initialAccessoryId ?? null
  );
  const [showArPicker, setShowArPicker] = useState(false);

  const canvasArRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCaptureTimeRef = useRef<number>(0);
  // Face detection is throttled (~12 fps) and its result reused between ticks:
  // running MediaPipe on every animation frame starves WebKit/iPad and freezes
  // the capture + download flow.
  const lastDetectionRef = useRef<number>(0);
  const cachedFacesRef = useRef<Awaited<ReturnType<typeof detectFacesFromVideo>>>([]);

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
      activeAccessoryId !== null
    ) {
      const video = videoRef.current;
      const canvas = canvasArRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx && canvas.width > 0 && canvas.height > 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Detect face landmarks (throttled to ~12 fps)
        const now = performance.now();
        if (now - lastDetectionRef.current > 80) {
          lastDetectionRef.current = now;
          cachedFacesRef.current = detectFacesFromVideo(video, now);
        }

        cachedFacesRef.current.forEach((face) => {
          // Adjust coordinates for canvas size and mirroring
          const x = isMirror ? (1 - face.center.x) * canvas.width : face.center.x * canvas.width;
          const y = face.center.y * canvas.height;
          const rotation = isMirror ? -face.roll : face.roll;

          const placed: PlacedAccessory = {
            id: 'live-ar',
            accessoryId: activeAccessoryId as AccessoryId,
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
  }, [activeAccessoryId, isMirror, videoRef]);

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
      const photo = await capturePhoto(canvasArRef.current);
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
    <div className="relative w-full h-[calc(100vh-65px)] h-[calc(100dvh-65px)] flex flex-col items-center justify-between bg-espresso overflow-hidden select-none">
      {/* Flash overlay */}
      {sessState.flashActive && (
        <div className="absolute inset-0 z-50 bg-paper flash-screen pointer-events-none" />
      )}

      {/* Main Video Viewport */}
      <div className="pb-grain pb-vignette pb-viewfinder pb-glow relative w-full flex-1 overflow-hidden bg-leather-deep">
        {/* Permission Denied / Error view */}
        {camState.permission === 'denied' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 py-4 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-paper mb-2">Accès caméra requis</h3>
            <p className="text-sm text-sand mb-6">
              {camState.error || 'Veuillez autoriser l’accès à la caméra pour démarrer la séance photomaton.'}
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <button
                onClick={() => startStream()}
                className="w-full py-3 px-5 rounded-xl font-semibold bg-brass hover:bg-brass text-ink transition shadow-lg shadow-brass/30"
              >
                Autoriser la caméra
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-leather-soft hover:bg-leather-soft text-paper border border-line cursor-pointer flex items-center justify-center gap-2">
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
          className={`absolute inset-0 h-full w-full object-cover transition-transform ${
            isMirror && camState.facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Real-time AR Canvas for accessories (aviator glasses, etc.) */}
        <canvas
          ref={canvasArRef}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Live theme preview (before shooting) */}
        <div className="absolute top-16 right-3 z-20 flex flex-col items-end gap-1">
          <span className="px-2 py-0.5 rounded-full bg-espresso/60 backdrop-blur-md border border-paper/10 text-[9px] font-bold uppercase tracking-wider text-paper/80">
            Aperçu
          </span>
          <button
            onClick={onOpenThemes}
            title="Modifier le thème"
            aria-label="Aperçu du tirage — modifier le thème"
            className="rounded-lg overflow-hidden border border-paper/20 shadow-lg bg-espresso/40 p-1 backdrop-blur-md active:scale-95 transition"
          >
            <ThemePreview themeId={sessState.themeId} formatId={sessState.formatId} width={66} />
          </button>
        </div>

        {/* AR accessory picker (works with every theme) */}
        <div className="absolute bottom-3 left-0 right-0 z-20 px-3">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowArPicker((v) => !v)}
              aria-label="Accessoires AR"
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border backdrop-blur-md transition ${
                activeAccessoryId
                  ? 'bg-brass/90 text-ink border-brass/40'
                  : 'bg-espresso/50 text-paper/80 border-paper/15'
              }`}
            >
              AR{activeAccessoryId ? ' · on' : ''}
            </button>
            {arTrackingActive ? (
              <span className="px-2 py-1 rounded-full bg-brass/20 border border-brass/30 text-brass-light text-[10px] font-bold">
                suivi visage OK
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-espresso/50 border border-paper/10 text-paper/50 text-[10px] font-bold">
                suivi indisponible
              </span>
            )}
            {activeAccessoryId && (
              <button
                onClick={() => setActiveAccessoryId(null)}
                className="px-2 py-1 rounded-full bg-espresso/50 border border-paper/15 text-paper/70 text-[10px] font-bold"
              >
                retirer
              </button>
            )}
          </div>

          {showArPicker && (
            <div className="grid grid-cols-4 gap-1.5 rounded-xl bg-espresso/60 p-2 backdrop-blur-md border border-paper/10">
              <button
                onClick={() => setActiveAccessoryId(null)}
                title="Aucun accessoire"
                aria-label="Aucun accessoire"
                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition ${
                  activeAccessoryId === null
                    ? 'bg-brass text-ink border-brass/60'
                    : 'bg-leather/70 text-paper/75 border-paper/10 hover:text-paper'
                }`}
              >
                <AccessoryIcon id="none" className="h-4 w-4" />
                <span className="pb-label text-[9px] leading-none">Aucun</span>
              </button>
              {ACCESSORIES_META.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setActiveAccessoryId(acc.id)}
                  title={acc.name}
                  aria-label={acc.name}
                  className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-1.5 transition ${
                    activeAccessoryId === acc.id
                      ? 'bg-brass text-ink border-brass/60'
                      : 'bg-leather/70 text-paper/75 border-paper/10 hover:text-paper'
                  }`}
                >
                  <AccessoryIcon id={acc.id} className="h-4 w-4" />
                  <span className="pb-label text-[9px] leading-none truncate w-full text-center">
                    {ACC_SHORT_LABEL[acc.id] ?? acc.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active Countdown Big Display */}
        {sessState.step === 'countdown' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-espresso/40 backdrop-blur-[2px] transition-all">
            <div className="flex flex-col items-center">
              <div className="text-8xl md:text-9xl font-black text-paper drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-pulse-fast">
                {sessState.countdownSeconds}
              </div>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-brass/80 text-ink font-bold text-sm tracking-wider uppercase">
                Photo {sessState.photos.length + 1} / 4
              </div>
            </div>
          </div>
        )}

        {/* Top Control Bar over video */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
          {/* Progress pill 1/4 to 4/4 */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-espresso/60 backdrop-blur-md border border-paper/10 text-paper text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-brass animate-pulse" />
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
                  ? 'bg-paper/20 text-paper border-paper/30'
                  : 'bg-espresso/40 text-paper/70 border-paper/10 hover:text-paper'
              }`}
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            {/* Switch Camera */}
            <button
              onClick={toggleFacingMode}
              title="Changer de caméra"
              className="p-2.5 rounded-full bg-espresso/40 hover:bg-espresso/60 text-paper backdrop-blur-md border border-paper/10 transition"
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
                      ? 'border-brass bg-leather-soft shadow-md scale-100'
                      : 'border-paper/20 bg-espresso/40 backdrop-blur-sm'
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
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-paper/50 font-bold">
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
      <div className="w-full bg-leather-deep/90 backdrop-blur-md border-t border-line px-6 py-4 pb-safe flex flex-col gap-3">
        {sessState.step === 'idle' ? (
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between max-w-xl mx-auto w-full gap-2.5">
            {/* Timer duration + theme picker (mobile-friendly row) */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2">
              <div className="flex items-center rounded-xl bg-leather p-1 border border-line shrink-0">
                {([3, 5, 10] as const).map((dur) => (
                  <button
                    key={dur}
                    onClick={() => session.setTimerDuration(dur)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      sessState.timerDuration === dur
                        ? 'bg-brass text-ink shadow-sm'
                        : 'text-sand hover:text-paper'
                    }`}
                  >
                    {dur}s
                  </button>
                ))}
              </div>

              <button
                onClick={onOpenThemes}
                aria-label="Choisir un thème"
                title="Choisir un thème"
                className="px-3 py-2 rounded-xl bg-leather hover:bg-leather-soft border border-line text-paper hover:text-paper text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
              >
                <Sparkles className="w-4 h-4 text-brass" />
                <span>Thème</span>
              </button>
            </div>

            {/* Giant Main Start Button — full width on phones, no clipping */}
            <button
              onClick={() => session.start4PhotoSession()}
              className="pb-cta relative group w-full sm:w-auto justify-center px-5 sm:px-8 py-3.5 rounded-full text-ink font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2.5"
            >
              <Camera className="w-5 h-5 shrink-0" />
              <span className="pb-label whitespace-nowrap text-[13px]">Démarrer (4 photos)</span>
            </button>
          </div>
        ) : (
          /* Active session controls (Pause, Resume, Cancel) */
          <div className="flex items-center justify-center gap-4 max-w-md mx-auto w-full">
            <button
              onClick={sessState.isPaused ? session.resumeSession : session.pauseSession}
              className="px-5 py-2.5 rounded-xl bg-leather hover:bg-leather-soft border border-line text-paper font-semibold text-sm flex items-center gap-2 transition"
            >
              {sessState.isPaused ? (
                <>
                  <Play className="w-4 h-4 text-brass-light fill-emerald-400" />
                  <span>Reprendre</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-brass-light" />
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
