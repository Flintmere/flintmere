// ESLint 9 flat config — replaces the legacy `next lint` interactive
// setup which prompts (and fails in CI) when no eslintrc is present.
//
// `next lint` is being removed in Next.js 16; the canonical migration
// path is FlatCompat-bridged `eslint-config-next` invoked via the
// ESLint CLI directly. The two rule sets we extend match what
// `next lint` would have applied:
//   - next/core-web-vitals — Next.js plus the Web Vitals checks
//   - next/typescript      — Next.js TypeScript rule set
//
// Excluded paths:
//   - .next/**               build output
//   - node_modules/**        deps
//   - src/generated/**       prisma client + other generated code
//   - public/**              static assets
//   - *.config.{js,mjs,ts}   tooling configs (linter doesn't care)
//   - scripts/**             tsx CLI scripts run via tsx, not Next
//   - prisma/**              migrations + seed
//   - next-env.d.ts          Next-generated ambient types

import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'src/generated/**',
      'public/**',
      'scripts/**',
      'prisma/**',
      'next-env.d.ts',
      '*.config.js',
      '*.config.mjs',
      '*.config.ts',
      'sentry.*.config.ts',
    ],
  },
  ...compat.config({ extends: ['next/core-web-vitals', 'next/typescript'] }),
  {
    rules: {
      // `// the seven checks` style mono-uppercase eyebrows render as
      // JSX text children throughout the marketing surfaces (PillarWheel,
      // ManifestoChord, page sections). The rule's heuristic treats every
      // leading `//` as a forgotten comment — false positive against the
      // legibility-bracket-adjacent design canon. Trade-off accepted: we
      // lose the safety net for real "forgot to wrap a comment" cases.
      'react/jsx-no-comment-textnodes': 'off',
    },
  },
];
