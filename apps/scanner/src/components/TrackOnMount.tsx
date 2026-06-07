'use client';

/**
 * Fire-once client analytics beacon for server-rendered surfaces.
 *
 * The connect page and the public score page are server components, so they
 * can't call the client `track()` helper directly. Mounting this invisible
 * component emits a single PostHog event after hydration (ADR 0025 client
 * helper; cookieless, no-op when PostHog isn't loaded). Renders nothing and
 * never changes layout — it exists only to mark a funnel step (ADR 0023
 * §measurement, spec 2026-06-07).
 *
 * The empty-deps effect runs once per mount. React 18+ Strict Mode double-
 * invokes effects in dev only; production fires once. PostHog's funnel maths
 * is first-touch per distinct id, so a dev double-fire is harmless.
 */

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

export interface TrackOnMountProps {
  event: string;
  props?: Record<string, string | number | boolean>;
}

export function TrackOnMount({ event, props }: TrackOnMountProps) {
  useEffect(() => {
    track(event, props);
    // Serialise props so a new object literal each render doesn't re-fire;
    // the event is a one-shot page-view / render marker.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, JSON.stringify(props ?? {})]);

  return null;
}
