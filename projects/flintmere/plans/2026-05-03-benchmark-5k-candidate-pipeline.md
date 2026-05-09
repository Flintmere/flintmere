# Plan: Benchmark scale to 5,000 qualifying scans (candidate supply chain)

**Status:** implementation handoff for Claude Code / engineering  
**Owner:** operator + scanner app (`apps/scanner`)  
**Created:** 2026-05-03  

This document is the **no-holds-barred** spec: problem definition, architecture, file contracts, scripts to build, runbook, risks, and success criteria. Implement **exactly** what is specified unless ADR or legal review overrides.

---

## 1. Executive summary

**Problem:** The public benchmark on `audit.flintmere.com` (`/research`, `/for/*`, `GET /api/benchmark/summary`) is limited by **how many qualifying `scanner_scans` rows exist in production Postgres**, not by the scoring engine.

**Root cause:** **Sourcing** — a large, deduplicated, validated list of **public Shopify storefront domains** with **vertical** hints, fed through the existing **compile → FlintmereBot batch scan** pipeline.

**Solution shape:** A **repeatable candidate supply chain**: **raw intake → normalise + dedupe → `candidates.csv` → `benchmark:compile` → `stores.csv` → `benchmark:scan` against `BASE_URL=https://audit.flintmere.com`** with **resume + pacing**. Add **observability** (gap to target, per-source reject rates).

**Paid tools:** **Not required** for the architecture. **Optional** later: licensed store lists (StoreLeads, etc.) as **one adapter** — out of scope unless operator procures a licence.

---

## 2. Product and claims context

- **Canonical benchmark endpoint:** `apps/scanner/src/app/api/benchmark/summary/route.ts`  
  - Rows counted: `status === 'complete'`, `score` and `grade` non-null, and (`source === 'bot'` OR `publishedToBenchmark === true`).

- **Publish framing:** `BENCHMARK_PUBLISH_FLOOR = 100` in `apps/scanner/src/lib/copy.ts` — overall vs per-vertical semantics already documented there and in `/for/*` pages.

- **Public claims:** Any headline “N stores” must match **this qualifying definition** or **claim-review** must approve alternate wording. Do **not** equate “candidates pasted” with “stores in benchmark.”

- **Ethics / README:** `data/benchmark/README.md` — do not build **mass automated scraping** of third-party directories against ToS. **Allowlisted URLs / exports / manual lists** are in bounds.

---

## 3. Current repo capabilities (do not reinvent)

| Piece | Location | Role |
|-------|-----------|------|
| Validate Shopify storefront | `apps/scanner/scripts/compile-store-list.ts` | `candidates.csv` → `stores.csv` + `stores.report.json` |
| Batch scan | `apps/scanner/scripts/batch-scan.ts` | `stores.csv` → `POST /api/scan` as FlintmereBot; `RESUME`, `PACE_MS`, `FILTER_VERTICAL`, `BASE_URL` |
| Qualifying counts | `apps/scanner/scripts/benchmark-qualifying-count.ts` | DB counts vs `BENCHMARK_PUBLISH_FLOOR` (same filters as summary API) |
| Cohort diagnose | `apps/scanner/scripts/cohort-funnel-diagnose.ts` | Funnel snapshot (leads, etc.) |

**npm scripts** in `apps/scanner/package.json` — extend with new commands; keep names `benchmark:*` for discoverability.

---

## 4. Target metric (single source of truth)

**Primary success metric:**  
`GET https://audit.flintmere.com/api/benchmark/summary` → JSON field **`overall.n`** ≥ **5000**.

That **`n`** is **not**:
- lines in `candidates.csv`,
- rows in `stores.csv`,
- successful batch-script “ok” lines only (DB may differ slightly due to prior state),
- attempts or failed scans.

**Secondary (optional):** per-vertical **`byVertical.*.n`** for `/for/food-and-drink`, `/for/beauty`, `/for/apparel` — not required for “5000 overall” but may matter for UX balance.

**Integrity upgrade (future ADR, not blocking 5k rows):**  
dedupe benchmark **by `normalisedDomain`** for marketing “5000 unique merchants” — **out of scope** for this plan’s MVP unless product insists.

---

## 5. Gap arithmetic

Let **`N₀`** = current production **`overall.n`** (curl summary or `benchmark:qualifying` with prod `DATABASE_URL`).

**Delta:** **`Δ = 5000 − N₀`** qualifying rows still needed.

Order-of-magnitude for **candidate domains** to ingest (through compile):

- Assume compile accepts **~50–75%** of candidate domains (source-dependent).
- Assume scan batch **~90–98%** `ok` under gentle pacing (transient `fetch-failed` happens).

**Rough:** need **~1.3–2.0×** raw unique domains vs **`Δ`** through the full pipeline to land **`Δ`** qualifying rows **from new scans alone** — more if many sources are junk.

**Concrete:** If **`Δ ≈ 4600`**, plan **~7k–9k** **new** validated `stores.csv` rows **cumulative** over time (or fewer if compile yield is excellent).

---

## 6. Architecture (new vs existing)

```
┌─────────────────────────────────────────────────────────────────┐
│ SOURCES (human / allowlisted Crawl4AI / pasted exports)          │
│ → candidates.raw.csv (append-only, messy allowed)                │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ NEW: benchmark:merge-candidates                                │
│  · parse URLs/domains, normalise host, https default             │
│  · dedupe by normalised host (policy: one row per host)         │
│  · merge with existing candidates.csv                            │
│  · optional: preserve vertical = first-wins or last-wins (DOC)  │
│  · emit merge.report.json (counts, collisions)                 │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ candidates.csv  (url,vertical)  — compile contract               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXISTING: benchmark:compile                                     │
│  → stores.csv, stores.report.json                               │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ EXISTING: benchmark:scan                                       │
│  BASE_URL=https://audit.flintmere.com                           │
│  CONCURRENCY=1, PACE_MS=2500 (default for prod scale)           │
│  RESUME=true, OUTPUT=…jsonl                                     │
└────────────────────────────┬────────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ PROD Postgres · scanner_scans                                    │
│ → /api/benchmark/summary overall.n                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data contracts

### 7.1 `data/benchmark/candidates.raw.csv` (new, gitignored except README note)

**Purpose:** Operator and tooling dump **everything** here first.

**Suggested columns (header row):**

```text
url_or_domain,vertical,source,ingested_at
```

- **`url_or_domain`:** `brand.com`, `https://brand.com/path`, `www.brand.co.uk` — merge step normalises.
- **`vertical`:** must align with research slugs where possible: `food-and-drink`, `beauty`, `apparel`, or `unknown` if merged later.
- **`source`:** free text for analytics (`clipara-food-blog`, `manual-may-2026`, `listicle-url-…`).
- **`ingested_at`:** ISO date.

**Git:** Path should remain **gitignored** like other `data/benchmark/*` PII-adjacent artefacts; only document in `data/benchmark/README.md`.

### 7.2 `data/benchmark/candidates.csv` (existing contract)

**Compile parser today:** `apps/scanner/scripts/compile-store-list.ts` — `parseCsv` splits first comma into `url`, second into `vertical`.

**Decision for implementer:**

- **Option A (minimal):** Merge script outputs **exactly** `url,vertical` two columns only; provenance lives only in `candidates.raw.csv`.
- **Option B:** Extend `compile-store-list.ts` to accept optional trailing columns **ignored** for validation — only if product wants provenance in one file. Prefer **Option A** for MVP.

### 7.3 Normalisation rules (merge script — specify in code comments)

- Trim whitespace.
- If no scheme, prepend `https://`.
- Parse URL; **authoritative key** = **hostname** lowercase, strip leading `www.` (single rule — document choice).
- Drop obviously invalid hosts (empty, localhost, IP literals per shopify-fetcher private-host rules optional duplicate — compile will reject anyway).

**Collision policy when two rows same host different vertical:**  
**Document one:** e.g. **first occurrence wins** OR **last wins** — pick one and log in `merge.report.json`.

---

## 8. Scripts to implement (MVP)

### 8.1 `apps/scanner/scripts/merge-candidate-stores.ts` (name flexible)

**CLI behaviour:**

- Inputs:
  - **`--raw`** path default `data/benchmark/candidates.raw.csv` (optional if stdin).
  - **`--out`** path default `data/benchmark/candidates.csv`.
  - **`--existing`** optional path to seed existing candidates if not merging from current file only.
- Reads raw + existing `candidates.csv`, applies normalisation + dedupe, writes **`out`**.
- Writes **`data/benchmark/merge.report.json`** with:
  - `rawRows`, `existingRows`, `outputRows`, `duplicatesDropped`, `invalidDropped`, `collisions`.

**Tests:** unit tests for normalisation edge cases (`HTTP`, capitals, paths, `www`).

### 8.2 `apps/scanner/scripts/benchmark-gap.ts` (thin wrapper)

- Calls production summary URL **or** uses Prisma with **`DATABASE_URL`**:
  - Prints **`N₀`**, **`Δ = 5000 − N₀`**, and optional **rate** if given prior snapshot file.
- No DB credentials required if operator only uses **curl** — implement **both** paths behind flag.

### 8.3 Optional Phase 2: `apps/scanner/scripts/intake-paste.ts`

- Read lines from stdin → append **`candidates.raw.csv`** with **`source=stdin`** and **`ingested_at=now()`**.
- Vertical flag **`--vertical=food-and-drink`**.

### 8.4 Optional Phase 2: Crawl4AI adapter (**separate** Python or Node micro-tool)

- **Out of repo** acceptable if deps heavy — but prefer **documented** `tools/benchmark-extract/` with `pyproject.toml` if in-repo.
- **Input:** JSON file of **allowlisted article URLs** only.
- **Output:** append **`candidates.raw.csv`**.
- **No** broad crawling without allowlist — enforce in code.

---

## 9. `package.json` scripts (add)

```json
"benchmark:merge": "tsx scripts/merge-candidate-stores.ts",
"benchmark:gap": "tsx scripts/benchmark-gap.ts"
```

Document in `data/benchmark/README.md` with copy-paste **runbook** (section 11).

---

## 10. Operator runbook (production)

**Prerequisites:** Laptop/network stable; **`stores.csv`** path correct; prod scanner healthy.

1. **Gap check**

   ```bash
   curl -s https://audit.flintmere.com/api/benchmark/summary | jq '.overall.n'
   ```

2. **Intake session** — append domains to **`candidates.raw.csv`** (200–500 rows per session is a good cadence).

3. **Merge**

   ```bash
   pnpm --filter scanner benchmark:merge
   ```

4. **Compile**

   ```bash
   pnpm --filter scanner benchmark:compile
   ```

   Inspect **`data/benchmark/stores.report.json`** — if reject rate high, **fix source**, not compile.

5. **Scan prod**

   ```bash
   BASE_URL=https://audit.flintmere.com CONCURRENCY=1 PACE_MS=2500 \
     pnpm --filter scanner benchmark:scan
   ```

6. **Re-check gap** — repeat until **`overall.n ≥ 5000`.

**Resume:** Never delete **`scans.jsonl`** unless intentional full rerun — duplicates in DB may occur if same domain scanned twice; track as **integrity follow-up**.

---

## 11. Testing requirements

- **Unit:** URL normalisation + dedupe collisions.
- **Integration (optional):** dry-run merge on fixture CSVs under `apps/scanner/scripts/__fixtures__/benchmark-merge/` (small committed samples **without** real merchant domains if policy prefers synthetic hosts).

---

## 12. Observability

- **`benchmark:qualifying`** against prod DB when **`DATABASE_URL`** available — shows per-vertical qualifying counts.
- **`merge.report.json`** + **`stores.report.json`** — track **source quality** by correlating `source` column in raw with rejects (manual spreadsheet join acceptable for MVP).

---

## 13. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| ToS violation crawling | Allowlist-only automation; human-driven list building |
| Shopify / edge 429 on outbound fetches from Coolify IP | `PACE_MS`, `CONCURRENCY=1`, pause runs |
| `fetch-failed` in batch | Resume; retry failed domains later |
| Inflated **n** from duplicate domains | Future unique-domain summary; document interim claims |
| Prod DB migration drift | Run **`pnpm prisma migrate`** only via normal process — scanner schema unchanged by this plan |

---

## 14. Out of scope (explicit)

- Changing **`GET /api/benchmark/summary`** aggregation logic (unless ADR for unique-domain **n**).
- Shopify App Store scraping or bypassing OAuth flows.
- Paid data vendor integration **code** without licence keys and compliance review.
- Auto-running scans from CI without operator approval (cost + kindness).

---

## 15. Definition of done

1. **`merge-candidate-stores`** merged to `main`, documented, tested.
2. **`benchmark-gap`** (or documented **`curl` one-liner** in README) for **`Δ`**.
3. **`data/benchmark/README.md`** updated with **raw → merge → compile → scan prod** loop.
4. Operator can reproduce **one full cycle** without touching TypeScript.
5. **`overall.n` ≥ 5000** on production summary JSON (verified by **`curl`**).

---

## 16. References (read before coding)

- `apps/scanner/scripts/compile-store-list.ts` — CSV parse, validation rules.
- `apps/scanner/scripts/batch-scan.ts` — env vars, resume semantics.
- `apps/scanner/src/app/api/benchmark/summary/route.ts` — qualifying query (mirror for gap script if DB-based).
- `apps/scanner/src/lib/copy.ts` — `BENCHMARK_PUBLISH_FLOOR`.
- `data/benchmark/README.md` — handling + gitignore conventions.

---

**End of handoff.**
