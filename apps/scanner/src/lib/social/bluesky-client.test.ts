import { describe, it, expect, vi } from 'vitest';
import { postSkeet, readBlueskyCredentials, type BlueskyCredentials } from './bluesky-client';
import { pngHeader } from './png.fixture';

const CREDS: BlueskyCredentials = {
  handle: 'flintmere.bsky.social',
  appPassword: 'test-app-password',
};

/** A fetch double that returns createSession then createRecord responses in order. */
function sequenceFetch(responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  let i = 0;
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return responses[i++]!;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

describe('postSkeet', () => {
  it('creates a session then a post and returns the record uri', async () => {
    const { fn, calls } = sequenceFetch([
      new Response(JSON.stringify({ did: 'did:plc:abc', accessJwt: 'jwt-123' }), { status: 200 }),
      new Response(JSON.stringify({ uri: 'at://did:plc:abc/app.bsky.feed.post/xyz' }), { status: 200 }),
    ]);

    const result = await postSkeet('hello bsky', CREDS, fn);

    expect(result).toEqual({ ok: true, id: 'at://did:plc:abc/app.bsky.feed.post/xyz' });
    // session call carries the handle as identifier and the app password in the body
    expect(calls[0]!.url).toBe('https://bsky.social/xrpc/com.atproto.server.createSession');
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      identifier: 'flintmere.bsky.social',
      password: 'test-app-password',
    });
    // record call is bearer-authed with the session jwt and posts the text
    expect(calls[1]!.url).toBe('https://bsky.social/xrpc/com.atproto.repo.createRecord');
    expect((calls[1]!.init.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-123');
    const recordBody = JSON.parse(calls[1]!.init.body as string);
    expect(recordBody.repo).toBe('did:plc:abc');
    expect(recordBody.collection).toBe('app.bsky.feed.post');
    expect(recordBody.record.text).toBe('hello bsky');
    expect(recordBody.record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns the session error body and never posts when auth fails', async () => {
    const { fn, calls } = sequenceFetch([
      new Response(JSON.stringify({ error: 'AuthenticationRequired' }), { status: 401 }),
    ]);
    const result = await postSkeet('hello', CREDS, fn);
    expect(result).toEqual({ ok: false, status: 401, error: '{"error":"AuthenticationRequired"}' });
    expect(calls).toHaveLength(1); // createRecord never attempted
  });

  it('returns the record error body on a failed post', async () => {
    const { fn } = sequenceFetch([
      new Response(JSON.stringify({ did: 'did:plc:abc', accessJwt: 'jwt-123' }), { status: 200 }),
      new Response(JSON.stringify({ error: 'InvalidRequest' }), { status: 400 }),
    ]);
    const result = await postSkeet('hello', CREDS, fn);
    expect(result).toEqual({ ok: false, status: 400, error: '{"error":"InvalidRequest"}' });
  });
});

describe('postSkeet with a carousel', () => {
  const sessionOk = () =>
    new Response(JSON.stringify({ did: 'did:plc:abc', accessJwt: 'jwt-123' }), { status: 200 });
  const blob = (link: string) => ({
    $type: 'blob',
    ref: { $link: link },
    mimeType: 'image/png',
    size: 33,
  });

  it('uploads each slide then embeds ordered images with alt and aspectRatio', async () => {
    const { fn, calls } = sequenceFetch([
      sessionOk(),
      new Response(JSON.stringify({ blob: blob('l1') }), { status: 200 }),
      new Response(JSON.stringify({ blob: blob('l2') }), { status: 200 }),
      new Response(JSON.stringify({ uri: 'at://did:plc:abc/app.bsky.feed.post/img' }), { status: 200 }),
    ]);
    const images = [
      { bytes: pngHeader(1080, 1350), alt: 'Slide 1' },
      { bytes: pngHeader(1200, 1200), alt: 'Slide 2' },
    ];

    const result = await postSkeet('caption', CREDS, fn, images);

    expect(result).toEqual({ ok: true, id: 'at://did:plc:abc/app.bsky.feed.post/img' });
    expect(calls[1]!.url).toBe('https://bsky.social/xrpc/com.atproto.repo.uploadBlob');
    expect((calls[1]!.init.headers as Record<string, string>)['Content-Type']).toBe('image/png');
    expect((calls[1]!.init.headers as Record<string, string>)['Authorization']).toBe('Bearer jwt-123');
    const { record } = JSON.parse(calls[3]!.init.body as string) as {
      record: { text: string; embed: unknown };
    };
    expect(record.text).toBe('caption');
    expect(record.embed).toEqual({
      $type: 'app.bsky.embed.images',
      images: [
        { image: blob('l1'), alt: 'Slide 1', aspectRatio: { width: 1080, height: 1350 } },
        { image: blob('l2'), alt: 'Slide 2', aspectRatio: { width: 1200, height: 1200 } },
      ],
    });
  });

  it('aborts before createRecord when a blob upload fails', async () => {
    const { fn, calls } = sequenceFetch([
      sessionOk(),
      new Response(JSON.stringify({ error: 'BlobTooLarge' }), { status: 413 }),
    ]);
    const result = await postSkeet('caption', CREDS, fn, [{ bytes: pngHeader(1, 1), alt: 'a' }]);
    expect(result).toEqual({ ok: false, status: 413, error: '{"error":"BlobTooLarge"}' });
    expect(calls).toHaveLength(2); // session + failed blob; record never attempted
  });

  it('omits the embed entirely for a text-only post', async () => {
    const { fn, calls } = sequenceFetch([
      sessionOk(),
      new Response(JSON.stringify({ uri: 'at://did:plc:abc/app.bsky.feed.post/txt' }), { status: 200 }),
    ]);
    await postSkeet('plain', CREDS, fn, []);
    const { record } = JSON.parse(calls[1]!.init.body as string) as { record: Record<string, unknown> };
    expect(record.embed).toBeUndefined();
  });
});

describe('readBlueskyCredentials', () => {
  it('returns null when either var is missing', () => {
    expect(readBlueskyCredentials({ BLUESKY_HANDLE: 'flintmere.bsky.social' } as NodeJS.ProcessEnv)).toBeNull();
    expect(readBlueskyCredentials({ BLUESKY_APP_PASSWORD: 'pw' } as NodeJS.ProcessEnv)).toBeNull();
    expect(readBlueskyCredentials({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it('reads handle + app password and defaults the service', () => {
    const creds = readBlueskyCredentials({
      BLUESKY_HANDLE: 'flintmere.bsky.social',
      BLUESKY_APP_PASSWORD: 'pw-1234',
    } as NodeJS.ProcessEnv);
    expect(creds).toEqual({ handle: 'flintmere.bsky.social', appPassword: 'pw-1234' });
  });

  it('honours an explicit service override', () => {
    const creds = readBlueskyCredentials({
      BLUESKY_HANDLE: 'flintmere.bsky.social',
      BLUESKY_APP_PASSWORD: 'pw-1234',
      BLUESKY_SERVICE: 'https://pds.example.com',
    } as NodeJS.ProcessEnv);
    expect(creds?.service).toBe('https://pds.example.com');
  });
});
