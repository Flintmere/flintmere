# £197 Audit Deliverable — v1 spec

> 2026-05-09 — revenue sprint. Frozen until first 5 audits delivered.

## Why this exists

The audit-assist console (`/admin/audit-draft`) generates a draft. Status flows
`draft → reviewed → sent`. What "sent" *is* — the actual artefact the merchant
receives — has never been defined. This spec freezes v1 so the operator can
deliver a paid audit today.

## What the merchant gets for £197

A single markdown-rendered email (HTML body, no attachment) containing the
full audit. ~1,500–2,500 words. Sent from `hello@flintmere.com` via Resend,
reply-to the operator's address. Subject: `[shop] — your Flintmere AI-readiness audit`.

The body is the markdown export of the audit-draft (`auditDraftToMarkdown`),
rendered to HTML. No PDF attachment in v1 — gmail-renders-clean-HTML beats
PDF-in-attachment for open + read-through rate. PDF is a v2 ask.

### Sections (ordered)

1. **Executive summary** — 1 headline + 2-3 paragraph body. Voice: British,
   plain, no jargon. Frames the scoring framework + their grade in plain
   English. (auto-generated; operator edits in `/admin/audit-draft`)
2. **Estimated revenue impact** — the £-band wedge if available, otherwise
   the SKU-count fallback. (auto-generated)
3. **Top priorities** — 3 to 5 ranked priorities. Each with: rank, title,
   rationale, recommended action. (auto-generated, operator may reorder)
4. **Per-pillar findings** — for each of the 7 pillars where score is below
   80: the score, what's broken, 2-3 recommended fixes, confidence band.
   (auto-generated)
5. **What happens next** — operator-written paragraph. Two CTAs:
   - **£349/month Concierge retainer** — we keep the score moving, monthly
     re-scan + drift fixes + new-channel adapters as Google/Amazon/AI
     shopping standards change. Email reply to start.
   - **Re-scan after fixes** — `https://audit.flintmere.com/scan?url=[shop]`
     pre-filled. Free, takes 60 seconds.

### What it is NOT (v1)

- Not a PDF — markdown HTML body only
- Not interactive — no embedded charts, no live links to a hosted report page
- Not auto-sent — operator clicks send (Resend dashboard or manual)
- Not a custom-designed template — uses Flintmere's transactional email shell

## Delivery flow (operator runbook)

1. Generate draft: `/admin/audit-draft` → enter shop URL + band-1 + vertical → Generate
2. Review the draft pane. Edit headlines, top priorities, fix recommendations
   to read as if a human wrote them (because one did, in collaboration with
   Gemini Pro)
3. Click **Copy as markdown**
4. Open Resend dashboard → New email
5. To: merchant address (operator-supplied)
6. Subject: `[shop name] — your Flintmere AI-readiness audit`
7. Paste markdown body (Resend renders it)
8. Reply-to: operator address
9. Send
10. Back in `/admin/audit-draft` → mark as **sent** (`sentAt` set; status
    auto-advances to `sent`)

Total operator time per audit (after first 2 calibration runs): ~30-45 min
of editing + 5 min sending.

## Pricing → deliverable mapping

- **Band 1 (£197)** — ≤1,500 SKUs. This spec applies.
- **Band 2 (£397)** — 1,501-5,000 SKUs. Same shape, longer per-pillar
  sections (more issues to enumerate). +30 min operator time.
- **Band 3 (from £597)** — 5,001+ SKUs. Out of scope for v1; route to
  `hello@flintmere.com` for bespoke quote (already wired on `/audit`).

## What this lets us do this week

Sell, deliver, and bank £197s without touching code. The audit-assist console
already generates the draft. The markdown export already works. Resend is
already wired. The only thing that was missing was the freeze on what
"delivered" means.

## What needs building for v2 (after first 5 sales)

- One-click "Send to merchant" button in `/admin/audit-draft` (replaces the
  Resend-dashboard manual paste)
- Hosted report page with a tokenised URL (replaces email body)
- PDF export (CSS print stylesheet on the hosted page, headless-chromium
  render via worker)
- Retainer signup link + Stripe subscription wiring
