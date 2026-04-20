-- CreateTable
CREATE TABLE "app_sessions" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_shops" (
    "shop_domain" TEXT NOT NULL,
    "encrypted_access_token" TEXT NOT NULL,
    "scopes" TEXT NOT NULL,
    "plan_tier" TEXT NOT NULL DEFAULT 'free',
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalled_at" TIMESTAMP(3),
    "last_sync_at" TIMESTAMP(3),
    "last_score_at" TIMESTAMP(3),
    "last_score_composite" INTEGER,
    "country_code" TEXT,
    "primary_domain" TEXT,

    CONSTRAINT "app_shops_pkey" PRIMARY KEY ("shop_domain")
);

-- CreateTable
CREATE TABLE "app_products" (
    "id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "shopify_product_id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "product_type" TEXT,
    "status" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "raw_payload" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_variants" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shopify_variant_id" TEXT NOT NULL,
    "sku" TEXT,
    "barcode" TEXT,
    "price" TEXT NOT NULL,
    "inventory_quantity" INTEGER,
    "raw_payload" JSONB NOT NULL,

    CONSTRAINT "app_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_scores" (
    "id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "composite" INTEGER NOT NULL,
    "grade" TEXT NOT NULL,
    "gtinless_ceiling" INTEGER NOT NULL,
    "pillars" JSONB NOT NULL,
    "product_count" INTEGER NOT NULL,
    "variant_count" INTEGER NOT NULL,

    CONSTRAINT "app_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_issues" (
    "id" TEXT NOT NULL,
    "score_id" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected_count" INTEGER NOT NULL,
    "revenue_impact_score" INTEGER NOT NULL,

    CONSTRAINT "app_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_fixes" (
    "id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "fix_type" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "product_count" INTEGER NOT NULL,
    "before_state" JSONB NOT NULL,
    "after_state" JSONB NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revertable_until" TIMESTAMP(3) NOT NULL,
    "reverted_at" TIMESTAMP(3),

    CONSTRAINT "app_fixes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_webhook_events" (
    "id" TEXT NOT NULL,
    "shopify_event_id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "payload" JSONB,

    CONSTRAINT "app_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_channel_health" (
    "id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ai_clicks" INTEGER NOT NULL DEFAULT 0,
    "ai_orders" INTEGER NOT NULL DEFAULT 0,
    "ai_revenue_pence" INTEGER NOT NULL DEFAULT 0,
    "google_shopping_approvals" INTEGER NOT NULL DEFAULT 0,
    "ai_overviews_citations" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "app_channel_health_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_shops_plan_tier_idx" ON "app_shops"("plan_tier");

-- CreateIndex
CREATE INDEX "app_shops_installed_at_idx" ON "app_shops"("installed_at");

-- CreateIndex
CREATE INDEX "app_products_shop_domain_idx" ON "app_products"("shop_domain");

-- CreateIndex
CREATE UNIQUE INDEX "app_products_shop_domain_shopify_product_id_key" ON "app_products"("shop_domain", "shopify_product_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_variants_product_id_shopify_variant_id_key" ON "app_variants"("product_id", "shopify_variant_id");

-- CreateIndex
CREATE INDEX "app_scores_shop_domain_idx" ON "app_scores"("shop_domain");

-- CreateIndex
CREATE INDEX "app_scores_scored_at_idx" ON "app_scores"("scored_at");

-- CreateIndex
CREATE INDEX "app_issues_score_id_idx" ON "app_issues"("score_id");

-- CreateIndex
CREATE INDEX "app_fixes_shop_domain_idx" ON "app_fixes"("shop_domain");

-- CreateIndex
CREATE INDEX "app_fixes_revertable_until_idx" ON "app_fixes"("revertable_until");

-- CreateIndex
CREATE UNIQUE INDEX "app_webhook_events_shopify_event_id_key" ON "app_webhook_events"("shopify_event_id");

-- CreateIndex
CREATE INDEX "app_webhook_events_shop_domain_idx" ON "app_webhook_events"("shop_domain");

-- CreateIndex
CREATE INDEX "app_webhook_events_topic_idx" ON "app_webhook_events"("topic");

-- CreateIndex
CREATE INDEX "app_webhook_events_received_at_idx" ON "app_webhook_events"("received_at");

-- CreateIndex
CREATE INDEX "app_channel_health_date_idx" ON "app_channel_health"("date");

-- CreateIndex
CREATE UNIQUE INDEX "app_channel_health_shop_domain_date_key" ON "app_channel_health"("shop_domain", "date");

-- AddForeignKey
ALTER TABLE "app_products" ADD CONSTRAINT "app_products_shop_domain_fkey" FOREIGN KEY ("shop_domain") REFERENCES "app_shops"("shop_domain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_variants" ADD CONSTRAINT "app_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "app_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_scores" ADD CONSTRAINT "app_scores_shop_domain_fkey" FOREIGN KEY ("shop_domain") REFERENCES "app_shops"("shop_domain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_issues" ADD CONSTRAINT "app_issues_score_id_fkey" FOREIGN KEY ("score_id") REFERENCES "app_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_fixes" ADD CONSTRAINT "app_fixes_shop_domain_fkey" FOREIGN KEY ("shop_domain") REFERENCES "app_shops"("shop_domain") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_webhook_events" ADD CONSTRAINT "app_webhook_events_shop_domain_fkey" FOREIGN KEY ("shop_domain") REFERENCES "app_shops"("shop_domain") ON DELETE CASCADE ON UPDATE CASCADE;
