'use client';

import React, { useState } from 'react';
import { X, Monitor, Maximize, Play, Settings } from 'lucide-react';
import { EventKioskSettings, ThemeId } from '@/types';
import { THEME_LIST } from '@/lib/themes';

interface KioskModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EventKioskSettings;
  onUpdateSettings: (settings: EventKioskSettings) => void;
  onStartKioskSession: () => void;
}

export function KioskModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onStartKioskSession,
}: KioskModalProps) {
  const [eventName, setEventName] = useState(settings.eventName);
  const [eventDate, setEventDate] = useState(settings.eventDate);
  const [idleTimeout, setIdleTimeout] = useState(settings.idleTimeoutSeconds);
  const [allowedThemes, setAllowedThemes] = useState<ThemeId[]>(settings.allowedThemes);

  if (!isOpen) return null;

  const toggleTheme = (id: ThemeId) => {
    if (allowedThemes.includes(id)) {
      if (allowedThemes.length > 1) {
        setAllowedThemes(allowedThemes.filter((t) => t !== id));
      }
    } else {
      setAllowedThemes([...allowedThemes, id]);
    }
  };

  const handleLaunchKiosk = () => {
    onUpdateSettings({
      ...settings,
      enabled: true,
      eventName,
      eventDate,
      idleTimeoutSeconds: idleTimeout,
      allowedThemes,
    });

    // Try requesting fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    onClose();
    onStartKioskSession();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mode Borne Événement iPad</h3>
              <p className="text-[11px] text-slate-400">Expérience tactile optimisée pour salon, mariage ou fête</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nom de l’événement
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ex : Mariage de Sophie & Thomas"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Date ou message additionnel
            </label>
            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="Ex : 5 Novembre 2026 • Domaine des Oliviers"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Réinitialisation automatique après inactivité
            </label>
            <select
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={30}>30 secondes</option>
              <option value={60}>60 secondes (Recommandé)</option>
              <option value={90}>90 secondes</option>
              <option value={120}>2 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Thèmes autorisés en borne
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
              {THEME_LIST.map((t) => {
                const checked = allowedThemes.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTheme(t.id)}
                    className={`p-2 rounded-lg border text-left text-xs font-medium transition ${
                      checked
                        ? 'border-indigo-500 bg-indigo-500/20 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
          >
            Annuler
          </button>
          <button
            onClick={handleLaunchKiosk}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-pink-500 hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition active:scale-95"
          >
            <Maximize className="w-4 h-4" />
            <span>Lancer la Borne</span>
          </button>
        </div>
      </div>
    </div>
  );
}
