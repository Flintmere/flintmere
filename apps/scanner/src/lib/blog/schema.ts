import { z } from 'zod';

/**
 * Blog frontmatter contract — the single source of truth for what a post must
 * declare. Shared by the loader (posts.ts), the CI content gate
 * (scripts/validate-blog.ts), and the /blog routes. Per the editorial standard
 * context/plans/2026-06-10-blog-editorial-seo-standard.md.
 *
 * Clusters mirror memory/marketing/seo.md (the topic engine) — one post serves
 * exactly one cluster / search intent.
 */

export const BLOG_CLUSTERS = [
  'ai-shopping-agentic-commerce', // seo.md Cluster 1
  'catalog-readiness-scoring', //    seo.md Cluster 2 (our category)
  'gtin-identifier-guidance', //     seo.md Cluster 3
  'catalog-mapping-metafields', //   seo.md Cluster 4
  'shopify-app-discovery', //        seo.md Cluster 5
  'ai-agent-shopping-behaviour', //  seo.md Cluster 6
] as const;

export type BlogCluster = (typeof BLOG_CLUSTERS)[number];

// YAML auto-parses unquoted ISO dates into JS Date objects; coerce back to a
// 'YYYY-MM-DD' string so quoted and unquoted frontmatter validate identically.
const isoDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
    .refine((s) => !Number.isNaN(Date.parse(s)), 'date must be a real calendar date'),
);

const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  publisher: z.string().min(1).optional(),
});

const faqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const heroSchema = z.object({
  /** Path under /public (existing imagery canon — no AI generation per the standard §E). */
  src: z.string().min(1),
  /** Mandatory alt text — Noor #8 veto. */
  alt: z.string().min(1),
});

export const frontmatterSchema = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(50).max(160), // SEO meta-description window
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  cluster: z.enum(BLOG_CLUSTERS),
  author: z.string().min(1), // key into AUTHORS (authors.ts)
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  hero: heroSchema.optional(),
  /** Primary-source citations (authority rule §B) → Sources block + JSON-LD citation. */
  sources: z.array(sourceSchema).default([]),
  /** Q&A → FAQPage JSON-LD (AEO rule §D). */
  faq: z.array(faqSchema).default([]),
  draft: z.boolean().default(false),
});

export type BlogFrontmatter = z.infer<typeof frontmatterSchema>;
export type BlogSource = z.infer<typeof sourceSchema>;
export type BlogFaq = z.infer<typeof faqSchema>;
