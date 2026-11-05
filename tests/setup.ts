import '@testing-library/jest-dom';

// Polyfills for tests in jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (contextType: string) {
    if (contextType === '2d') {
      const mockCtx: Record<string, unknown> = {
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '10px sans-serif',
        textAlign: 'start',
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetY: 0,
        fillRect: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        getImageData: (x: number, y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
          width: w,
          height: h,
        }),
        putImageData: () => {},
        drawImage: () => {},
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        beginPath: () => {},
        closePath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        bezierCurveTo: () => {},
        quadraticCurveTo: () => {},
        arc: () => {},
        ellipse: () => {},
        roundRect: () => {},
        fill: () => {},
        stroke: () => {},
        fillText: () => {},
        strokeText: () => {},
        setLineDash: () => {},
        measureText: () => ({ width: 100 }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        createRadialGradient: () => ({ addColorStop: () => {} }),
      };
      return mockCtx as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
    callback(new Blob(['fake-image'], { type: 'image/jpeg' }));
  };

  HTMLCanvasElement.prototype.toDataURL = function () {
    return 'data:image/jpeg;base64,fake';
  };
}

// MediaDevices mock
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'mediaDevices', {
    writable: true,
    value: {
      getUserMedia: async () => {
        return {
          getTracks: () => [
            {
              stop: () => {},
              getSettings: () => ({ width: 1920, height: 1080 }),
            },
          ],
        } as unknown as MediaStream;
      },
      enumerateDevices: async () => [
        { deviceId: 'default', kind: 'videoinput', label: 'FaceTime HD Camera' },
      ],
    },
  });
}
