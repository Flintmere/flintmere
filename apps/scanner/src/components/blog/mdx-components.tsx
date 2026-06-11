import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Bracket } from '@flintmere/ui';

/**
 * MDX component map for blog posts (blog-system). Standard elements (h2, p,
 * ul, table…) are styled by the .blog-prose CSS block in globals.css, so the
 * map only overrides what needs behaviour, plus the custom answer-first blocks
 * the editorial standard §G requires authors to use.
 *
 * RSC-safe: every component here is a Server Component (next/link + next/image
 * render on the server). Passed to <MDXRemote components={mdxComponents} />.
 */

/** Anchor: internal → next/link (prefetch); external → new-tab + rel. */
function Anchor({ href = '', children }: { href?: string; children?: ReactNode }) {
  const external = /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

/** TL;DR / key-takeaways slab (AEO answer-first, §D). */
function Callout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <aside className="blog-callout" aria-label={label}>
      <p className="blog-callout__label">{label}</p>
      {children}
    </aside>
  );
}

function TLDR({ children }: { children: ReactNode }) {
  return <Callout label="TL;DR">{children}</Callout>;
}

function KeyTakeaways({ children }: { children: ReactNode }) {
  return <Callout label="Key takeaways">{children}</Callout>;
}

/** Definition block for a named entity — AI engines lift these verbatim. */
function Definition({ term, children }: { term: string; children: ReactNode }) {
  return <Callout label={`Definition · ${term}`}>{children}</Callout>;
}

/**
 * Inline figure proving a point (editorial standard §E — existing imagery
 * canon, never decorative). next/image for LCP + weight discipline; alt is
 * mandatory (Noor #8 veto) — TypeScript requires it.
 */
function Figure({
  src,
  alt,
  caption,
  width = 1280,
  height = 720,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  return (
    <figure>
      <Image src={src} alt={alt} width={width} height={height} sizes="(max-width: 768px) 100vw, 720px" />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export const mdxComponents = {
  a: Anchor,
  Bracket,
  TLDR,
  KeyTakeaways,
  Definition,
  Figure,
};
