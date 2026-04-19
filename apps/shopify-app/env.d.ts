/// <reference types="@remix-run/node" />
/// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    SHOPIFY_API_KEY: string;
    SHOPIFY_API_SECRET: string;
    SHOPIFY_APP_URL: string;
    SHOPIFY_SCOPES: string;
    SHOPIFY_TOKEN_ENCRYPTION_KEY: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    LLM_PRIMARY_PROVIDER?: string;
    LLM_PRIMARY_MODEL?: string;
    LLM_HARDCASE_MODEL?: string;
    LLM_PRIMARY_REGION?: string;
    LLM_FALLBACK_PROVIDER?: string;
    GOOGLE_APPLICATION_CREDENTIALS?: string;
    STRIPE_SECRET_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    RESEND_API_KEY?: string;
    SENTRY_DSN?: string;
    POSTHOG_KEY?: string;
    POSTHOG_HOST?: string;
  }
}
