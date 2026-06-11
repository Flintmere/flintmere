import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { frontmatterSchema, type BlogFrontmatter } from './schema';

/**
 * Filesystem-backed blog loader (editorial standard + blog-system plan). Posts
 * are MDX files in apps/scanner/content/blog/<slug>.mdx. Pure functions; the
 * directory is injectable so tests run against a fixtures dir (mirrors the
 * repo's fake-client testability ethos).
 *
 * RSC-only — uses node:fs. Never import from a Client Component.
 */

export const BLOG_DIR = join(process.cwd(), 'content', 'blog');

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  /** Raw MDX body (frontmatter stripped) — compiled at the route via MDXRemote. */
  body: string;
  wordCount: number;
  readingMinutes: number;
}

/** Parse + validate a single MDX file. Throws with the slug on bad frontmatter. */
export function parsePost(raw: string, fileSlug: string): BlogPost {
  const { data, content } = matter(raw);
  const parsed = frontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`invalid frontmatter in ${fileSlug}.mdx — ${issues}`);
  }
  if (parsed.data.slug !== fileSlug) {
    throw new Error(`slug mismatch in ${fileSlug}.mdx — frontmatter slug is "${parsed.data.slug}"`);
  }
  const stats = readingTime(content);
  return {
    frontmatter: parsed.data,
    body: content,
    wordCount: stats.words,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
  };
}

export function getPostSlugs(dir: string = BLOG_DIR): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''));
}

export function getPostBySlug(slug: string, dir: string = BLOG_DIR): BlogPost | null {
  const file = join(dir, `${slug}.mdx`);
  if (!existsSync(file)) return null;
  return parsePost(readFileSync(file, 'utf8'), slug);
}

/**
 * All posts, newest first. Drafts excluded unless includeDrafts (the CI gate
 * validates drafts too; public routes never see them).
 */
export function getAllPosts(includeDrafts = false, dir: string = BLOG_DIR): BlogPost[] {
  return getPostSlugs(dir)
    .map((slug) => getPostBySlug(slug, dir))
    .filter((p): p is BlogPost => p !== null)
    .filter((p) => includeDrafts || !p.frontmatter.draft)
    .sort((a, b) => b.frontmatter.publishedAt.localeCompare(a.frontmatter.publishedAt));
}
