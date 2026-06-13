/**
 * Minimal Bluesky (AT Protocol) client — create-post only. ADR 0026.
 *
 * Two XRPC calls over fetch: createSession (handle + app password →
 * accessJwt + did) then repo.createRecord (the post). The official
 * @atproto/api SDK is a heavy dependency for two endpoints (anti-waste
 * rule 1 considered — no wizard, ~40 lines of fetch).
 * Docs: https://docs.bsky.app/docs/api/com-atproto-repo-create-record
 *
 * Auth uses an APP PASSWORD (bsky.app → Settings → App Passwords), never
 * the account password — revocable, scope-limited. Read response BODIES
 * on failure, not just status (anti-waste rule 3).
 *
 * Result shape is intentionally structurally identical to x-client's
 * PostTweetResult so both satisfy the queue's Poster contract without
 * the clients importing from each other or from the queue.
 */

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

export async function postSkeet(
  text: string,
  creds: BlueskyCredentials,
  fetchFn: typeof fetch = fetch,
): Promise<PostSkeetResult> {
  const service = creds.service ?? DEFAULT_SERVICE;

  const session = await createSession(creds, service, fetchFn);
  if (!session.ok) return session;

  const res = await fetchFn(`${service}/xrpc/com.atproto.repo.createRecord`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.session.accessJwt}`,
    },
    body: JSON.stringify({
      repo: session.session.did,
      collection: 'app.bsky.feed.post',
      record: {
        $type: 'app.bsky.feed.post',
        text,
        createdAt: new Date().toISOString(),
      },
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
