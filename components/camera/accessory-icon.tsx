'use client';

import React from 'react';

/**
 * Icônes d'accessoires dessinées en SVG (aucun emoji) pour rester dans la
 * direction artistique « appareil argentique » : traits fins, couleur héritée.
 */
export function AccessoryIcon({ id, className = 'w-5 h-5' }: { id: string; className?: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  if (id === 'none') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path d="M7 17 17 7" />
      </svg>
    );
  }

  if (id === 'round-retro-sunglasses') {
    return (
      <svg {...common}>
        <circle cx="7.5" cy="13" r="4" />
        <circle cx="16.5" cy="13" r="4" />
        <path d="M11.5 13h1M3.5 11 6 9M20.5 11 18 9" />
      </svg>
    );
  }

  if (id === 'wayfarer-sunglasses') {
    return (
      <svg {...common}>
        <path d="M3 10h6l1.5 3.5a3 3 0 0 1-2.8 4H6.2a3 3 0 0 1-2.9-2.2L2.6 12A3 3 0 0 1 3 10Z" />
        <path d="M21 10h-6l-1.5 3.5a3 3 0 0 0 2.8 4h1.5a3 3 0 0 0 2.9-2.2L21.4 12A3 3 0 0 1 21 10Z" />
        <path d="M9 11.5h6" />
      </svg>
    );
  }

  if (id === 'heart-sunglasses') {
    return (
      <svg {...common}>
        <path d="M7.5 9c-2 0-3.5 1.4-3.5 3 0 2 3.5 4.5 3.5 4.5S11 14 11 12c0-1.6-1.5-3-3.5-3Z" />
        <path d="M16.5 9c-2 0-3.5 1.4-3.5 3 0 2 3.5 4.5 3.5 4.5S20 14 20 12c0-1.6-1.5-3-3.5-3Z" />
        <path d="M11 11h2" />
      </svg>
    );
  }

  if (id === 'futuristic-visor') {
    return (
      <svg {...common}>
        <path d="M2 11c2.5-3 6.5-4.5 10-4.5S19.5 8 22 11v3.5a1.5 1.5 0 0 1-1.5 1.5H3.5A1.5 1.5 0 0 1 2 14.5V11Z" />
        <path d="M6 11.5h12" />
      </svg>
    );
  }

  if (id === 'cowboy-hat' || id === 'party-hat') {
    return (
      <svg {...common}>
        <path d="M7 15 10 5h4l3 10" />
        <path d="M3 16c3 1.6 15 1.6 18 0" />
        <path d="M9.5 10.5h5" />
      </svg>
    );
  }

  if (id === 'crown') {
    return (
      <svg {...common}>
        <path d="M4 17 2.5 7l5 3.5L12 5l4.5 5.5 5-3.5L20 17Z" />
        <path d="M4 17h16" />
      </svg>
    );
  }

  if (id === 'mustache') {
    return (
      <svg {...common}>
        <path d="M12 12c-1.6-2.6-4-3.6-6.4-2.4C3.6 10.8 3 13 4.4 14.2c1.8 1.5 4.8.6 7.6-2.2Z" />
        <path d="M12 12c1.6-2.6 4-3.6 6.4-2.4 2 1.2 2.6 3.4 1.2 4.6-1.8 1.5-4.8.6-7.6-2.2Z" />
      </svg>
    );
  }

  if (id === 'cat-ears') {
    return (
      <svg {...common}>
        <path d="M4 16V7l5 3M20 16V7l-5 3" />
        <path d="M9 12h6" />
      </svg>
    );
  }

  if (id === 'wig') {
    return (
      <svg {...common}>
        <path d="M4 15V12a8 8 0 0 1 16 0v3" />
        <path d="M4 15c0 2 1.5 3 3 3M20 15c0 2-1.5 3-3 3" />
        <path d="M9 11c1.5-1.5 4.5-1.5 6 0" />
      </svg>
    );
  }

  // aviator par défaut : verres en goutte + pont
  return (
    <svg {...common}>
      <path d="M3 9h7l-.7 4.2A3.5 3.5 0 0 1 5.9 16 3.5 3.5 0 0 1 2.4 12.6L2 10.5A2.5 2.5 0 0 1 3 9Z" />
      <path d="M21 9h-7l.7 4.2A3.5 3.5 0 0 0 18.1 16a3.5 3.5 0 0 0 3.5-3.4L22 10.5A2.5 2.5 0 0 0 21 9Z" />
      <path d="M10 10h4" />
    </svg>
  );
}
