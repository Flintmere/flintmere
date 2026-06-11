/**
 * Blog content gate (blog-system, editorial standard §F). Run in CI
 * (.github/workflows/lint.yml) + locally (`pnpm -F scanner blog:validate`).
 * Assistive — informs the human reviewer who reads + merges; it does not
 * replace the read. A post failing any HARD check exits non-zero and blocks
 * merge.
 *
 * HARD checks (block merge):
 *   - frontmatter passes the zod schema (parsePost throws otherwise)
 *   - filename slug === frontmatter slug (parsePost enforces)
 *   - author resolves in authors.ts
 *   - word count ≥ WORD_FLOOR (2300 — ~8% under the 2500 target, plan Q4)
 *   - ≥ MIN_SOURCES primary-source citations (authority §B)
 *   - ≥ MIN_FAQ FAQ entries (AEO §D / template §G)
 *   - no banned phrase (VOICE.md) and no AI-tell (§A)
 *   - JSON-LD builds without throwing
 *   - slugs unique across the corpus
 *
 * The author-truthfulness and per-claim source checks are HUMAN — this gate
 * cannot judge them; it only enforces the mechanical floors.
 */

import { existsSync } from 'node:fs';
import { getPostSlugs, getPostBySlug, BLOG_DIR } from '../src/lib/blog/posts';
import { authorExists } from '../src/lib/blog/authors';
import { postJsonLd } from '../src/lib/blog/jsonld';
import { findAiTell, findBannedPhrase } from '../src/lib/blog/lint';

const WORD_FLOOR = 2300;
const MIN_SOURCES = 2;
const MIN_FAQ = 3;

function main(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!existsSync(BLOG_DIR)) {
    console.log(`No blog directory at ${BLOG_DIR} — nothing to validate.`);
    return;
  }

  const slugs = getPostSlugs();
  const seen = new Set<string>();
  let validated = 0;

  for (const slug of slugs) {
    let post;
    try {
      post = getPostBySlug(slug);
    } catch (err) {
      errors.push(`${slug}.mdx — ${(err as Error).message}`);
      continue;
    }
    if (!post) continue;
    validated += 1;

    const fm = post.frontmatter;
    const where = `${slug}.mdx`;

    if (seen.has(fm.slug)) errors.push(`${where} — duplicate slug "${fm.slug}"`);
    seen.add(fm.slug);

    if (!authorExists(fm.author)) {
      errors.push(`${where} — unknown author "${fm.author}" (add to authors.ts)`);
    }

    if (post.wordCount < WORD_FLOOR) {
      errors.push(`${where} — ${post.wordCount} words, below floor ${WORD_FLOOR}`);
    }

    if (fm.sources.length < MIN_SOURCES) {
      errors.push(`${where} — ${fm.sources.length} sources, need ≥${MIN_SOURCES} (authority §B)`);
    }

    if (fm.faq.length < MIN_FAQ) {
      errors.push(`${where} — ${fm.faq.length} FAQ entries, need ≥${MIN_FAQ} (AEO §D)`);
    }

    // Scan body + the human-readable frontmatter strings (title/description/faq).
    const haystack = [
      post.body,
      fm.title,
      fm.description,
      ...fm.faq.flatMap((f) => [f.q, f.a]),
    ].join('\n');

    const banned = findBannedPhrase(haystack);
    if (banned) errors.push(`${where} — banned phrase "${banned}" (VOICE.md)`);

    const tell = findAiTell(haystack);
    if (tell) errors.push(`${where} — AI-tell "${tell}" (editorial standard §A)`);

    try {
      JSON.parse(
        postJsonLd(post)
          .replace(/\\u003c/g, '<')
          .replace(/\\u003e/g, '>')
          .replace(/\\u0026/g, '&'),
      );
    } catch (err) {
      errors.push(`${where} — JSON-LD failed to build: ${(err as Error).message}`);
    }

    if (fm.draft) warnings.push(`${where} — draft:true (will not publish until set false)`);
  }

  for (const w of warnings) console.log(`⚠ ${w}`);

  if (errors.length > 0) {
    console.error(`\n✗ blog:validate failed — ${errors.length} error(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`\n✓ blog:validate passed — ${validated} post(s) checked.`);
}

main();
