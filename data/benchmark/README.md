# Benchmark data

Working directory for the Flintmere benchmark pipeline. All files here
except this README and `candidates.example.csv` are gitignored — they
contain in-flight operator data or scan artefacts.

## Pipeline

```
candidates.csv      (operator-supplied — URL list, any source)
       │
       │  pnpm --filter scanner benchmark:compile
       ▼
stores.csv          (validated live Shopify storefronts)
stores.report.json  (rejection reasons, per-run summary)
       │
       │  pnpm --filter scanner benchmark:scan     (scanner must be running)
       ▼
scans.jsonl         (per-store outcome, one JSON per line)
scans.report.json   (error breakdown, totals)
scanner_scans       (Postgres rows tagged source='bot')
```

## Quick start

1. Copy the example and edit:
   ```
   cp data/benchmark/candidates.example.csv data/benchmark/candidates.csv
   ```
2. Append your candidate URLs, one per line (vertical hint optional).
3. Run the validator:
   ```
   pnpm --filter scanner benchmark:compile
   ```
4. Inspect `data/benchmark/stores.csv` and
   `data/benchmark/stores.report.json`.
5. Start the scanner in another terminal:
   ```
   pnpm --filter scanner dev
   ```
6. Run the batch scanner:
   ```
   pnpm --filter scanner benchmark:scan
   ```
   This writes each outcome to `scans.jsonl` and each completed row
   lands in Postgres `scanner_scans` tagged `source='bot'`. Safe to
   ctrl-c and resume — `RESUME=true` (default) skips domains already
   present in the output file.

## Candidate sources

Curated by the operator. Suggested starting points:

- Shopify Exchange / Shopify Staff Picks listings
- `site:myshopify.com` search queries
- Public "top D2C brands" lists (trimmed of non-Shopify)
- BuiltWith / StoreLeads exports (if licensed)

Do not scrape third parties at scale to build this list. The validator
is the only thing that touches stores, and it obeys the
`FlintmereBot/1.0` contract on `/bot`.

## Publishing contract

Only aggregate statistics are published (vertical medians, grade
distributions). Never a list of named stores by grade. See
`memory/project_benchmark_decisions.md`.
