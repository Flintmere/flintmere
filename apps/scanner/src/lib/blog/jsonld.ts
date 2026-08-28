import type { BlogPost } from './posts';
import { getAuthor } from './authors';
import { SCANNER_HOST } from '../host-routing';

/**
 * JSON-LD builders — the AEO/GEO surface (editorial standard §D). Every post
 * emits BlogPosting + FAQPage + BreadcrumbList so ChatGPT / Gemini / Copilot /
 * Perplexity can lift structured answers and cite us. Pure functions of the
 * post + host; no I/O. The route renders the output inside a single
 * <script type="application/ld+json"> using the @graph container.
 *
 * Validated in CI (scripts/validate-blog.ts) — a post whose FAQ/sources/dates
 * can't produce valid JSON-LD blocks merge.
 */

const ORG_NAME = 'Flintmere';
const ORG_LOGO = `https://${SCANNER_HOST}/icon.svg`;

/** Canonical absolute URL for a post on the scanner host. */
export function postUrl(slug: string, host = SCANNER_HOST): string {
  return `https://${host}/blog/${slug}`;
}

/** OG image URL for a post (the per-post opengraph-image route). */
export function postImageUrl(slug: string, host = SCANNER_HOST): string {
  return `https://${host}/blog/${slug}/opengraph-image`;
}

function blogPosting(post: BlogPost, host: string): Record<string, unknown> {
  const { frontmatter: fm } = post;
  const author = getAuthor(fm.author);
  return {
    '@type': 'BlogPosting',
    headline: fm.title,
    description: fm.description,
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt ?? fm.publishedAt,
    url: postUrl(fm.slug, host),
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(fm.slug, host) },
    image: postImageUrl(fm.slug, host),
    wordCount: post.wordCount,
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.role,
      ...(author.url ? { url: author.url } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: ORG_LOGO },
    },
    ...(fm.sources.length
      ? {
          citation: fm.sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.title,
            url: s.url,
            ...(s.publisher ? { publisher: s.publisher } : {}),
          })),
        }
      : {}),
  };
}

function faqPage(post: BlogPost): Record<string, unknown> | null {
  const { faq } = post.frontmatter;
  if (!faq.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

function breadcrumbs(post: BlogPost, host: string): Record<string, unknown> {
  const base = `https://${host}`;
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${base}/blog` },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.frontmatter.title,
        item: postUrl(post.frontmatter.slug, host),
      },
    ],
  };
}

/**
 * Full JSON-LD @graph for a post. Returns a JSON string ready to drop into a
 * <script type="application/ld+json"> tag. Throws (via getAuthor) on an
 * unknown author — caught at build time, never ships.
 */
export function postJsonLd(post: BlogPost, host = SCANNER_HOST): string {
  const graph: Record<string, unknown>[] = [blogPosting(post, host)];
  const faq = faqPage(post);
  if (faq) graph.push(faq);
  graph.push(breadcrumbs(post, host));
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  // Escape characters that could break out of the <script> tag when this is
  // injected via dangerouslySetInnerHTML. JSON.stringify does NOT escape '<',
  // so a literal '</script>' in frontmatter would otherwise close the tag.
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
