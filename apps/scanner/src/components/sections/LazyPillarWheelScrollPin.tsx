'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy wrapper for PillarWheelScrollPin (978-line PillarWheel + motion).
 * Loaded after first paint to keep the homepage initial JS bundle small;
 * SSR is disabled because Next.js 15 forbids `ssr: false` in Server
 * Components and the parent page.tsx is a Server Component. Googlebot
 * executes JS so the pillars content remains discoverable. Placeholder
 * reserves vertical space (~180vh — pinned chapter) to prevent CLS.
 */
const PillarWheelScrollPinDynamic = dynamic(
  () =>
    import('./PillarWheelScrollPin').then((m) => ({
      default: m.PillarWheelScrollPin,
    })),
  {
    ssr: false,
    loading: () => <div style={{ minHeight: '180vh' }} aria-hidden />,
  },
);

export { PillarWheelScrollPinDynamic as PillarWheelScrollPin };
