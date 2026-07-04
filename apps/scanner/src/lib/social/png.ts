/**
 * Minimal PNG byte inspection for the social carousel — no image dependency.
 * Deliberately shallow: the Maters render pipeline is the trusted producer;
 * the magic check catches wrong-file mistakes, not corrupt encodings.
 */

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** True when the buffer starts with the PNG signature and covers the IHDR chunk. */
export function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 24 && PNG_MAGIC.every((b, i) => bytes[i] === b);
}

/** Width/height from IHDR (always the first chunk — big-endian u32 at 16/20).
 *  Callers must have verified isPng first. */
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}
