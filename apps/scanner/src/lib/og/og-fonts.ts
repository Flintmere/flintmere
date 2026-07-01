import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Shared Geist/GeistMono loader for OG ImageResponse routes. Fonts live at
// apps/scanner/src/app/og-fonts/ (canonical location used by the existing root,
// /scan and /score OG cards). Path is resolved relative to THIS module
// (src/lib/og/) so every route file gets the fonts without per-depth `../` math.
// Next.js file-tracing follows the `new URL(..., import.meta.url)` + readFile
// pattern to bundle the .ttf assets for the serverless OG route.

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 500 | 700; style: 'normal' };

async function loadFont(filename: string): Promise<ArrayBuffer> {
  const url = new URL(`../../app/og-fonts/${filename}`, import.meta.url);
  const buf = await readFile(fileURLToPath(url));
  return new Uint8Array(buf).buffer as ArrayBuffer;
}

export async function loadOgFonts(): Promise<OgFont[]> {
  const [geistBold, geistMedium, monoBold, monoRegular] = await Promise.all([
    loadFont('Geist-Bold.ttf'),
    loadFont('Geist-Medium.ttf'),
    loadFont('GeistMono-Bold.ttf'),
    loadFont('GeistMono-Regular.ttf'),
  ]);

  return [
    { name: 'Geist', data: geistBold, weight: 700, style: 'normal' },
    { name: 'Geist', data: geistMedium, weight: 500, style: 'normal' },
    { name: 'GeistMono', data: monoBold, weight: 700, style: 'normal' },
    { name: 'GeistMono', data: monoRegular, weight: 400, style: 'normal' },
  ];
}
