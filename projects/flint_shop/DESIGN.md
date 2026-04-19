# Flint Shop — Design System

Visual canon. Claude reads this when touching UI surfaces.

## TL;DR

One sentence: **what does it look like** and **why**.

## Tokens

Single source of truth in `tailwind.config.js` (+ `src/app/globals.css` for custom properties).

- **Surfaces:** <list bg-* tokens>
- **Text:** <list text-* tokens, note contrast ratios>
- **Accents:** <one-two brand colours>
- **Rules / borders:** <border-* tokens>
- **Type:** <display / body / mono stacks>

## Laws

1. <The guiding principle for this product's aesthetic>
2. <…>
3. <…>

## Components

Located in `src/components/ui/`.

| Component | Purpose |
|-----------|---------|
| `Button` | CVA variants: primary, secondary, ghost, … |
| `Card` | CardHeader / CardTitle / CardContent / CardFooter |
| `Modal` | Accessible dialog w/ focus trap |
| `Alert` | Semantic alerts + auto-dismiss toasts |
| <add> |  |

## Rules (non-negotiable)

1. **Tokens only.** No ad-hoc hex in `src/`. Propose via `design-token` skill.
2. **AA contrast.** Floor stated here; enforced by Noor (Design Council VETO).
3. **prefers-reduced-motion honoured everywhere.**
4. **No `<div onClick>`.** Semantic elements.
5. <add>

## ADRs

- `../decisions/0001-…md`
- …
