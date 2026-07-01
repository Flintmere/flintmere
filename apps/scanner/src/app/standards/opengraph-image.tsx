import { ImageResponse } from 'next/og';
import { loadOgFonts } from '@/lib/og/og-fonts';
import { renderOgCard, OG_SIZE, OG_CONTENT_TYPE } from '@/lib/og/og-card';
import { standardsCard } from '@/lib/og/og-content';

const content = standardsCard();

export const alt = content.alt;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function OG() {
  return new ImageResponse(renderOgCard(content), { ...OG_SIZE, fonts: await loadOgFonts() });
}
