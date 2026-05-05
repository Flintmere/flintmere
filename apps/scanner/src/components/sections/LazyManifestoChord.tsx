'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy wrapper for ManifestoChord — see LazyPillarWheelScrollPin.tsx
 * for the rationale. Placeholder ~140vh matches the reduction-cascade
 * sticky-pin runway.
 */
const ManifestoChordDynamic = dynamic(
  () =>
    import('./ManifestoChord').then((m) => ({
      default: m.ManifestoChord,
    })),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: '140vh' }} aria-hidden />,
  },
);

export { ManifestoChordDynamic as ManifestoChord };
