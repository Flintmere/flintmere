-- Merchant opt-in to publish /score/{normalisedDomain}.
-- Independent from publishedToBenchmark (different consent, different surface).

ALTER TABLE "scanner_scans"
  ADD COLUMN "publish_public_page" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "public_page_at" TIMESTAMP(3);

CREATE INDEX "scanner_scans_publish_public_page_idx" ON "scanner_scans" ("publish_public_page");
