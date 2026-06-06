// PostHog connection constants — single source of truth (ADR 0025).
// The phc_ project key is public-by-design (anti-waste rule 6: visible in
// DevTools to any visitor; postcard test passes) — hardcode, no env var.
// OPERATOR: replace phc_REPLACE_ME with the real key from PostHog
// project settings (EU Cloud → Flintmere web → Project API key).
export const POSTHOG_KEY = 'phc_REPLACE_ME';
export const POSTHOG_PROXY_PATH = '/ingest';
export const POSTHOG_UI_HOST = 'https://eu.posthog.com';
export const POSTHOG_SERVER_HOST = 'https://eu.i.posthog.com';

export function posthogKeyIsStub(): boolean {
  return POSTHOG_KEY.includes('REPLACE_ME');
}
