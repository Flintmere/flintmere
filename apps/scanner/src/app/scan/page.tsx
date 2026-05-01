'use client';

/**
 * Scanner results page — `/scan`.
 *
 * Orchestrator only. Owns the ScanState state machine + the /api/scan
 * fetch lifecycle. Display sub-components (Results, ScanScopeLine,
 * SuppressionLede, ScanningOverlay, ErrorBlock, PublicPageOptIn,
 * BenchmarkOptIn, useLiveSample) live in apps/scanner/src/components/scan/.
 *
 * Hero composition (2026-05-01 design-extravagant pass):
 * `[ suppressed ]` lands at Saks scale via Bracket size="saks", carrying
 * the marketing-homepage chord through to the conversion moment. Amber-
 * radial atmosphere blooms behind the chord (per ADR 0021 §3 relaxation
 * — atmospheric gradient permitted). The chord IS the page's brand-mark;
 * the running text orbits it.
 */

import { useState } from 'react';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { EmailGate } from '@/components/EmailGate';
import { ScanForm } from '@/components/ScanForm';
import { BenchmarkOptIn } from '@/components/scan/BenchmarkOptIn';
import { ErrorBlock } from '@/components/scan/ErrorBlock';
import { PublicPageOptIn } from '@/components/scan/PublicPageOptIn';
import { Results } from '@/components/scan/Results';
import { ScanningOverlay } from '@/components/scan/ScanningOverlay';
import type { ScanState } from '@/components/scan/types';

export default function ScanPage() {
  const [state, setState] = useState<ScanState>({ phase: 'idle' });

  const runScan = async (url: string) => {
    setState({ phase: 'scanning', url });
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ shopUrl: url }),
      });
      const body = await res.json();
      if (!res.ok) {
        setState({
          phase: 'error',
          message: body.message ?? 'Scan failed. Try another store URL.',
        });
        return;
      }
      setState({ phase: 'complete', result: body });
    } catch (err) {
      setState({
        phase: 'error',
        message:
          err instanceof Error ? err.message : 'Network error. Try again.',
      });
    }
  };

  return (
    <main id="main" className="flintmere-main">
      <section
        aria-labelledby="scan-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)]"
      >
        {/* Atmosphere — amber-radial gradient blooming behind the chord.
            Per ADR 0021 §3 relaxation: --gradient-amber-radial is a documented
            atmospheric gradient. Positioned to bloom from roughly the chord's
            visual centre, falls off naturally via the radial. Decorative,
            aria-hidden. */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'var(--gradient-amber-radial)',
            transform: 'translate(0, -10%) scale(1.2)',
            opacity: 0.95,
          }}
        />

        <div
          className="relative mx-auto max-w-[1280px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(72px, 9vw, 128px)',
            paddingBottom: 'clamp(48px, 6vw, 96px)',
          }}
        >
          <p className="eyebrow mb-10">
            Free scan · No signup · 60 seconds
          </p>

          <h1
            id="scan-heading"
            className="font-medium tracking-[-0.04em] leading-[0.92] text-[color:var(--color-ink)] max-w-[16ch]"
            style={{ fontSize: 'clamp(40px, 7vw, 112px)' }}
          >
            Which of your products are{' '}
            <Bracket size="saks">suppressed</Bracket>
            {' '}in Google Shopping today?
          </h1>

          <p
            className="font-sans"
            style={{
              marginTop: 'clamp(32px, 4vw, 56px)',
              maxWidth: '52ch',
              fontSize: 'clamp(15px, 1.1vw, 17px)',
              lineHeight: 1.55,
              fontWeight: 400,
              color: 'var(--color-mute)',
            }}
          >
            Paste your URL. We measure how much annual demand is leaking to
            competitors while these products stay demoted — and surface the
            catalog data costing you the sale.
          </p>

          <div style={{ marginTop: 'clamp(40px, 5vw, 72px)' }}>
            <ScanForm
              onSubmit={runScan}
              isSubmitting={state.phase === 'scanning'}
            />
          </div>
        </div>
      </section>

      {state.phase === 'scanning' ? (
        <ScanningOverlay url={state.url} />
      ) : null}

      {state.phase === 'error' ? <ErrorBlock message={state.message} /> : null}

      {state.phase === 'complete' ? (
        <>
          <Results result={state.result} />
          <BenchmarkOptIn scanId={state.result.id} />
          <PublicPageOptIn
            scanId={state.result.id}
            shopDomain={state.result.shopDomain}
          />
          <EmailGate
            scanId={state.result.id}
            shopDomain={state.result.shopDomain}
          />
        </>
      ) : null}
      <SiteFooter />
    </main>
  );
}
