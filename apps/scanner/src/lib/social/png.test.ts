import { describe, it, expect } from 'vitest';
import { isPng, pngDimensions } from './png';
import { pngHeader } from './png.fixture';

describe('isPng', () => {
  it('accepts a PNG signature with an IHDR chunk', () => {
    expect(isPng(pngHeader(1080, 1350))).toBe(true);
  });

  it('rejects non-PNG bytes', () => {
    expect(isPng(new TextEncoder().encode('GIF89a definitely not a png padding'))).toBe(false);
  });

  it('rejects a buffer too short to hold IHDR', () => {
    expect(isPng(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(false);
  });
});

describe('pngDimensions', () => {
  it('reads width and height from IHDR', () => {
    expect(pngDimensions(pngHeader(1080, 1350))).toEqual({ width: 1080, height: 1350 });
    expect(pngDimensions(pngHeader(1200, 1200))).toEqual({ width: 1200, height: 1200 });
  });

  it('reads dimensions at a non-zero byte offset', () => {
    const padded = new Uint8Array(40);
    padded.set(pngHeader(640, 480), 7);
    expect(pngDimensions(padded.subarray(7))).toEqual({ width: 640, height: 480 });
  });
});
