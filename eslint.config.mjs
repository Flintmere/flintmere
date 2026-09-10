// ESLint 9 flat config — workspace root.
//
// Why this file exists: ESLint 9 removed `.eslintrc` support, and only
// `apps/scanner` was migrated (2026-04-29, alongside the `next lint`
// removal). The other three `lint` scripts — `packages/scoring`,
// `packages/llm`, `apps/shopify-app` — kept running `eslint` against no
// config at all and had been exiting non-zero ever since. CI never caught
// it because `.github/workflows/lint.yml` only ran `pnpm -F scanner lint`.
//
// Flat config resolves from the working directory upward, so this single
// file serves every package that invokes `eslint` from its own directory.
// `apps/scanner` keeps its own config — the nearest one wins — because it
// needs the FlatCompat-bridged `eslint-config-next` rule sets, and it is
// ignored here so a root-level run doesn't lint it twice under the wrong
// rules (flat config does not cascade into nested configs).
//
// Rule scope is deliberately typescript-eslint's non-type-checked
// `recommended`. The type-checked variants need a `projectService` wired
// per package and cost roughly an order of magnitude more wall-clock for
// rules that mostly restate what `tsc --noEmit` already gates in each
// package's `typecheck` script.

import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/generated/**',
      'apps/scanner/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // The codebase already marks intentionally-unused parameters with a
      // leading underscore: signatures an interface mandates but the
      // implementation ignores. `completeVision(_opts)` on the OpenAI
      // fallback throws by design per ADR 0010, and Remix hands every
      // route a `_loadContext` most of them never read. typescript-eslint
      // does not honour that convention unless told to, so the three
      // "defined but never used" errors it raised were the linter missing
      // an established house rule, not the code being wrong.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
);
