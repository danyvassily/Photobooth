import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoboothSession } from '@/hooks/use-photobooth-session';

describe('Photobooth Session State Machine', () => {
  it('initializes in idle state with classic theme by default', () => {
    const { result } = renderHook(() => usePhotoboothSession('classic'));
    expect(result.current.state.step).toBe('idle');
    expect(result.current.state.themeId).toBe('classic');
    expect(result.current.state.photos).toHaveLength(0);
    expect(result.current.state.timerDuration).toBe(3);
  });

  it('starts a 4-photo session and transitions to preparing', () => {
    const { result } = renderHook(() => usePhotoboothSession());

    act(() => {
      result.current.start4PhotoSession();
    });

    expect(result.current.state.step).toBe('preparing');
    expect(result.current.state.currentPhotoIndex).toBe(0);
  });

  it('accumulates 4 photos and transitions to reviewing', () => {
    const { result } = renderHook(() => usePhotoboothSession());

    act(() => {
      result.current.start4PhotoSession();
    });

    // Capture 4 photos
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.addCapturedPhoto({
          blob: new Blob([]),
          dataUrl: `data:image/jpeg;base64,photo${i}`,
          width: 800,
          height: 600,
        });
      });
    }

    expect(result.current.state.photos).toHaveLength(4);
    expect(result.current.state.step).toBe('reviewing');
  });

  it('allows retaking an individual photo without losing the others', () => {
    const { result } = renderHook(() => usePhotoboothSession());

    act(() => {
      result.current.start4PhotoSession();
    });

    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.addCapturedPhoto({
          blob: new Blob([]),
          dataUrl: `data:image/jpeg;base64,initial-${i}`,
          width: 800,
          height: 600,
        });
      });
    }

    // Retake photo at index 1
    act(() => {
      result.current.retakeSinglePhoto(1);
    });

    expect(result.current.state.retakeTargetIndex).toBe(1);
    expect(result.current.state.step).toBe('preparing');

    // Add replacement photo
    act(() => {
      result.current.addCapturedPhoto({
        blob: new Blob([]),
        dataUrl: 'data:image/jpeg;base64,replacement-1',
        width: 800,
        height: 600,
      });
    });

    expect(result.current.state.photos).toHaveLength(4);
    expect(result.current.state.photos[1].dataUrl).toBe('data:image/jpeg;base64,replacement-1');
    expect(result.current.state.photos[0].dataUrl).toBe('data:image/jpeg;base64,initial-0');
    expect(result.current.state.photos[2].dataUrl).toBe('data:image/jpeg;base64,initial-2');
    expect(result.current.state.step).toBe('reviewing');
  });

  it('allows reordering photos in the session', () => {
    const { result } = renderHook(() => usePhotoboothSession());

    act(() => {
      result.current.start4PhotoSession();
    });

    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.addCapturedPhoto({
          blob: new Blob([]),
          dataUrl: `data:image/jpeg;base64,p${i}`,
          width: 800,
          height: 600,
        });
      });
    }

    // Reverse order
    const reversed = [...result.current.state.photos].reverse();
    act(() => {
      result.current.updatePhotosOrder(reversed);
    });

    expect(result.current.state.photos[0].dataUrl).toBe('data:image/jpeg;base64,p3');
    expect(result.current.state.photos[3].dataUrl).toBe('data:image/jpeg;base64,p0');
  });
});
