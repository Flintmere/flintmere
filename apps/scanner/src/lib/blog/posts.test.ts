import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { getAllPosts, getPostBySlug, getPostSlugs, parsePost } from './posts';

const FIXTURES = fileURLToPath(new URL('./__fixtures__', import.meta.url));

describe('blog posts loader', () => {
  it('lists slugs from the dir', () => {
    expect(getPostSlugs(FIXTURES).sort()).toEqual(['draft-post', 'good-post']);
  });

  it('excludes drafts by default, newest first', () => {
    const posts = getAllPosts(false, FIXTURES);
    expect(posts.map((p) => p.frontmatter.slug)).toEqual(['good-post']);
  });

  it('includes drafts when asked, sorted by publishedAt desc', () => {
    const posts = getAllPosts(true, FIXTURES);
    expect(posts.map((p) => p.frontmatter.slug)).toEqual(['draft-post', 'good-post']);
  });

  it('loads a post with word count + reading time', () => {
    const post = getPostBySlug('good-post', FIXTURES);
    expect(post).not.toBeNull();
    expect(post!.frontmatter.title).toBe('A Good Test Post');
    expect(post!.frontmatter.sources[0]?.publisher).toBe('GS1');
    expect(post!.wordCount).toBeGreaterThan(0);
    expect(post!.readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('returns null for an unknown slug', () => {
    expect(getPostBySlug('does-not-exist', FIXTURES)).toBeNull();
  });

  it('throws on a slug/filename mismatch', () => {
    const raw = `---\ntitle: X\ndescription: ${'x'.repeat(60)}\nslug: other\ncluster: catalog-readiness-scoring\nauthor: john-morris\npublishedAt: 2026-06-01\n---\nbody`;
    expect(() => parsePost(raw, 'good-post')).toThrow(/slug mismatch/);
  });

  it('throws on invalid frontmatter', () => {
    const raw = `---\ntitle: X\nslug: bad\n---\nbody`;
    expect(() => parsePost(raw, 'bad')).toThrow(/invalid frontmatter/);
  });
});
