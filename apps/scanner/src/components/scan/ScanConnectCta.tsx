'use client';

/**
 * Connect-CTA on scan results for a domain that owns an eligible concierge
 * audit (connect-friction spec 2026-06-07, fix 3).
 *
 * Renders nothing until it confirms eligibility via the possession-gated
 * /api/scan/[id]/connect-eligibility endpoint (scan id = capability token).
 * When the merchant has a paid/delivered audit for this domain, we offer a
 * direct path to connect Google Merchant Center — recovering the journey for
 * merchants who lost the audit-delivery email. Gated behind FEATURE_GMC_OAUTH
 * server-side (the endpoint 404s when off), so this stays dark until the flag
 * flips.
 *
 * Scope copy: access is restricted to read-only at our call-site — never
 * described as a "read-only scope" (the Google API scope is write-capable).
 */

import { useEffect, useState } from 'react';

export interface ScanConnectCtaProps {
  scanId: string;
}

export function ScanConnectCta({ scanId }: ScanConnectCtaProps) {
  const [auditId, setAuditId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/scan/${scanId}/connect-eligibility`);
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled && body?.eligible && typeof body.auditId === 'string') {
          setAuditId(body.auditId);
        }
      } catch {
        // Eligibility is best-effort; silence keeps the results page clean.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  if (!auditId) return null;

  const href = `/catalog-letter/connect?audit=${encodeURIComponent(auditId)}`;

  return (
    <section
      aria-label="Connect Google Merchant Center"
      className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <p className="eyebrow mb-3">Your concierge audit</p>
          <h3 className="max-w-[30ch]">
            Connect Google Merchant Center to read your real disapprovals.
          </h3>
          <p
            className="mt-4 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            This scan reads public signals. Connect your account and every
            future scan re-reads Google&rsquo;s own reasons &mdash; your real
            disapprovals and account state. Access is restricted to read-only
            at our call-site. Disconnect anytime.
          </p>
        </div>
        <div>
          <a href={href} className="btn btn-accent whitespace-nowrap">
            Connect Merchant Center →
          </a>
        </div>
      </div>
    </section>
  );
}
