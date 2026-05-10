'use client';

/**
 * Per-shop GMC public-page opt-in. Toggles `publish_gmc_on_public_page` on
 * the scan record via POST/DELETE to /api/scan/:id/publish-gmc-on-public-page.
 *
 * Per ADR 0023 slice 3 — separate consent gate from `publish_public_page`.
 * The merchant must enable the parent score page first; this toggle layers
 * GMC counts on top. The component should only mount when:
 *   - The scan carries gmcGroundTruth (Google connection succeeded), AND
 *   - The merchant has already enabled `publish_public_page`.
 *
 * Caller controls when this component renders (see scan/page.tsx).
 *
 * Mirrors `PublicPageOptIn.tsx` — same state machine, same UX shape; just
 * different endpoint + copy.
 */

import { useState } from 'react';

export interface GmcPublicPageOptInProps {
  scanId: string;
  shopDomain: string;
}

export function GmcPublicPageOptIn({
  scanId,
  shopDomain,
}: GmcPublicPageOptInProps) {
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
      const res = await fetch(
        `/api/scan/${scanId}/publish-gmc-on-public-page`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        },
      );
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message:
            body?.message ?? 'Could not add GMC counts to your score page.',
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
      const res = await fetch(
        `/api/scan/${scanId}/publish-gmc-on-public-page`,
        {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
        },
      );
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message:
            body?.message ?? 'Could not remove GMC counts from your score page.',
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
      aria-label="Publish GMC counts on score page"
      className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <p className="eyebrow mb-3">
            Add Google Merchant Center counts to /score/{shopDomain}
          </p>
          <h3 className="max-w-[28ch]">
            Show your live GMC approval breakdown alongside your score.
          </h3>
          <p
            className="mt-4 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            Separate from the score-page consent above. Adds your live
            approved / disapproved / pending counts and the top three
            disapproval reasons (Google&rsquo;s own language) to the
            public page. We never publish your failing SKU titles &mdash;
            those stay in the private audit email. You can turn this off
            here any time, which removes the GMC section from the page.
          </p>
        </div>
        <div>
          {state.phase === 'idle' ? (
            <button
              type="button"
              onClick={enable}
              className="btn btn-accent whitespace-nowrap"
            >
              Add GMC counts →
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
                Published on /score/{state.domain}
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
              GMC section turned off
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
