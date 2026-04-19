# shopify-api-rules.md

Scoped rules for every Shopify API integration point. Canonical API version + endpoint list live in `projects/flintmere/ARCHITECTURE.md`; this file is invariants + workflow only.

Replaces the retired `chain-support.md` (EVM chains were an allowanceguard concept with no Flintmere analogue).

## API version pinning

- **One version per app.** Both apps pin the same Shopify API version in `shopify.app.toml` / `@shopify/shopify-app-remix` config. Drift between scanner and app = hazard.
- Upgrade one version at a time, in lockstep across both apps. PR mentions the changelog entries that matter.
- Never target `unstable`. Never target `unreleased`. Only stable versions reach production.
- Breaking changes: read the entire changelog for that version before upgrading. Tests must pass against a dev store before the PR merges.

## Admin GraphQL API

- **Primary data source** for catalog reads and writes. Do not use REST unless the resource is GraphQL-unavailable (rare; flag in an ADR if it happens).
- Rate limiting is cost-based (GraphQL query cost points, 50/sec bucket by default on standard plans, 100/sec on Plus). Every query has a known cost. Measure before batching.
- Use `bulkOperationRunQuery` for any read that could exceed 250 products. See below.
- Use `bulkOperationRunMutation` for any write that exceeds 10 variants in a single merchant action.
- Log the GraphQL response's `extensions.cost` on every request in development; alert if a single query exceeds 400 points.

## Bulk operation handling (critical — easy to get wrong)

`bulkOperationRunQuery` returns a signed URL to a JSONL file. For a 10,000-variant store that file can be **hundreds of megabytes**. Wrong handling will OOM the app.

### Rules

- **Stream, never load.** Pipe the HTTPS response through a line-by-line JSONL parser (`ndjson` or a hand-rolled `readline` stream). Never `await response.text()` or `await response.json()` on a bulk file.
- **Chunk writes.** Process products in chunks of 500, writing scoring results to Postgres incrementally. Each chunk is a transaction.
- **Progressive UI state.** The dashboard shows `"3,400 of 12,000 products analysed · ETA 8 minutes"`. Never let a progress bar hang at 100% while the worker is still crunching.
- **Async by design for >5,000 SKUs.** Initial sync is a BullMQ job. Email the merchant when the first full scorecard lands.
- **One concurrent bulk per shop.** Shopify rejects concurrent bulk operations with `BULK_OPERATION_IN_PROGRESS`. Queue subsequent requests — do not retry immediately.

### Failure modes to handle

- Signed URL expired (15-minute window from Shopify) → re-request the operation, don't retry the download.
- 499/529 from Shopify's CDN mid-stream → resume from the last successfully-written chunk's `updated_at` cursor.
- JSONL contains a malformed line (rare but seen) → log, skip that line, continue. Don't abort the whole sync.

## Webhooks

### HMAC verification (hard-ban: never skip)

Every webhook handler verifies the `X-Shopify-Hmac-SHA256` header against the raw request body + `SHOPIFY_API_SECRET` before any side effect. Signature mismatch = 401 + log + no processing. Partial-processing is a vulnerability, not a graceful degradation.

### The 5-second rule

Shopify deregisters webhook subscribers that consistently respond slower than 5 seconds. Every webhook handler:

1. Verifies HMAC (~1ms).
2. Enqueues the job to BullMQ (~5ms).
3. Returns `200 OK` immediately.

Heavy work (re-scoring, API calls, LLM enrichment) happens in the worker, not the webhook handler.

### Idempotency

Webhooks are re-delivered on failure and occasionally duplicated in normal operation. Every handler:

- Keys on the `X-Shopify-Webhook-Id` header + the business-level event ID (product ID + updated_at timestamp).
- Short-circuits replays: if the event ID is already processed, return 200 without re-processing.
- Idempotency keys stored in Postgres `webhook_events` table with a TTL-based cleanup (retain 30 days).

### Registered topics (scanner: none; app: these)

- `products/create`, `products/update`, `products/delete` — drift monitoring.
- `app/uninstalled` — scrub the merchant's tokens + enqueue a data-purge job (see `security-posture.md` on retention).
- `customers/data_request`, `customers/redact`, `shop/redact` — GDPR compliance, **mandatory** for App Store approval.

### Belt-and-braces drift monitoring

Shopify webhooks are best-effort, not guaranteed. Nightly incremental sync per paid tier catches anything webhooks missed. Weekly full re-sync as a final safety net. Cheap at the API level, eliminates entire classes of "why is my score stale" tickets.

## OAuth + tokens

- OAuth flow handled by `@shopify/shopify-app-remix`. Never reimplement.
- **Access tokens encrypted at rest** — Postgres column-level AES-256-GCM, key from env var `SHOPIFY_TOKEN_ENCRYPTION_KEY` (32 bytes, base64). Rotation plan documented in `security-posture.md`.
- **Never log an access token**, even redacted. Log the shop domain only.
- Scopes: declare minimum in `shopify.app.toml`. Every new scope request requires an ADR explaining what it unlocks and why the existing scopes aren't sufficient.
- App Bridge session tokens for client → server auth from inside the embedded app. Verify every session token on the server side (`verifySessionToken` from `@shopify/shopify-app-remix`).

## Storefront API

- Used only by the scanner, for verifying what's actually published (vs what's in Admin).
- Unauthenticated storefront access token. Read-only.
- Rate-limited lightly; scanner caches storefront responses for 5 minutes per shop.

## Metafields

- Use the typed metafield API — `metafieldDefinitionCreate`, `metafieldsSet`. Free-text metafields are legacy and score lower on attribute-completeness.
- Every metafield Flintmere creates has: a namespace prefixed `flintmere.`, a typed definition, a storefront-visibility decision.
- `metafieldStorefrontVisibility` is required for metafields that agents need to see (JSON-LD, external product URL). Default to `public_read` for everything Flintmere writes unless the merchant opts out.

## Adding a new Shopify integration point — workflow

When a new Shopify API surface is introduced (new endpoint, new webhook topic, new metafield namespace):

1. **ADR first.** `projects/flintmere/decisions/NNNN-<slug>.md`. What, why, alternatives considered, cost (rate limit / storage / ops).
2. **Scope + security review.** #4 Security on any new token surface, new PII handling, new write path.
3. **Rate-limit decision.** How many requests per merchant per day. Where the budget comes from.
4. **Test at integration level.** Dev store, happy path + one malformed response.
5. **Docs update.** `projects/flintmere/ARCHITECTURE.md` endpoint list + rate-limit table.

## Hard bans

- No webhook handler without HMAC verification.
- No access token stored in plaintext.
- No `bulkOperationRunQuery` result loaded via `.json()` or `.text()`.
- No concurrent bulk operations to the same shop.
- No `unstable` / `unreleased` API versions in production.
- No direct REST calls where a GraphQL equivalent exists.
- No per-request retry loop on Shopify 429 — back off per the `Retry-After` header.

## Council gates for Shopify work

- **#33 Backend engineer (Node.js / Next.js)** — BullMQ topology, Prisma transactions around writes, streaming parser correctness.
- **#34 Full-stack debugging engineer** — failure-mode coverage (expired signed URLs, HMAC mismatch, 429 handling).
- **#4 Security** — every new scope, every new token surface, every new webhook topic.
- **#17 Performance** — bulk operation p95, dashboard load under a 5K-SKU catalog.
- **#18 DBA** — webhook_events table retention, indexing on `webhook_id` + `shop_id`.
