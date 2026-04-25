// Sentry pipeline self-test. Gated on SENTRY_TEST_ENABLED env var so the
// route 404s in normal operation. To verify: set SENTRY_TEST_ENABLED=true in
// Coolify, redeploy, GET /api/_sentry-test, see the error appear in Sentry,
// unset SENTRY_TEST_ENABLED, redeploy. Delete this route once Sentry is
// proven working in production.
//
// Three force-dynamic mechanisms (belt + braces) — Next.js 15 will otherwise
// prerender pure GET handlers at build time and freeze the env-var check at
// build-time values. `await headers()` is the canonical signal that defeats
// the prerender heuristic; the const exports back it up.
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
  await headers(); // touches a request-scoped API; prevents static optimization
  if (process.env.SENTRY_TEST_ENABLED !== 'true') {
    return new Response('Not found', {
      status: 404,
      headers: { 'cache-control': 'no-store, no-cache, must-revalidate' },
    });
  }
  throw new Error('Sentry test error — intentional. Pipeline verification.');
}
