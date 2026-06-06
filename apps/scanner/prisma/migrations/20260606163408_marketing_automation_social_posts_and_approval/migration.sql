-- Per ADR 0026 — marketing automation pipeline (SocialPost queue + outreach batch approval).
--
-- Two additive changes — no data transforms, no breaking alterations:
--
--   1. New table: scanner_social_posts
--      Agent-drafted social posts queued for deterministic publishing by
--      /api/cron/social-post. Status: queued → posted | failed.
--      Failed rows are never auto-retried; the daily brief flags them
--      and the weekly agent re-queues or rewrites.
--
--   2. ALTER scanner_outreach_targets: adds batch_id + approved_at
--      Agent stages targets with status='ready_for_approval' + batch_id;
--      /api/approve flips them to 'queued' and stamps approved_at.
--      batch_id NULL ⇒ legacy path, untouched by approval flow.

CREATE TABLE "scanner_social_posts" (
  "id"              TEXT NOT NULL,
  "channel"         TEXT NOT NULL,
  "body"            TEXT NOT NULL,
  "alt_text"        TEXT,
  "utm_campaign"    TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'queued',
  "scheduled_at"    TIMESTAMP(3) NOT NULL,
  "posted_at"       TIMESTAMP(3),
  "external_id"     TEXT,
  "error_message"   TEXT,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "scanner_social_posts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scanner_social_posts_status_scheduled_at_idx"
  ON "scanner_social_posts"("status", "scheduled_at");

ALTER TABLE "scanner_outreach_targets"
  ADD COLUMN "batch_id"    TEXT,
  ADD COLUMN "approved_at" TIMESTAMP(3);

CREATE INDEX "scanner_outreach_targets_batch_id_idx"
  ON "scanner_outreach_targets"("batch_id");
