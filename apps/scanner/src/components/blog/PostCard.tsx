import Link from 'next/link';
import type { BlogCluster } from '@/lib/blog/schema';
import type { BlogPost } from '@/lib/blog/posts';

/**
 * Human-readable cluster labels (the seo.md topic engine). Single source for
 * the index card eyebrow + the post-page cluster line. Keys mirror
 * BLOG_CLUSTERS in schema.ts.
 */
export const CLUSTER_LABELS: Record<BlogCluster, string> = {
  'ai-shopping-agentic-commerce': 'AI shopping',
  'catalog-readiness-scoring': 'Catalog data',
  'gtin-identifier-guidance': 'GTIN & identifiers',
  'catalog-mapping-metafields': 'Catalog mapping',
  'shopify-app-discovery': 'Shopify discovery',
  'ai-agent-shopping-behaviour': 'Agent behaviour',
};

/** Format an ISO YYYY-MM-DD date as e.g. "11 June 2026" (en-GB, UTC-safe). */
export function formatPostDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Index list card. Title in Geist Sans, mono meta line (date · reading time ·
 * cluster), amber `]` accent on hover. The whole card is one link; the title
 * carries the accessible name.
 */
export function PostCard({ post }: { post: BlogPost }) {
  const { frontmatter: fm, readingMinutes } = post;
  return (
    <li className="blog-card border-t border-[color:var(--color-line-soft)] first:border-t-0">
      <Link
        href={`/blog/${fm.slug}`}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--color-accent-sage)]"
        style={{ paddingTop: 'clamp(28px, 4vw, 44px)', paddingBottom: 'clamp(28px, 4vw, 44px)' }}
      >
        <p className="eyebrow" style={{ marginBottom: 14 }}>
          {CLUSTER_LABELS[fm.cluster]}
        </p>
        <h2
          className="font-sans text-[color:var(--color-ink)]"
          style={{
            fontSize: 'clamp(24px, 3.2vw, 38px)',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            lineHeight: 1.1,
            maxWidth: '20ch',
          }}
        >
          <span className="group-hover:underline underline-offset-[6px] decoration-2 decoration-[color:var(--color-accent)]">
            {fm.title}
          </span>
        </h2>
        <p
          className="text-[color:var(--color-ink-2)]"
          style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, maxWidth: '60ch' }}
        >
          {fm.description}
        </p>
        <p
          className="font-mono uppercase text-[color:var(--color-mute)]"
          style={{ marginTop: 18, fontSize: 12, letterSpacing: '0.1em' }}
        >
          {formatPostDate(fm.publishedAt)} <span aria-hidden="true">·</span> {readingMinutes} min read
        </p>
      </Link>
    </li>
  );
}
