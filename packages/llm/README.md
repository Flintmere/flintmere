# @flintmere/llm

Flintmere's LLM provider abstraction. Both apps import from here; neither imports provider SDKs (`@google-cloud/vertexai`, `openai`) directly. ADR-locked per `decisions/0005-llm-provider-strategy.md` + `0006-hardcase-llm-lock-gemini-pro.md` + `0010-fallback-pivot-openai-platform.md`.

## Providers

| Role | Provider | Model | Region / Posture |
|---|---|---|---|
| Primary bulk | Vertex AI | `gemini-2.5-flash` | `europe-west1` (EU-pinned) |
| Hard case | Vertex AI | `gemini-2.5-pro` | `europe-west1` (EU-pinned) |
| Fallback | OpenAI Platform | `gpt-4o-mini` | Global (privacy-by-minimization — see ADR 0010) |

## Usage

```ts
import { createRouter } from '@flintmere/llm';

const router = createRouter(process.env, (event) => {
  // Cost + latency sink. Plug your logger / Sentry here.
  logger.info('llm_completion', event);
});

const result = await router.completeBulk({
  messages: [
    { role: 'system', content: 'You are a product-catalog cleanup assistant.' },
    { role: 'user', content: 'Rewrite: "BEST EVER coffee grinder!!!"' },
  ],
  maxOutputTokens: 256,
  temperature: 0.2,
  tag: 'title-rewrite',
  requestId: crypto.randomUUID(),
});
```

For hard cases (title rewrites, ambiguous classification): `router.completeHardCase(...)`.
For vision (alt-text generation): `router.completeVisionBulk(...)` — primary only; falls over to fallback **only if `allowVisionFallback: true`** is set on the router (default `false`, see ADR 0010).

## Failover rules

Router falls over to the OpenAI Platform fallback when the primary returns:

- `rate-limit` (429)
- `timeout`
- `provider-error` (5xx)
- `circuit-open` (circuit breaker has tripped)

Router does **not** fall over on:

- `safety-filter` — content blocked; fallback would also block
- `auth` — config is wrong; fix the config
- `invalid-input` — caller's bug
- **vision requests** (default) — alt-text retries on next bulk cycle rather than crossing residency boundary

## Fallback posture (ADR 0010)

The OpenAI Platform fallback runs with code-level data minimization in lieu of formal EU residency. The privacy floor is "catalog text, no personal data, no images" — not "EU residency at all costs," because catalog text is not personal data under GDPR.

- `store: false` hard-coded on every request — suppresses 30-day Application State retention. **Note:** this does NOT exempt requests from OpenAI's separate 30-day abuse-monitoring retention. True ZDR is sales-gated and bundled with EU residency; neither is in effect on this account tier.
- Project-scoped key required — user keys (`sk-…`) rejected at construction; only `sk-proj-…` accepted.
- All message content runs through `sanitizeMessages` before transmission — strips email, phone, card patterns. Because abuse-monitoring retention applies to what does transmit, the sanitizer is the **primary** control, not defence-in-depth.
- Vision fallback disabled by default — `OpenAIProvider.completeVision` throws `LLMError('invalid-input')`.
- Catalog data only — apps must not pass merchant customer data through customer-data routes.
- Pass `onRedactions` to the provider to wire a warn-log on every non-zero redaction event. Each redaction is a near-miss to investigate.

Residency upgrade path: `decisions/0010-fallback-pivot-openai-platform.md` §Re-open conditions.

## Circuit breaker

Bundled. Trips after 5 consecutive failures, opens for 30s, probes on next call. Configurable via `createRouter({ breaker: { failureThreshold, openDurationMs } })`.

## Customer data boundary

See ADR 0010 §Decision and the `customer/` vs `internal/` split. Merchant catalog data must only flow through `router.completeBulk` / `completeHardCase` / `completeVisionBulk`. The `router.completeInternal` path is for synthetic-data / research / operator tooling where no merchant PII or commercial data crosses the boundary.

## Testing

```ts
import { MockProvider } from '@flintmere/llm/testing';
import { createRouterFromProviders } from '@flintmere/llm';

const primary = new MockProvider({ text: 'clean title' });
const router = createRouterFromProviders(primary, new MockProvider(), new MockProvider());
const result = await router.completeBulk({ messages: [...], maxOutputTokens: 100 });
```

## Scripts

- `pnpm build` — compile to `dist/`
- `pnpm test` — Vitest suites (no network)
- `pnpm typecheck` — tsc `--noEmit`

## Cross-references

- `projects/flintmere/decisions/0005-llm-provider-strategy.md`
- `projects/flintmere/decisions/0006-hardcase-llm-lock-gemini-pro.md`
- `projects/flintmere/decisions/0010-fallback-pivot-openai-platform.md`
- `memory/product-engineering/architecture-rules.md` §Shared packages
- `memory/admin-ops/vendor-register.md` §LLM
