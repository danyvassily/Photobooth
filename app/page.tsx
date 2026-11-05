'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePhotoboothSession } from '@/hooks/use-photobooth-session';
import { NavigationBar } from '@/components/ui/navigation-bar';
import { CameraView } from '@/components/camera/camera-view';
import { PhotoboothEditor } from '@/components/editor/photobooth-editor';
import { ThemeSelector } from '@/components/themes/theme-selector';
import { GalleryModal } from '@/components/gallery/gallery-modal';
import { KioskModal } from '@/components/kiosk/kiosk-modal';
import { BenchmarkModal } from '@/components/ui/benchmark-modal';
import { EventKioskSettings, StoredPrint } from '@/types';
import { getAllPrints } from '@/lib/storage';
import { initWasm } from '@/lib/image-processing';

export default function PhotoboothPage() {
  const session = usePhotoboothSession('classic');
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isKioskModalOpen, setIsKioskModalOpen] = useState(false);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  const [galleryCount, setGalleryCount] = useState(0);

  const [kioskSettings, setKioskSettings] = useState<EventKioskSettings>({
    enabled: false,
    eventName: '',
    eventDate: '',
    accentColor: '#ec4899',
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

  // Re-open saved print from gallery into editor
  const handleSelectPrintToReedit = (print: StoredPrint) => {
    session.setTheme(print.themeId);
    session.setFormat(print.formatId);
    // Photos can be mapped if data URLs stored
    setIsGalleryOpen(false);
    session.goToEditor();
  };

  const isEditing = session.state.step === 'reviewing' || session.state.step === 'editing';

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col justify-between overflow-x-hidden font-sans">
      {/* Top Header / Nav */}
      <NavigationBar
        currentThemeId={session.state.themeId}
        onOpenThemes={() => setIsThemeSelectorOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpenKiosk={() => setIsKioskModalOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkModalOpen(true)}
        galleryCount={galleryCount}
      />

      {/* Main Interactive Body */}
      <div className="flex-1 w-full flex flex-col">
        {!isEditing ? (
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
        onStartKioskSession={session.start4PhotoSession}
      />

      <BenchmarkModal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
      />
    </main>
  );
}
