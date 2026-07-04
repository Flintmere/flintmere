/**
 * Test fixture: hand-built PNG signature + IHDR header — enough bytes for
 * isPng/pngDimensions and for fabricating valid carousel slides in tests.
 * Not a *.test.ts file so vitest never collects it; shared by png.test.ts,
 * queue-posts.test.ts and bluesky-client.test.ts.
 */
export function pngHeader(width: number, height: number): Uint8Array {
  const b = new Uint8Array(33);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const view = new DataView(b.buffer);
  view.setUint32(8, 13); // IHDR data length
  b.set([0x49, 0x48, 0x44, 0x52], 12); // 'IHDR'
  view.setUint32(16, width);
  view.setUint32(20, height);
  return b;
}
