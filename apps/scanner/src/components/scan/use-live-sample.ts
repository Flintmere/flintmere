'use client';

/**
 * Lazily fetches the published aggregate benchmark summary so the scan
 * results page can contextualise the merchant's score against the rolling
 * sample. Below the publish floor (n < 50) we still show nothing — the
 * claim-review contract applies here too.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 as part of
 * the pre-emptive 600-line ceiling refactor (memory/PROCESS.md §2).
 */

import { useEffect, useState } from 'react';

export interface LiveSample {
  show: boolean;
  median: number;
  n: number;
}

export function useLiveSample(): LiveSample {
  const [sample, setSample] = useState<LiveSample>({
    show: false,
    median: 0,
    n: 0,
  });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/benchmark/summary', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const available = Boolean(body.available);
        const preview = Boolean(body.preview);
        const median = body.overall?.medianScore;
        const n = body.overall?.n ?? 0;
        if (available && !preview && typeof median === 'number') {
          setSample({ show: true, median, n });
        }
      })
      .catch(() => {
        /* benchmark is optional context, never block the result */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return sample;
}
