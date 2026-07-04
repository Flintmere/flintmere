/**
 * Minimal Bluesky (AT Protocol) client — create-post only. ADR 0026.
 *
 * XRPC over fetch: createSession (handle + app password → accessJwt + did),
 * repo.uploadBlob per carousel slide (≤4, ≤1,000,000 bytes each — intake
 * caps at 950,000), then repo.createRecord with app.bsky.embed.images.
 * The official @atproto/api SDK is a heavy dependency for three endpoints
 * (anti-waste rule 1 considered — no wizard, small fetch surface).
 * Docs: https://docs.bsky.app/docs/advanced-guides/posts
 *
 * Auth uses an APP PASSWORD (bsky.app → Settings → App Passwords), never
 * the account password — revocable, scope-limited. Read response BODIES
 * on failure, not just status (anti-waste rule 3).
 *
 * Result shape is intentionally structurally identical to x-client's
 * PostTweetResult so both satisfy the queue's Poster contract without
 * the clients importing from each other or from the queue.
 */

import { isPng, pngDimensions } from './png';

const DEFAULT_SERVICE = 'https://bsky.social';

export interface BlueskyCredentials {
  /** Account handle, e.g. flintmere.bsky.social */
  handle: string;
  /** App password (xxxx-xxxx-xxxx-xxxx), not the login password. */
  appPassword: string;
  /** PDS service URL; defaults to https://bsky.social. */
  service?: string;
}

export type PostSkeetResult =
  | { ok: true; id: string }
  | { ok: false; status: number; error: string };

/** One carousel slide: PNG bytes + its alt text (required — accessibility floor). */
export interface SkeetImage {
  bytes: Uint8Array;
  alt: string;
}

interface SessionInfo {
  did: string;
  accessJwt: string;
}

async function createSession(
  creds: BlueskyCredentials,
  service: string,
  fetchFn: typeof fetch,
): Promise<{ ok: true; session: SessionInfo } | { ok: false; status: number; error: string }> {
  const res = await fetchFn(`${service}/xrpc/com.atproto.server.createSession`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: creds.handle, password: creds.appPassword }),
  });
  const bodyText = await res.text();
  if (res.status !== 200) return { ok: false, status: res.status, error: bodyText };
  try {
    const parsed = JSON.parse(bodyText) as { did?: string; accessJwt?: string };
    if (!parsed.did || !parsed.accessJwt) {
      return { ok: false, status: res.status, error: bodyText };
    }
    return { ok: true, session: { did: parsed.did, accessJwt: parsed.accessJwt } };
  } catch {
    return { ok: false, status: res.status, error: bodyText };
  }
}

async function uploadBlob(
  bytes: Uint8Array,
  session: SessionInfo,
  service: string,
  fetchFn: typeof fetch,
): Promise<{ ok: true; blob: unknown } | { ok: false; status: number; error: string }> {
  const res = await fetchFn(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      Authorization: `Bearer ${session.accessJwt}`,
    },
    // slice() copies onto a plain ArrayBuffer — BodyInit rejects the
    // ArrayBufferLike-backed Uint8Array Prisma hands back (≤950KB, negligible).
    body: bytes.slice(),
  });
  const bodyText = await res.text();
  if (res.status !== 200) return { ok: false, status: res.status, error: bodyText };
  try {
    const parsed = JSON.parse(bodyText) as { blob?: unknown };
    if (!parsed.blob) return { ok: false, status: res.status, error: bodyText };
    return { ok: true, blob: parsed.blob };
  } catch {
    return { ok: false, status: res.status, error: bodyText };
  }
}

export async function postSkeet(
  text: string,
  creds: BlueskyCredentials,
  fetchFn: typeof fetch = fetch,
  images: SkeetImage[] = [],
): Promise<PostSkeetResult> {
  const service = creds.service ?? DEFAULT_SERVICE;

  const session = await createSession(creds, service, fetchFn);
  if (!session.ok) return session;

  // Upload every slide BEFORE the record exists: any failure aborts the whole
  // publish (fail-the-row semantics — no partial carousels, no image without
  // alt). Unreferenced blobs are garbage-collected by the PDS.
  const embedImages: Array<Record<string, unknown>> = [];
  for (const image of images) {
    const uploaded = await uploadBlob(image.bytes, session.session, service, fetchFn);
    if (!uploaded.ok) return uploaded;
    embedImages.push({
      image: uploaded.blob,
      alt: image.alt,
      // aspectRatio spares clients a layout guess; IHDR is trustworthy here
      // because intake validated the PNG signature.
      ...(isPng(image.bytes) ? { aspectRatio: pngDimensions(image.bytes) } : {}),
    });
  }

  const record: Record<string, unknown> = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: new Date().toISOString(),
  };
  if (embedImages.length > 0) {
    record.embed = { $type: 'app.bsky.embed.images', images: embedImages };
  }

  const res = await fetchFn(`${service}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.session.did,
      collection: 'app.bsky.feed.post',
      record,
    }),
  });
  const bodyText = await res.text();
  if (res.status !== 200) return { ok: false, status: res.status, error: bodyText };
  try {
    const parsed = JSON.parse(bodyText) as { uri?: string };
    return { ok: true, id: parsed.uri ?? '' };
  } catch {
    return { ok: false, status: res.status, error: bodyText };
  }
}

export function readBlueskyCredentials(
  env: NodeJS.ProcessEnv = process.env,
): BlueskyCredentials | null {
  const { BLUESKY_HANDLE, BLUESKY_APP_PASSWORD, BLUESKY_SERVICE } = env;
  if (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD) return null;
  return {
    handle: BLUESKY_HANDLE,
    appPassword: BLUESKY_APP_PASSWORD,
    ...(BLUESKY_SERVICE ? { service: BLUESKY_SERVICE } : {}),
  };
}
