-- Add the rescan_30_day variant to the ScanSource enum so the Day-30
-- re-scan cron can persist Scan rows distinct from user-driven and
-- bot-driven scans (Slice B of the audit re-scan promise).
--
-- Postgres enum-extension is non-locking and runs in milliseconds. The
-- IF NOT EXISTS guard makes the migration idempotent against any prior
-- manual application.
ALTER TYPE "ScanSource" ADD VALUE IF NOT EXISTS 'rescan_30_day';
