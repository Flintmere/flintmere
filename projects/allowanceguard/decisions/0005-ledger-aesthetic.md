# 0005 — Ledger aesthetic on homepage

**Status:** Superseded by ADR 0007 (2026-04-17). Ledger is no longer the marketing-only canon — it is the unified canon across the product.
**Date:** 2026-04-14 (ADR written during refactor; aesthetic itself shipped earlier)
**Council:** Design Council (Maren, Idris, Sable, Kael, Noor with veto, Thane), #20 Brand copywriter, #17 Performance engineer

## Context

The homepage previously ran on the dark "Midnight Amber" / glass canon with WebGL backgrounds (Vanta NET). Performance and positioning concerns accumulated:

- Vanta NET added ~180KB to the bundle and hurt LCP.
- Glassmorphism read as generic SaaS, not as a considered security product.
- Voice of the product (#20) wanted "editorial financial publication" — authoritative, serious, paper-weight.
- The dashboard/docs were still working well on glass; the problem was specifically the marketing surface.

## Decision

Adopt the **Ledger aesthetic** on the homepage (marketing surface only):

- Warm bone paper (`bg-paper` #F7F5F0) as the default surface.
- Ink body text on paper. Oxblood (#2D0A0A) reserved for a single inverse moment (CTABand).
- Fraunces italic for display. IBM Plex Sans for body. JetBrains Mono for metadata.
- Signature move: oversized italic numerals as margin notation, paired with `.ledger-rule` double separator.
- Remove Vanta NET. No WebGL on marketing pages.
- Dashboard, docs, and account pages **remain on the glass/Midnight Amber canon**.

## Consequences

- Two active canons to maintain: Ledger (homepage) and glass (app). Clear boundaries enforced in `DESIGN.md`.
- Homepage bundle down ~180KB.
- New `.paper-*` utilities in `src/app/globals.css`.
- Noor's veto remains active: `ink-whisper` is the lowest contrast text allowed on paper (5.18:1).
- Copy has to be written to the aesthetic — editorial voice, not SaaS voice.

## Alternatives considered

- **Full redesign including app surfaces** — rejected: the app design works; don't fix what isn't broken. Also doubles the work.
- **Keep glass, drop Vanta** — rejected: solves performance but not positioning.
- **Pure minimalism (no signature move)** — rejected by the Design Council: fails the "One Signature Move" law.
