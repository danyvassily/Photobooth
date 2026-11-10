'use client';

import React, { useEffect, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, Monitor, Cpu, Download } from 'lucide-react';
import { ThemeId } from '@/types';
import { THEMES } from '@/lib/themes';
import { isWasmActive } from '@/lib/image-processing';

interface NavigationBarProps {
  currentThemeId: ThemeId;
  onOpenThemes: () => void;
  onOpenGallery: () => void;
  onOpenKiosk: () => void;
  onOpenBenchmark: () => void;
  galleryCount: number;
}

export function NavigationBar({
  currentThemeId,
  onOpenThemes,
  onOpenGallery,
  onOpenKiosk,
  onOpenBenchmark,
  galleryCount,
}: NavigationBarProps) {
  const [wasmAvailable, setWasmAvailable] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<unknown>(null);

  useEffect(() => {
    setWasmAvailable(isWasmActive());
    const interval = setInterval(() => {
      setWasmAvailable(isWasmActive());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt as { prompt: () => void; userChoice: Promise<{ outcome: string }> };
    prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') {
      setCanInstall(false);
    }
  };

  const currentTheme = THEMES[currentThemeId];

  return (
    <header className="pb-grain sticky top-0 z-40 w-full backdrop-blur-md bg-leather-deep/70 border-b border-line/80 px-4 py-2.5 pt-safe flex items-center justify-between transition-all">
      {/* Brand & Theme badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold tracking-tight text-paper text-lg">
          <div className="pb-plate w-8 h-8 rounded-full flex items-center justify-center">
            <Camera className="w-4 h-4 text-ink" />
          </div>
          <span className="pb-engraved text-base sm:text-lg text-paper">Photobooth</span>
        </div>

        {/* Current Theme Pill Button */}
        <button
          onClick={onOpenThemes}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-leather-soft/90 [@media(hover:hover)]:hover:bg-leather-soft text-paper border border-line transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-brass" />
          <span className="pb-label text-[10px]">{currentTheme.name}</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* WASM engine indicator & benchmark launcher */}
        <button
          onClick={onOpenBenchmark}
          title="Moteur de traitement (Rust/WASM ou JS)"
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition ${
            wasmAvailable
              ? 'bg-espresso/40 text-brass-light border-brass-dark/50 [@media(hover:hover)]:hover:bg-espresso/40'
              : 'bg-espresso/40 text-brass-light border-brass-dark/50 [@media(hover:hover)]:hover:bg-espresso/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{wasmAvailable ? 'WASM Rust' : 'JS Fallback'}</span>
        </button>

        {/* PWA Install Button */}
        {canInstall && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-brass-light to-brass-dark text-ink shadow-md [@media(hover:hover)]:hover:opacity-90 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Installer</span>
          </button>
        )}

        {/* Kiosk Mode iPad */}
        <button
          onClick={onOpenKiosk}
          title="Mode Borne Événement iPad"
          aria-label="Mode Borne Événement iPad"
          className="p-2 rounded-xl text-paper [@media(hover:hover)]:hover:text-paper [@media(hover:hover)]:hover:bg-leather-soft border border-line transition"
        >
          <Monitor className="w-4 h-4" />
        </button>

        {/* Gallery Button with Counter */}
        <button
          onClick={onOpenGallery}
          title="Galerie locale"
          aria-label="Galerie locale"
          className="relative p-2 rounded-xl text-paper [@media(hover:hover)]:hover:text-paper [@media(hover:hover)]:hover:bg-leather-soft border border-line transition"
        >
          <ImageIcon className="w-4 h-4" />
          {galleryCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brass text-ink leading-none">
              {galleryCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
