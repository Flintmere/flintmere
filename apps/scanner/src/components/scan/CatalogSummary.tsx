'use client';

/**
 * "What we read" preamble — sits between the ScanScopeLine and the
 * SuppressionLede on the scan results page.
 *
 * Plays back verbatim productType (or vendor / generic-fallback) strings
 * from the merchant's own catalog so the merchant can see we read THEIR
 * store, not a template. Vertical-correct by construction: an apparel
 * shop sees apparel categories; a food shop sees food categories; a
 * brand-collective sees brand names.
 *
 * Council pre-flight references (binding 2026-04-28):
 *   - GitHub repo language bar — ranked, verbatim, source-of-truth labels.
 *   - NYT "By the Numbers" sidebar — calibration before analysis lands.
 *   - Stripe Atlas playback rows — mirror-recognition trust mechanic.
 *
 * Restrained scale per pillars-economy rule (memory 2026-04-29):
 * single eyebrow, one short sentence, mono list. Bracket signature lands
 * on `totalProducts` only — that's the "we counted you" beat. Category
 * strings are unbracketed; they are the data the bracket points at.
 */

import { Bracket } from '@flintmere/ui';
import type { CatalogSummary } from '@flintmere/scoring';

export interface CatalogSummaryProps {
  summary: CatalogSummary | undefined;
}

/**
 * Format the category list with proper Oxford-style joining.
 * Returns a JSX fragment so each label can sit in Mono without breaking
 * the surrounding Sans flow.
 */
function joinCategories(labels: readonly string[]): React.ReactNode {
  if (labels.length === 0) return null;
  if (labels.length === 1) return <CategoryChip label={labels[0]!} />;
  if (labels.length === 2) {
    return (
      <>
        <CategoryChip label={labels[0]!} /> and{' '}
        <CategoryChip label={labels[1]!} />
      </>
    );
  }
  // 3+: comma-list with Oxford "and" before the final label.
  const head = labels.slice(0, -1);
  const tail = labels[labels.length - 1]!;
  return (
    <>
      {head.map((label, i) => (
        <span key={label}>
          <CategoryChip label={label} />
          {i < head.length - 1 ? ', ' : ', and '}
        </span>
      ))}
      <CategoryChip label={tail} />
    </>
  );
}

function CategoryChip({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.94em',
        color: 'var(--color-ink)',
      }}
    >
      {label}
    </span>
  );
}

export function CatalogSummary({ summary }: CatalogSummaryProps) {
  // State: no data — either the catalog was empty or this is an older
  // scan persisted before the preamble shipped. Render nothing rather
  // than fabricate a "we found nothing" line that would undercut trust.
  if (!summary || summary.totalProducts === 0) return null;
  if (summary.topCategories.length === 0) return null;

  const labels = summary.topCategories.map((c) => c.label);
  const productCount = summary.totalProducts.toLocaleString();
  const productNoun = summary.totalProducts === 1 ? 'product' : 'products';
  const joined = joinCategories(labels);

  // Three copy framings keyed to the source rung. Stripe-like mirror.
  let body: React.ReactNode;
  if (summary.source === 'product-type') {
    body =
      labels.length === 1 ? (
        <>
          We read <Bracket>{`${productCount} ${productNoun}`}</Bracket>. They
          sit under {joined}.
        </>
      ) : (
        <>
          We read <Bracket>{`${productCount} ${productNoun}`}</Bracket> across{' '}
          {joined}.
        </>
      );
  } else if (summary.source === 'vendor') {
    body =
      labels.length === 1 ? (
        <>
          We read <Bracket>{`${productCount} ${productNoun}`}</Bracket> from{' '}
          {joined}.
        </>
      ) : (
        <>
          We read <Bracket>{`${productCount} ${productNoun}`}</Bracket> from
          brands including {joined}.
        </>
      );
  } else {
    body = (
      <>
        We read <Bracket>{`${productCount} ${productNoun}`}</Bracket> on this
        site.
      </>
    );
  }

  return (
    <div className="mb-10">
      <p className="eyebrow mb-3">What we read</p>
      <p
        className="max-w-[58ch]"
        style={{
          fontSize: 17,
          lineHeight: 1.55,
          color: 'var(--color-ink-2)',
        }}
      >
        {body}
      </p>
    </div>
  );
}
