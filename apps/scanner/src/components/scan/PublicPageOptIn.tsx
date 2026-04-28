'use client';

/**
 * Per-shop public score-page opt-in. Toggles `publish_public_page` on the
 * scan record via POST/DELETE to /api/scan/:id/publish-public-page. When
 * live, the page renders at /score/[normalisedDomain] with ISR=3600s.
 *
 * Consent model: independent of the benchmark opt-in. A merchant can opt
 * in to public-page-only, benchmark-only, both, or neither. Per
 * BUSINESS.md:19 + the 2026-04-24 scoring schema migration.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

import { useState } from 'react';

export interface PublicPageOptInProps {
  scanId: string;
  shopDomain: string;
}

export function PublicPageOptIn({ scanId, shopDomain }: PublicPageOptInProps) {
  const [state, setState] = useState<
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'success'; domain: string }
    | { phase: 'off' }
    | { phase: 'error'; message: string }
  >({ phase: 'idle' });

  const enable = async () => {
    setState({ phase: 'submitting' });
    try {
      const res = await fetch(`/api/scan/${scanId}/publish-public-page`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message: body?.message ?? 'Could not publish your score page.',
        });
        return;
      }
      setState({ phase: 'success', domain: body.domain ?? shopDomain });
    } catch (err) {
      setState({
        phase: 'error',
        message:
          err instanceof Error ? err.message : 'Network error. Try again.',
      });
    }
  };

  const disable = async () => {
    setState({ phase: 'submitting' });
    try {
      const res = await fetch(`/api/scan/${scanId}/publish-public-page`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message: body?.message ?? 'Could not turn off the score page.',
        });
        return;
      }
      setState({ phase: 'off' });
    } catch (err) {
      setState({
        phase: 'error',
        message:
          err instanceof Error ? err.message : 'Network error. Try again.',
      });
    }
  };

  return (
    <section
      aria-label="Publish score page"
      className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <p className="eyebrow mb-3">Publish a shareable page</p>
          <h3 className="max-w-[28ch]">
            Turn on a public page at flintmere.com/score/{shopDomain}.
          </h3>
          <p
            className="mt-4 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            Separate from the benchmark. We&rsquo;ll publish your score,
            grade, and the seven pillar sub-scores at a public URL you can
            share on LinkedIn, X, or embed in your site. No email, no IP,
            no lead data on the page &mdash; just your score. You can turn
            it off here any time, which removes the page immediately.
          </p>
        </div>
        <div>
          {state.phase === 'idle' ? (
            <button
              type="button"
              onClick={enable}
              className="btn btn-accent whitespace-nowrap"
            >
              Publish my score page →
            </button>
          ) : state.phase === 'submitting' ? (
            <button
              type="button"
              disabled
              className="btn whitespace-nowrap"
              aria-busy="true"
            >
              Working…
            </button>
          ) : state.phase === 'success' ? (
            <div className="text-right max-md:text-left">
              <p
                className="eyebrow mb-2"
                style={{ color: 'var(--color-accent-ink)' }}
                role="status"
              >
                Live at /score/{state.domain}
              </p>
              <button
                type="button"
                onClick={disable}
                className="btn whitespace-nowrap"
              >
                Turn off
              </button>
            </div>
          ) : state.phase === 'off' ? (
            <p
              className="eyebrow"
              style={{ color: 'var(--color-mute)' }}
              role="status"
            >
              Page turned off
            </p>
          ) : (
            <div className="text-right max-md:text-left">
              <p
                role="alert"
                className="eyebrow mb-2"
                style={{ color: 'var(--color-alert)' }}
              >
                {state.message}
              </p>
              <button
                type="button"
                onClick={enable}
                className="btn whitespace-nowrap"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
