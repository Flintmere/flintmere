import Link from 'next/link';
import { Bracket } from '@/components/Bracket';
import { SectionAnchor } from '@/components/SectionAnchor';
import { SiteFooter } from '@/components/SiteFooter';
import * as React from 'react';

/**
 * LegalShell — shared chrome for /privacy, /terms, /security, /cookies, /dpa, /support.
 *
 * Council seats: #9 Mira (legal), #23 Platform Policy, #24 Data Protection (veto),
 * #16 Copy, #11 Investor Voice, #37 Consumer Psychologist.
 *
 * Rule: plain-English summary sits above the formal clause. Flesch ≥55 for summaries.
 * Last-updated date is load-bearing — every clause block dates from here until superseded.
 */

export interface LegalShellProps {
  eyebrow: string;
  title: React.ReactNode;
  summary: string;
  lastUpdated: string; // ISO yyyy-mm-dd
  children: React.ReactNode;
  anchorNumeral?: string;
}

export function LegalShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  children,
  anchorNumeral = '01',
}: LegalShellProps) {
  return (
    <main id="main">
      <header className="border-b border-[color:var(--color-line)]">
        <div className="mx-auto max-w-[1280px] px-8 h-[56px] flex items-center justify-between">
          <Link href="/" aria-label="Flintmere home" className="text-[18px] font-medium tracking-tight">
            Flintmere<span className="font-mono font-bold" aria-hidden="true">]</span>
          </Link>
          <nav className="hidden md:flex gap-8" aria-label="Primary">
            <Link href="/#pillars" className="eyebrow">Checks</Link>
            <Link href="/pricing" className="eyebrow">Pricing</Link>
            <Link href="/research" className="eyebrow">Research</Link>
          </nav>
          <Link href="/scan" className="btn btn-accent">Run a free scan →</Link>
        </div>
      </header>

      <section className="section-anchor-host mx-auto max-w-[980px] px-8 py-20 md:py-24">
        <SectionAnchor variant="numeral" numeral={anchorNumeral} side="top-right" />
        <p className="eyebrow mb-6">{eyebrow}</p>
        <h1 className="max-w-[20ch]">{title}</h1>
        <div
          className="mt-10 p-8 border border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
          style={{ maxWidth: '64ch' }}
        >
          <p className="eyebrow mb-4">In plain English</p>
          <p style={{ fontSize: 17, lineHeight: 1.55, letterSpacing: '-0.005em' }}>
            {summary}
          </p>
        </div>
        <p className="eyebrow mt-8 text-[color:var(--color-mute)]">
          Last updated: <time dateTime={lastUpdated}>{lastUpdated}</time>
        </p>
      </section>

      <section className="mx-auto max-w-[980px] px-8 pb-24">
        <div className="legal-body">{children}</div>
      </section>

      <SiteFooter />
    </main>
  );
}

interface ClauseProps {
  n: string;
  heading: string;
  children: React.ReactNode;
}

export function Clause({ n, heading, children }: ClauseProps) {
  return (
    <section className="grid md:grid-cols-[96px_1fr] gap-6 py-10 border-t border-[color:var(--color-line-soft)] first:border-t-0">
      <p
        aria-hidden="true"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: '0.14em',
          color: 'var(--color-mute)',
        }}
      >
        [&nbsp;{n}&nbsp;]
      </p>
      <div>
        <h2
          style={{
            fontSize: 22,
            letterSpacing: '-0.015em',
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          {heading}
        </h2>
        <div
          className="legal-clause-body text-[color:var(--color-ink-2)]"
          style={{ fontSize: 15, lineHeight: 1.65 }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
