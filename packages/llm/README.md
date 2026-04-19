# @flintmere/llm

Flintmere's LLM provider abstraction. Both apps import from here; neither imports provider SDKs (`@google-cloud/vertexai`, `openai`) directly. ADR-locked per `decisions/0005-llm-provider-strategy.md` + `0006-hardcase-llm-lock-gemini-pro.md`.

## Providers

| Role | Provider | Model | Region |
|---|---|---|---|
| Primary bulk | Vertex AI | `gemini-2.5-flash` | `europe-west1` |
| Hard case | Vertex AI | `gemini-2.5-pro` | `europe-west1` |
| Fallback | Azure OpenAI | `gpt-4o-mini` | `swedencentral` / `francecentral` |

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
For vision (alt-text generation): `router.completeVisionBulk(...)`.

## Failover rules

Router falls over to the Azure OpenAI fallback when the primary returns:

- `rate-limit` (429)
- `timeout`
- `provider-error` (5xx)
- `circuit-open` (circuit breaker has tripped)

Router does **not** fall over on:

- `safety-filter` — content blocked; fallback would also block
- `auth` — config is wrong; fix the config
- `invalid-input` — caller's bug

## Circuit breaker

Bundled. Trips after 5 consecutive failures, opens for 30s, probes on next call. Configurable via `createRouter({ breaker: { failureThreshold, openDurationMs } })`.

## Customer data boundary

See `memory/compliance-risk/data-handling-rules.md`. Merchant catalog data must only flow through `router.completeBulk` / `completeHardCase` / `completeVisionBulk`. The `router.completeInternal` path is for synthetic-data / research / operator tooling where no merchant PII or commercial data crosses the boundary.

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
- `memory/product-engineering/architecture-rules.md` §Shared packages
- `memory/compliance-risk/data-handling-rules.md` §Customer data boundary
