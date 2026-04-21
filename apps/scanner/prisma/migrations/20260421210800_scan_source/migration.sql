-- Add ScanSource enum + source column on scanner_scans.
-- Supports the benchmark pipeline: FlintmereBot scans are tagged
-- source='bot' so aggregates can filter to bot-only (consented-by-
-- default public catalogs) vs user-initiated scans.

CREATE TYPE "ScanSource" AS ENUM ('user', 'bot');

ALTER TABLE "scanner_scans"
  ADD COLUMN "source" "ScanSource" NOT NULL DEFAULT 'user';

CREATE INDEX "scanner_scans_source_idx" ON "scanner_scans" ("source");
