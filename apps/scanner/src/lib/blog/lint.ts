/**
 * Blog copy lint — the mechanical half of the editorial standard (§A voice +
 * VOICE.md banned phrases). Pure string functions, shared by the CI gate
 * (scripts/validate-blog.ts) and tested in lint.test.ts. Case-insensitive;
 * callers pass any text (body + frontmatter strings).
 *
 * Self-contained on purpose: no DB / prisma / app imports, so the CI gate
 * runs without a generated Prisma client. BANNED_PHRASES mirrors VOICE.md
 * (the canonical list) — the same set lib/social/queue-posts.ts enforces on
 * X posts. Keep the two in sync when VOICE.md changes.
 */

// VOICE.md banned phrases (mirror of lib/social/queue-posts BANNED_PHRASES).
export const BANNED_PHRASES = [
  'leverage', 'unlock', 'transform', 'synergy', 'supercharge', 'world-class',
  'industry-leading', 'ai-powered', 'best-in-class', 'ai-driven', 'game-changing',
  'revolutionary', 'disruptive', 'next-generation', 'guaranteed', 'bulletproof',
  'trusted by',
] as const;

// AI-tells the reviewer rejects on sight (editorial standard §A). Lowercase.
export const AI_TELLS = [
  'delve',
  'seamless',
  'realm',
  'tapestry',
  'moreover',
  'furthermore',
  'navigate the landscape',
  'testament to',
  'ever-evolving',
  'game-changer',
  "it's worth noting",
  'it is worth noting',
  "it's important to remember",
  'in conclusion',
  'to sum up',
  "in today's",
  'in the world of',
  'as businesses increasingly',
  "whether you're a", // both-sides padding ("whether you're a small merchant or…")
] as const;

// Single-word tells get word-boundary matching to avoid false positives
// ("realm" but not "overwhelm"). Multi-word phrases match as substrings.
const WORD_TELLS = new Set<string>([
  'delve',
  'seamless',
  'realm',
  'tapestry',
  'moreover',
  'furthermore',
]);

/** First AI-tell found in `text`, or null. */
export function findAiTell(text: string): string | null {
  const lower = text.toLowerCase();
  for (const tell of AI_TELLS) {
    if (WORD_TELLS.has(tell)) {
      if (new RegExp(`\\b${tell}\\b`, 'i').test(lower)) return tell;
    } else if (lower.includes(tell)) {
      return tell;
    }
  }
  return null;
}

/** First VOICE.md banned phrase found in `text`, or null. */
export function findBannedPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  return BANNED_PHRASES.find((b) => lower.includes(b)) ?? null;
}
