import type { Metadata } from 'next';
import Link from 'next/link';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { getAllPosts } from '@/lib/blog/posts';
import { PostCard } from '@/components/blog/PostCard';
import { SCAN_URL } from '@/lib/host-routing';

/**
 * /blog — index of catalog data field notes. Lives on
 * audit.flintmere.com (scanner host). MDX posts in content/blog/, newest
 * first, drafts excluded. Static — rebuilt on deploy (a new post ships by
 * merging its .mdx + redeploying).
 *
 * Canon: neutral-bold. Geist display H1 with one [ bracket ] anchor, eyebrow,
 * hairline-divided card list. No imagery on the index (the cards are the
 * surface); per-post heroes carry the photoreal moments.
 */

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog — Catalog data for AI shopping',
  description:
    'Field notes on catalog data quality, GTINs, metafields, and how AI shopping agents read your products. Source-cited, from first-hand scan data.',
  alternates: { canonical: 'https://audit.flintmere.com/blog' },
  openGraph: {
    title: 'Flintmere Blog — Catalog data for AI shopping',
    description:
      'Field notes on catalog data quality, GTINs, metafields, and how AI shopping agents read your products.',
    url: 'https://audit.flintmere.com/blog',
    type: 'website',
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main id="main" className="flintmere-main bg-[color:var(--color-paper)]">
      <section
        aria-labelledby="blog-heading"
        className="relative isolate overflow-hidden bg-[color:var(--color-paper)]"
      >
        <div
          aria-hidden="true"
          className="absolute pointer-events-none"
          style={{
            inset: 0,
            background: 'var(--gradient-amber-radial)',
            transform: 'translate(0, -12%) scale(1.15)',
            opacity: 0.7,
          }}
        />
        <div
          className="relative mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(64px, 9vw, 128px)',
            paddingBottom: 'clamp(40px, 5vw, 72px)',
          }}
        >
          <p className="eyebrow mb-8">Field notes</p>
          <h1
            id="blog-heading"
            className="font-sans tracking-[-0.04em] leading-[0.95] text-[color:var(--color-ink)]"
            style={{ fontSize: 'var(--scale-h1-page)', fontWeight: 700, maxWidth: '16ch' }}
          >
            What agents see when they read your{' '}
            <Bracket>catalog</Bracket>.
          </h1>
          <p
            className="font-sans text-[color:var(--color-mute)]"
            style={{ marginTop: 'clamp(24px, 3vw, 40px)', maxWidth: '58ch', fontSize: 'clamp(15px, 1.1vw, 17px)', lineHeight: 1.55 }}
          >
            Catalog data quality, GTINs, metafields, and the channel rules behind Google Merchant Center, Amazon Fresh, and AI shopping agents. Source-cited, drawn from first-hand scan data.
          </p>
        </div>
      </section>

      <section
        aria-label="Posts"
        className="bg-[color:var(--color-paper)] border-t border-[color:var(--color-line)]"
      >
        <div
          className="mx-auto max-w-[1024px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 64px)',
            paddingRight: 'clamp(24px, 4vw, 64px)',
            paddingTop: 'clamp(8px, 2vw, 24px)',
            paddingBottom: 'clamp(64px, 9vw, 128px)',
          }}
        >
          {posts.length === 0 ? (
            <p
              className="font-mono text-[color:var(--color-mute)]"
              style={{ paddingTop: 48, fontSize: 14, letterSpacing: '0.04em' }}
            >
              First field note publishing soon. Meanwhile,{' '}
              <Link href={SCAN_URL} className="underline decoration-[color:var(--color-accent)] decoration-2 underline-offset-4 text-[color:var(--color-ink)]">
                run a free scan
              </Link>
              .
            </p>
          ) : (
            <ul className="list-none p-0 m-0">
              {posts.map((post) => (
                <PostCard key={post.frontmatter.slug} post={post} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
