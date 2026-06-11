import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Bracket, SiteFooter } from '@flintmere/ui';
import { getAllPosts, getPostBySlug } from '@/lib/blog/posts';
import { getAuthor } from '@/lib/blog/authors';
import { postJsonLd, postUrl, postImageUrl } from '@/lib/blog/jsonld';
import { mdxComponents } from '@/components/blog/mdx-components';
import { CLUSTER_LABELS, formatPostDate } from '@/components/blog/PostCard';
import { SCAN_URL } from '@/lib/host-routing';

/**
 * /blog/[slug] — a single field note. RSC; MDX compiled at build via
 * next-mdx-remote/rsc. Emits per-post canonical, OpenGraph, BlogPosting +
 * FAQPage + BreadcrumbList JSON-LD (AEO §D), a Sources block (authority §B)
 * and a closing scan CTA. Body rendered inside .blog-prose (globals.css).
 *
 * Static: generateStaticParams pre-renders every non-draft slug. A new post
 * ships by merging its .mdx + redeploy. Unknown slug → notFound (404).
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  // Drafts excluded from static params — they 404 in production.
  return getAllPosts().map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.frontmatter.draft) return {};
  const fm = post.frontmatter;
  return {
    title: fm.title,
    description: fm.description,
    alternates: { canonical: postUrl(fm.slug) },
    openGraph: {
      type: 'article',
      title: fm.title,
      description: fm.description,
      url: postUrl(fm.slug),
      publishedTime: fm.publishedAt,
      modifiedTime: fm.updatedAt ?? fm.publishedAt,
      images: [{ url: postImageUrl(fm.slug), width: 1200, height: 630, alt: fm.title }],
    },
    twitter: { card: 'summary_large_image', title: fm.title, description: fm.description },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post || post.frontmatter.draft) notFound();

  const fm = post.frontmatter;
  const author = getAuthor(fm.author);
  const showUpdated = fm.updatedAt && fm.updatedAt !== fm.publishedAt;

  return (
    <main id="main" className="flintmere-main bg-[color:var(--color-paper)]">
      {/* AEO/GEO structured data — BlogPosting + FAQPage + BreadcrumbList. */}
      <script
        type="application/ld+json"
        // JSON.stringify output, not user HTML — safe to inject.
        dangerouslySetInnerHTML={{ __html: postJsonLd(post) }}
      />

      <article>
        {/* Masthead */}
        <header className="relative isolate overflow-hidden bg-[color:var(--color-paper)]">
          <div
            className="relative mx-auto max-w-[768px]"
            style={{
              paddingLeft: 'clamp(24px, 4vw, 48px)',
              paddingRight: 'clamp(24px, 4vw, 48px)',
              paddingTop: 'clamp(56px, 8vw, 112px)',
              paddingBottom: 'clamp(28px, 4vw, 48px)',
            }}
          >
            <nav aria-label="Breadcrumb" className="mb-8">
              <Link
                href="/blog"
                className="eyebrow hover:underline underline-offset-4 decoration-1"
              >
                ← Blog
              </Link>
            </nav>

            <p className="eyebrow mb-5">{CLUSTER_LABELS[fm.cluster]}</p>
            <h1
              className="font-sans tracking-[-0.035em] text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 700, lineHeight: 1.05 }}
            >
              {fm.title}
            </h1>

            {/* Byline — E-E-A-T author signal (§B). */}
            <div
              className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono uppercase text-[color:var(--color-mute)]"
              style={{ marginTop: 'clamp(24px, 3vw, 36px)', fontSize: 12, letterSpacing: '0.08em' }}
            >
              <span className="text-[color:var(--color-ink-2)]">{author.name}</span>
              <span aria-hidden="true">·</span>
              <span>{author.role}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={fm.publishedAt}>{formatPostDate(fm.publishedAt)}</time>
              {showUpdated ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Updated {formatPostDate(fm.updatedAt!)}</span>
                </>
              ) : null}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
          </div>

          {fm.hero ? (
            <div
              className="relative mx-auto max-w-[1024px]"
              style={{
                paddingLeft: 'clamp(24px, 4vw, 48px)',
                paddingRight: 'clamp(24px, 4vw, 48px)',
                paddingBottom: 'clamp(16px, 2vw, 24px)',
              }}
            >
              <Image
                src={fm.hero.src}
                alt={fm.hero.alt}
                width={1024}
                height={576}
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                style={{ width: '100%', height: 'auto', display: 'block', border: '1px solid var(--color-line)' }}
              />
            </div>
          ) : null}
        </header>

        {/* Body */}
        <div
          className="mx-auto max-w-[768px]"
          style={{
            paddingLeft: 'clamp(24px, 4vw, 48px)',
            paddingRight: 'clamp(24px, 4vw, 48px)',
            paddingTop: 'clamp(8px, 2vw, 24px)',
            paddingBottom: 'clamp(48px, 6vw, 80px)',
          }}
        >
          <div className="blog-prose">
            <MDXRemote source={post.body} components={mdxComponents} />
          </div>

          {/* FAQ — rendered + fed to FAQPage JSON-LD (§D). */}
          {fm.faq.length > 0 ? (
            <section aria-labelledby="faq-heading" style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
              <h2
                id="faq-heading"
                className="font-sans text-[color:var(--color-ink)]"
                style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, letterSpacing: '-0.02em' }}
              >
                Frequently asked
              </h2>
              <dl className="mt-8 border-t border-[color:var(--color-line)]">
                {fm.faq.map((item) => (
                  <div
                    key={item.q}
                    className="border-b border-[color:var(--color-line-soft)]"
                    style={{ paddingTop: 24, paddingBottom: 24 }}
                  >
                    <dt
                      className="font-sans text-[color:var(--color-ink)]"
                      style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}
                    >
                      {item.q}
                    </dt>
                    <dd
                      className="font-sans text-[color:var(--color-ink-2)]"
                      style={{ marginTop: 10, fontSize: 16, lineHeight: 1.65 }}
                    >
                      {item.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          {/* Sources — authority signal (§B); feeds JSON-LD citation. */}
          {fm.sources.length > 0 ? (
            <section aria-labelledby="sources-heading" style={{ marginTop: 'clamp(48px, 6vw, 80px)' }}>
              <h2 id="sources-heading" className="eyebrow" style={{ fontSize: 12 }}>
                Sources
              </h2>
              <ol className="mt-5 list-none p-0 m-0">
                {fm.sources.map((src, i) => (
                  <li
                    key={src.url}
                    className="border-t border-[color:var(--color-line-soft)] first:border-t-0"
                    style={{ paddingTop: 14, paddingBottom: 14 }}
                  >
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-[color:var(--color-ink)] underline decoration-[color:var(--color-accent)] decoration-2 underline-offset-4"
                      style={{ fontSize: 15 }}
                    >
                      <span className="font-mono text-[color:var(--color-mute)]" style={{ marginRight: 8 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {src.title}
                      {src.publisher ? (
                        <span className="text-[color:var(--color-mute)]"> — {src.publisher}</span>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {/* Closing CTA — the free 60-second scan (§G). */}
          <aside
            className="blog-callout"
            style={{ marginTop: 'clamp(56px, 7vw, 96px)' }}
            aria-label="Run a free scan"
          >
            <p
              className="font-sans text-[color:var(--color-ink)]"
              style={{ fontSize: 'clamp(20px, 2.4vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}
            >
              See what agents read in your <Bracket>catalog</Bracket>.
            </p>
            <p className="text-[color:var(--color-ink-2)]" style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6 }}>
              A free 60-second scan reads four public pillars and reports your partial readiness score — no install required.
            </p>
            <Link href={SCAN_URL} className="btn btn-accent" style={{ marginTop: 20 }}>
              Run a free scan →
            </Link>
          </aside>
        </div>
      </article>

      <SiteFooter />
    </main>
  );
}
