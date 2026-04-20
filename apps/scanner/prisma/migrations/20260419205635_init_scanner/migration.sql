-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('pending', 'running', 'complete', 'failed');

-- CreateTable
CREATE TABLE "scanner_scans" (
    "id" TEXT NOT NULL,
    "shop_url" TEXT NOT NULL,
    "normalised_domain" TEXT NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'pending',
    "score" INTEGER,
    "grade" TEXT,
    "score_json" JSONB,
    "product_count" INTEGER,
    "variant_count" INTEGER,
    "error_code" TEXT,
    "error_message" TEXT,
    "ip_hash" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "scanner_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanner_leads" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "scan_id" TEXT NOT NULL,
    "consented_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(3),
    "report_sent_at" TIMESTAMP(3),
    "report_opened_at" TIMESTAMP(3),

    CONSTRAINT "scanner_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scanner_concierge_audits" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "shop_url" TEXT NOT NULL,
    "stripe_payment_intent_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paid',
    "calendly_url" TEXT,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scanner_concierge_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scanner_scans_normalised_domain_idx" ON "scanner_scans"("normalised_domain");

-- CreateIndex
CREATE INDEX "scanner_scans_created_at_idx" ON "scanner_scans"("created_at");

-- CreateIndex
CREATE INDEX "scanner_scans_status_idx" ON "scanner_scans"("status");

-- CreateIndex
CREATE INDEX "scanner_leads_email_idx" ON "scanner_leads"("email");

-- CreateIndex
CREATE INDEX "scanner_leads_scan_id_idx" ON "scanner_leads"("scan_id");

-- CreateIndex
CREATE UNIQUE INDEX "scanner_concierge_audits_stripe_payment_intent_id_key" ON "scanner_concierge_audits"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "scanner_concierge_audits_email_idx" ON "scanner_concierge_audits"("email");

-- CreateIndex
CREATE INDEX "scanner_concierge_audits_status_idx" ON "scanner_concierge_audits"("status");

-- AddForeignKey
ALTER TABLE "scanner_leads" ADD CONSTRAINT "scanner_leads_scan_id_fkey" FOREIGN KEY ("scan_id") REFERENCES "scanner_scans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
