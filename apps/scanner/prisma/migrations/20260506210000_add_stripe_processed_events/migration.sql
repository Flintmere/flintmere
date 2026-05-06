-- Stripe webhook event-ID idempotency table.
--
-- Stripe guarantees at-least-once webhook delivery — if our handler
-- takes >20s or fails mid-flight, Stripe retries the same event_id.
-- Without this table, retries re-fire side effects (duplicate invoice
-- creation, duplicate emails) before the row-level guards on
-- scanner_concierge_audits would catch them, because two concurrent
-- invocations of the same event race on those guards.
--
-- The PRIMARY KEY on event_id is the lock: an INSERT race resolves
-- via unique-violation, the loser returns 200 (replay), the winner
-- proceeds to dispatch. A failed dispatch leaves the row in place,
-- so subsequent Stripe retries are no-ops and operator alert (Sentry)
-- is the manual-recovery signal.
--
-- Retention: keep ~30 days (Stripe's max retry window per docs). A
-- prune job ages out older rows; until the cron host lands, manual
-- prune on a quarterly cadence. The processed_at index supports the
-- prune query.

CREATE TABLE "scanner_stripe_processed_events" (
  "event_id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scanner_stripe_processed_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "scanner_stripe_processed_events_processed_at_idx"
  ON "scanner_stripe_processed_events"("processed_at");
