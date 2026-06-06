// PostHog analytics helper — replaces the prior analytics helper (ADR 0025,
// superseding ADR 0013). Cookieless-max: persistence 'memory' → zero
// cookies, zero localStorage identifiers, no consent banner.
//
// Event taxonomy (names unchanged from ADR 0013 — portable by design):
//   scan_started, email_captured, audit_cta_from_scan, band_preselected,
//   band_switched, audit_prefill_applied, concierge_clicked,
//   audit_draft_generated (client) + concierge_paid (server,
//   apps/scanner/src/lib/analytics-server.ts).
//
// Safe no-op if PostHog isn't initialised (SSR, stub key, ad-blockers).
// Never throws — analytics must never break the user flow.
import posthog from 'posthog-js';

export function track(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return;
  if (!posthog.__loaded) return;
  try {
    posthog.capture(event, props);
  } catch {
    // Swallow — analytics must never break the user flow.
  }
}
