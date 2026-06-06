// PostHog connection constants — single source of truth (ADR 0025).
// The phc_ project key is public-by-design (anti-waste rule 6: visible in
// DevTools to any visitor; postcard test passes) — hardcode, no env var.
// Project: eu.posthog.com/project/195011 (EU Cloud), operator-supplied
// 2026-06-06.
export const POSTHOG_KEY = 'phc_BqWR45zhaCB2uzqJpSCiAkSxheF8UDnGVFFxP8M4Awn7';
export const POSTHOG_PROXY_PATH = '/ingest';
export const POSTHOG_UI_HOST = 'https://eu.posthog.com';
export const POSTHOG_SERVER_HOST = 'https://eu.i.posthog.com';

export function posthogKeyIsStub(): boolean {
  return POSTHOG_KEY.includes('REPLACE_ME');
}
