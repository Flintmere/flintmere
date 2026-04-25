import { OpenAIProvider } from './providers/openai.js';
import { VertexProvider } from './providers/vertex.js';
import { LLMRouter } from './router.js';
import { LLMError, type LLMProvider } from './types.js';

export interface FactoryEnv {
  // Vertex
  GOOGLE_CLOUD_PROJECT?: string;
  LLM_PRIMARY_PROVIDER?: string;
  LLM_PRIMARY_MODEL?: string;
  LLM_PRIMARY_REGION?: string;
  LLM_HARDCASE_PROVIDER?: string;
  LLM_HARDCASE_MODEL?: string;
  LLM_HARDCASE_REGION?: string;

  // OpenAI Platform (fallback) — ADR 0010
  LLM_FALLBACK_PROVIDER?: string;
  OPENAI_API_KEY?: string;
  OPENAI_PROJECT_ID?: string;
  OPENAI_MODEL?: string;
  OPENAI_BASE_URL?: string;
}

/**
 * Construct an LLMRouter from environment variables.
 *
 * Canonical defaults per ADRs 0005 + 0006 + 0010:
 *  - Primary: Vertex AI, gemini-2.5-flash, europe-west1
 *  - Hard case: Vertex AI, gemini-2.5-pro, europe-west1
 *  - Fallback: OpenAI Platform, gpt-4o-mini, project-scoped key, store: false,
 *    PII sanitizer, vision fallback disabled
 *
 * `onRedactions` fires on every non-zero sanitizer redaction at the OpenAI
 * fallback boundary — wire your warn-log / Sentry breadcrumb here.
 */
export function createRouter(
  env: FactoryEnv = process.env,
  onCompletion?: Parameters<typeof createRouterFromProviders>[3],
  onRedactions?: (count: number) => void,
): LLMRouter {
  const project = requireEnv(env.GOOGLE_CLOUD_PROJECT, 'GOOGLE_CLOUD_PROJECT');
  const region = env.LLM_PRIMARY_REGION ?? 'europe-west1';

  const primary = new VertexProvider({
    project,
    location: region,
    model: env.LLM_PRIMARY_MODEL ?? 'gemini-2.5-flash',
    inputPriceTenthPencePerMillion: 120,
    outputPriceTenthPencePerMillion: 480,
  });

  const hardcaseRegion = env.LLM_HARDCASE_REGION ?? region;
  const hardcase = new VertexProvider({
    project,
    location: hardcaseRegion,
    model: env.LLM_HARDCASE_MODEL ?? 'gemini-2.5-pro',
    inputPriceTenthPencePerMillion: 1000,
    outputPriceTenthPencePerMillion: 4000,
  });

  const fallback = new OpenAIProvider({
    apiKey: requireEnv(env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
    projectId: requireEnv(env.OPENAI_PROJECT_ID, 'OPENAI_PROJECT_ID'),
    model: env.OPENAI_MODEL ?? 'gpt-4o-mini',
    baseURL: env.OPENAI_BASE_URL,
    inputPriceTenthPencePerMillion: 120,
    outputPriceTenthPencePerMillion: 480,
    onRedactions,
  });

  return createRouterFromProviders(primary, hardcase, fallback, onCompletion);
}

export function createRouterFromProviders(
  primary: LLMProvider,
  hardcase: LLMProvider,
  fallback: LLMProvider,
  onCompletion?: ConstructorParameters<typeof LLMRouter>[0]['onCompletion'],
): LLMRouter {
  return new LLMRouter({ primary, hardcase, fallback, onCompletion });
}

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new LLMError('auth', `Missing required env var: ${name}`);
  }
  return value;
}
