-- Cold-email outreach pipeline. Sprint 2026-05-09 → 2026-05-23.
-- Sends from team.flintmere.com (separate Resend domain) to keep apex
-- hello@flintmere.com transactional reputation intact.
--
-- Four tables:
--   scanner_outreach_targets      — one row per merchant in the cohort
--   scanner_outreach_sends        — one row per send (initial OR followup)
--   scanner_outreach_unsubscribes — permanent opt-outs, checked before every send
--   scanner_resend_processed_events — Resend webhook idempotency
--
-- Schema/Prisma model invariants:
--   - shop_domain is the global uniqueness key on outreach_targets
--   - (target_id, kind) is unique on outreach_sends — one initial + one followup max
--   - recipient_email unique on outreach_unsubscribes — one row per email
--   - event_id PK on resend_processed_events (mirrors Stripe pattern)

CREATE TABLE "scanner_outreach_targets" (
  "id"               TEXT NOT NULL,
  "shop_domain"      TEXT NOT NULL,
  "recipient_email"  TEXT,
  "first_name"       TEXT,
  "score"            INTEGER,
  "grade"            VARCHAR(2),
  "product_count"    INTEGER,
  "uk_signal"        BOOLEAN NOT NULL DEFAULT false,
  "scan_id"          TEXT,
  "rescan_url"       TEXT,
  "source"           TEXT NOT NULL,
  "status"           TEXT NOT NULL DEFAULT 'pending',
  "subject_variant"  VARCHAR(1) NOT NULL DEFAULT 'A',
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"       TIMESTAMP(3) NOT NULL,
  "sent_at"          TIMESTAMP(3),
  "followed_up_at"   TIMESTAMP(3),
  "replied_at"       TIMESTAMP(3),
  "dropped_reason"   TEXT,

  CONSTRAINT "scanner_outreach_targets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scanner_outreach_targets_shop_domain_key"
  ON "scanner_outreach_targets"("shop_domain");

CREATE INDEX "scanner_outreach_targets_status_idx"
  ON "scanner_outreach_targets"("status");

CREATE INDEX "scanner_outreach_targets_recipient_email_idx"
  ON "scanner_outreach_targets"("recipient_email");

CREATE INDEX "scanner_outreach_targets_sent_at_idx"
  ON "scanner_outreach_targets"("sent_at");

CREATE TABLE "scanner_outreach_sends" (
  "id"                 TEXT NOT NULL,
  "target_id"          TEXT NOT NULL,
  "kind"               TEXT NOT NULL,
  "subject_variant"    VARCHAR(1) NOT NULL,
  "subject"            TEXT NOT NULL,
  "body_html"          TEXT NOT NULL,
  "body_text"          TEXT NOT NULL,
  "resend_message_id"  TEXT,
  "delivery_status"    TEXT NOT NULL DEFAULT 'sent',
  "sent_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "error_message"      TEXT,

  CONSTRAINT "scanner_outreach_sends_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scanner_outreach_sends_target_id_kind_key"
  ON "scanner_outreach_sends"("target_id", "kind");

CREATE INDEX "scanner_outreach_sends_target_id_idx"
  ON "scanner_outreach_sends"("target_id");

CREATE INDEX "scanner_outreach_sends_delivery_status_idx"
  ON "scanner_outreach_sends"("delivery_status");

ALTER TABLE "scanner_outreach_sends"
  ADD CONSTRAINT "scanner_outreach_sends_target_id_fkey"
  FOREIGN KEY ("target_id") REFERENCES "scanner_outreach_targets"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "scanner_outreach_unsubscribes" (
  "id"               TEXT NOT NULL,
  "recipient_email"  TEXT NOT NULL,
  "unsubscribed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source"           TEXT NOT NULL,

  CONSTRAINT "scanner_outreach_unsubscribes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scanner_outreach_unsubscribes_recipient_email_key"
  ON "scanner_outreach_unsubscribes"("recipient_email");

CREATE TABLE "scanner_resend_processed_events" (
  "event_id"      TEXT NOT NULL,
  "event_type"    TEXT NOT NULL,
  "processed_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scanner_resend_processed_events_pkey" PRIMARY KEY ("event_id")
);

CREATE INDEX "scanner_resend_processed_events_processed_at_idx"
  ON "scanner_resend_processed_events"("processed_at");
