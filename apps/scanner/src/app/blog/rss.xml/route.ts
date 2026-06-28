import { getAllPosts } from '@/lib/blog/posts';
import { getAuthor } from '@/lib/blog/authors';
import { postUrl } from '@/lib/blog/jsonld';

/**
 * /blog/rss.xml — RSS 2.0 feed of non-draft posts, newest first. Static
 * (rebuilt on deploy with the post set). Absolute URLs on the scanner host.
 */

export const dynamic = 'force-static';
export const revalidate = 3600;

const HOST = 'audit.flintmere.com';
const FEED_TITLE = 'Flintmere — Catalog data for AI shopping';
const FEED_DESC =
  'Field notes on catalog data quality, GTINs, metafields, and how AI shopping agents read your products.';

/** Escape the five XML predefined entities. */
function xml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** YYYY-MM-DD → RFC-822 date string (RSS pubDate format), UTC. */
function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString();
}

export function GET(): Response {
  const posts = getAllPosts();
  const self = `https://${HOST}/blog/rss.xml`;
  const built = posts[0]
    ? rfc822(posts[0].frontmatter.updatedAt ?? posts[0].frontmatter.publishedAt)
    : new Date(0).toUTCString();

  const items = posts
    .map((p) => {
      const fm = p.frontmatter;
      const url = postUrl(fm.slug, HOST);
      const author = getAuthor(fm.author);
      return `    <item>
      <title>${xml(fm.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <description>${xml(fm.description)}</description>
      <dc:creator>${xml(author.name)}</dc:creator>
      <pubDate>${rfc822(fm.publishedAt)}</pubDate>
    </item>`;
    })
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(FEED_TITLE)}</title>
    <link>https://${HOST}/blog</link>
    <description>${xml(FEED_DESC)}</description>
    <language>en-GB</language>
    <lastBuildDate>${built}</lastBuildDate>
    <atom:link href="${xml(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
