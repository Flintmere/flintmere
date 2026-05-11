/**
 * Anti-bot signals for public POST endpoints.
 *
 * Two checks, both client-supplied via the Honeypot component:
 *  - `website` — visually-hidden trap field. Non-empty = bot.
 *  - `dwellMs` — milliseconds between page mount and submit. Anything
 *    under MIN_PAGE_DWELL_MS is faster than a human can paste a URL.
 *
 * Routes that fail these checks should silent-drop — return a benign
 * envelope that mimics a normal terminal state (e.g. rate-limited,
 * already-registered) so scrapers don't learn the fields are tells.
 *
 * Canonical pattern matches `/api/contact` (the original, kept inline
 * inside that route). Wired to `/api/scan` + `/api/lead` 2026-05-11.
 */

export const MIN_PAGE_DWELL_MS = 3000;
const MAX_PAGE_DWELL_MS = 24 * 60 * 60 * 1000;

export type AntiBotInput = {
  website: string | null | undefined;
  dwellMs: number | null | undefined;
};

export type AntiBotResult =
  | { ok: true }
  | { ok: false; reason: 'honeypot' | 'dwell' };

export function checkAntiBot(input: AntiBotInput): AntiBotResult {
  if (typeof input.website === 'string' && input.website.length > 0) {
    return { ok: false, reason: 'honeypot' };
  }
  if (input.dwellMs != null) {
    if (input.dwellMs < MIN_PAGE_DWELL_MS) {
      return { ok: false, reason: 'dwell' };
    }
    if (input.dwellMs > MAX_PAGE_DWELL_MS) {
      // Stale page (tab parked >24h). Treat as bot — real users don't
      // submit a 24h-old form.
      return { ok: false, reason: 'dwell' };
    }
  }
  return { ok: true };
}
