import { describe, it, expect, vi } from 'vitest';
import { buildOAuthHeader, postTweet, type XCredentials } from './x-client';

const CREDS: XCredentials = {
  apiKey: 'consumer-key',
  apiKeySecret: 'consumer-secret',
  accessToken: 'access-token',
  accessTokenSecret: 'access-secret',
};

/** Routes fetches by URL and records calls in order. */
function routeFetch(handlers: Record<string, () => Response>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const u = String(url);
    calls.push({ url: u, init: init ?? {} });
    const handler = handlers[u];
    if (!handler) throw new Error(`unexpected fetch: ${u}`);
    return handler();
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('buildOAuthHeader', () => {
  it('produces a deterministic header for fixed nonce + timestamp', () => {
    const header = buildOAuthHeader(
      'POST',
      'https://api.x.com/2/tweets',
      CREDS,
      { nonce: 'fixed-nonce', timestampSec: 1780000000 },
    );
    expect(header).toContain('OAuth ');
    expect(header).toContain('oauth_consumer_key="consumer-key"');
    expect(header).toContain('oauth_token="access-token"');
    expect(header).toContain('oauth_signature_method="HMAC-SHA1"');
    expect(header).toContain('oauth_timestamp="1780000000"');
    expect(header).toContain('oauth_nonce="fixed-nonce"');
    // Signature is deterministic given fixed inputs — pin determinism so
    // any signing-logic regression fails loudly.
    expect(header).toMatch(/oauth_signature="[A-Za-z0-9%]+"/);
    const again = buildOAuthHeader('POST', 'https://api.x.com/2/tweets', CREDS, {
      nonce: 'fixed-nonce',
      timestampSec: 1780000000,
    });
    expect(again).toBe(header);
  });
});

describe('postTweet', () => {
  it('returns the tweet id on 201', async () => {
    const fetchFn = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify({ data: { id: '1234567890', text: 'hello' } }), { status: 201 }),
    );
    const result = await postTweet('hello', CREDS, fetchFn);
    expect(result).toEqual({ ok: true, id: '1234567890' });
    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toBe('https://api.x.com/2/tweets');
    expect((init!.headers as Record<string, string>)['Authorization']).toContain('OAuth ');
    expect(init!.body).toBe(JSON.stringify({ text: 'hello' }));
  });

  it('returns the response body as error on non-2xx', async () => {
    const fetchFn = vi.fn(async (..._args: Parameters<typeof fetch>) =>
      new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 }),
    );
    const result = await postTweet('hello', CREDS, fetchFn);
    expect(result).toEqual({ ok: false, status: 401, error: '{"title":"Unauthorized"}' });
  });
});

describe('postTweet with a carousel', () => {
  const UPLOAD = 'https://api.x.com/2/media/upload';
  const METADATA = 'https://api.x.com/2/media/metadata';
  const TWEETS = 'https://api.x.com/2/tweets';

  it('uploads each slide, alt-tags it, then tweets with ordered media_ids', async () => {
    let uploads = 0;
    const { fn, calls } = routeFetch({
      [UPLOAD]: () => new Response(JSON.stringify({ data: { id: `m${++uploads}` } }), { status: 200 }),
      [METADATA]: () => new Response('{}', { status: 200 }),
      [TWEETS]: () => new Response(JSON.stringify({ data: { id: 'tweet-9' } }), { status: 201 }),
    });
    const images = [
      { bytes: new Uint8Array([1]), alt: 'Slide 1' },
      { bytes: new Uint8Array([2]), alt: 'Slide 2' },
    ];

    const result = await postTweet('caption', CREDS, fn, images);

    expect(result).toEqual({ ok: true, id: 'tweet-9' });
    // per-slide upload → alt-tag, in order, then a single tweet
    expect(calls.map((c) => c.url)).toEqual([UPLOAD, METADATA, UPLOAD, METADATA, TWEETS]);
    const form = calls[0]!.init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get('media_category')).toBe('tweet_image');
    expect((calls[0]!.init.headers as Record<string, string>)['Authorization']).toContain('OAuth ');
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({
      id: 'm1',
      metadata: { alt_text: { text: 'Slide 1' } },
    });
    expect(JSON.parse(calls[4]!.init.body as string)).toEqual({
      text: 'caption',
      media: { media_ids: ['m1', 'm2'] },
    });
  });

  it('aborts before the tweet when an upload is rejected', async () => {
    const { fn, calls } = routeFetch({
      [UPLOAD]: () => new Response(JSON.stringify({ title: 'Forbidden' }), { status: 403 }),
    });
    const result = await postTweet('caption', CREDS, fn, [{ bytes: new Uint8Array([1]), alt: 'a' }]);
    expect(result).toEqual({ ok: false, status: 403, error: '{"title":"Forbidden"}' });
    expect(calls.map((c) => c.url)).toEqual([UPLOAD]); // no alt call, no tweet
  });

  it('aborts before the tweet when alt metadata fails — no image publishes without alt', async () => {
    const { fn, calls } = routeFetch({
      [UPLOAD]: () => new Response(JSON.stringify({ data: { id: 'm1' } }), { status: 200 }),
      [METADATA]: () => new Response(JSON.stringify({ title: 'Bad Request' }), { status: 400 }),
    });
    const result = await postTweet('caption', CREDS, fn, [{ bytes: new Uint8Array([1]), alt: 'a' }]);
    expect(result).toEqual({ ok: false, status: 400, error: '{"title":"Bad Request"}' });
    expect(calls.map((c) => c.url)).toEqual([UPLOAD, METADATA]); // tweet never fires
  });
});
