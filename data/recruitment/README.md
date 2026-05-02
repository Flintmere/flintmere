# data/recruitment/

Generated cohort exports for design-partner / beta / advocacy outreach.

**Contents are PII** (merchant emails + scan metadata) and gitignored. Do not check in CSVs from this directory. The README is the only tracked file.

## Generators

| Script | Purpose | Run |
|---|---|---|
| `apps/scanner/scripts/export-design-partner-cohort.ts` | UK food merchants, 100–5,000 SKUs, ≤ C grade, opt-in to benchmark — for Phase 1 Day-6 design-partner recruitment | `pnpm --filter scanner cohort:design-partners` |

## Output convention

Each generator writes two files dated `YYYY-MM-DD`:

- `<cohort-name>-<date>.csv` — one row per merchant, header row, RFC 4180-escaped.
- `<cohort-name>-<date>.report.json` — filter parameters, total counts, grade tally.

Re-run any day for a fresh snapshot; outputs are non-destructive (different filename per day).

## Handling

1. Open the CSV in a desktop spreadsheet (Numbers / Excel / LibreOffice). Do not paste rows into Slack, Notion, or any third party.
2. Outreach copy lives in `context/marketing/`. Operator sends from a personal mail client; no bulk-send tooling.
3. After send, append the merchant + send-date + outcome to a local outreach log (operator-maintained, off-repo).
4. Delete CSVs older than 30 days from local disk; they're snapshot exports, not records.

## Consent posture

The default cohort filter requires `publishedToBenchmark = true` AND `unsubscribedAt IS NULL`. That's the strongest opt-in signal we have. Recruitment outreach to that cohort is defensible under PECR B2B soft-opt-in (related Flintmere offering, opt-out provided in every send).

If a generator widens the filter (e.g. `REQUIRE_BENCHMARK_OPTIN=false`), the operator must hold a higher bar on the outreach copy and the per-send rationale — and never use the wider list for marketing campaigns.
