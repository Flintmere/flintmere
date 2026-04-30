'use client';

/**
 * Scanner results page — `/scan`.
 *
 * Orchestrator only. Owns the ScanState state machine + the /api/scan
 * fetch lifecycle. Display sub-components (Results, ScanScopeLine,
 * SuppressionLede, ScanningOverlay, ErrorBlock, PublicPageOptIn,
 * BenchmarkOptIn, useLiveSample) live in apps/scanner/src/components/scan/.
 *
 * This file was 890 lines pre-refactor; pre-emptive extraction landed
 * 2026-04-28 to bring it under the 600-line ceiling per memory/PROCESS.md §2.
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
      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-20 md:py-24">
        <p className="eyebrow mb-6">
          Free scan · No signup · 60 seconds
        </p>
        <h1 className="max-w-[22ch]">
          Which of your products are <Bracket>suppressed</Bracket> in Google Shopping today?
        </h1>
        <p
          className="mt-8 max-w-[54ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          Paste your URL. We estimate how much annual demand is going to
          competitors while these products stay demoted — and show you the
          catalog data costing you the sale.
        </p>
        <div className="mt-10">
          <ScanForm
            onSubmit={runScan}
            isSubmitting={state.phase === 'scanning'}
          />
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
