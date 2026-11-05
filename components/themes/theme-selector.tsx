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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white">{`Choisir un Thème (${visibleThemes.length} Thèmes)`}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {visibleThemes.map((theme) => {
            const isSelected = theme.id === selectedThemeId;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  onSelectTheme(theme.id);
                  onClose();
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500'
                    : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Theme Color Bar Preview */}
                <div
                  className="w-full h-2 rounded-full mb-3"
                  style={{ backgroundColor: theme.backgroundColor, border: `1px solid ${theme.frameBorderColor}` }}
                />

                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-white text-base group-hover:text-pink-300 transition">
                    {theme.name}
                  </span>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center text-white">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {theme.tagline}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Filtre : <strong className="text-slate-300 font-medium capitalize">{theme.defaultFilter}</strong></span>
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
