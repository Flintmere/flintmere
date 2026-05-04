/**
 * Scanner → /audit email handoff via sessionStorage.
 *
 * Email is PII; URLs leak PII to browser history, server access logs, the
 * Referer header on any outbound click, and any analytics that captures
 * the path. sessionStorage is per-tab, ephemeral, and never seen by the
 * network. Council 2026-05-04 (#24 Data Protection, #28 Security): URLs
 * do not carry PII; shop URL stays in `?shop=` (publicly resolvable,
 * non-PII) so deep-links survive copy-paste sharing for support flows.
 *
 * One-shot: the reader consumes-and-clears so a refresh of /audit does
 * not silently re-pre-fill — the merchant edits via the form after first
 * read, like every other Stripe Elements checkout.
 */

const KEY = 'flintmere.audit-handoff.v1';
const TTL_MS = 30 * 60 * 1000;

interface Handoff {
  email: string;
  scanId?: string;
  ts: number;
}

export function writeHandoff(payload: {
  email: string;
  scanId?: string;
}): void {
  if (typeof window === 'undefined') return;
  const email = payload.email?.trim();
  if (!email) return;
  try {
    const record: Handoff = {
      email,
      scanId: payload.scanId,
      ts: Date.now(),
    };
    window.sessionStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // sessionStorage may be blocked (privacy mode, quota exceeded).
    // Non-fatal — the merchant retypes their email on /audit.
  }
}

export function readAndConsumeHandoff(): Handoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    const parsed = JSON.parse(raw) as Handoff;
    if (!parsed?.email || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}
