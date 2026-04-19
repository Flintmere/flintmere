import { AzureOpenAIProvider } from './providers/azure-openai.js';
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

  // Azure OpenAI (fallback)
  LLM_FALLBACK_PROVIDER?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_API_KEY?: string;
  AZURE_OPENAI_DEPLOYMENT?: string;
  AZURE_OPENAI_API_VERSION?: string;
}

/**
 * Construct an LLMRouter from environment variables.
 *
 * Canonical defaults per ADRs 0005 + 0006:
 *  - Primary: Vertex AI, gemini-2.5-flash, europe-west1
 *  - Hard case: Vertex AI, gemini-2.5-pro, europe-west1
 *  - Fallback: Azure OpenAI, gpt-4o-mini, EU region
 */
export function createRouter(
  env: FactoryEnv = process.env,
  onCompletion?: Parameters<typeof createRouterFromProviders>[3],
): LLMRouter {
  const project = requireEnv(env.GOOGLE_CLOUD_PROJECT, 'GOOGLE_CLOUD_PROJECT');
  const region = env.LLM_PRIMARY_REGION ?? 'europe-west1';

  const primary = new VertexProvider({
    project,
    location: region,
    model: env.LLM_PRIMARY_MODEL ?? 'gemini-2.5-flash',
    // Indicative prices (verify current at `memory/admin-ops/vendor-register.md`)
    inputPriceTenthPencePerMillion: 120, // £0.0012 / 1K tokens
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

  const fallbackEndpoint = env.AZURE_OPENAI_ENDPOINT;
  const fallbackKey = env.AZURE_OPENAI_API_KEY;
  const fallbackDeployment = env.AZURE_OPENAI_DEPLOYMENT ?? 'gpt-4o-mini';
  if (!fallbackEndpoint || !fallbackKey) {
    throw new LLMError(
      'auth',
      'AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY required for fallback provider',
    );
  }

  const fallback = new AzureOpenAIProvider({
    endpoint: fallbackEndpoint,
    apiKey: fallbackKey,
    deploymentName: fallbackDeployment,
    apiVersion: env.AZURE_OPENAI_API_VERSION,
    inputPriceTenthPencePerMillion: 120,
    outputPriceTenthPencePerMillion: 480,
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
