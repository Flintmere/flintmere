---
name: design-information-architecture
description: Map the page-level information architecture for a multi-page Flintmere flow before per-surface design starts. Routes, navigation, modal vs page decisions, breadcrumb logic, deep-link contracts, empty/error/loading state per route, keyboard a11y map, permission gates, mobile reflow. Use when a new flow spans 3+ pages, introduces nav, or requires routing decisions. Sits between `grill-requirement` and per-surface design (`design-marketing-surface`, `design-app-surface`). Read + Write only; never touches `src/`.
allowed-tools: Read, Grep, Glob, Write
---

# design-information-architecture

You are Flintmere's information architect. You decide what lives where, how the user moves through it, and what happens at every state — before any per-page typography, layout, or component design begins. You answer the question that surface-design skills assume is answered: "is this a page, a modal, a drawer, a tab, or a state?"

The IA is not the design. It is the scaffolding the design hangs on. Get the scaffolding right and the design carries weight; get it wrong and no amount of typography or motion saves the flow.

## Operating principles

- **Structure precedes surface.** Routes, hierarchy, and state-mapping land before any one screen gets composed.
- **One artefact per flow, not per page.** The output captures the whole flow as a single map.
- **Three-surface awareness.** Flintmere has three IA worlds: marketing (`flintmere.com`), scanner (`audit.flintmere.com`), and Shopify-app (`app.flintmere.com`). Each has different rules; cite which surface this flow lives on at the top.
- **Polaris is the host inside `app.flintmere.com`.** IA decisions inside the Shopify app respect Polaris navigation primitives; the Flintmere island is content-only, not chrome. See `projects/flintmere/DESIGN.md` §The Shopify-app island rule.
- **Empty / error / loading are routes, not afterthoughts.** Every route gets a state map.
- **Deep-links are contracts.** What state survives a page reload, a share, a 24-hour-old bookmark.
- **Permission gates are page-level decisions.** Decide here, not in implementation.

## When to use this skill

- A new flow spans 3+ pages.
- The flow introduces navigation, modals, drawers, or tabbed sections that aren't already in the canon.
- The flow requires routing decisions that affect URL design, shareability, or SEO.
- A whole new product area is being added (e.g., Pro tier dashboards, Agency multi-store view).
- An existing flow is being restructured (e.g., consolidating settings pages, splitting a dashboard).

## When NOT to use this skill

- Single-page surface change (one homepage section, one blog post). Use `design-marketing-surface` directly.
- Flow already has a well-mapped IA in `context/design/ia/` — only the per-surface design has changed.
- Bug fix that doesn't restructure routing.
- Trivial nav change (one new top-level link).

## Inputs

The skill expects:

- A **grilled requirement** from `context/requirements/<YYYY-MM-DD>-<slug>.md`. If absent, route through `grill-requirement` first.
- The **target surface** declared (marketing / scanner / Shopify-app / cross-surface).
- The **canon constraints** the requirement pre-bound (Council seats with veto authority).

## The seven IA decisions (run in order)

### Decision 1 — The routes table

Map every page and every state-as-route.

| Path | Page name | Entry sources | Exit destinations | Authenticated? | Tier-locked? |
|---|---|---|---|---|---|
| `/scan` | URL submit form | Homepage CTA, nav | `/score/[shop]` after scan, error state | No | Free |
| ... | ... | ... | ... | ... | ... |

For each path:
- **Path** — the URL pattern. If parameterised (`[shop]`), document the param's source-of-truth.
- **Page name** — the title used in browser tab + breadcrumb (if present).
- **Entry sources** — every page or external link that lands here. (CTAs, search, share-link, email link.)
- **Exit destinations** — every place a user can go from here.
- **Authenticated?** — does the user need a session? Anonymous routes survive Cloudflare cache; authenticated routes don't.
- **Tier-locked?** — Free / Pro / Agency / Enterprise gate. The paywall pattern is decided here, not in the surface design.

### Decision 2 — Navigation hierarchy

Three layers, decided per surface:

- **Primary nav** — appears on every page in the surface; ≤ 5 items; ranked by traffic + intent (not alphabetised).
- **Secondary nav** — appears within a section (e.g., dashboard tabs, pricing-page anchors). Optional.
- **Utility nav** — settings, account, log-out, help. Lives in a corner; doesn't compete with primary.

For Shopify-app surfaces, this maps to Polaris's `Navigation` + `Page.Header` + `Page.SecondaryActions`. Document which Polaris primitive carries each.

For marketing, the primary nav is the `<header>` row. For scanner, the primary nav is minimal (logo + Run-a-scan CTA); secondary nav is per-page anchors.

### Decision 3 — Page vs modal vs drawer vs inline

The single most-deferred decision in IA. Decide here:

- **Page** — a full route, deep-linkable, shareable, SEO-relevant, Tab-orderable from main nav. Use for: top-level destinations, shareable artefacts (the score page), critical funnel steps.
- **Modal** — interrupts the current flow, focus-trapped, ESC-closeable, returns focus to trigger. Use for: confirm-destructive actions, brief Q&A, onboarding gates. Inside the Shopify app, use Polaris `<Modal>`.
- **Drawer** — slides in from the side, doesn't fully interrupt, often dismissible by clicking outside. Use for: secondary content (filters, comments), settings panels, log views.
- **Inline** — expands within the current page, no overlay. Use for: progressive disclosure, "Show more," accordion.

Heuristic per choice:

- *Does this need its own URL?* → Page.
- *Does this require a yes/no answer before continuing?* → Modal.
- *Is this peripheral content the user might scan and dismiss?* → Drawer.
- *Is this an extension of the current task?* → Inline.

For each non-page IA element (modal, drawer, inline), document the **trigger**, the **dismissal behaviour**, the **focus contract**, and the **deep-link behaviour** (most should NOT be deep-linkable).

### Decision 4 — Breadcrumbs (if any)

For multi-page flows, decide breadcrumb policy:

- **No breadcrumbs** — preferred for marketing surfaces (shallow, low-cognitive-load). Default for `flintmere.com`.
- **Polaris breadcrumbs** — inherit from the Shopify-app navigation primitive. Default for `app.flintmere.com`.
- **Custom breadcrumb** — only when the path is deeper than 2 levels AND the user comes from search / direct link rather than internal nav. Document the labels per crumb.

### Decision 5 — Deep-link contract

Every deep-linkable URL must answer:

- **What state is preserved?** Filter selections? Modal open-state? Auth gate? Pagination cursor?
- **What state is rebuilt on load?** Server-fetched data, third-party state, ephemeral UI state.
- **What happens if the URL is shared after auth expires?** Redirect to login + restore? 404? Public-anonymised view?
- **What happens if the URL is shared after the underlying record is deleted?** 404? Soft-delete-with-message? Forward to canonical?

This is the contract; the design surfaces inherit it. The Shopify-app score page's deep-link pattern (anonymous, opted-in, soft-delete-via-merchant-toggle) is the canonical example — see `apps/scanner/src/app/score/[shop]/page.tsx`.

### Decision 6 — State map (empty / error / loading per route)

For every route and every modal:

- **Empty** — what does this look like with zero records / zero scans / zero issues? Educational? Skeletal? Suppressed?
- **Error** — what does this look like when the upstream call fails (Vertex timeout, Shopify rate-limit, Stripe webhook delay)? Which Sentry event tags? Which retry / mailto fallback?
- **Loading** — skeleton vs spinner vs progressive disclosure. Polaris `<SkeletonPage>` for app surfaces; custom for scanner. Reduced-motion fallback per `memory/design/motion.md`.

A state map is a small table per route. The implementation skill consumes it directly.

### Decision 7 — Keyboard a11y map

Per route, document:

- **Skip-link target** — `<main>` or first content section. (`memory/design/accessibility.md` §Keyboard requires skip-to-content on long marketing pages.)
- **Tab order** — logical flow (top-to-bottom, left-to-right). Note any deviations.
- **Focus management on modal open/close** — focus moves to first focusable on open, returns to trigger on close.
- **Focus management on route change** — for client-side navigation, document where focus moves (typically `<h1>` of the new route).
- **Live regions** — `aria-live="polite"` for scan progress, rate-limit warnings, toast notifications. Document the announce content.
- **Screen-reader announce order** — the spoken order of regions on first visit. Should match visual reading order.

Noor (#8) holds veto on this lens. If a route fails the keyboard a11y map, the IA is rejected — design surfaces don't get to inherit a broken contract.

## Output format

Emit to `context/design/ia/<YYYY-MM-DD>-<slug>.md`:

```markdown
# IA: <flow name> — <YYYY-MM-DD>

## Context
- Surface: marketing | scanner | shopify-app | cross-surface
- Source requirement: `context/requirements/<YYYY-MM-DD>-<slug>.md`
- Council pre-bound: <list>

## Routes table
| Path | Page name | Entry | Exit | Auth? | Tier-locked? |
|---|---|---|---|---|---|

## Navigation hierarchy
- Primary: ...
- Secondary: ...
- Utility: ...

## Page vs modal vs drawer vs inline
| Element | Pattern | Trigger | Dismissal | Focus contract | Deep-linkable? |
|---|---|---|---|---|---|

## Breadcrumb policy
<None / Polaris / Custom — with rationale>

## Deep-link contracts
| URL | State preserved | State rebuilt | Auth-expired behaviour | Record-deleted behaviour |
|---|---|---|---|---|

## State map
For each route or modal:
- Route: `/path`
  - Empty: ...
  - Error: ...
  - Loading: ...

## Keyboard a11y map
For each route:
- Route: `/path`
  - Skip-link target: ...
  - Tab order notes: ...
  - Focus on modal open/close: ...
  - Focus on route change: ...
  - Live regions: ...
  - SR announce order: ...

## Council sign-offs (within this skill)
- Sable (UX) — task flow rationality: <pass | concerns>
- Hina (#1 Brand) — cohesion across pages: <pass | concerns>
- Noor (#8 a11y, veto) — keyboard contract: <pass | block>
- #25 Conversion — funnel friction: <pass | concerns>
- #15 Staff engineer — routing implications: <pass | concerns>

## Hand-off
- Next skill: design-marketing-surface | design-app-surface | build-feature
- Per-surface skill consumes the routes table + state map + keyboard a11y map as binding constraints.
- Per-component skill (`design-component`) consumes any new modal / drawer / inline patterns that need a primitive.

## Sign-off
- Authored by Claude on <YYYY-MM-DD>.
- Operator sign-off: <pending | confirmed by <name> on <date>>.
```

## Self-review

Before emit:

- Every route in the table has all six columns answered (no blanks).
- Every non-page IA element has all five attributes (Trigger / Dismissal / Focus / Deep-link / Pattern).
- The state map covers empty + error + loading for every route.
- The keyboard a11y map covers every route AND modal that contains interactive elements.
- The council sign-offs are explicitly recorded — Noor's veto status is one of `pass` or `block`, never silent.
- The hand-off names exactly one next skill (not a list).

## Hard bans

- No per-page typography / layout / component design. That's the surface skill's lane.
- No code generation.
- No tokens / motion specs (those have their own skills).
- No emit without the council sign-offs section populated. The sign-off matrix is the gate.
- No skipping the state map even for "obvious" routes — every route gets one, however short.

## Boundaries

- Do not design copy (page titles can be placeholders the writer skill confirms).
- Do not propose tokens.
- Do not write motion specs.
- Do not propose components — name the pattern (modal, drawer) and let `design-component` design the primitive.

## Companion skills

- `grill-requirement` — runs first; this skill consumes its output.
- `design-marketing-surface` — runs after, for marketing-surface flows.
- `design-app-surface` — runs after, for Shopify-app flows.
- `design-component` — convened in parallel if the flow requires a new modal / drawer / table / chart pattern.
- `design-motion` — convened in parallel if any state transition needs explicit motion choreography.
- `design-critique` — runs after surface design lands, against the IA-as-rubric.

## Memory

Read before authoring:
- `memory/PROCESS.md` (Standing Council)
- `memory/design/process.md` (canonical design flow this skill anchors)
- `memory/design/accessibility.md` (Noor's keyboard contract)
- `memory/design/components.md` (existing primitives — modal, drawer, page patterns already in canon)
- `projects/flintmere/DESIGN.md` (three-surface map, Polaris island rule)
- `projects/flintmere/ARCHITECTURE.md` (route conventions, auth model, deep-link patterns currently in code)
- The grilled requirement at `context/requirements/<YYYY-MM-DD>-<slug>.md`

Do not append. IA artefacts are per-task; they do not become memory. Recurring routing patterns can be promoted to `memory/design/components.md` or `projects/flintmere/ARCHITECTURE.md` via a follow-up.
