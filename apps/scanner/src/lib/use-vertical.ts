'use client';

/**
 * useVertical — URL state hook for the vertical picker.
 *
 * Single source of truth = the URL `?vertical=` param.
 *  - Read via `useSearchParams()` (Next.js App Router).
 *  - Write via `router.replace()` — NOT push() — selection should not
 *    pollute the back-stack (operator UX intent: a vertical change is a
 *    filter, not a navigation event).
 *  - `{ scroll: false }` so the page does not jump on selection.
 *
 * Per-app glue (lives outside packages/ui because next/navigation is
 * App-Router-specific). The primitive itself stays framework-agnostic.
 */

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import {
  parseHomepageVertical,
  parsePricingVertical,
  type HomepageVerticalId,
  type PricingVerticalId,
} from './vertical';

interface UseVerticalReturn<T extends string> {
  selected: T;
  setSelected: (next: T) => void;
}

/**
 * Generic core. Both surface-specific hooks below delegate here so the
 * router-replace + scroll-false contract is implemented exactly once.
 */
function useVerticalCore<T extends string>(parser: (raw: string | null) => T): UseVerticalReturn<T> {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selected = parser(searchParams?.get('vertical') ?? null);

  const setSelected = useCallback(
    (next: T) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('vertical', next);
      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { selected, setSelected };
}

/** Homepage variant — accepts food | beauty | apparel; defaults to food. */
export function useHomepageVertical(): UseVerticalReturn<HomepageVerticalId> {
  return useVerticalCore<HomepageVerticalId>(parseHomepageVertical);
}

/** Pricing variant — accepts food | beauty | apparel | bundle; defaults to food. */
export function usePricingVertical(): UseVerticalReturn<PricingVerticalId> {
  return useVerticalCore<PricingVerticalId>(parsePricingVertical);
}
