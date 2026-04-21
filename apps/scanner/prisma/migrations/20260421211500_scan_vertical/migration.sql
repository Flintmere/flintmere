-- Add nullable vertical hint to scanner_scans. Populated by the bot
-- batch scanner from the operator's stores.csv vertical column; left
-- null for user-initiated scans. Used by /api/benchmark/summary to
-- group aggregates by vertical without exposing any individual store.

ALTER TABLE "scanner_scans" ADD COLUMN "vertical" VARCHAR(64);
CREATE INDEX "scanner_scans_vertical_idx" ON "scanner_scans" ("vertical");
