# Flint Shop — Project Map

High-level facts about this product. Claude reads this on tasks that need repo layout, stack, env vars, or commands.

## TL;DR

One sentence: **what is it**, **who is it for**, **what does it cost**.

## Stack

- **Framework:** <Next.js 15 / SvelteKit / Rails / …>
- **Language:** <TypeScript / Ruby / Python …>
- **DB:** <Postgres / SQLite / …>
- **Hosting:** <Vercel / Fly / Railway …>
- **Payments:** <Stripe / none / …>
- **Auth:** <email OTP / OAuth / magic link / …>

## Repo layout

```
src/
├── app/                # routes
├── components/         # UI
├── lib/                # shared libs
└── …
```

## Commands

- `pnpm dev` — local dev server
- `pnpm build` — production build
- `pnpm test` — jest / vitest
- `pnpm lint` — eslint + prettier

## Env vars

See `.env.example`. Production values in <your-secrets-store>.

## Deployment

- Branch → Vercel (auto)
- Production promotion: <manual / auto on `main` / …>

## Related

- `ARCHITECTURE.md` — routes, DB schema, feature gates
- `DESIGN.md` — visual system
- `BUSINESS.md` — pricing, tiers, positioning
- `STATUS.md` — current phase + what's shipped
- `decisions/` — ADRs
