import { describe, it, expect } from 'vitest';
import { buildPrintFilename } from '@/lib/export/filename';

describe('Print filename convention', () => {
  it('uses the mandated photobooth-YYYY-MM-DD-HHMMSS.jpg pattern', () => {
    const date = new Date(2026, 10, 5, 9, 7, 3); // 5 Nov 2026 09:07:03
    expect(buildPrintFilename(date)).toBe('photobooth-2026-11-05-090703.jpg');
  });

  it('zero-pads every component', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0);
    expect(buildPrintFilename(date)).toBe('photobooth-2026-01-01-000000.jpg');
  });

  it('changes when the timestamp changes (no collisions within a run)', () => {
    const a = buildPrintFilename(new Date(2026, 5, 12, 14, 30, 10));
    const b = buildPrintFilename(new Date(2026, 5, 12, 14, 30, 11));
    expect(a).not.toBe(b);
  });
});
