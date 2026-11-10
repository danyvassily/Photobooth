'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { usePhotoboothSession } from '@/hooks/use-photobooth-session';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { CameraView } from '@/components/camera/camera-view';
import { PhotoboothEditor } from '@/components/editor/photobooth-editor';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { GalleryModal } from '@/components/gallery/gallery-modal';
import { KioskModal } from '@/components/kiosk/kiosk-modal';
import { KioskAttract } from '@/components/kiosk/kiosk-attract';
import { BenchmarkModal } from '@/components/ui/benchmark-modal';
import { EventKioskSettings, StoredPrint } from '@/types';
import { getAllPrints } from '@/lib/storage';
import { initWasm } from '@/lib/image-processing';

/** Reads a Blob as a DataURL. */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read photo blob'));
    reader.readAsDataURL(blob);
  });
}

/** Resolves the intrinsic pixel size of an image DataURL. */
function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

export default function PhotoboothPage() {
  const session = usePhotoboothSession('classic');
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);
  const [isKioskActive, setIsKioskActive] = useState(false);

  const [galleryCount, setGalleryCount] = useState(0);

  const [kioskSettings, setKioskSettings] = useState<EventKioskSettings>({
    enabled: false,
    eventName: '',
    eventDate: '',
    accentColor: '#C9A227',
    idleTimeoutSeconds: 60,
    allowedThemes: ['classic', 'vintage', 'korean-life4cuts', 'party', 'fun-ar'],
  });

  // Try initializing WASM on start
  useEffect(() => {
    initWasm().catch(() => {});
  }, []);

  // Sync gallery count
  const refreshGalleryCount = useCallback(async () => {
    try {
      const list = await getAllPrints();
      setGalleryCount(list.length);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    refreshGalleryCount();
  }, [refreshGalleryCount]);

  // Handle retaking an individual photo from editor
  const handleRetakePhotoFromEditor = (index: number) => {
    session.retakeSinglePhoto(index);
  };

  // Re-open a saved print from the gallery, restoring originals + settings.
  const handleSelectPrintToReedit = async (print: StoredPrint) => {
    setIsGalleryOpen(false);
    try {
      const photos = await Promise.all(
        print.originalPhotos.map(async (blob, index) => {
          const dataUrl = await blobToDataUrl(blob);
          const { width, height } = await imageSize(dataUrl);
          return { blob, dataUrl, width, height, index };
        })
      );

      if (photos.length > 0) {
        session.loadPrintIntoSession(photos, {
          themeId: print.themeId,
          formatId: print.formatId,
          adjustments: print.adjustments,
          accessories: print.placedAccessories,
          customText: print.customText,
          colorStudioBg: print.colorStudioBg,
        });
        return;
      }
    } catch (err) {
      console.warn('Unable to restore the stored photos, opening the editor with the print settings:', err);
    }

    // Fallback: keep the look of the print even if the originals are unreadable.
    session.setTheme(print.themeId);
    session.setFormat(print.formatId);
    session.goToEditor();
  };

  // Kiosk / event mode: start a session, request fullscreen, auto-reset on idle.
  const resetSessionRef = useRef(session.resetToNewSession);
  resetSessionRef.current = session.resetToNewSession;

  // Lancement de la borne : on affiche l'écran attract, la séance part au premier tap.
  const handleStartKiosk = () => {
    setIsKioskActive(true);
    session.resetToNewSession();
  };

  const handleKioskShoot = () => {
    session.start4PhotoSession();
  };

  const exitKiosk = useCallback(() => {
    setIsKioskActive(false);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    resetSessionRef.current();
  }, []);

  useEffect(() => {
    if (!isKioskActive) return;
    const timeoutMs = Math.max(5, kioskSettings.idleTimeoutSeconds) * 1000;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // No interaction for the configured delay: back to the attract screen.
        resetSessionRef.current();
      }, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((eventName) => window.addEventListener(eventName, arm, { passive: true }));
    arm();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((eventName) => window.removeEventListener(eventName, arm));
    };
  }, [isKioskActive, kioskSettings.idleTimeoutSeconds]);

  const isEditing = session.state.step === 'reviewing' || session.state.step === 'editing';

  return (
    <main className="pb-grain relative mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-between overflow-x-hidden bg-leather-deep font-sans text-paper lg:border-x lg:border-line">
      {/* Top Header / Nav */}
      <NavigationBar
        currentThemeId={session.state.themeId}
        onOpenThemes={() => setIsThemeSelectorOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenKiosk={() => setIsKioskModalOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkModalOpen(true)}
        galleryCount={galleryCount}
      />

      {isKioskActive && (
        <div
          className="pb-label w-full px-4 py-2 text-center text-[10px] font-semibold flex items-center justify-center gap-3 text-ink"
          style={{ backgroundColor: kioskSettings.accentColor }}
        >
          <span>
            BORNE ÉVÉNEMENT{kioskSettings.eventName ? ` — ${kioskSettings.eventName}` : ''}
            {kioskSettings.eventDate ? ` · ${kioskSettings.eventDate}` : ''}
          </span>
          <button
            onClick={exitKiosk}
            className="underline underline-offset-2 [@media(hover:hover)]:hover:opacity-80"
            aria-label="Quitter le mode borne"
          >
            Quitter la borne
          </button>
        </div>
      )}

      {/* Main Interactive Body */}
      <div className="flex-1 w-full flex flex-col">
        {isKioskActive && !isEditing && session.state.step === 'idle' ? (
          <KioskAttract
            eventName={kioskSettings.eventName}
            eventDate={kioskSettings.eventDate}
            idleTimeoutSeconds={kioskSettings.idleTimeoutSeconds}
            onStart={handleKioskShoot}
            onExit={exitKiosk}
            onOpenThemes={() => setIsThemeSelectorOpen(true)}
          />
        ) : !isEditing ? (
          <CameraView
            session={session}
            onPhotosReady={session.goToEditor}
            onOpenThemes={() => setIsThemeSelectorOpen(true)}
          />
        ) : (
          <PhotoboothEditor
            photos={session.state.photos}
            initialThemeId={session.state.themeId}
            initialFormatId={session.state.formatId}
            initialAdjustments={session.state.restoredAdjustments}
            initialAccessories={session.state.restoredAccessories}
            initialCustomText={session.state.restoredCustomText}
            initialColorStudioBg={session.state.restoredColorStudioBg}
            onBackToCamera={session.resetToNewSession}
            onRetakePhoto={handleRetakePhotoFromEditor}
            onSavedToGallery={refreshGalleryCount}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <ThemeSelector
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
        selectedThemeId={session.state.themeId}
        onSelectTheme={session.setTheme}
        allowedThemeIds={isKioskActive ? kioskSettings.allowedThemes : undefined}
      />

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelectPrintToReedit={handleSelectPrintToReedit}
      />

      <KioskModal
        isOpen={isKioskModalOpen}
        onClose={() => setIsKioskModalOpen(false)}
        settings={kioskSettings}
        onUpdateSettings={setKioskSettings}
        onStartKioskSession={handleStartKiosk}
      />

      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </main>
  );
}
