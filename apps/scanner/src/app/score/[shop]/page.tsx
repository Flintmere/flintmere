import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { prisma } from '@/lib/db';
import {
  pillarExplanationCustomerFacing,
  pillarLabelCustomerFacing,
} from '@/lib/copy';
import { badgeUrl, scoreUrl, validateDomainSegment } from '@/lib/badge-url';
import type { CompositeScore, PillarId } from '@flintmere/scoring';
import type { GmcGroundTruth } from '@/lib/gmc/types';
import { GmcPanel } from '@/components/scan/GmcPanel';

// Per ADR 0023 slice 3: GmcPanel mounts here when the merchant has
// connected GMC AND has separately consented to publish GMC counts on
// the public page (`publishGmcOnPublicPage`, distinct from the parent
// `publishPublicPage` consent). The 2026-04-24 precedent — publish_public_page
// split from published_to_benchmark — is the pattern: each new data
// class on a public surface gets its own consent column + endpoint +
// toggle. Sample product titles are excluded from the public render
// (see `publicSafeIssue` in lib/gmc-copy.ts).

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ shop: string }>;
}

async function loadScore(shop: string) {
  const scan = await prisma.scan.findFirst({
    where: {
      normalisedDomain: shop,
      publishPublicPage: true,
      status: 'complete',
      score: { not: null },
      grade: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    select: {
      score: true,
      grade: true,
      shopUrl: true,
      scoreJson: true,
      completedAt: true,
      publicPageAt: true,
      publishGmcOnPublicPage: true,
    },
  });
  return scan;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shop } = await params;
  const domain = validateDomainSegment(shop);
  if (!domain) return { title: 'Score not found · Flintmere' };

  const scan = await loadScore(domain);
  if (!scan) {
    return {
      title: `Score not published · ${domain} · Flintmere`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${domain} · ${scan.score}/100 · catalog data score`;
  const description = `${domain} scored ${scan.score}/100 (grade ${scan.grade}) on Flintmere's catalog data audit — the seven checks AI shopping agents use before recommending a product.`;
  return {
    title,
    description,
    alternates: { canonical: scoreUrl(domain) },
    openGraph: {
      title,
      description,
      url: scoreUrl(domain),
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function formatScanned(at: Date | null): string {
  if (!at) return '';
  return at.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function ScorePage({ params }: PageProps) {
  const { shop } = await params;
  const domain = validateDomainSegment(shop);
  if (!domain) notFound();

  const scan = await loadScore(domain);
  if (!scan || scan.score === null || scan.grade === null) notFound();

  const composite = scan.scoreJson as unknown as
    | (CompositeScore & { gmcGroundTruth?: GmcGroundTruth | null })
    | null;
  const pillars = composite?.pillars ?? [];
  const runPillars = pillars.filter((p) => !p.locked);
  const gmcGroundTruth =
    scan.publishGmcOnPublicPage && composite?.gmcGroundTruth
      ? composite.gmcGroundTruth
      : null;

  const scannedOn = formatScanned(scan.completedAt);

  const badgeAlt = `Flintmere catalog data score: ${scan.score}/100, grade ${scan.grade} — ${domain}`;
  const embedSnippet = `<a href="${scoreUrl(domain)}">
  <img src="${badgeUrl(domain)}"
       alt="${badgeAlt}"
       width="400" height="120">
</a>`;

  return (
    <main id="main" className="flintmere-main">
      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-24 md:py-28">
        <p className="eyebrow text-[color:var(--color-ink-2)] mb-8">
          Catalog data score · Public by merchant opt-in
        </p>
        <h1 className="max-w-[18ch]">
          <Bracket>{domain}</Bracket>
        </h1>
        <p
          className="mt-8 max-w-[52ch] text-[color:var(--color-ink-2)]"
          style={{ fontSize: 18, lineHeight: 1.5 }}
        >
          This is the store&rsquo;s score on the seven checks AI shopping
          agents run before they&rsquo;ll recommend a product &mdash;
          Shopify product data, GS1 UK barcodes, Google Merchant Center
          specs, crawler rules, llms.txt, sitemap, and agent checkout
          readiness.
        </p>
      </section>

      <section
        aria-label="Score"
        className="border-y border-[color:var(--color-line)] bg-[color:var(--color-paper-2)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24 grid md:grid-cols-[auto_1fr] gap-12 items-end">
          <div>
            <p
              style={{
                fontSize: 'clamp(88px, 14vw, 220px)',
                fontWeight: 500,
                letterSpacing: '-0.045em',
                lineHeight: 0.92,
              }}
            >
              {scan.score}
              <span
                aria-hidden="true"
                className="inline-block align-baseline ml-2"
                style={{
                  width: '0.22em',
                  height: '2px',
                  background: 'var(--color-accent)',
                  transform: 'translateY(-0.22em)',
                }}
              />
            </p>
            <p
              className="eyebrow mt-4 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              / 100
            </p>
          </div>
          <div className="pb-4">
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: 'clamp(48px, 7vw, 96px)',
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {scan.grade}
            </p>
            <p
              className="eyebrow mt-3 text-[color:var(--color-mute)]"
              style={{ fontSize: 12 }}
            >
              Grade
            </p>
          </div>
        </div>
      </section>

      {gmcGroundTruth ? <GmcPanel gmcGroundTruth={gmcGroundTruth} /> : null}

      {runPillars.length > 0 ? (
        <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow mb-6">Pillar breakdown</p>
          <h2 className="max-w-[24ch] mb-12">
            How the score breaks down across the seven checks.
          </h2>
          <ol className="list-none p-0 m-0 divide-y divide-[color:var(--color-line)] border-y border-[color:var(--color-line)]">
            {runPillars.map((p) => {
              const label =
                pillarLabelCustomerFacing[p.pillar as PillarId] ?? p.pillar;
              const explanation =
                pillarExplanationCustomerFacing[p.pillar as PillarId] ?? '';
              const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
              return (
                <li
                  key={p.pillar}
                  className="grid grid-cols-[280px_1fr_100px] gap-6 py-7 items-baseline max-md:grid-cols-1 max-md:gap-2"
                >
                  <span style={{ fontSize: 22, letterSpacing: '-0.01em' }}>
                    {label}
                  </span>
                  <span className="text-[color:var(--color-mute)] text-[15px] leading-[1.45]">
                    {explanation}
                  </span>
                  <span
                    className="eyebrow text-right max-md:text-left"
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  >
                    {pct}%
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section
        aria-label="Embed this badge"
        className="bg-[color:var(--color-paper-2)] border-t border-[color:var(--color-line)]"
      >
        <div className="mx-auto max-w-[1280px] px-8 py-24">
          <p className="eyebrow mb-6">Embed this badge</p>
          <h2 className="max-w-[22ch] mb-10">
            Show your <Bracket>score</Bracket> on your own site.
          </h2>
          <div className="grid md:grid-cols-[auto_1fr] gap-10 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- shows the raster PNG badge exactly as an external site embeds it; next/image would proxy + rewrite the canonical URL */}
            <img
              src={`/badge/${domain}`}
              alt={badgeAlt}
              width={400}
              height={120}
              className="border border-[color:var(--color-line)]"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <div>
              <p
                className="text-[color:var(--color-mute)] mb-4 max-w-[52ch]"
                style={{ fontSize: 15, lineHeight: 1.5 }}
              >
                Paste this where you show your trust marks. It reflects your
                latest published scan.
              </p>
              <pre
                tabIndex={0}
                className="overflow-x-auto border border-[color:var(--color-line)] bg-[color:var(--color-paper)] p-5 m-0"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                <code>{embedSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--color-paper)] mx-auto max-w-[1280px] px-8 py-12 border-t border-[color:var(--color-line)]">
        <p
          className="text-[color:var(--color-mute)]"
          style={{ fontSize: 13, lineHeight: 1.55, maxWidth: '72ch' }}
        >
          Scanned by Flintmere{scannedOn ? ` on ${scannedOn}` : ''}. The
          merchant opted in to publish this score page and can turn it off at
          any time, which removes the page immediately.
        </p>
      </section>

      <section
        aria-label="Scan your store"
        style={{
          background: 'var(--color-ink)',
          color: 'var(--color-paper)',
          padding: '96px 32px',
        }}
      >
        <div className="mx-auto max-w-[1000px]">
          <p
            style={{
              fontSize: 'clamp(28px, 4.5vw, 56px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.12,
              maxWidth: '22ch',
            }}
          >
            What does your store score?
          </p>
          <p
            className="mt-6 max-w-[52ch]"
            style={{ fontSize: 17, lineHeight: 1.5, opacity: 0.85 }}
          >
            Free scan. 60 seconds. No signup, no credit card. The same seven
            checks an AI shopping agent runs.
          </p>
          <p style={{ marginTop: 32 }}>
            <Link href="/scan" className="btn btn-accent">
              Run the free scan →
            </Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
