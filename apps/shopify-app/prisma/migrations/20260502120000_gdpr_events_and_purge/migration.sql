-- Shop: track scheduled and completed data purges.

ALTER TABLE "app_shops"
  ADD COLUMN "purge_scheduled_at" TIMESTAMP(3),
  ADD COLUMN "purge_completed_at" TIMESTAMP(3);

-- GDPR audit trail. Append-only. Operator queries `deadline_at` to prove
-- the 30-day DSAR / redact response window was met.

CREATE TABLE "app_gdpr_events" (
  "id"               TEXT          NOT NULL,
  "shop_domain"      TEXT          NOT NULL,
  "topic"            TEXT          NOT NULL,
  "shopify_event_id" TEXT,
  "payload"          JSONB         NOT NULL,
  "received_at"      TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deadline_at"      TIMESTAMP(3),
  "job_id"           TEXT,
  "responded_at"     TIMESTAMP(3),
  "notes"            TEXT,

  CONSTRAINT "app_gdpr_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "app_gdpr_events_shop_domain_idx" ON "app_gdpr_events"("shop_domain");
CREATE INDEX "app_gdpr_events_topic_idx"        ON "app_gdpr_events"("topic");
CREATE INDEX "app_gdpr_events_deadline_at_idx"  ON "app_gdpr_events"("deadline_at");
CREATE INDEX "app_gdpr_events_received_at_idx" ON "app_gdpr_events"("received_at");
