-- Per ADR 0023 slice 3: separate consent gate for publishing GMC
-- ground-truth counts on the public score page. The existing
-- publish_public_page consent covers pillar scores only; the
-- merchant's GMC disapproval data is a different data class and
-- requires explicit re-consent. Mirrors the 2026-04-24 precedent
-- where publish_public_page was deliberately split from
-- published_to_benchmark for the same reason.
--
-- Both columns additive + defaulted — safe for online add against
-- existing rows; no backfill required.

ALTER TABLE "scanner_scans"
  ADD COLUMN "publish_gmc_on_public_page" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "scanner_scans"
  ADD COLUMN "publish_gmc_on_public_page_at" TIMESTAMP(3);
