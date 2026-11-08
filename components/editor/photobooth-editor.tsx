'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Download,
  Share2,
  Sliders,
  Sparkles,
  Layers,
  Palette,
  RefreshCw,
  Camera,
  Check,
  Undo2,
  Smile,
  Type,
  ChevronLeft,
} from 'lucide-react';
import {
  AccessoryId,
  ColorStudioBackground,
  FilterPresetId,
  FormatId,
  ImageAdjustments,
  PhotoCapture,
  PlacedAccessory,
  StoredPrint,
  ThemeId,
} from '@/types';
import { THEMES, THEME_LIST } from '@/lib/themes';
import { FORMATS, FORMAT_LIST } from '@/lib/formats';
import { composePrint, ComposeResult } from '@/lib/export/composer';
import { buildPrintFilename } from '@/lib/export/filename';
import { ACCESSORIES_META } from '@/lib/accessories/renderer';
import { createThumbnail } from '@/lib/images/thumbnail';
import { savePrint } from '@/lib/storage';

interface PhotoboothEditorProps {
  photos: PhotoCapture[];
  initialThemeId: ThemeId;
  initialFormatId: FormatId;
  initialAdjustments?: ImageAdjustments;
  initialAccessories?: PlacedAccessory[];
  initialCustomText?: string;
  initialColorStudioBg?: ColorStudioBackground;
  onBackToCamera: () => void;
  onRetakePhoto: (index: number) => void;
  onSavedToGallery: () => void;
}

export function PhotoboothEditor({
  photos,
  initialThemeId,
  initialFormatId,
  initialAdjustments,
  initialAccessories,
  initialCustomText,
  initialColorStudioBg,
  onBackToCamera,
  onRetakePhoto,
  onSavedToGallery,
}: PhotoboothEditorProps) {
  const [themeId, setThemeId] = useState<ThemeId>(initialThemeId);
  const [formatId, setFormatId] = useState<FormatId>(initialFormatId);
  const [activeTab, setActiveTab] = useState<'themes' | 'formats' | 'filters' | 'adjust' | 'accessories' | 'text'>('themes');

  const baselineAdjustments = initialAdjustments ?? {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    sepia: 0,
    grayscale: false,
    vignette: 0,
    grain: 0,
    filterPreset: THEMES[initialThemeId].defaultFilter,
  };

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(baselineAdjustments);

  const [accessories, setAccessories] = useState<PlacedAccessory[]>(initialAccessories ?? []);
  const [customText, setCustomText] = useState<string>(initialCustomText ?? '');
  const [colorStudioBg, setColorStudioBg] = useState<ColorStudioBackground>(
    initialColorStudioBg ?? {
      type: 'solid',
      primaryColor: '#3b82f6',
    }
  );

  const [compositeResult, setCompositeResult] = useState<ComposeResult | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [exportQuality, setExportQuality] = useState<number>(0.94);
  const [isSaved, setIsSaved] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Restore a print loaded from the gallery (originals + previous settings).
  useEffect(() => {
    setAdjustments(initialAdjustments ?? {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      sepia: 0,
      grayscale: false,
      vignette: 0,
      grain: 0,
      filterPreset: THEMES[initialThemeId].defaultFilter,
    });
    setAccessories(initialAccessories ?? []);
    setCustomText(initialCustomText ?? '');
    setColorStudioBg(initialColorStudioBg ?? { type: 'solid', primaryColor: '#3b82f6' });
  }, [initialAdjustments, initialAccessories, initialCustomText, initialColorStudioBg, initialThemeId]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update composition preview
  const refreshPreview = useCallback(async () => {
    setIsComposing(true);
    try {
      const res = await composePrint({
        photos,
        theme: THEMES[themeId],
        format: FORMATS[formatId],
        adjustments,
        accessories,
        customText,
        colorStudioBg,
        segmentationEnabled: themeId === 'color-studio',
        quality: exportQuality,
      });
      setCompositeResult(res);
    } catch (e) {
      console.error('Composition preview error:', e);
    } finally {
      setIsComposing(false);
    }
  }, [photos, themeId, formatId, adjustments, accessories, customText, colorStudioBg, exportQuality]);

  // Debounce preview updates when sliders change
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      refreshPreview();
    }, 150);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [refreshPreview]);

  // Handle Preset Filter click
  const handleSelectFilter = (preset: FilterPresetId) => {
    setAdjustments((prev) => ({
      ...prev,
      filterPreset: preset,
      grayscale: preset === 'black-and-white',
    }));
  };

  // Add / remove accessory
  const toggleAccessory = (accId: AccessoryId) => {
    const existing = accessories.find((a) => a.accessoryId === accId);
    if (existing) {
      setAccessories(accessories.filter((a) => a.accessoryId !== accId));
    } else {
      setAccessories([
        ...accessories,
        {
          id: 'acc-' + Date.now(),
          accessoryId: accId,
          x: 0.5,
          y: accId.includes('sunglasses') || accId.includes('visor') ? 0.38 : 0.22,
          scale: 1,
          rotation: 0,
        },
      ]);
    }
  };

  // Save to IndexedDB
  const handleSaveToGallery = async () => {
    if (!compositeResult) return;
    setSaveError(null);
    try {
      // WebKit can stall on large canvas decodes: never let the thumbnail
      // generation block the export / persistence flow.
      const thumbnailUrl =
        (await Promise.race([
          createThumbnail(compositeResult.dataUrl),
          new Promise<string>((resolve) => setTimeout(() => resolve(''), 8000)),
        ])) || compositeResult.dataUrl;
      const stored: StoredPrint = {
        id: 'print-' + Date.now(),
        createdAt: Date.now(),
        themeId,
        formatId,
        jpegBlob: compositeResult.blob,
        thumbnailUrl,
        originalPhotos: photos.map((p) => p.blob),
        adjustments,
        placedAccessories: accessories,
        customText,
        colorStudioBg: themeId === 'color-studio' ? colorStudioBg : undefined,
      };
      await savePrint(stored);
      setIsSaved(true);
      onSavedToGallery();
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save print to gallery:', err);
      setSaveError(
        err instanceof DOMException && err.name === 'QuotaExceededError'
          ? "Stockage local plein : supprimez d'anciens tirages dans la galerie."
          : "Impossible d'enregistrer le tirage dans la galerie locale."
      );
    }
  };

  // Download JPEG directly (saves to the gallery first, so the local copy is
  // guaranteed even when the browser's download flow interrupts JS execution —
  // observed on WebKit / Safari).
  const handleDownloadJpeg = async () => {
    if (!compositeResult) return;

    const filename = buildPrintFilename();
    const objectUrl = URL.createObjectURL(compositeResult.blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    // Persist after the download has been handed to the browser.
    try {
      await handleSaveToGallery();
    } catch {
      /* storage errors are already surfaced through saveError */
    }
  };

  // Native Web Share
  const handleShare = async () => {
    if (!compositeResult) return;
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([compositeResult.blob], buildPrintFilename(), { type: 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Mon tirage Photobooth V3',
            text: 'Tirage réalisé avec Photobooth V3',
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
          await handleSaveToGallery();
          return;
        }
      } catch (err) {
        console.warn('Native share cancelled or failed, falling back to download:', err);
      }
    }
    // Fallback: download
    await handleDownloadJpeg();
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-65px)] min-h-[calc(100dvh-65px)] flex flex-col lg:flex-row bg-leather-deep text-paper select-none">
      {/* Left/Center: High-Fidelity Print Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-leather/60 overflow-y-auto">
        <div className="relative flex items-center justify-center max-w-full max-h-[75vh]">
          {compositeResult ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={compositeResult.dataUrl}
              alt="Prévisualisation du tirage"
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl border border-line transition-all"
            />
          ) : (
            <div className="w-64 h-96 rounded-xl bg-leather-soft/80 animate-pulse flex items-center justify-center text-sand">
              Génération du tirage...
            </div>
          )}

          {isComposing && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-espresso/70 backdrop-blur-md text-xs font-semibold text-brass border border-brass/30 flex items-center gap-1.5 shadow-lg">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Rendu en cours</span>
            </div>
          )}
        </div>

        {/* Action bar below preview */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={() => void handleDownloadJpeg()}
            className="flex-1 py-3 px-5 rounded-xl font-bold bg-gradient-to-r from-brass-light to-brass-dark hover:opacity-95 text-ink flex items-center justify-center gap-2 shadow-lg shadow-brass/25 transition active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Enregistrer JPEG</span>
          </button>

          <button
            onClick={handleShare}
            className="py-3 px-5 rounded-xl font-semibold bg-leather-soft hover:bg-leather-soft text-paper border border-line flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Share2 className="w-4 h-4 text-brass" />
            <span>Partager</span>
          </button>

          <button
            onClick={onBackToCamera}
            className="p-3 rounded-xl bg-leather-soft hover:bg-leather-soft text-paper hover:text-paper border border-line transition"
            title="Reprendre une séance"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {isSaved && (
          <div className="mt-3 px-4 py-1.5 rounded-full bg-espresso/80 border border-brass-dark text-brass-light text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
            <Check className="w-3.5 h-3.5" />
            <span>Tirage enregistré dans la galerie locale !</span>
          </div>
        )}

        {saveError && (
          <div className="mt-3 px-4 py-1.5 rounded-full bg-espresso/80 border border-brass-dark text-brass text-xs font-semibold">
            {saveError}
          </div>
        )}
      </div>

      {/* Right / Bottom Drawer: Comprehensive Editing Controls */}
      <div className="w-full lg:w-[420px] bg-leather-deep border-t lg:border-t-0 lg:border-l border-line flex flex-col max-h-[50vh] lg:max-h-[calc(100vh-65px)] overflow-hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-line px-3 py-2 overflow-x-auto gap-1">
          {[
            { id: 'themes', label: 'Thème', icon: Sparkles },
            { id: 'formats', label: 'Format', icon: Layers },
            { id: 'filters', label: 'Filtres', icon: Palette },
            { id: 'adjust', label: 'Réglages', icon: Sliders },
            { id: 'accessories', label: 'AR & Fun', icon: Smile },
            { id: 'text', label: 'Texte', icon: Type },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-brass text-ink shadow-md shadow-brass/20'
                    : 'text-sand hover:text-paper hover:bg-leather'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Choisir parmi les 12 thèmes
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {THEME_LIST.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setThemeId(t.id);
                      setAdjustments((prev) => ({ ...prev, filterPreset: t.defaultFilter }));
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      themeId === t.id
                        ? 'border-brass bg-brass/15 text-ink ring-1 ring-brass'
                        : 'border-line bg-leather/60 hover:bg-leather text-paper'
                    }`}
                  >
                    <div
                      className="w-full h-1.5 rounded-full mb-2"
                      style={{ backgroundColor: t.backgroundColor, border: `1px solid ${t.frameBorderColor}` }}
                    />
                    <div className="font-bold text-xs">{t.name}</div>
                    <div className="text-[10px] text-sand truncate">{t.tagline}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: FORMATS */}
          {activeTab === 'formats' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Gabarits de Tirage (6 Formats)
              </h4>
              <div className="space-y-2">
                {FORMAT_LIST.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormatId(f.id)}
                    className={`w-full p-3.5 rounded-xl border flex items-center justify-between text-left transition ${
                      formatId === f.id
                        ? 'border-brass bg-brass/15 text-ink ring-1 ring-brass'
                        : 'border-line bg-leather/60 hover:bg-leather text-paper'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{f.name}</div>
                      <div className="text-[10px] text-sand">
                        {f.canvasWidth} × {f.canvasHeight} px
                      </div>
                    </div>
                    {formatId === f.id && <Check className="w-4 h-4 text-brass" />}
                  </button>
                ))}
              </div>

              {/* Retake individual photo option */}
              <div className="pt-4 border-t border-line">
                <h5 className="text-xs font-bold text-sand mb-2">Reprendre une photo individuelle</h5>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => onRetakePhoto(idx)}
                      className="p-2 rounded-lg bg-leather hover:bg-leather-soft border border-line text-xs font-medium text-paper hover:text-paper flex flex-col items-center gap-1 transition"
                    >
                      <span>Photo {idx + 1}</span>
                      <RefreshCw className="w-3 h-3 text-brass" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FILTERS */}
          {activeTab === 'filters' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Filtres Photographiques (11 Presets)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'natural', label: 'Naturel' },
                  { id: 'black-and-white', label: 'Noir & Blanc' },
                  { id: 'vintage', label: 'Vintage 70s' },
                  { id: 'sepia', label: 'Sépia Authentique' },
                  { id: 'film-grain', label: 'Grain Pellicule' },
                  { id: 'warm', label: 'Tons Chauds' },
                  { id: 'cool', label: 'Tons Froids' },
                  { id: 'soft', label: 'Rêveur / Flou Doux' },
                  { id: 'high-contrast', label: 'Haut Contraste' },
                  { id: 'faded', label: 'Délavé' },
                  { id: 'cinematic', label: 'Teal & Orange' },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    onClick={() => handleSelectFilter(flt.id as FilterPresetId)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition ${
                      adjustments.filterPreset === flt.id
                        ? 'border-brass bg-brass/20 text-brass'
                        : 'border-line bg-leather/60 hover:bg-leather text-paper'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADJUSTMENTS */}
          {activeTab === 'adjust' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                  Réglages Pixels Précis
                </h4>
                <button
                  onClick={() =>
                    setAdjustments({
                      brightness: 0,
                      contrast: 0,
                      saturation: 0,
                      temperature: 0,
                      sepia: 0,
                      grayscale: false,
                      vignette: 0,
                      grain: 0,
                      filterPreset: 'natural',
                    })
                  }
                  className="text-[11px] text-brass hover:text-brass flex items-center gap-1"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              </div>

              {/* Sliders */}
              {[
                { label: 'Luminosité', key: 'brightness', min: -100, max: 100 },
                { label: 'Contraste', key: 'contrast', min: -100, max: 100 },
                { label: 'Saturation', key: 'saturation', min: -100, max: 100 },
                { label: 'Température', key: 'temperature', min: -100, max: 100 },
                { label: 'Vignettage', key: 'vignette', min: 0, max: 100 },
                { label: 'Grain Argentique', key: 'grain', min: 0, max: 100 },
              ].map((slider) => (
                <div key={slider.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-paper">{slider.label}</span>
                    <span className="text-sand font-mono">
                      {adjustments[slider.key as keyof ImageAdjustments]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={slider.min}
                    max={slider.max}
                    value={adjustments[slider.key as keyof ImageAdjustments] as number}
                    onChange={(e) =>
                      setAdjustments({
                        ...adjustments,
                        [slider.key]: Number(e.target.value),
                      })
                    }
                    className="pb-slider w-full accent-brass cursor-pointer h-2 rounded-full bg-espresso"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: AR & ACCESSORIES */}
          {activeTab === 'accessories' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Accessoires Virtuels (Lunettes Aviateur, etc.)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES_META.map((acc) => {
                  const isActive = accessories.some((a) => a.accessoryId === acc.id);
                  return (
                    <button
                      key={acc.id}
                      onClick={() => toggleAccessory(acc.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                        isActive
                          ? 'border-brass bg-brass/20 text-ink'
                          : 'border-line bg-leather/60 hover:bg-leather text-paper'
                      }`}
                    >
                      <span className="text-xl">{acc.icon}</span>
                      <span className="text-xs font-bold truncate">{acc.name}</span>
                    </button>
                  );
                })}
              </div>

              {themeId === 'color-studio' && (
                <div className="pt-4 border-t border-line space-y-3">
                  <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                    Fond Color Studio
                  </h4>
                  <div className="flex items-center gap-2">
                    {['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setColorStudioBg({ type: 'solid', primaryColor: c })}
                        className="w-7 h-7 rounded-full border border-paper/20 hover:scale-110 transition"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={colorStudioBg.primaryColor}
                      onChange={(e) => setColorStudioBg({ type: 'solid', primaryColor: e.target.value })}
                      className="w-7 h-7 rounded-full cursor-pointer bg-transparent border-0"
                    />
                  </div>

                  <div>
                    <div className="text-[11px] font-semibold text-sand mb-1.5">
                      Couleur par photo (segmentation locale)
                    </div>
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3].map((index) => {
                        const colors = colorStudioBg.perPhotoColors ?? [];
                        const value = colors[index] ?? colorStudioBg.primaryColor;
                        return (
                          <input
                            key={index}
                            type="color"
                            aria-label={`Couleur photo ${index + 1}`}
                            value={value}
                            onChange={(e) => {
                              const next = [...colors];
                              next[index] = e.target.value;
                              setColorStudioBg({ ...colorStudioBg, perPhotoColors: next });
                            }}
                            className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-line"
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TEXT & CAPTION */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-sand uppercase tracking-wider">
                Légende & Message Personnalisé
              </h4>
              <input
                type="text"
                placeholder="Ex : Dany & ses amis • Paris 2026"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={45}
                className="w-full px-4 py-2.5 rounded-xl bg-leather border border-line text-sm text-paper placeholder-sand focus:outline-none focus:border-brass transition"
              />
              <p className="text-[11px] text-sand">
                Ce texte apparaîtra imprimé avec élégance dans le pied de page du tirage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
