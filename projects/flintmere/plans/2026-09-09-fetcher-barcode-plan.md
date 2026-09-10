---
title: Fetcher barcode read — implementation plan
spec: projects/flintmere/plans/2026-09-09-homepage-thesis-spec.md §3
adr: projects/flintmere/decisions/0029-retail-gate-pivot.md
canon_sources:
  - https://support.google.com/merchants/answer/7052112 — GMC product data spec. Every consequence string in this plan uses Google's own outcome vocabulary: a listing is *disapproved*, or its visibility is *limited*. Nothing claims invisibility or agent rejection.
  - https://www.gs1.org/standards/barcodes-epcrfid-id-keys/gs1-general-specifications — GS1 General Specifications. A modulo-10 check-digit pass is necessary, not sufficient; GS1 registration is not tested by this code. Forbids the word "valid" in any clean-state string.
  - memory/VOICE.md §Banned phrases — the GTIN-claim register. Rules out "excluded from AI agent matching", "invisible", and every outcome promise in the two issue descriptions this plan rewrites.
canon_audit_run: pending — Task 9 gate 6 runs it on the final diff
---

# Fetcher Barcode Read Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public scanner actually read a product's barcode, so the GTIN check stops reporting 100% missing on every store.

**Architecture:** `/products.json` — the only endpoint the fetcher has ever called — carries no `barcode` key. `/products/{handle}.js` does. After the existing page loop builds the product list, a second sequential pass reads the first N products' `.js` documents and fills their variants' `barcode`, marking each product it managed to read. Products it did not reach are marked unread, and the scoring pillar computes barcode coverage over read products only, so an unchecked product is never counted as a product without a barcode.

**Tech Stack:** TypeScript · Node 20 · Next.js 15 (`apps/scanner`) · framework-free scoring package (`packages/scoring`) · Vitest · Zod · pnpm workspace.

## Global Constraints

- **`packages/scoring` resolves through `dist/`.** `apps/scanner/package.json` depends on `@flintmere/scoring": "workspace:*"` whose `main` is `./dist/index.js`. After ANY edit to `packages/scoring/src`, run `pnpm -r --filter "@flintmere/*" build` before the scanner's tests or `tsc` will see the old types. CI does this at `.github/workflows/lint.yml:32`.
- **`DEFAULT_OPTIONS` is typed `Required<FetchOptions>`** (`shopify-fetcher.ts:57`). Every new key in `FetchOptions` needs a default in the same commit or `tsc --noEmit` fails.
- **Any new field on `FetchedCatalog` must be optional.** `apps/scanner/src/app/api/scan/route.test.ts:96-107` mocks `fetchCatalog` returning only `{catalog, truncated, actualProductCount}`. A required field breaks that mock.
- **There is no `PACE_MS` in the fetcher.** No pacing, no retry, no backoff, no concurrency — pages are fetched one at a time with no delay. `PACE_MS` is an env var of `apps/scanner/scripts/batch-scan.ts:22`, a different program. The real bound is `DEFAULT_OPTIONS.timeoutMs = 55_000`, a whole-pipeline `AbortController`. The spec says otherwise and Task 9 corrects it.
- **Sequential requests are the kindness contract.** One request in flight at a time, ~180ms round trip observed on `workshopcoffee.com`. Do not add a concurrency pool; it would be the only unpaced parallel load Flintmere puts on a merchant's CDN.
- **Never write "valid" in a clean-state string.** A check-digit pass is necessary, not sufficient — GS1 registration is not tested. Write "passes its check digit".
- **Never write "N GTINs".** Counts are products with at least one failing variant.
- **User-Agent is `Flintmere-Scanner/0.1 (+https://flintmere.com/bot)`**, an inline literal duplicated at `shopify-fetcher.ts:129` and `:231`. Task 2 hoists it to one const. Do not add a third copy.
- **British spelling** in all prose and copy. `catalog` keeps its US spelling only as the product's own name.
- No file over 600 lines (`memory/PROCESS.md` rule 2). `shopify-fetcher.ts` is 316 and gains ~70.

## File Structure

| File | Change | Responsibility after |
|---|---|---|
| `apps/scanner/src/lib/shopify-fetcher.test.ts` | **create** | The fetcher's only test. Mocks global `fetch` and `./ssrf`. |
| `apps/scanner/src/lib/shopify-fetcher.ts` | modify | Adds the barcode pass. Still the only thing that talks to a merchant storefront. |
| `packages/scoring/src/types.ts` | modify | `ProductInput` gains optional `barcodeRead`. |
| `packages/scoring/src/pillars/identifiers.ts` | modify | Scores barcode coverage over read products only; severities corrected. |
| `packages/scoring/src/pillars/suppression-estimate.ts` | modify | Its missing-GTIN signal scopes to read products (2 lines). |
| `packages/scoring/test/identifiers.test.ts` | modify | Severity assertions flip; unread-product cases added. |
| `packages/scoring/test/fixtures/products.ts` | modify | Adds `unreadBarcodeProduct`. |
| `apps/scanner/src/lib/copy.ts` | modify | Two issue consequences rewritten; `scanScopeLine` states the barcode count. |
| `apps/scanner/src/lib/copy-scan-scope.test.ts` | **create** | Locks the scope-line branches. |
| `apps/scanner/src/lib/run-scan.ts` | modify | Threads `barcodesRead` into the result + persisted JSON. |
| `apps/scanner/src/app/api/scan/route.ts` | modify | Emits `barcodesRead` in the envelope. |
| `apps/scanner/src/components/scan/types.ts` | modify | `ScanResult.barcodesRead?`. |
| `apps/scanner/src/components/scan/ScanScopeLine.tsx` | modify | Passes the count through. |
| `apps/scanner/src/components/scan/Results.tsx` | modify | One prop. |
| `apps/scanner/src/lib/audit-draft/catalog-sample.ts` | modify | Asks for exactly its own sample size. |
| `apps/scanner/src/lib/audit-draft/catalog-sample.test.ts` | modify | Gains a fetcher mock — it has none today. |
| `projects/flintmere/plans/2026-09-09-homepage-thesis-spec.md` | modify | Two corrections (Task 9). |

---

### Task 1: Test harness for the fetcher

No test file exists for `shopify-fetcher.ts`. Before changing it, pin what it does today — including the bug — so the next task's change is visible as a diff in test output rather than asserted from memory.

**Files:**
- Create: `apps/scanner/src/lib/shopify-fetcher.test.ts`

**Interfaces:**
- Consumes: `fetchCatalog(rawUrl: string, options?: FetchOptions): Promise<FetchedCatalog>`, `ShopifyFetchError` — both from `./shopify-fetcher`.
- Produces: the helpers `productsJsonPage(products)`, `jsDoc(variants)` and `mockFetch(routes)` used by Tasks 2–4.

- [ ] **Step 1: Write the harness and two characterization tests**

Vitest picks this up via `include: ['src/**/*.test.ts']` (`apps/scanner/vitest.config.ts`). `fetchCatalog` calls `assertPublicHost`, which does a real DNS lookup — mock `./ssrf` so the suite never touches the network. `SsrfBlockedError` must stay a real class because `fetchCatalog:111` does an `instanceof` check on it.

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./ssrf', () => ({
  assertPublicHost: vi.fn(async () => undefined),
  isPrivateHostLiteral: vi.fn(() => false),
  SsrfBlockedError: class SsrfBlockedError extends Error {},
}));

import { fetchCatalog, ShopifyFetchError } from './shopify-fetcher';

/** One product as /products.json serves it — note: no `barcode` key. */
function rawProduct(n: number, variantIds: number[] = [n * 10]) {
  return {
    id: n,
    handle: `product-${n}`,
    title: `Product ${n}`,
    body_html: '<p>x</p>',
    vendor: 'Meridian',
    product_type: 'Coffee',
    tags: 'a,b',
    published_at: '2026-01-01T00:00:00Z',
    variants: variantIds.map((id) => ({
      id,
      sku: `SKU-${id}`,
      price: '9.00',
      compare_at_price: null,
      inventory_quantity: 5,
      inventory_policy: 'deny',
      available: true,
    })),
    images: [],
  };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

/**
 * Routes by URL substring, first match wins. Anything unmatched is a 404 —
 * so a test that forgets a route fails loudly instead of hanging.
 */
function mockFetch(routes: Array<[string, () => Response]>) {
  const fn = vi.fn(async (input: string | URL) => {
    const url = String(input);
    for (const [needle, make] of routes) {
      if (url.includes(needle)) return make();
    }
    return json({}, 404);
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

beforeEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('fetchCatalog — catalog shape', () => {
  it('normalises a single page of products.json', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1), rawProduct(2)] })],
      ['/products/count.json', () => json({ count: 2 })],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.shopDomain).toBe('example.com');
    expect(result.catalog.products).toHaveLength(2);
    expect(result.truncated).toBe(false);
    expect(result.actualProductCount).toBe(2);
  });

  it('throws not-shopify on a 404 from products.json', async () => {
    mockFetch([['/products.json', () => json({}, 404)]]);

    await expect(fetchCatalog('example.com')).rejects.toMatchObject({
      name: 'ShopifyFetchError',
      code: 'not-shopify',
    });
    expect(ShopifyFetchError).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `pnpm -F scanner exec vitest run src/lib/shopify-fetcher.test.ts`
Expected: PASS, 2 tests. If `assertPublicHost` throws or the suite hangs, the `vi.mock('./ssrf', …)` factory is wrong — it must be declared above the `import { fetchCatalog }` line for hoisting to apply.

- [ ] **Step 3: Commit**

```bash
git add apps/scanner/src/lib/shopify-fetcher.test.ts
git commit -m "test(scanner): first test file for shopify-fetcher"
```

---

### Task 2: Read barcodes from `/products/{handle}.js`

**Files:**
- Modify: `apps/scanner/src/lib/shopify-fetcher.ts` (`FetchOptions` 27-34, `FetchedCatalog` 45-55, `DEFAULT_OPTIONS` 57-61, `fetchCatalog` body ~175, new helpers after `fetchProductCount`)
- Modify: `packages/scoring/src/types.ts` (`ProductInputSchema` 24-38)
- Test: `apps/scanner/src/lib/shopify-fetcher.test.ts`

**Interfaces:**
- Consumes: Task 1's `rawProduct`, `json`, `mockFetch`.
- Produces:
  - `FetchOptions.barcodeSampleSize?: number` (default 50; `0` disables the pass entirely)
  - `FetchedCatalog.barcodesRead?: number` — how many products got a barcode field read
  - `ProductInput.barcodeRead?: boolean` — `false` marks a product the fetcher did not check. **`undefined` means read.** Admin-API products (`shopify-admin-fetcher.ts:299`) and every test fixture carry real barcodes and set nothing.

- [ ] **Step 1: Write the failing tests**

Append to `apps/scanner/src/lib/shopify-fetcher.test.ts`:

```ts
/** One product as /products/{handle}.js serves it — this one HAS barcode. */
function jsDoc(variants: Array<{ id: number; barcode: string | null }>) {
  return {
    id: 1,
    handle: 'product-1',
    title: 'Product 1',
    variants: variants.map((v) => ({
      id: v.id,
      barcode: v.barcode,
      sku: `SKU-${v.id}`,
      price: 900,
      available: true,
    })),
  };
}

describe('fetchCatalog — barcode pass', () => {
  it('fills variant barcodes from the .js document', async () => {
    const fn = mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.catalog.products[0]!.variants[0]!.barcode).toBe('5012345678900');
    expect(result.catalog.products[0]!.barcodeRead).toBe(true);
    expect(result.barcodesRead).toBe(1);
    expect(fn.mock.calls.map((c) => String(c[0]))).toContain(
      'https://example.com/products/product-1.js',
    );
  });

  it('records a genuine null barcode as read, not as unread', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['/products/product-1.js', () => json(jsDoc([{ id: 10, barcode: null }]))],
    ]);

    const result = await fetchCatalog('example.com');

    // The distinction the whole plan exists for: we looked, and there is
    // nothing there. Not: we never looked.
    expect(result.catalog.products[0]!.variants[0]!.barcode).toBeNull();
    expect(result.catalog.products[0]!.barcodeRead).toBe(true);
    expect(result.barcodesRead).toBe(1);
  });

  it('reads at most barcodeSampleSize products and marks the rest unread', async () => {
    const products = [1, 2, 3].map((n) => rawProduct(n, [n * 10]));
    mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 3 })],
      ['.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com', { barcodeSampleSize: 2 });

    expect(result.barcodesRead).toBe(2);
    expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([true, true, false]);
  });

  it('skips the pass entirely at barcodeSampleSize 0', async () => {
    const fn = mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
    ]);

    const result = await fetchCatalog('example.com', { barcodeSampleSize: 0 });

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products[0]!.barcodeRead).toBe(false);
    expect(fn.mock.calls.every((c) => !String(c[0]).endsWith('.js'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm -F scanner exec vitest run src/lib/shopify-fetcher.test.ts`
Expected: FAIL — 4 failures. The first reads `expected null to be '5012345678900'`, because nothing fetches the `.js` document yet.

- [ ] **Step 3: Add `barcodeRead` to the product schema**

`packages/scoring/src/types.ts`, inside `ProductInputSchema` (after the `brandMetafield` line at :36):

```ts
  /**
   * False when the fetcher did not read this product's barcode field — it
   * fell outside the sample, or the storefront did not serve the endpoint
   * that carries barcodes. Absent means the source carries barcodes
   * natively (Admin API, fixtures), so absent reads as "read".
   */
  barcodeRead: z.boolean().optional(),
```

- [ ] **Step 4: Rebuild the scoring package**

Run: `pnpm -r --filter "@flintmere/*" build`
Expected: exit 0. Skipping this makes Step 5 fail with `Object literal may only specify known properties … 'barcodeRead'`.

- [ ] **Step 5: Implement the barcode pass**

In `apps/scanner/src/lib/shopify-fetcher.ts`:

Replace the `sampleFraction` option (`:32-33`) — it is declared, defaulted, and never read anywhere in the repo:

```ts
  /**
   * How many products to read barcodes for, via /products/{handle}.js.
   * /products.json carries no `barcode` key at all, so without this pass
   * every GTIN check scores zero on every store. 0 disables the pass.
   *
   * Sampled rather than exhaustive: the pass is sequential (one request in
   * flight, ~180ms observed), so 50 products costs ~9s of the 55s budget.
   * Reading 1,000 would cost ~3 minutes and put unpaced load on a
   * merchant's CDN. The sampled count is stated in the UI, never implied
   * to be the whole catalog.
   */
  barcodeSampleSize?: number;
```

`DEFAULT_OPTIONS` (`:57-61`) becomes:

```ts
const DEFAULT_OPTIONS: Required<FetchOptions> = {
  timeoutMs: 55_000,
  maxPages: 4,
  barcodeSampleSize: 50,
};

/** Wall-clock ceiling for the barcode pass alone, inside the 55s pipeline. */
const BARCODE_BUDGET_MS = 20_000;

/** One literal, three call sites. */
const SCANNER_UA = 'Flintmere-Scanner/0.1 (+https://flintmere.com/bot)';
```

Replace the inline user-agent string at `:129` and `:231` with `SCANNER_UA`.

`FetchedCatalog` gains, after `actualProductCount` (`:54`):

```ts
  /**
   * How many products we actually read a barcode field for. Optional so
   * existing mocks of this module keep type-checking; treat absent as 0.
   */
  barcodesRead?: number;
```

In `fetchCatalog`, immediately after the `actualProductCount` line (`:175`) and before the `truncated` computation:

```ts
    // Barcodes come from a different endpoint than the catalog. Runs after
    // the count fetch so the count — load-bearing for sampling honesty —
    // is never starved by this budget.
    const barcodesRead = await readBarcodes(
      domain,
      products,
      opts.barcodeSampleSize,
      controller.signal,
    );
```

and add `barcodesRead` to the returned object alongside `truncated` and `actualProductCount`.

New helpers, after `fetchProductCount` ends (`:244`):

```ts
/**
 * Second pass: reads `barcode` for the first `sampleSize` products from
 * /products/{handle}.js and writes it onto the already-built variants.
 *
 * Why a second pass at all: /products.json has never carried a `barcode`
 * key. `toProductInput` read `v.barcode ?? null` from a field that was
 * never in the response, so every public scan reported 100% missing GTIN.
 *
 * Mutates `products` in place — one pass, no copy of a 1,000-product array.
 * Returns how many products were successfully read.
 */
async function readBarcodes(
  domain: string,
  products: ProductInput[],
  sampleSize: number,
  signal: AbortSignal,
): Promise<number> {
  for (const product of products) {
    product.barcodeRead = false;
  }
  if (sampleSize <= 0) return 0;

  const deadline = Date.now() + BARCODE_BUDGET_MS;
  let read = 0;

  for (const product of products.slice(0, sampleSize)) {
    if (signal.aborted || Date.now() > deadline) break;

    const barcodeByVariantId = await fetchVariantBarcodes(
      domain,
      product.handle,
      signal,
    );

    if (barcodeByVariantId === null) {
      // Nothing has worked yet, so the endpoint is blocked storefront-wide
      // (password page, headless front end) — stop rather than spend the
      // budget proving it 50 times. A failure after a success is a one-off,
      // typically a handle that 404s; skip that product and carry on.
      if (read === 0) break;
      continue;
    }

    for (const variant of product.variants) {
      variant.barcode = barcodeByVariantId.get(variant.id) ?? null;
    }
    product.barcodeRead = true;
    read += 1;
  }

  return read;
}

/**
 * Reads one product's .js document. Returns variant-id → barcode, or null
 * when the endpoint did not serve usable JSON. Never throws: a barcode we
 * could not read is a smaller problem than a scan that fails outright.
 */
async function fetchVariantBarcodes(
  domain: string,
  handle: string,
  signal: AbortSignal,
): Promise<Map<string, string | null> | null> {
  try {
    const res = await fetch(
      `https://${domain}/products/${encodeURIComponent(handle)}.js`,
      {
        signal,
        headers: { 'user-agent': SCANNER_UA, accept: 'application/json' },
      },
    );
    if (!res.ok) return null;

    const body = (await res.json()) as {
      variants?: Array<{ id: number | string; barcode?: string | null }>;
    };
    if (!Array.isArray(body.variants)) return null;

    return new Map(
      body.variants.map((v) => [String(v.id), v.barcode ?? null] as const),
    );
  } catch {
    return null;
  }
}
```

Leave `toProductInput`'s `barcode: v.barcode ?? null` (`:263`) alone — it now correctly yields `null` as the starting state, and `readBarcodes` overwrites it.

- [ ] **Step 6: Run the tests**

Run: `pnpm -F scanner exec vitest run src/lib/shopify-fetcher.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Commit**

```bash
git add apps/scanner/src/lib/shopify-fetcher.ts apps/scanner/src/lib/shopify-fetcher.test.ts packages/scoring/src/types.ts
git commit -m "feat(scanner): read barcodes from /products/{handle}.js

/products.json has never carried a barcode key, so every public scan
reported 100% missing GTIN. Adds a sampled second pass and marks which
products were actually checked."
```

---

### Task 3: Blocked endpoint stays honest

The failure this task pins is the one that would put a false claim back on a customer surface: a storefront that serves `/products.json` but blocks `/products/{handle}.js` must produce "we did not read barcodes", never "no product has a barcode".

**Files:**
- Test: `apps/scanner/src/lib/shopify-fetcher.test.ts`

**Interfaces:**
- Consumes: Task 2's `barcodesRead` and `barcodeRead`, and its `BARCODE_FAILURE_CEILING` (3 consecutive non-404 failures) plus the `miss`/`blocked`/`ok` outcome classification. No production change is expected — this task proves that classification behaves, and fixes it if not.
- **Superseded by Task 2's fix round (operator ruling, 2026-09-10):** the original `if (read === 0) break;` is gone. A 404 is a per-handle miss and continues; a 429/5xx/403 counts toward the ceiling. Do not reinstate the single-failure break.

- [ ] **Step 1: Write the failing tests**

```ts
describe('fetchCatalog — barcode endpoint blocked', () => {
  it('reports zero read and leaves every product unread when .js 403s', async () => {
    const products = [1, 2, 3, 4, 5].map((n) => rawProduct(n, [n * 10]));
    const fn = mockFetch([
      ['/products.json', () => json({ products })],
      ['/products/count.json', () => json({ count: 5 })],
      ['/products/product-', () => json({}, 403)],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products.every((p) => p.barcodeRead === false)).toBe(true);
    // Stops once BARCODE_FAILURE_CEILING consecutive non-404 refusals have
    // been seen, rather than spending the budget proving the same 403 fifty
    // times. Five products, three calls: the early stop is the assertion.
    expect(fn.mock.calls.filter((c) => String(c[0]).endsWith('.js'))).toHaveLength(3);
  });

  it('skips a single bad handle and keeps reading the rest', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10]), rawProduct(2, [20]), rawProduct(3, [30])] })],
      ['/products/count.json', () => json({ count: 3 })],
      ['/products/product-2.js', () => json({}, 404)],
      ['.js', () => json(jsDoc([{ id: 10, barcode: '5012345678900' }, { id: 30, barcode: '5012345678900' }]))],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(2);
    expect(result.catalog.products.map((p) => p.barcodeRead)).toEqual([true, false, true]);
  });

  it('does not fail the scan when .js returns HTML instead of JSON', async () => {
    mockFetch([
      ['/products.json', () => json({ products: [rawProduct(1, [10])] })],
      ['/products/count.json', () => json({ count: 1 })],
      ['.js', () => new Response('<!doctype html><html>password page</html>', { status: 200 })],
    ]);

    const result = await fetchCatalog('example.com');

    expect(result.barcodesRead).toBe(0);
    expect(result.catalog.products).toHaveLength(1);
    expect(result.catalog.products[0]!.barcodeRead).toBe(false);
  });
});
```

- [ ] **Step 2: Run them**

Run: `pnpm -F scanner exec vitest run src/lib/shopify-fetcher.test.ts`
Expected: PASS, 16 tests (13 from Task 2 after its fix round, 3 added here). Task 2's implementation already satisfies these — that is the point of writing them. If the third fails with an unhandled `SyntaxError`, the `try` in `fetchVariantBarcodes` does not wrap `res.json()`; move the `await res.json()` inside it.

- [ ] **Step 3: Commit**

```bash
git add apps/scanner/src/lib/shopify-fetcher.test.ts
git commit -m "test(scanner): pin blocked-endpoint behaviour on the barcode pass"
```

---

### Task 4: The barcode pass cannot eat the scan

**Files:**
- Test: `apps/scanner/src/lib/shopify-fetcher.test.ts`

**Interfaces:**
- Consumes: `BARCODE_BUDGET_MS = 20_000` from Task 2. Not exported — the test drives it through a fake clock the mocked `fetch` advances.

- [ ] **Step 1: Write the failing test**

```ts
describe('fetchCatalog — barcode budget', () => {
  it('stops reading barcodes once the 20s budget is spent', async () => {
    vi.useFakeTimers();
    try {
      const products = Array.from({ length: 10 }, (_, i) => rawProduct(i + 1, [(i + 1) * 10]));
      const fn = vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.includes('/products.json')) return json({ products });
        if (url.includes('/products/count.json')) return json({ count: 10 });
        // Each .js request costs 8 seconds of the 20s barcode budget.
        vi.advanceTimersByTime(8_000);
        return json(jsDoc([{ id: 10, barcode: '5012345678900' }]));
      });
      vi.stubGlobal('fetch', fn);

      const result = await fetchCatalog('example.com');

      // 0s → read #1 → 8s → read #2 → 16s → read #3 → 24s > 20s, stop.
      expect(result.barcodesRead).toBe(3);
      expect(result.catalog.products).toHaveLength(10);
      expect(result.catalog.products[9]!.barcodeRead).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
```

- [ ] **Step 2: Run it**

Run: `pnpm -F scanner exec vitest run src/lib/shopify-fetcher.test.ts`
Expected: PASS, 10 tests. If it reads 10 instead of 3, `readBarcodes` is missing its `Date.now() > deadline` guard. If the run hangs, the fake clock is firing the 55s pipeline `setTimeout` — check the advance total stays under 55,000ms.

- [ ] **Step 3: Commit**

```bash
git add apps/scanner/src/lib/shopify-fetcher.test.ts
git commit -m "test(scanner): barcode pass stops at its 20s budget"
```

---

### Task 5: Score barcodes over read products only, and correct the severities

Two bugs in one file. First, with Task 2 landed, an unread product still counts as a product without a barcode — a 1,000-product store would report 950 missing after checking 50. Second, the severities are inverted against Google's actual behaviour: a missing GTIN limits a listing, an invalid one disapproves it, yet `missing-gtin` is `critical` and `invalid-gtin-checksum` is `high`.

**Files:**
- Modify: `packages/scoring/src/pillars/identifiers.ts`
- Modify: `packages/scoring/src/pillars/suppression-estimate.ts:222-229`
- Modify: `packages/scoring/test/fixtures/products.ts`
- Test: `packages/scoring/test/identifiers.test.ts:49-65`

**Interfaces:**
- Consumes: `ProductInput.barcodeRead` from Task 2.
- Produces: `scoreIdentifiers` returns `maxScore: 25` instead of `100` when no product's barcode was read, and emits a new issue code `barcodes-not-read` (severity `low`, `revenueImpactScore` 0). `score.ts:computeComposite` already divides by `maxScore`, so no change there.

- [ ] **Step 1: Add the fixture**

`packages/scoring/test/fixtures/products.ts`, after `noGtinProduct`:

```ts
/** Outside the fetcher's barcode sample — we never looked at this one. */
export const unreadBarcodeProduct: ProductInput = {
  ...cleanProduct,
  id: 'gid://shopify/Product/8',
  handle: 'unread-barcode',
  barcodeRead: false,
  variants: [
    {
      ...cleanProduct.variants[0]!,
      id: 'gid://shopify/ProductVariant/8',
      barcode: null,
    },
  ],
};
```

- [ ] **Step 2: Write the failing tests**

In `packages/scoring/test/identifiers.test.ts`, change the two existing severity assertions — line 55 `expect(missing?.severity).toBe('critical')` becomes `'high'`, and line 64 `expect(bad?.severity).toBe('high')` becomes `'critical'`. Rename those two `it` blocks to match (`emits a high issue for missing GTIN`, `emits a critical issue for invalid GTIN checksum`). Then append:

```ts
describe('scoreIdentifiers — products whose barcode was never read', () => {
  it('does not count an unread product as a product without a barcode', () => {
    const catalog = makeCatalog([cleanProduct, unreadBarcodeProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.issues.find((i) => i.code === 'missing-gtin')).toBeUndefined();
  });

  it('renormalises the pillar when no barcode was read at all', () => {
    const catalog = makeCatalog([unreadBarcodeProduct]);
    const result = scoreIdentifiers(catalog);
    // The 75 barcode points leave the denominator rather than scoring zero:
    // we have no evidence either way.
    expect(result.maxScore).toBe(25);
    expect(result.issues.find((i) => i.code === 'missing-gtin')).toBeUndefined();
    expect(result.issues.find((i) => i.code === 'invalid-gtin-checksum')).toBeUndefined();
    const notRead = result.issues.find((i) => i.code === 'barcodes-not-read');
    expect(notRead?.severity).toBe('low');
    expect(notRead?.revenueImpactScore).toBe(0);
  });

  it('keeps the full denominator when at least one product was read', () => {
    const catalog = makeCatalog([noGtinProduct, unreadBarcodeProduct]);
    const result = scoreIdentifiers(catalog);
    expect(result.maxScore).toBe(100);
    expect(result.issues.find((i) => i.code === 'barcodes-not-read')).toBeUndefined();
    // Only the read product is counted.
    expect(result.issues.find((i) => i.code === 'missing-gtin')?.affectedCount).toBe(1);
  });
});
```

Add `unreadBarcodeProduct` to the fixture import at the top of the file.

- [ ] **Step 3: Run them to verify they fail**

Run: `pnpm -F @flintmere/scoring exec vitest run test/identifiers.test.ts`
Expected: FAIL — 5 failures (2 flipped severities, 3 new cases).

- [ ] **Step 4: Implement**

In `packages/scoring/src/pillars/identifiers.ts`, after the `CHECKS` block (`:11`):

```ts
/** The two sub-checks that need a barcode to mean anything. */
const BARCODE_CHECKS = CHECKS.barcodePresence + CHECKS.gtinChecksum;
```

Replace the body from `const allVariants` (`:15`) through the checksum score (`:38`) with:

```ts
  const allVariants = input.products.flatMap((p) =>
    p.variants.map((v) => ({ product: p, variant: v })),
  );
  const variantCount = allVariants.length;

  if (variantCount === 0) {
    return emptyResult('empty-catalog');
  }

  // The public fetcher reads barcodes for a sample; anything outside it is
  // marked barcodeRead: false. An absent flag means the source carries
  // barcodes natively (Admin API, fixtures), so absent reads as "read".
  // Counting an unchecked product as a product without a barcode is the
  // false claim this scoping exists to prevent.
  const readProducts = input.products.filter((p) => p.barcodeRead !== false);
  const readVariants = allVariants.filter(
    ({ product }) => product.barcodeRead !== false,
  );
  const barcodesAssessable = readVariants.length > 0;

  // --- Sub-check 1: barcode presence on variants we actually read ---
  const variantsWithBarcode = readVariants.filter(
    ({ variant }) => variant.barcode && variant.barcode.trim().length > 0,
  );
  const barcodeCoverage = barcodesAssessable
    ? variantsWithBarcode.length / readVariants.length
    : 0;
  const barcodeScore = barcodeCoverage * CHECKS.barcodePresence;

  // --- Sub-check 2: GTIN checksum on present barcodes ---
  const barcodesWithValidChecksum = variantsWithBarcode.filter(({ variant }) =>
    isValidGtin(variant.barcode ?? null),
  );
  const checksumPassRate = variantsWithBarcode.length
    ? barcodesWithValidChecksum.length / variantsWithBarcode.length
    : 0;
  const checksumScore = checksumPassRate * CHECKS.gtinChecksum;
```

Sub-checks 3, 4 and 5 keep using `allVariants` and `input.products` — brand and SKU come from `/products.json` and are read for every product.

Replace the score computation (`:67-70`):

```ts
  const assessedScore = barcodesAssessable
    ? barcodeScore + checksumScore + brandScore + skuScore + uniquenessScore
    : brandScore + skuScore + uniquenessScore;
  const score = Math.round(assessedScore * 100) / 100;
  const maxScore = barcodesAssessable ? 100 : 100 - BARCODE_CHECKS;
```

Replace the two barcode issue blocks (`:74-108`). Both filters now run over `readProducts`, both descriptions are rewritten to Google's own vocabulary, and the severities swap:

```ts
  if (!barcodesAssessable) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'barcodes-not-read',
      severity: 'low' as const,
      title: 'Barcodes were not read',
      description:
        'Your storefront did not serve the per-product endpoint that carries barcodes, so this scan says nothing about your GTINs either way. The rest of the pillar is scored without them.',
      affectedCount: 0,
      affectedProductIds: [],
      revenueImpactScore: 0,
    });
  }

  const missingBarcodeProducts = readProducts.filter((p) =>
    p.variants.some((v) => !v.barcode || !v.barcode.trim()),
  );
  if (missingBarcodeProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'missing-gtin',
      severity: 'high' as const,
      title: `Missing GTINs on ${missingBarcodeProducts.length} products`,
      description:
        'A product with no GTIN can be limited in where Google Merchant Center shows it. It is not disapproved for that alone.',
      affectedCount: missingBarcodeProducts.length,
      affectedProductIds: missingBarcodeProducts.map((p) => p.id),
      revenueImpactScore: 80,
    });
  }

  const invalidChecksumProducts = readProducts.filter((p) =>
    p.variants.some(
      (v) => v.barcode && v.barcode.trim() && !isValidGtin(v.barcode),
    ),
  );
  if (invalidChecksumProducts.length > 0) {
    issues.push({
      pillar: 'identifiers' as const,
      code: 'invalid-gtin-checksum',
      severity: 'critical' as const,
      title: `Invalid GTIN checksum on ${invalidChecksumProducts.length} products`,
      description:
        'Google Merchant Center disapproves a listing whose GTIN is invalid. These values are present but fail the modulo-10 check digit.',
      affectedCount: invalidChecksumProducts.length,
      affectedProductIds: invalidChecksumProducts.map((p) => p.id),
      revenueImpactScore: 100,
    });
  }
```

Finally, the return (`:129-136`) uses the computed `maxScore` instead of the literal `100`.

- [ ] **Step 5: Scope the suppression signal the same way**

`packages/scoring/src/pillars/suppression-estimate.ts` raises a missing-GTIN signal for every product with an empty barcode. Left alone it would report 950 of 1,000 products suppressed after reading 50. The model is due for retirement in a separate PR, but it renders in production today, so scope its input.

The signal is computed per product inside `extractSignals(product, catalogIsNonFood)` and returns a boolean, not a count. Replace the `missingGtin` assignment at `:227-229`:

```ts
  // Signal 1 — missing GTIN: any variant lacks a non-empty barcode.
  // We use "missing" rather than "invalid checksum" here — the strict
  // checksum signal is what `identifiers` already grades.
  //
  // A product whose barcode was never read is not evidence of a missing
  // barcode. The public fetcher reads a sample; absent flag means the
  // source carries barcodes natively, so absent reads as "read".
  const missingGtin =
    product.barcodeRead !== false &&
    product.variants.some((v) => !v.barcode || v.barcode.trim().length === 0);
```

The added clause is the only change. Leave the rest of `extractSignals` alone.

- [ ] **Step 6: Run the whole scoring suite**

Run: `pnpm -F @flintmere/scoring test`
Expected: PASS. `score.test.ts:82` and `:88` still hold — their fixtures set no `barcodeRead`, so nothing about their scoring changes. If `enrich-issues.test.ts` fails, an `affectedProductIds` array changed shape; re-check the `readProducts` filters.

- [ ] **Step 7: Rebuild and commit**

```bash
pnpm -r --filter "@flintmere/*" build
git add packages/scoring/src/pillars/identifiers.ts packages/scoring/src/pillars/suppression-estimate.ts packages/scoring/test/identifiers.test.ts packages/scoring/test/fixtures/products.ts
git commit -m "fix(scoring): score barcodes over read products, correct GTIN severities

An unread product is no longer counted as a product without a barcode.
Invalid GTIN becomes critical and missing GTIN high, matching Google's
behaviour: an invalid value is disapproved, a missing one is limited."
```

---

### Task 6: Report-email copy matches the corrected severities

`issueCodeToFounderSpeak` is the merchant-facing translation used by the report email. Its two GTIN entries assert outcomes ADR 0029 retired: that products without barcodes "stay invisible" and that agents "reject these as fake codes". Leaving them behind a `critical` badge ships the same false claim the fetcher fix exists to remove.

**Files:**
- Modify: `apps/scanner/src/lib/copy.ts:155-170`
- Test: `apps/scanner/src/lib/report-email.test.ts`

**Interfaces:**
- Consumes: issue codes `missing-gtin`, `invalid-gtin-checksum`, and Task 5's new `barcodes-not-read`.
- Produces: nothing new. `report-email.ts:71` filters to `critical | high`, so `barcodes-not-read` at `low` will not appear in the email body — its entry exists for the on-page pillar breakdown.

- [ ] **Step 1: Write the failing test**

Append to `apps/scanner/src/lib/report-email.test.ts`:

```ts
describe('buildReportEmail — GTIN consequences match Google behaviour', () => {
  it('does not claim a missing barcode makes a product invisible', () => {
    const email = buildReportEmail({ score: makeScore(), ...baseInput });
    expect(email.text.toLowerCase()).not.toContain('invisible');
    expect(email.text.toLowerCase()).not.toContain('cannot match');
  });

  it('reserves disapproval for the invalid-checksum code', () => {
    const email = buildReportEmail({
      score: makeScore({
        issues: [
          {
            pillar: 'identifiers',
            code: 'invalid-gtin-checksum',
            severity: 'critical',
            title: 'Invalid GTIN checksum on 3 products',
            description: 'x',
            affectedCount: 3,
            affectedProductIds: [],
            revenueImpactScore: 100,
          },
        ],
      }),
      ...baseInput,
    });
    expect(email.text).toContain('disapproves');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm -F scanner exec vitest run src/lib/report-email.test.ts`
Expected: FAIL — the first test finds "invisible" in the current `missing-gtin` consequence.

- [ ] **Step 3: Rewrite the three entries**

`apps/scanner/src/lib/copy.ts`, replacing the two existing objects at `:157` and `:162` and adding a third:

```ts
  'missing-gtin': {
    title: 'Products have no barcode',
    consequence:
      'Google Merchant Center can limit where it shows a product with no GTIN. It does not disapprove the listing for that alone.',
  },
  'invalid-gtin-checksum': {
    title: 'Barcode numbers fail the check digit',
    consequence:
      'Google Merchant Center disapproves a listing whose GTIN is invalid, so the product stops showing in Shopping.',
  },
  'barcodes-not-read': {
    title: 'Barcodes were not read',
    consequence:
      'Your storefront did not serve the endpoint that carries barcodes, so this scan says nothing about your GTINs either way.',
  },
```

`report-email.test.ts:143` asserts the string `'Products have no barcode'`, which is unchanged.

- [ ] **Step 4: Run the scanner suite**

Run: `pnpm -F scanner test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/scanner/src/lib/copy.ts apps/scanner/src/lib/report-email.test.ts
git commit -m "fix(copy): GTIN consequences use Google's own outcome vocabulary"
```

---

### Task 7: State the barcode count on the results page

The scope line is the trust anchor above the results. With a sampled barcode read, a merchant who is told "412 of 1,000 products have no barcode" after 50 were checked is being misled by omission.

**Files:**
- Modify: `apps/scanner/src/lib/copy.ts:444-458`
- Modify: `apps/scanner/src/lib/run-scan.ts:60-64, 112, ~180, ~210`
- Modify: `apps/scanner/src/app/api/scan/route.ts:147-148`
- Modify: `apps/scanner/src/components/scan/types.ts:36-37`
- Modify: `apps/scanner/src/components/scan/ScanScopeLine.tsx`
- Modify: `apps/scanner/src/components/scan/Results.tsx:63-67`
- Create: `apps/scanner/src/lib/copy-scan-scope.test.ts`

**Interfaces:**
- Consumes: `FetchedCatalog.barcodesRead` from Task 2.
- Produces: `scanScopeLine({sampledCount, actualProductCount, truncated, barcodesRead?})`. `barcodesRead` is optional — persisted scans from before this change do not carry it, and `/score/[shop]` re-renders them from `scoreJson`.

- [ ] **Step 1: Write the failing tests**

Create `apps/scanner/src/lib/copy-scan-scope.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { scanScopeLine } from './copy';

describe('scanScopeLine', () => {
  it('says nothing extra when every scanned product had its barcode read', () => {
    expect(
      scanScopeLine({ sampledCount: 40, actualProductCount: 40, truncated: false, barcodesRead: 40 }),
    ).toBe('Scanned 40 products · 60 seconds');
  });

  it('states the barcode count when it is smaller than the scan', () => {
    expect(
      scanScopeLine({ sampledCount: 1000, actualProductCount: 4312, truncated: true, barcodesRead: 50 }),
    ).toBe('Scanned 1,000 of 4,312 products · barcodes on 50 · 60 seconds');
  });

  it('says barcodes were not read rather than implying none exist', () => {
    expect(
      scanScopeLine({ sampledCount: 120, actualProductCount: 120, truncated: false, barcodesRead: 0 }),
    ).toBe('Scanned 120 products · barcodes not read · 60 seconds');
  });

  it('omits the clause entirely for a persisted scan with no barcode data', () => {
    expect(
      scanScopeLine({ sampledCount: 120, actualProductCount: 120, truncated: false }),
    ).toBe('Scanned 120 products · 60 seconds');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm -F scanner exec vitest run src/lib/copy-scan-scope.test.ts`
Expected: FAIL — 2 failures; `scanScopeLine` ignores `barcodesRead` and emits no clause.

- [ ] **Step 3: Implement the copy change**

`apps/scanner/src/lib/copy.ts`, replacing `scanScopeLine` at `:444`:

```ts
export function scanScopeLine(args: {
  sampledCount: number
  actualProductCount: number | null
  truncated: boolean
  /** Absent on scans persisted before the barcode pass shipped. */
  barcodesRead?: number | null
}): string {
  const sampled = args.sampledCount.toLocaleString()
  const scanned = args.truncated
    ? `Scanned ${sampled} of ${
        args.actualProductCount !== null
          ? args.actualProductCount.toLocaleString()
          : `${sampled}+`
      } products`
    : `Scanned ${sampled} products`

  // Barcodes come from a per-product endpoint and are sampled, so the
  // count differs from the scan's. Stated only when it differs — a small
  // catalog reads exactly as it did before this shipped.
  let barcodes = ''
  if (typeof args.barcodesRead === 'number' && args.barcodesRead === 0) {
    barcodes = ' · barcodes not read'
  } else if (
    typeof args.barcodesRead === 'number' &&
    args.barcodesRead < args.sampledCount
  ) {
    barcodes = ` · barcodes on ${args.barcodesRead.toLocaleString()}`
  }

  return `${scanned}${barcodes} · 60 seconds`
}
```

- [ ] **Step 4: Thread the field through**

`apps/scanner/src/lib/run-scan.ts` — add `barcodesRead: number | null;` to `RunScanCompleteResult` beside `actualProductCount` (`:63`); destructure it at `:112` as `const { catalog, truncated, actualProductCount, barcodesRead = null } = fetched;`; add `barcodesRead` to `persistedScoreJson` and to the returned object.

`apps/scanner/src/app/api/scan/route.ts:148` — add `barcodesRead: result.barcodesRead,` after `actualProductCount`.

`apps/scanner/src/components/scan/types.ts:37` — add to `ScanResult`:

```ts
  /**
   * How many products had a barcode read. Optional: scans persisted before
   * the barcode pass shipped do not carry it, and /score/[shop] re-renders
   * those from scoreJson.
   */
  barcodesRead?: number | null;
```

`apps/scanner/src/components/scan/ScanScopeLine.tsx` — add `barcodesRead?: number | null;` to `ScanScopeLineProps`, accept it, pass it to `scanScopeLine`.

`apps/scanner/src/components/scan/Results.tsx:63` — add `barcodesRead={result.barcodesRead ?? null}` to the `<ScanScopeLine>` element.

- [ ] **Step 5: Run and typecheck**

Run: `pnpm -F scanner exec vitest run src/lib/copy-scan-scope.test.ts && pnpm -F scanner typecheck`
Expected: PASS, 4 tests; `tsc --noEmit` exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/scanner/src/lib/copy.ts apps/scanner/src/lib/copy-scan-scope.test.ts apps/scanner/src/lib/run-scan.ts apps/scanner/src/app/api/scan/route.ts apps/scanner/src/components/scan/types.ts apps/scanner/src/components/scan/ScanScopeLine.tsx apps/scanner/src/components/scan/Results.tsx
git commit -m "feat(scanner): state how many products had barcodes read"
```

---

### Task 8: The Catalog Letter's sample gets real barcodes

`catalog-sample.ts` builds the product summary the audit-assist model reads when drafting a paid Catalog Letter, and prints `barcode:y` or `barcode:n` per product (`:111-112`). It fetches one page and slices 50. Left alone it inherits the default sample of 50 — the same 50 — but a silent coupling on two constants matching is how a paid artifact starts lying.

**Files:**
- Modify: `apps/scanner/src/lib/audit-draft/catalog-sample.ts:52`
- Test: `apps/scanner/src/lib/audit-draft/catalog-sample.test.ts`

**Interfaces:**
- Consumes: `FetchOptions.barcodeSampleSize` from Task 2, `SAMPLE_SIZE = 50` (`catalog-sample.ts:25`).
- Produces: nothing new.

- [ ] **Step 1: Write the failing test**

`catalog-sample.test.ts` today only exercises `summariseProductsForLLM`, a pure function — it does not mock the fetcher and does not import `getCatalogSampleForDraft`. Add both. `vi.mock` is hoisted above the imports, so its factory must not reference anything imported; build the fixture inline.

At the top of `apps/scanner/src/lib/audit-draft/catalog-sample.test.ts`, add `vi` to the vitest import and insert before the `./catalog-sample` import:

```ts
vi.mock('../shopify-fetcher', () => ({
  fetchCatalog: vi.fn(async () => ({
    catalog: {
      shopDomain: 'example.com',
      scoredAt: '2026-09-09T00:00:00Z',
      products: [
        {
          id: 'gid://product/1',
          handle: 'sample-product',
          title: 'Sample Product',
          tags: [],
          variants: [{ id: 'v1', sku: 'SKU-1', barcode: '5012345678900', price: '14.50' }],
          images: [],
          barcodeRead: true,
        },
      ],
    },
    truncated: false,
    actualProductCount: 1,
    barcodesRead: 1,
  })),
  ShopifyFetchError: class ShopifyFetchError extends Error {
    code: string
    constructor(code: string, message: string) {
      super(message)
      this.code = code
    }
  },
}))
```

Change the module import to bring in both functions, then append the test:

```ts
import { getCatalogSampleForDraft, summariseProductsForLLM } from './catalog-sample'
import { fetchCatalog } from '../shopify-fetcher'

describe('getCatalogSampleForDraft', () => {
  it('asks the fetcher for a barcode on every product it will summarise', async () => {
    await getCatalogSampleForDraft('example.com')
    expect(fetchCatalog).toHaveBeenCalledWith('example.com', {
      maxPages: 1,
      barcodeSampleSize: 50,
    })
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm -F scanner exec vitest run src/lib/audit-draft/catalog-sample.test.ts`
Expected: FAIL — called with `{maxPages: 1}`, missing `barcodeSampleSize`.

- [ ] **Step 3: Implement**

`apps/scanner/src/lib/audit-draft/catalog-sample.ts:52`:

```ts
    // Ask for a barcode on exactly the products we will summarise. The
    // summary prints barcode:y/n per product and feeds a paid Catalog
    // Letter, so the two sizes must not drift apart.
    fetched = await fetchCatalog(rawUrl, {
      maxPages: 1,
      barcodeSampleSize: SAMPLE_SIZE,
    })
```

- [ ] **Step 4: Run the suite**

Run: `pnpm -F scanner exec vitest run src/lib/audit-draft/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/scanner/src/lib/audit-draft/catalog-sample.ts apps/scanner/src/lib/audit-draft/catalog-sample.test.ts
git commit -m "fix(audit-draft): read barcodes for every product in the letter sample"
```

---

### Task 9: Correct the spec, then verify against a live store

Two statements in the spec this plan implements are wrong, and one of them changes what the homepage copy may say. Fix them in the spec, then prove the whole thing works against a real merchant.

**Files:**
- Modify: `projects/flintmere/plans/2026-09-09-homepage-thesis-spec.md:148` and §2.2
- Test: a live scan, plus the full suite

**Interfaces:**
- Consumes: everything above.
- Produces: a spec the homepage PR can be built from without re-deriving these two facts.

- [ ] **Step 1: Correct §3's kindness-budget line**

Replace line 148, which names a constant that does not exist in this file:

```markdown
- One extra request per product, sampled. The scan's real bound is the 55-second
  whole-pipeline timeout (`DEFAULT_OPTIONS.timeoutMs`), and the barcode pass takes at
  most 20s of it, sequentially — one request in flight, which is the pacing. There is
  no `PACE_MS` in the fetcher; that is an env var of `scripts/batch-scan.ts`.
  **Ponytail: sample, and state the sampled count** — `ScanScopeLine` states it.
```

- [ ] **Step 2: Correct §2.2's `{total}` for the barcode branches**

§2.2 defines `{total}` as `score.productCount`. That is right for the product-type sentence and wrong for every barcode sentence: barcodes are read for a sample, so "None of the 1,000 products we read carries a barcode" would be a claim about 950 products nobody looked at. Add a second input and use it in branches 2, 3 and 4:

```markdown
- `{checked}` = `barcodesRead` from the scan envelope — how many products had a
  barcode read. Never `{total}`. When `barcodesRead === 0`, no barcode branch fires
  at all: the header says *We could not read barcodes from your storefront.* and the
  subhead carries the product-type sentence alone.
```

Then in the headline list, branch 2 becomes `{missingBarcode} == {checked}` → *None of the {checked} products we checked carries a barcode.*; branch 3 → *Every barcode we read passes its check digit. {missingBarcode} of {checked} products have none on at least one variant.*; branch 4 → *Every barcode on the {checked} products we checked passes its check digit.* Branch 1 keeps `{invalidGtin}` and swaps `{total}` for `{checked}`.

- [ ] **Step 3: Run everything**

```bash
pnpm -r --filter "@flintmere/*" build && pnpm -F @flintmere/scoring test && pnpm -F scanner test && pnpm -F scanner typecheck && pnpm -F scanner lint
```
Expected: all green.

- [ ] **Step 4: Scan a real store**

Start the scanner (`pnpm -F scanner dev`), then:

```bash
curl -s -X POST http://localhost:3001/api/scan -H 'content-type: application/json' -d '{"shopUrl":"workshopcoffee.com"}' | python3 -m json.tool | grep -A2 '"barcodesRead"\|missing-gtin\|invalid-gtin'
```

Expected: `barcodesRead` is 50, not 0. This is the spec's §6 gate 1 — the scan must no longer report 100% missing GTIN. Note the actual numbers in the PR body: `workshopcoffee.com` served a `null` barcode on the first product checked by hand on 2026-09-09, so a legitimate "none carries a barcode" verdict on this store is a correct result, not a failure. Confirm the same store's scan says *checked*, never *your catalog*.

- [ ] **Step 5: Run the canon audit**

Run: `/canon-audit` on the diff. It must clear the three sources in this plan's frontmatter, with particular attention to the word "valid" appearing in no clean-state string.

- [ ] **Step 6: Commit and open the PR**

```bash
git add projects/flintmere/plans/2026-09-09-homepage-thesis-spec.md
git commit -m "docs(spec): correct the kindness-budget line and scope the barcode counts"
git push -u origin HEAD
```

---

## Self-review

**Spec coverage.** §3's four design constraints each map to a task: sample-and-state → Tasks 2 and 7; fallback wording when `.js` is blocked → Tasks 3 and 5 (`barcodes-not-read`) and 7 (`barcodes not read`); a genuinely null barcode landing on branch 2 not branch 4 → Task 2 step 1, second test, which is the case that distinguishes read-and-empty from never-read; severity swap → Task 5. §1's ship gate is Task 9 step 4.

**Two spec corrections, not one.** The handover flagged `PACE_MS`. Writing the plan surfaced a second and larger one: §2.2 computes every barcode sentence against `score.productCount`, which after this change describes products nobody checked. Both are Task 9.

**Deliberate scope edges.** `computeGtinlessCeiling` (`score.ts`) discounts identifiers by `0.6` where the barcode sub-checks are 0.75 of the pillar — a pre-existing inconsistency, untouched here, worth its own look. `suppressionEstimate` gets a two-line scoping fix rather than the retirement ADR 0029 calls for; that stays a separate PR. Nothing in this plan touches the homepage — that is the spec's §4, gated on this landing.

**Two errors found and fixed in review.** Task 5's suppression-estimate snippet was written as a filter over `input.products`; the real signal is computed per product inside `extractSignals` and returns a boolean. Task 8's test called a `fetchCatalogMock` that does not exist — that test file has no fetcher mock at all today, so the task now adds one. Both were the "references a function no task defines" failure, caught by opening the files rather than trusting the map.

**Type consistency.** `barcodeRead` (on `ProductInput`, boolean, absent means read) and `barcodesRead` (on `FetchedCatalog` and `ScanResult`, number, optional) are one letter apart and mean different things. That is deliberate — one marks a product, one counts them — but it is the most likely thing to get wrong at a call site. Both are used with their full names in every snippet above.

**Estimate.** Tasks 1–4 about two hours, Task 5 an hour, Tasks 6–8 an hour, Task 9 half an hour plus the live scan.
