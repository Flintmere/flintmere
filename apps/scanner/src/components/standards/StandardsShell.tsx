import type { ReactNode } from 'react';
import { SiteFooter } from '@flintmere/ui';
import { STANDARDS_DISCLAIMER } from '@/lib/standards/disclaimer';
import type { CitableDocument } from '@/lib/standards/citation-formats';
import { CiteThisPage } from './CiteThisPage';

/**
 * Shared chrome for every page on standards.flintmere.com.
 *
 * Exists because the binding IA §Disclaimer placement contract is
 * load-bearing and #39 Regulatory Affairs holds a veto on any deviation.
 * Eight pages each hand-rolling the contract is eight chances to drift;
 * one shell is one place to audit.
 *
 * DUAL PLACEMENT, per the IA:
 *   1. Top-of-page eyebrow — one line, Geist Mono, metadata weight.
 *   2. Bottom-of-page block — the full disclaimer in an <aside>,
 *      semantically outside <main>.
 *
 * WORDING resolves a conflict between two canonical sources. The IA
 * (2026-04-26, derived from ADR 0018) specifies one sentence; ADR 0024
 * §Disclaimer (2026-05-10) supersedes ADR 0018 §Disclaimer with tighter
 * wording, pins it in `lib/standards/disclaimer.ts` as the single source
 * of truth, and puts a verbatim test around it. Later ADR wins on the
 * words; the IA still wins on placement, the "as of" date, and the
 * primary-source link. That is what this component implements.
 *
 * The #39 review line comes from the IA §Per-page meta footer line.
 */

export interface StandardsShellProps {
  children: ReactNode;
  /** Publication or last-review date, ISO. Renders as the "as of" date. */
  reviewedOn: string;
  /**
   * Regulator URL most relevant to this page, per the IA's per-page-type
   * variants. Omitted on `/` and `/how-to-cite`, where the IA says the
   * eyebrow points at "the relevant regulator" generically instead.
   */
  primarySource?: { label: string; url: string };
  /** Citation descriptor. Omit on pages that are not citation targets. */
  citable?: CitableDocument;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * ISO → "23 August 2026". String arithmetic, not `new Date()` — the same
 * timezone hazard `citation-formats.ts` documents applies here, and this
 * date appears inside the legal disclaimer.
 */
function humanDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  const monthName = MONTHS[Number(month) - 1];
  if (!year || !monthName || !day) return iso;
  return `${Number(day)} ${monthName} ${year}`;
}

export function StandardsShell({
  children,
  reviewedOn,
  primarySource,
  citable,
}: StandardsShellProps) {
  const asOf = humanDate(reviewedOn);

  return (
    <>
      <main id="main" className="flintmere-main bg-[color:var(--color-paper)]">
        <div
          className="mx-auto max-w-[1080px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(24px, 3vw, 40px)',
          }}
        >
          <p
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{ fontSize: '11px', letterSpacing: '0.16em', lineHeight: 1.6 }}
          >
            Informational guide. Not legal advice.{' '}
            <a
              href="#standards-disclaimer"
              className="text-[color:var(--color-mute)] underline underline-offset-4"
              style={{ display: 'inline-block', padding: '6px 0', minHeight: 24 }}
            >
              Verify against primary source →
            </a>
          </p>
        </div>

        {children}

        <aside
          id="standards-disclaimer"
          aria-labelledby="standards-disclaimer-heading"
          className="mx-auto max-w-[1080px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(40px, 6vw, 72px)',
            paddingBottom: 'clamp(64px, 8vw, 120px)',
            borderTop: '1px solid var(--color-line)',
          }}
        >
          <h2
            id="standards-disclaimer-heading"
            className="font-mono uppercase text-[color:var(--color-mute)]"
            style={{
              fontSize: '11px',
              letterSpacing: '0.16em',
              marginBottom: 20,
              fontWeight: 400,
            }}
          >
            Scope of this document.
          </h2>
          <p
            className="text-[color:var(--color-ink-2)]"
            style={{ fontSize: '15px', lineHeight: 1.65, maxWidth: '68ch' }}
          >
            {STANDARDS_DISCLAIMER}
          </p>
          <p
            className="text-[color:var(--color-ink-2)]"
            style={{
              fontSize: '15px',
              lineHeight: 1.65,
              maxWidth: '68ch',
              marginTop: 16,
            }}
          >
            Aligned with regulator guidance as of {asOf}.
            {primarySource ? (
              <>
                {' '}Verify against{' '}
                <a
                  href={primarySource.url}
                  rel="noopener"
                  className="text-[color:var(--color-ink)] underline underline-offset-4"
                >
                  {primarySource.label}
                </a>{' '}
                for your specific situation.
              </>
            ) : (
              ' Verify against the relevant regulator for your specific situation.'
            )}{' '}
            Maintained by Flintmere Regulatory Affairs (council seat #39) on a
            half-yearly publication cadence with continuous monitoring — see{' '}
            <a
              href="/about"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              /about
            </a>{' '}
            and{' '}
            <a
              href="/food/diff-log"
              className="text-[color:var(--color-ink)] underline underline-offset-4"
            >
              /food/diff-log
            </a>{' '}
            for the full operating model.
          </p>

          <p
            className="font-mono text-[color:var(--color-mute)]"
            style={{
              fontSize: '12px',
              lineHeight: 1.6,
              marginTop: 24,
            }}
          >
            Last reviewed by Flintmere Regulatory Affairs (council seat #39) on{' '}
            {asOf}.
          </p>

          {citable ? <CiteThisPage doc={citable} /> : null}
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
