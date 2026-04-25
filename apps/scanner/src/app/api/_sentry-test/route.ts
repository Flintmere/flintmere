// Sentry pipeline self-test. Gated on SENTRY_TEST_ENABLED env var so the
// route 404s in normal operation. To verify: set SENTRY_TEST_ENABLED=true in
// Coolify, redeploy, GET /api/_sentry-test, see the error appear in Sentry,
// unset SENTRY_TEST_ENABLED, redeploy. Delete this route once Sentry is
// proven working in production.
export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.SENTRY_TEST_ENABLED !== 'true') {
    return new Response('Not found', { status: 404 });
  }
  throw new Error('Sentry test error — intentional. Pipeline verification.');
}
