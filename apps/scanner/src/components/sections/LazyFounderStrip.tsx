'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy wrapper for FounderStrip — see LazyPillarWheelScrollPin.tsx for
 * the rationale. Placeholder ~120vh matches the section's typical pinned
 * runway.
 */
const FounderStripDynamic = dynamic(
  () =>
    import('./FounderStrip').then((m) => ({
      default: m.FounderStrip,
    })),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: '120vh' }} aria-hidden />,
  },
);

export { FounderStripDynamic as FounderStrip };
