import type { CrawlabilityInput } from '@flintmere/scoring';
import { assertPublicHost, isPrivateHostLiteral } from './ssrf';

const USER_AGENT =
  'Flintmere-Scanner/0.1 (+https://flintmere.com/bot)';

const MAX_BODY_BYTES = 512_000; // 500 KB per file — more than enough for robots/llms/sitemap heads.

export interface FetchCrawlabilityOptions {
  /** Per-request timeout in ms. Default 5000. */
  timeoutMs?: number;
}

export async function fetchCrawlability(
  domain: string,
  options: FetchCrawlabilityOptions = {},
): Promise<CrawlabilityInput> {
  const timeoutMs = options.timeoutMs ?? 5_000;

  // Same domain that fetchCatalog already gated, but the scan route also
  // calls this independently — re-gate here so the helper is safe to call
  // from anywhere.
  if (isPrivateHostLiteral(domain)) {
    return { robotsTxt: null, llmsTxt: null, sitemapXml: null };
  }
  try {
    await assertPublicHost(domain);
  } catch {
    return { robotsTxt: null, llmsTxt: null, sitemapXml: null };
  }

  const [robotsTxt, llmsTxt, sitemapXml] = await Promise.all([
    fetchTextOrNull(`https://${domain}/robots.txt`, timeoutMs),
    fetchTextOrNull(`https://${domain}/llms.txt`, timeoutMs),
    fetchTextOrNull(`https://${domain}/sitemap.xml`, timeoutMs),
  ]);

  return { robotsTxt, llmsTxt, sitemapXml };
}

async function fetchTextOrNull(
  url: string,
  timeoutMs: number,
): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/plain, text/xml, application/xml, text/*;q=0.9, */*;q=0.5',
      },
    });
    if (!res.ok) return null;

    const reader = res.body?.getReader();
    if (!reader) return (await res.text()).slice(0, MAX_BODY_BYTES);

    const decoder = new TextDecoder();
    let out = '';
    while (out.length < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return out.slice(0, MAX_BODY_BYTES);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
