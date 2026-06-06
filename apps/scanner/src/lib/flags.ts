// PostHog feature-flag helpers (ADR 0025).
//
// Cookieless caveat: with persistence 'memory' the distinct_id is
// per-page-load, so flag bucketing can change across reloads. Fine for
// ops kill-switches and copy experiments measured within a visit; NOT
// suitable for long-running A/B tests needing stable assignment — that
// requires the hybrid-consent follow-up (spec §Scope-OUT).
//
// Safe no-ops when PostHog isn't initialised. Never throws.
import posthog from 'posthog-js';

export function isFlagEnabled(key: string): boolean {
  if (typeof window === 'undefined') return false;
  if (!posthog.__loaded) return false;
  try {
    return posthog.isFeatureEnabled(key) === true;
  } catch {
    return false;
  }
}

export function getFlagPayload(key: string): unknown {
  if (typeof window === 'undefined') return undefined;
  if (!posthog.__loaded) return undefined;
  try {
    return posthog.getFeatureFlagPayload(key);
  } catch {
    return undefined;
  }
}
