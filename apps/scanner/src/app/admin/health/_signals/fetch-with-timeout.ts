// Next.js extends the standard RequestInit with a `next` option that
// controls the data cache (revalidate seconds, tags). The standard
// RequestInit type doesn't declare it, so we widen at the wrapper
// signature so callers can pass `next: { revalidate: 60 }` without a
// per-call cast.
export type FetchInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

export async function fetchWithTimeout(
  input: string | URL,
  init: FetchInit = {},
  timeoutMs = 1500,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
