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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-leather-deep border border-line rounded-2xl flex flex-col shadow-2xl overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brass-dark/10 border border-brass-dark/20 flex items-center justify-center text-brass-light">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-paper">Mode Borne Événement iPad</h3>
              <p className="text-[11px] text-sand">Expérience tactile optimisée pour salon, mariage ou fête</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-leather-soft text-sand hover:text-paper transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Form */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-xs font-bold text-paper mb-1">
              Nom de l’événement
            </label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Ex : Mariage de Sophie & Thomas"
              className="w-full px-3.5 py-2.5 rounded-xl bg-leather border border-line text-base text-paper placeholder-sand focus:outline-none focus:border-brass-dark transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-paper mb-1">
              Date ou message additionnel
            </label>
            <input
              type="text"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              placeholder="Ex : 5 Novembre 2026 • Domaine des Oliviers"
              className="w-full px-3.5 py-2.5 rounded-xl bg-leather border border-line text-base text-paper placeholder-sand focus:outline-none focus:border-brass-dark transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-paper mb-1">
              Réinitialisation automatique après inactivité
            </label>
            <select
              value={idleTimeout}
              onChange={(e) => setIdleTimeout(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-leather border border-line text-base text-paper focus:outline-none focus:border-brass-dark"
            >
              <option value={30}>30 secondes</option>
              <option value={60}>60 secondes (Recommandé)</option>
              <option value={90}>90 secondes</option>
              <option value={120}>2 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-paper mb-2">
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
                        ? 'border-brass-dark bg-brass-dark/20 text-ink'
                        : 'border-line bg-leather text-sand'
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
        <div className="p-4 border-t border-line bg-leather/60 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-leather-soft hover:bg-leather-soft text-paper text-xs font-bold transition"
          >
            Annuler
          </button>
          <button
            onClick={handleLaunchKiosk}
            className="pb-cta flex-1 py-3 rounded-xl text-ink text-xs font-bold flex items-center justify-center gap-2"
          >
            <Maximize className="w-4 h-4" />
            <span>Lancer la Borne</span>
          </button>
        </div>
      </div>
    </div>
  );
}
