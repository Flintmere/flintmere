'use client';

/**
 * Anonymous-benchmark contribution opt-in. Adds the merchant's score to
 * the State of Shopify Catalogs aggregate via POST to /api/scan/:id/publish.
 * Only the score + grade ship to the benchmark; the domain stays private.
 *
 * Consent model: independent of the public-score-page opt-in. See the
 * 2026-04-24 dual-consent migration in STATUS.md for context.
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

import { useState } from 'react';

export interface BenchmarkOptInProps {
  scanId: string;
}

export function BenchmarkOptIn({ scanId }: BenchmarkOptInProps) {
  const [state, setState] = useState<
    | { phase: 'idle' }
    | { phase: 'submitting' }
    | { phase: 'success' }
    | { phase: 'error'; message: string }
  >({ phase: 'idle' });

  const submit = async () => {
    setState({ phase: 'submitting' });
    try {
      const res = await fetch(`/api/scan/${scanId}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setState({
          phase: 'error',
          message:
            body?.message ?? 'Could not add your score to the benchmark.',
        });
        return;
      }
      setState({ phase: 'success' });
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
      aria-label="Contribute to the benchmark"
      className="mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]"
    >
      <div className="grid md:grid-cols-[1fr_auto] gap-8 items-end">
        <div>
          <p className="eyebrow mb-3">Help the benchmark</p>
          <h3 className="max-w-[28ch]">
            Add your anonymised score to the State of Shopify Catalogs
            sample.
          </h3>
          <p
            className="mt-4 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 15, lineHeight: 1.55 }}
          >
            Your score joins the /research aggregates. We never publish your
            domain, never share it with anyone, and never sell the dataset.
            More stores in the sample = a sharper benchmark for every
            merchant.
          </p>
        </div>
        <div>
          {state.phase === 'idle' ? (
            <button
              type="button"
              onClick={submit}
              className="btn btn-accent whitespace-nowrap"
            >
              Add my score →
            </button>
          ) : state.phase === 'submitting' ? (
            <button
              type="button"
              disabled
              className="btn whitespace-nowrap"
              aria-busy="true"
            >
              Adding…
            </button>
          ) : state.phase === 'success' ? (
            <p
              className="eyebrow"
              style={{ color: 'var(--color-accent-ink)' }}
              role="status"
            >
              Added · thank you
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
                onClick={submit}
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
