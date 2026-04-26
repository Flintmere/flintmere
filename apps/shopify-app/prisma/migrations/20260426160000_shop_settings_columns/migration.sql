-- AlterTable: add merchant settings columns to Shop
ALTER TABLE "app_shops" ADD COLUMN "notifications_email" TEXT;
ALTER TABLE "app_shops" ADD COLUMN "weekly_digest_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "app_shops" ADD COLUMN "drift_alerts_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "app_shops" ADD COLUMN "auto_apply_tier1_enabled" BOOLEAN NOT NULL DEFAULT false;
