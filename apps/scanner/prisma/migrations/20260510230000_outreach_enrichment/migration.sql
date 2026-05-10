-- Auto-enrichment scaffolding for the outreach pipeline.
--
-- Stores the latest Gemini 2.5 Flash extraction draft per target (email
-- candidate + first-name candidate + per-field confidence + source URL)
-- in scanner_outreach_targets.enrichment_draft (JSONB).
--
-- enrichment_attempted_at gates the hourly cron's re-attempt window:
-- the cron picks pending targets where this is NULL OR <= now() - 24h,
-- so a transient outreach failure naturally retries the next day
-- without thrashing.
--
-- enrichment_failed_reason captures unreachable / parse-error / llm-error
-- short codes for operator visibility in the admin UI.

ALTER TABLE "scanner_outreach_targets"
  ADD COLUMN "enrichment_draft" JSONB,
  ADD COLUMN "enrichment_attempted_at" TIMESTAMP(3),
  ADD COLUMN "enrichment_failed_reason" TEXT;
