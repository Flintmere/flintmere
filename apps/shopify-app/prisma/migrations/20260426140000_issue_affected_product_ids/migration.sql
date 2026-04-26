-- AlterTable: add affected_product_ids array (default empty so existing rows backfill safely)
ALTER TABLE "app_issues" ADD COLUMN "affected_product_ids" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- DropDefault: future inserts must provide the array explicitly
ALTER TABLE "app_issues" ALTER COLUMN "affected_product_ids" DROP DEFAULT;

-- CreateIndex: drill-down lookups filter by issue code per (scoreId)
CREATE INDEX "app_issues_code_idx" ON "app_issues"("code");
