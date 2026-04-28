'use client';

/**
 * Results — the main score + verdict + issues + pillar-breakdown block.
 *
 * Composed below the SuppressionLede + ScanScopeLine. Renders:
 *   - Scope line (sampled-of-actual products)
 *   - Suppression lede (wedge frame, three states)
 *   - ScoreRing + verdict + benchmark context
 *   - Top 3 issues with severity + affected count
 *   - "What we checked" pillar grid
 *   - Locked-checks footnote
 *
 * Extracted from apps/scanner/src/app/scan/page.tsx 2026-04-28 (refactor
 * for the 600-line ceiling).
 */

import Link from 'next/link';
import { Bracket } from '@flintmere/ui';
import { ScoreRing } from '@/components/ScoreRing';
import {
  AUTHORITY_LINE,
  gradeBadgeAnchor,
  issueCodeToFounderSpeak,
  pillarExplanationCustomerFacing,
  pillarLabelCustomerFacing,
  verdictHeader,
} from '@/lib/copy';
import type { PillarId } from '@flintmere/scoring';
import { ScanScopeLine } from './ScanScopeLine';
import { SuppressionLede } from './SuppressionLede';
import { useLiveSample } from './use-live-sample';
import type { ScanResult } from './types';

export function Results({ result }: { result: ScanResult }) {
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
