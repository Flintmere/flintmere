# OUTPUT

## TL;DR

- TypeScript strict. No `any` unless unavoidable.
- Mobile-first. WCAG AA on every component.
- File naming: `PascalCase.tsx` components, `camelCase.ts` utils/hooks, `route.ts` for API routes, `kebab-case.ts` for DB schemas.
- Use `cn()` + CVA for class composition.
- Tailwind classes first. CSS custom properties for theme tokens.
- No docstrings, comments, or type annotations on code you didn't change. Only comment where logic isn't self-evident.

## General coding standards

- TypeScript strict mode. No `any` types unless absolutely necessary.
- Use `cn()` from `src/lib/utils.ts` for conditional class merging.
- Use CVA (class-variance-authority) for component variants.
- Prefer Tailwind classes. Use CSS custom properties for theme tokens.
- All components must be accessible (WCAG AA). Use semantic HTML, ARIA labels, keyboard navigation.
- Mobile-first responsive design. Test at 375px, 768px, 1024px, 1440px.

## File naming

| Kind | Convention |
|------|-----------|
| Components | `PascalCase.tsx` |
| Utilities / hooks | `camelCase.ts` |
| API routes | `route.ts` inside descriptive directories |
| DB schemas | `kebab-case.ts` |

## Commit messages

- Present tense, imperative. "Add X" not "Added X" or "Adds X".
- First line ≤72 chars. Body explains *why*, not *what*.
- Scope prefix optional but consistent within a repo (e.g. `feat:`, `fix:`, `docs:`).

## Scope discipline

- Don't add features, refactor, or "improve" beyond what was asked.
- A bug fix doesn't need surrounding code cleaned up.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries.
- Don't use feature flags or backwards-compatibility shims when you can just change the code.
- Don't create helpers, utilities, or abstractions for one-time operations.
- Three similar lines of code is better than a premature abstraction.

## Comments and annotations

- No docstrings, comments, or type annotations on code you didn't change.
- Only add comments where logic isn't self-evident.
- Don't leave `// removed X` or `// TODO` breadcrumbs unless they're actionable and tracked.

## Changelog

- 2026-04-14: Split from `CLAUDE.md`.
