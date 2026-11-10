'use client';

import React, { useEffect, useRef } from 'react';
import { FORMATS } from '@/lib/formats';
import { THEMES } from '@/lib/themes';
import { FormatId, ThemeId } from '@/types';

interface ThemePreviewProps {
  themeId: ThemeId;
  formatId: FormatId;
  /** Rendered width in CSS pixels; the height follows the print ratio. */
  width?: number;
  className?: string;
}

/**
 * Live miniature of the print that will be produced with the selected theme and
 * format. It is drawn before any photo is taken so the look can be validated
 * (frame colour, slot layout, footer) without wasting a session.
 */
export function ThemePreview({ themeId, formatId, width = 74, className }: ThemePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const theme = THEMES[themeId];
    const format = FORMATS[formatId];
    const ratio = format.canvasHeight / format.canvasWidth;
    const w = Math.round(width);
    const h = Math.round(w * ratio);
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sx = w / format.canvasWidth;
    const sy = h / format.canvasHeight;

    // Paper / frame background
    ctx.fillStyle = theme.backgroundColor;
    ctx.fillRect(0, 0, w, h);

    if (theme.decorations?.subtleBorder) {
      ctx.strokeStyle = theme.frameBorderColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
    }

    // Photo slots as placeholders
    ctx.setLineDash([3, 2]);
    ctx.lineWidth = 1;
    format.photoSlots.slice(0, 4).forEach((slot, index) => {
      const x = slot.x * sx;
      const y = slot.y * sy;
      const sw = slot.width * sx;
      const sh = slot.height * sy;

      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)';
      ctx.fillRect(x, y, sw, sh);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.65)';
      ctx.strokeRect(x, y, sw, sh);

      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `bold ${Math.max(7, Math.round(sw * 0.28))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(index + 1), x + sw / 2, y + sh / 2);
    });
    ctx.setLineDash([]);

    // Footer label — masqué sous 110 px : à cette échelle le texte est illisible
    if (w >= 110) {
      ctx.fillStyle = theme.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(7, Math.round(h * 0.035))}px sans-serif`;
      ctx.fillText(theme.name.toUpperCase().slice(0, 18), w / 2, h - Math.max(7, h * 0.035));
    }
  }, [themeId, formatId, width]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={`Aperçu du tirage ${THEMES[themeId].name}`}
      role="img"
    />
  );
}
