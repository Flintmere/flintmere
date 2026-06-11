import { describe, it, expect } from 'vitest';
import { frontmatterSchema } from './schema';

const valid = {
  title: 'A Title',
  description: 'A description that is comfortably longer than the fifty-character minimum for SEO.',
  slug: 'a-title',
  cluster: 'catalog-readiness-scoring',
  author: 'john-morris',
  publishedAt: '2026-06-01',
};

describe('blog frontmatter schema', () => {
  it('accepts a valid post and applies array/draft defaults', () => {
    const r = frontmatterSchema.parse(valid);
    expect(r.sources).toEqual([]);
    expect(r.faq).toEqual([]);
    expect(r.draft).toBe(false);
  });

  it('rejects a non-kebab slug', () => {
    expect(frontmatterSchema.safeParse({ ...valid, slug: 'Not Kebab' }).success).toBe(false);
  });

  it('rejects an unknown cluster', () => {
    expect(frontmatterSchema.safeParse({ ...valid, cluster: 'nope' }).success).toBe(false);
  });

  it('rejects a malformed date', () => {
    expect(frontmatterSchema.safeParse({ ...valid, publishedAt: '01/06/2026' }).success).toBe(false);
    expect(frontmatterSchema.safeParse({ ...valid, publishedAt: '2026-13-40' }).success).toBe(false);
  });

  it('rejects a too-short description', () => {
    expect(frontmatterSchema.safeParse({ ...valid, description: 'too short' }).success).toBe(false);
  });

  it('rejects a bad source url', () => {
    const bad = { ...valid, sources: [{ title: 'x', url: 'not-a-url' }] };
    expect(frontmatterSchema.safeParse(bad).success).toBe(false);
  });
});
