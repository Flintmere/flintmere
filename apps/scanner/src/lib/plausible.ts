// Plausible analytics helper.
// Cookieless by design — no consent banner required (Cookie Policy + Privacy
// Policy stay simple). Per ADR 0013, we use Plausible Cloud (EU). No env var
// for the DSN — Plausible's <script data-domain="..."> tag carries the
// identifier; this helper only fires events on `window.plausible`.
//
// Event taxonomy — keep names PORTABLE so a future migration to PostHog (per
// ADR 0013 trigger conditions T1–T7) is a string-rename, not a redesign:
//   - scan_started        ScanForm submit
//   - email_captured      EmailGate /api/lead success
//   - concierge_clicked   CheckoutCard handleStart (start of /audit flow)
//   - concierge_paid      Stripe webhook (server-side; not via this helper)
//
// Safe no-op if Plausible isn't loaded (dev environments, ad-blockers,
// network failure, SSR). Never throws.

declare global {
  interface Window {
    plausible?: (
      event: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
  }
}

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.plausible !== 'function') return;
  try {
    window.plausible(event, props ? { props } : undefined);
  } catch {
    // Plausible queue/init race conditions occasionally throw. Swallow —
    // analytics must never break the user flow.
  }
}
