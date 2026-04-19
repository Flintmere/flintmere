'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { EmailGate } from '@/components/EmailGate';
import { ScanForm } from '@/components/ScanForm';
import { ScoreRing } from '@/components/ScoreRing';

type ScanState =
  | { phase: 'idle' }
  | { phase: 'scanning'; url: string }
  | { phase: 'complete'; result: ScanResult }
  | { phase: 'error'; message: string };

interface ScanResult {
  id: string;
  shopDomain: string;
  score: number;
  grade: string;
  gtinlessCeiling: number;
  productCount: number;
  pillars: Array<{
    pillar: string;
    score: number;
    maxScore: number;
    locked: boolean;
    lockedReason?: string;
  }>;
  issues: Array<{
    code: string;
    severity: string;
    title: string;
    description: string;
    affectedCount: number;
  }>;
}

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
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" className="text-[18px] font-medium tracking-tight">
            Flintmere
          </Link>
          <Link href="/contact" className="btn">
            Book a demo
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1280px] px-8 py-20 md:py-24">
        <p className="eyebrow mb-6">
          Free scan · No signup · 60 seconds
        </p>
        <h1 className="max-w-[18ch]">
          Is your Shopify catalog <Bracket>invisible</Bracket> to ChatGPT?
        </h1>
        <p
          className="mt-8 max-w-[54ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 17, lineHeight: 1.55 }}
        >
          Paste your store URL. We read your public feed, sample your product
          pages, and return a readiness score with the top issues ranked by
          revenue impact.
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
          <EmailGate
            scanId={state.result.id}
            shopDomain={state.result.shopDomain}
          />
        </>
      ) : null}
    </main>
  );
}

function ScanningOverlay({ url }: { url: string }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
    >
      <p className="eyebrow mb-4">Scanning</p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--color-ink-2)',
        }}
      >
        Fetching {url} · this takes 10–55s depending on catalog size
      </p>
    </section>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]"
    >
      <p className="eyebrow mb-4" style={{ color: 'var(--color-alert)' }}>
        Scan failed
      </p>
      <p style={{ fontSize: 19, lineHeight: 1.5 }}>{message}</p>
    </section>
  );
}

function Results({ result }: { result: ScanResult }) {
  const pillarLabels: Record<string, string> = {
    identifiers: 'Identifier completeness',
    attributes: 'Attribute completeness',
    titles: 'Title & description',
    mapping: 'Catalog mapping',
    consistency: 'Consistency & integrity',
    'checkout-eligibility': 'AI checkout eligibility',
  };

  return (
    <section className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]">
      <div className="grid md:grid-cols-[300px_1fr] gap-12 items-center">
        <ScoreRing
          score={result.score}
          targetFill={result.score}
          grade={result.grade}
        />
        <div>
          <p className="eyebrow mb-4">Your AI-readiness score</p>
          <h2 className="max-w-[20ch]">
            <Bracket>{String(result.score)}</Bracket> / 100 · Grade {result.grade}
          </h2>
          <p className="mt-6 text-[color:var(--color-ink-2)] max-w-[44ch]" style={{ fontSize: 16, lineHeight: 1.55 }}>
            We analysed {result.productCount} products at {result.shopDomain}. Your GTIN-less ceiling sits at {result.gtinlessCeiling}/100 — the highest score you can reach without GS1 identifiers.
          </p>
        </div>
      </div>

      <h3 className="mt-16 mb-6">Pillars</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {result.pillars.map((p) => (
          <div
            key={p.pillar}
            className="p-5 border border-[color:var(--color-line)] bg-[color:var(--color-paper)]"
            style={{
              background: p.locked
                ? 'repeating-linear-gradient(45deg, var(--color-paper-2) 0 8px, var(--color-paper) 8px 9px)'
                : undefined,
              color: p.locked ? 'var(--color-mute)' : undefined,
            }}
          >
            <div className="flex justify-between items-baseline">
              <span style={{ fontSize: 20, letterSpacing: '-0.01em' }}>
                {pillarLabels[p.pillar] ?? p.pillar}
              </span>
              <span className="eyebrow">
                {p.locked ? 'Locked' : `${Math.round(p.score)}%`}
              </span>
            </div>
            <div
              className="mt-3 h-[4px]"
              style={{ background: 'var(--color-line-soft)' }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: p.locked ? 0 : `${p.score}%`,
                  height: '100%',
                  background: 'var(--color-ink)',
                }}
              />
            </div>
            {p.locked ? (
              <p className="mt-3 text-[13px] text-[color:var(--color-mute)]">
                Install Flintmere to unlock — {p.lockedReason ?? 'requires OAuth'}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {result.issues.length > 0 ? (
        <>
          <h3 className="mt-16 mb-6">Top issues, ranked by revenue impact</h3>
          <ol className="list-none p-0 m-0 border-y border-[color:var(--color-line)]">
            {result.issues.slice(0, 5).map((issue) => (
              <li
                key={issue.code}
                className="grid grid-cols-[80px_1fr_120px] gap-5 py-5 items-baseline border-t border-[color:var(--color-line-soft)] first:border-t-0 max-md:grid-cols-1 max-md:gap-2"
              >
                <span
                  className="eyebrow text-center"
                  style={{
                    background:
                      issue.severity === 'critical'
                        ? 'var(--color-alert)'
                        : issue.severity === 'high'
                          ? 'var(--color-ink)'
                          : 'var(--color-mute-2)',
                    color: 'var(--color-paper)',
                    padding: '4px 8px',
                  }}
                >
                  {issue.severity}
                </span>
                <div>
                  <p style={{ fontSize: 18 }}>{issue.title}</p>
                  <p className="mt-1 text-[14px] text-[color:var(--color-mute)]">
                    {issue.description}
                  </p>
                </div>
                <p className="eyebrow text-right max-md:text-left">
                  {issue.affectedCount} items
                </p>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
