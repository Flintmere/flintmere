-- Merchant-driven benchmark contributions. User-initiated scans default
-- to published_to_benchmark = false; the /api/scan/[id]/publish route
-- flips it to true when the merchant clicks the opt-in card in the
-- Results block. The benchmark summary query unions {source:'bot'}
-- with {published_to_benchmark:true}, so opt-in scans feed the same
-- aggregates — bypassing the bot-block problem by using the merchant's
-- own IP for data collection.

ALTER TABLE "scanner_scans"
  ADD COLUMN "published_to_benchmark" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "published_at" TIMESTAMP(3);

CREATE INDEX "scanner_scans_published_to_benchmark_idx"
  ON "scanner_scans" ("published_to_benchmark");
