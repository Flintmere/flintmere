-- Day-30 re-scan tracking on concierge audits.
--
-- Every paid audit promises a free re-scan 30 days after delivery so the
-- merchant can see what shifted. Capture happens at delivery time
-- (`scripts/audit-deliver.ts` — baseline scan id + denormalised score
-- snapshot + due-by stamp = delivered_at + 30 days). Execution happens
-- in the rescan-30-day cron (Slice B) which runs a fresh scan, persists
-- the rescan_scan_id, and emails the merchant the comparison.
--
-- All columns NULL-able: pre-existing rows (and rows still in `paid` /
-- `delivered` state without baseline) keep working; the cron filters
-- on `rescan_due_at IS NOT NULL AND rescan_completed_at IS NULL`.

ALTER TABLE "scanner_concierge_audits"
  ADD COLUMN "baseline_scan_id" TEXT,
  ADD COLUMN "baseline_score_json" JSONB,
  ADD COLUMN "rescan_due_at" TIMESTAMP(3),
  ADD COLUMN "rescan_scan_id" TEXT,
  ADD COLUMN "rescan_completed_at" TIMESTAMP(3),
  ADD COLUMN "rescan_email_sent_at" TIMESTAMP(3);

-- Cron's "what's due now" lookup hits this column with an inequality
-- + an IS NULL on rescan_completed_at. Plain B-tree on rescan_due_at
-- is enough — the table will stay small (one row per paid audit) and
-- the trailing IS NULL filter is cheap.
CREATE INDEX "scanner_concierge_audits_rescan_due_at_idx"
  ON "scanner_concierge_audits"("rescan_due_at");
