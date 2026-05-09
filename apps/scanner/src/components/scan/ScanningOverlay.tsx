'use client';

import { useEffect, useState } from 'react';
import { StageLedger } from '@/components/StageLedger';

/**
 * Loading state shown while a scan is in flight. Wraps the canonical
 * Stage Ledger primitive (spec:
 * context/design/specs/2026-05-09-stage-ledger.md) — descriptor stays
 * vertical-neutral, no model names, no fake progress.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28.
 * Retrofit to Stage Ledger 2026-05-09.
 */
export function ScanningOverlay({ url }: { url: string }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    // Anchor elapsed time to first client mount so SSR doesn't bake
    // a stale timestamp into the markup.
    setStartedAt(Date.now());
  }, []);

  return (
    <section className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]">
      <p className="eyebrow mb-4">Scanning</p>
      {startedAt !== null && (
        <StageLedger
          stages={[
            {
              id: 'all',
              label: 'scanning',
              description: `inspecting ${url}`,
            },
          ]}
          currentId="all"
          startedAt={startedAt}
        />
      )}
    </section>
  );
}
