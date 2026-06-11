import { headers } from 'next/headers';
import { getAllPosts } from '@/lib/blog/posts';
import { MARKETING_HOST, SCANNER_HOST, STANDARDS_HOST } from '@/lib/host-routing';

/**
 * /llms.txt — the llmstxt.org convention: a curated map for AI / answer
 * engines (editorial standard §D, "get cited by AI engines"). Host-aware so
 * each subdomain advertises its own most-useful surfaces; the scanner host
 * additionally lists every published blog post by title + URL.
 *
 * force-dynamic because we read the request host. Hit infrequently by
 * crawlers — cost is fine.
 */

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const hdrs = await headers();
  const host = (hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? MARKETING_HOST)
    .split(':')[0]!
    .toLowerCase();

  let body: string;

  if (host === SCANNER_HOST) {
    const posts = getAllPosts();
    const postLines = posts.length
      ? posts
          .map(
            (p) =>
              `- [${p.frontmatter.title}](https://${SCANNER_HOST}/blog/${p.frontmatter.slug}): ${p.frontmatter.description}`,
          )
          .join('\n')
      : '- (No posts published yet.)';

    body = `# Flintmere — Audit (audit.flintmere.com)

> The public catalog-readiness scanner. Reads a Shopify storefront's public catalog and reports how ready it is for Google Merchant Center, Amazon Fresh, and AI shopping agents. Free 60-second scan; one-off concierge audits; weekly field notes grounded in first-hand scan data.

## Tools
- [Free catalog scan](https://${SCANNER_HOST}/scan): 60-second public readiness score, no install.
- [Concierge audit](https://${SCANNER_HOST}/audit): one-off expert catalog audit (band-priced).
- [Methodology](https://${MARKETING_HOST}/methodology): how the seven-pillar readiness score is computed, source-cited.

## Blog — catalog readiness field notes
${postLines}

## Feeds
- [RSS](https://${SCANNER_HOST}/blog/rss.xml)
- [Sitemap](https://${SCANNER_HOST}/sitemap.xml)
`;
  } else if (host === STANDARDS_HOST) {
    body = `# Flintmere — Standards (standards.flintmere.com)

> The public food catalog standard: a JSON Schema plus human-readable spec defining a complete food product record for UK Shopify merchants, with regulatory citations and version history. One standard, five channels (Google Merchant Center, Amazon Fresh, Ocado, Deliveroo, AI shopping agents).

## Pages
- [Standard home](https://${STANDARDS_HOST}/)
`;
  } else {
    body = `# Flintmere (flintmere.com)

> A vertical-specialist commerce-data platform for UK food merchants. We make catalogs readable by AI shopping agents and channel feeds — multimodal extraction, a proprietary food regulatory taxonomy, merchant-verified, written to Shopify metafields under OAuth.

## Pages
- [Pricing](https://${MARKETING_HOST}/pricing): subscription ladder + one-off audit bands.
- [Methodology](https://${MARKETING_HOST}/methodology): how readiness is scored, source-cited.
- [For food & drink](https://${MARKETING_HOST}/for/food-and-drink): the primary vertical.
- [About](https://${MARKETING_HOST}/about): how Flintmere decides.

## Related surfaces
- [Audit scanner](https://${SCANNER_HOST}/scan): free catalog readiness scan.
- [Blog](https://${SCANNER_HOST}/blog): catalog-readiness field notes.
- [Standards](https://${STANDARDS_HOST}/): the public food catalog standard.
`;
  }

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
