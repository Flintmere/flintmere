'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { EmailGate } from '@/components/EmailGate';
import { ScanForm } from '@/components/ScanForm';
import { ScoreRing } from '@/components/ScoreRing';
import {
  AUTHORITY_LINE,
  gradeBadgeAnchor,
  issueCodeToFounderSpeak,
  pillarExplanationCustomerFacing,
  pillarLabelCustomerFacing,
  REVENUE_LEDE_DISCLOSURE,
  REVENUE_LEDE_EYEBROW,
  revenueLede,
  sampledRevenueDisclosure,
  scanScopeLine,
  SUPPRESSION_LEDE_EYEBROW,
  SUPPRESSION_LEDE_SUBHEAD,
  suppressionLede,
  suppressionSignalLine,
  verdictHeader,
} from '@/lib/copy';
import type {
  AovEstimate,
  PillarId,
  RevenueEstimate,
  SuppressionEstimate,
} from '@flintmere/scoring';

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
  /**
   * Sampling-honesty fields per BUSINESS.md:19 council ruling 2026-04-27.
   * Optional for backwards compatibility — pre-2026-04-27 scans missing.
   */
  truncated?: boolean;
  actualProductCount?: number | null;
  /**
   * Optional for backwards compatibility — older scans persisted before
   * the dead-inventory wedge shipped won't carry this field.
   */
  suppressionEstimate?: SuppressionEstimate;
  /**
   * Sample-projected suppression. Present when truncated AND actualProductCount
   * is known and exceeds the sampled count. UI prefers this over raw when
   * present. Null otherwise.
   */
  scaledSuppressionEstimate?: SuppressionEstimate | null;
  /**
   * AOV inference (wedge finish arc). Null for non-food catalogs and
   * below-sample-floor catalogs. Older persisted scans won't carry it.
   */
  aovEstimate?: AovEstimate | null;
  /**
   * Annual-demand-at-risk band. Null when suppression.high === 0 OR when
   * `aovEstimate` itself is null.
   */
  revenueEstimate?: RevenueEstimate | null;
  /**
   * Sample-projected revenue band. Same scaling logic as
   * scaledSuppressionEstimate. Null when no scaling applies.
   */
  scaledRevenueEstimate?: RevenueEstimate | null;
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
      <section className="mx-auto max-w-[1280px] px-8 py-20 md:py-24">
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

interface LiveSample {
  show: boolean;
  median: number;
  n: number;
}

function useLiveSample(): LiveSample {
  // Lazily fetch the published aggregate once the user has a result to
  // contextualise. Below the publish floor we still show nothing — the
  // claim-review contract applies here too.
  const [sample, setSample] = useState<LiveSample>({
    show: false,
    median: 0,
    n: 0,
  });
  useEffect(() => {
    let cancelled = false;
    fetch('/api/benchmark/summary', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (cancelled || !body) return;
        const available = Boolean(body.available);
        const preview = Boolean(body.preview);
        const median = body.overall?.medianScore;
        const n = body.overall?.n ?? 0;
        if (available && !preview && typeof median === 'number') {
          setSample({ show: true, median, n });
        }
      })
      .catch(() => {
        /* benchmark is optional context, never block the result */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return sample;
}

interface SuppressionLedeProps {
  estimate: SuppressionEstimate | undefined;
  productCount: number;
  revenueEstimate?: RevenueEstimate | null;
  /** Sampled-projected suppression — UI prefers this over `estimate` when present. */
  scaledEstimate?: SuppressionEstimate | null;
  /** Sampled-projected revenue — UI prefers this over `revenueEstimate` when present. */
  scaledRevenueEstimate?: RevenueEstimate | null;
  /** Sampling state for disclosure swap. */
  truncated?: boolean;
  actualProductCount?: number | null;
}

/**
 * The lead result block — surfaces the dead-inventory wedge ahead of the
 * score + pillar breakdown. Three states:
 *
 *   State 1 (revenue band available): "Roughly £X–£Y of annual demand at
 *           risk" — the v2 §7 hero framing. Renders for food catalogs
 *           with a priced-variant sample above the floor AND non-zero
 *           suppression.
 *   State 2 (suppression available, no revenue band): existing MVP
 *           SKU-count lede. Falls back for non-food catalogs, low
 *           sample, or older scans persisted before AOV shipped.
 *   State 3 (no suppression signal): renders nothing — don't manufacture
 *           a "you're losing nothing" line (per requirement Q-G).
 *
 * Per BUSINESS.md:19 council ruling 2026-04-27: when truncated AND scaled
 * estimates are present, prefer scaled (the merchant's full-catalog
 * projection) and swap disclosure to `sampledRevenueDisclosure`.
 */
function SuppressionLede({
  estimate,
  productCount,
  revenueEstimate,
  scaledEstimate,
  scaledRevenueEstimate,
  truncated,
  actualProductCount,
}: SuppressionLedeProps) {
  // Prefer scaled estimates when present (truncated catalogs with known total).
  const effectiveSuppression = scaledEstimate ?? estimate;
  const effectiveRevenue = scaledRevenueEstimate ?? revenueEstimate;

  // State 3: no suppression to surface.
  if (!effectiveSuppression || effectiveSuppression.high === 0) return null;

  const signalLine = suppressionSignalLine(effectiveSuppression.signals);

  // Disclosure: scaled-projection variant when sampling applied; raw otherwise.
  const disclosure =
    truncated && scaledRevenueEstimate
      ? sampledRevenueDisclosure({
          sampledCount: productCount,
          actualProductCount: actualProductCount ?? null,
        })
      : REVENUE_LEDE_DISCLOSURE;

  // State 1: revenue band available — lead with the £-figure.
  if (effectiveRevenue) {
    const headline = revenueLede({
      low: effectiveRevenue.low,
      high: effectiveRevenue.high,
    });
    return (
      <div className="mb-12 pb-12 border-b border-[color:var(--color-line)]">
        <p className="eyebrow mb-4">
          <Bracket>{REVENUE_LEDE_EYEBROW}</Bracket>
        </p>
        <h2 className="max-w-[40ch]">{headline}</h2>
        {signalLine ? (
          <p
            className="mt-6 max-w-[58ch] text-[color:var(--color-ink-2)]"
            style={{ fontSize: 16, lineHeight: 1.55 }}
          >
            {signalLine}
          </p>
        ) : null}
        <p
          className="mt-4 max-w-[58ch]"
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--color-mute)',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {disclosure}
        </p>
      </div>
    );
  }

  // State 2: SKU-count fallback. Uses scaled estimate when truncated +
  // scaled is present so a non-food catalog of 4,000 reads "Roughly 1,800
  // of your 4,000 products" not "Roughly 449 of your 1,000 products".
  // For the SKU-count lede, the full-catalog total is the merchant-facing
  // denominator — sampled count would feel wrong here.
  const ledeProductCount =
    truncated && scaledEstimate
      ? actualProductCount ?? productCount
      : productCount;
  const headline = suppressionLede({
    low: effectiveSuppression.low,
    high: effectiveSuppression.high,
    productCount: ledeProductCount,
  });
  return (
    <div className="mb-12 pb-12 border-b border-[color:var(--color-line)]">
      <p className="eyebrow mb-4">
        <Bracket>{SUPPRESSION_LEDE_EYEBROW}</Bracket>
      </p>
      <h2 className="max-w-[34ch]">{headline}</h2>
      {signalLine ? (
        <p
          className="mt-6 max-w-[58ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 16, lineHeight: 1.55 }}
        >
          {signalLine}
        </p>
      ) : null}
      <p
        className="mt-4 max-w-[58ch]"
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: 'var(--color-mute)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {truncated
          ? sampledRevenueDisclosure({
              sampledCount: productCount,
              actualProductCount: actualProductCount ?? null,
            })
          : SUPPRESSION_LEDE_SUBHEAD}
      </p>
    </div>
  );
}

interface ScanScopeLineProps {
  sampledCount: number;
  actualProductCount: number | null;
  truncated: boolean;
}

/**
 * Scope row above SuppressionLede — gives merchant calibration on the
 * sample BEFORE the £-figure lands. Per BUSINESS.md:19 council ruling
 * 2026-04-27 #3: trust-anchor sits ahead of the headline.
 */
function ScanScopeLine({
  sampledCount,
  actualProductCount,
  truncated,
}: ScanScopeLineProps) {
  return (
    <p
      className="eyebrow mb-6 text-[color:var(--color-mute)]"
      style={{ letterSpacing: '0.12em' }}
    >
      {scanScopeLine({ sampledCount, actualProductCount, truncated })}
    </p>
  );
}

function Results({ result }: { result: ScanResult }) {
  const sample = useLiveSample();
  const criticalAndHigh = result.issues.filter(
    (i) => i.severity === 'critical' || i.severity === 'high',
  );
  const invisibleCount = criticalAndHigh.reduce(
    (max, issue) => Math.max(max, issue.affectedCount),
    0,
  );
  const verdict = verdictHeader({
    grade: result.grade,
    invisibleCount,
    totalProducts: result.productCount,
  });
  const gradeAnchor = gradeBadgeAnchor({ grade: result.grade });

  const runChecks = result.pillars.filter((p) => !p.locked);
  const lockedChecks = result.pillars.filter((p) => p.locked);
  const topIssues = result.issues.slice(0, 3);

  return (
    <section className="mx-auto max-w-[1280px] px-8 py-16 border-t border-[color:var(--color-line)]">
      {/*
        Scan scope line — calibration row above the lede. Per BUSINESS.md:19
        council ruling 2026-04-27: trust-anchor sits ahead of the headline so
        the merchant absorbs the sampling story before the £-figure lands.
      */}
      <ScanScopeLine
        sampledCount={result.productCount}
        actualProductCount={result.actualProductCount ?? null}
        truncated={result.truncated ?? false}
      />

      {/*
        Dead-inventory wedge — v2 strategic report §7. Surface the
        suppression estimate as the LEAD result, ahead of the score +
        pillar breakdown. The score block remains below as the deeper
        detail; this is the headline a merchant should see first.
      */}
      <SuppressionLede
        estimate={result.suppressionEstimate}
        productCount={result.productCount}
        revenueEstimate={result.revenueEstimate}
        scaledEstimate={result.scaledSuppressionEstimate ?? null}
        scaledRevenueEstimate={result.scaledRevenueEstimate ?? null}
        truncated={result.truncated ?? false}
        actualProductCount={result.actualProductCount ?? null}
      />

      <div className="grid md:grid-cols-[300px_1fr] gap-12 items-center">
        <div>
          <ScoreRing
            score={result.score}
            targetFill={result.score}
            grade={result.grade}
          />
          <p
            className="mt-4 text-center"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--color-ink-2)',
            }}
          >
            {gradeAnchor}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4">Verdict</p>
          <h2 className="max-w-[24ch]">{verdict.headline}</h2>
          <p
            className="mt-6 text-[color:var(--color-ink-2)] max-w-[54ch]"
            style={{ fontSize: 17, lineHeight: 1.5 }}
          >
            {verdict.subhead}
          </p>
          <p
            className="mt-6 max-w-[54ch]"
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--color-mute)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {AUTHORITY_LINE}
          </p>
          {sample.show ? (
            <p
              className="mt-4 max-w-[54ch]"
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--color-mute)',
              }}
            >
              For context — across {sample.n.toLocaleString()} mid-market
              Shopify catalogs in our rolling sample, the median score is{' '}
              {sample.median}/100. You scored {result.score}/100.{' '}
              <Link href="/research" className="underline">
                Read the full report →
              </Link>
            </p>
          ) : null}
        </div>
      </div>

      {topIssues.length > 0 ? (
        <>
          <h3 className="mt-16 mb-6">
            What <Bracket>AI agents</Bracket> see first
          </h3>
          <ol className="list-none p-0 m-0 border-y border-[color:var(--color-line)]">
            {topIssues.map((issue) => {
              const speak = issueCodeToFounderSpeak[issue.code];
              const title = speak?.title ?? issue.title;
              const consequence = speak?.consequence ?? issue.description;
              return (
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
                    <p style={{ fontSize: 18 }}>{title}</p>
                    <p className="mt-1 text-[14px] text-[color:var(--color-mute)]">
                      {consequence}
                    </p>
                  </div>
                  <p className="eyebrow text-right max-md:text-left">
                    {issue.affectedCount.toLocaleString()}{' '}
                    {issue.affectedCount === 1 ? 'product' : 'products'}
                  </p>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      <h3 className="mt-16 mb-6">What we checked</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {runChecks.map((p) => {
          const label =
            pillarLabelCustomerFacing[p.pillar as PillarId] ?? p.pillar;
          const explanation =
            pillarExplanationCustomerFacing[p.pillar as PillarId] ?? '';
          return (
            <div
              key={p.pillar}
              className="p-5 border border-[color:var(--color-line)] bg-[color:var(--color-paper)]"
            >
              <div className="flex justify-between items-baseline gap-3">
                <span style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                  {label}
                </span>
                <span className="eyebrow">{Math.round(p.score)}%</span>
              </div>
              <div
                className="mt-3 h-[4px]"
                style={{ background: 'var(--color-line-soft)' }}
                aria-hidden="true"
              >
                <div
                  style={{
                    width: `${p.score}%`,
                    height: '100%',
                    background: 'var(--color-ink)',
                  }}
                />
              </div>
              {explanation ? (
                <p className="mt-3 text-[13px] text-[color:var(--color-mute)]">
                  {explanation}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {lockedChecks.length > 0 ? (
        <p
          className="mt-8 max-w-[64ch]"
          style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: 'var(--color-mute)',
          }}
        >
          Three more checks —{' '}
          {lockedChecks
            .map(
              (p) =>
                pillarLabelCustomerFacing[p.pillar as PillarId] ?? p.pillar,
            )
            .join(', ')}{' '}
          — need a one-click Shopify connection to run. The free scan only
          reads what is publicly visible.
        </p>
      ) : null}
    </section>
  );
}

function PublicPageOptIn({
  scanId,
  shopDomain,
}: {
  scanId: string;
  shopDomain: string;
}) {
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

function BenchmarkOptIn({ scanId }: { scanId: string }) {
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
