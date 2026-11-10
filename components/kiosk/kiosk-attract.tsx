'use client';

import React from 'react';

interface KioskAttractProps {
  eventName?: string;
  eventDate?: string;
  idleTimeoutSeconds: number;
  onStart: () => void;
  onExit: () => void;
  onOpenThemes: () => void;
}

/**
 * Écran attract du mode borne : plein écran, typographie gravée, obturateur en
 * laiton. Affiché tant que la séance n'a pas démarré.
 */
export function KioskAttract({
  eventName,
  eventDate,
  idleTimeoutSeconds,
  onStart,
  onExit,
  onOpenThemes,
}: KioskAttractProps) {
  return (
    <div className="pb-grain relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden bg-espresso px-6 py-10 text-center">
      {/* halo chaud derrière l'obturateur */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8a6b2e 0%, transparent 70%)' }}
        aria-hidden
      />

      <p className="pb-label relative z-10 text-[10px] text-brass">Mode borne · plein écran</p>

      <h1 className="pb-engraved relative z-10 mt-4 text-4xl font-bold text-paper sm:text-5xl">
        {eventName?.trim() || 'Photobooth'}
      </h1>

      {eventDate?.trim() ? (
        <p className="relative z-10 mt-3 font-serif text-lg italic text-brass-light">{eventDate}</p>
      ) : null}

      <span className="relative z-10 mt-5 h-px w-24 bg-line" aria-hidden />

      <button
        onClick={onStart}
        aria-label="Commencer la séance photo"
        className="pb-shutter relative z-10 mt-10 flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full border-2 border-brass-dark text-ink transition active:scale-[0.98] sm:h-52 sm:w-52"
      >
        <span className="pb-label text-[11px] font-bold">Commencer</span>
        <span className="pb-label text-[9px] opacity-80">4 poses</span>
      </button>

      <p className="pb-label relative z-10 mt-8 text-[10px] text-paper/80">Touchez pour commencer</p>

      {/* 4 emplacements de la bande à venir */}
      <div className="relative z-10 mt-8 flex items-end gap-2.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex h-16 w-12 items-center justify-center rounded-sm border border-line bg-leather-deep"
          >
            <span className="font-serif text-lg text-line">{i + 1}</span>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-8 flex flex-col items-center gap-2">
        <p className="pb-label text-[9px] text-sand">
          Retour automatique après {idleTimeoutSeconds} s d&apos;inactivité
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenThemes}
            aria-label="Choisir un thème"
            className="pb-label rounded-full border border-brass-dark px-3 py-1 text-[9px] text-brass transition [@media(hover:hover)]:hover:text-brass-light"
          >
            Thème
          </button>
        </div>
      </div>
    </div>
  );
}
