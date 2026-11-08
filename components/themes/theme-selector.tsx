'use client';

import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { ThemeId } from '@/types';
import { THEME_LIST } from '@/lib/themes';

interface ThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedThemeId: ThemeId;
  onSelectTheme: (id: ThemeId) => void;
  /** When set (kiosk / event mode) only these themes are selectable. */
  allowedThemeIds?: ThemeId[];
}

export function ThemeSelector({
  isOpen,
  onClose,
  selectedThemeId,
  onSelectTheme,
  allowedThemeIds,
}: ThemeSelectorProps) {
  if (!isOpen) return null;

  const visibleThemes = allowedThemeIds
    ? THEME_LIST.filter((theme) => allowedThemeIds.includes(theme.id))
    : THEME_LIST;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-espresso/70 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="pb-grain relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-leather border border-line rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brass" />
            <h2 className="pb-engraved text-lg font-bold text-paper">{`Choisir un Thème (${visibleThemes.length} Thèmes)`}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-leather-soft text-sand hover:text-paper transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 auto-rows-min content-start gap-3.5">
          {visibleThemes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`flex shrink-0 flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-brass bg-brass/10 shadow-lg shadow-brass/10 ring-1 ring-brass'
                    : 'border-line bg-leather-soft/50 hover:bg-leather-soft hover:border-line'
                }`}
              >
                {/* Theme Color Bar Preview */}
                <div
                  className="w-full h-3 rounded-sm mb-3 shadow-sm"
                  style={{ backgroundColor: theme.backgroundColor, border: `1px solid ${theme.frameBorderColor}` }}
                />

                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-paper text-base group-hover:text-brass transition">
                    {theme.name}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-brass flex items-center justify-center text-ink">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-sand leading-relaxed">
                  {theme.tagline}
                </p>

                <div className="mt-3 pt-2.5 border-t border-line/80 flex items-center justify-between text-[11px] text-sand">
                  <span>Filtre : <strong className="text-paper font-medium capitalize">{theme.defaultFilter}</strong></span>
                  <span className="capitalize">{theme.defaultFormat.replace('-', ' ')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
