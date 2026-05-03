-- CreateTable
CREATE TABLE "scanner_one_time_secrets" (
    "id" TEXT NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "auth_tag" BYTEA NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),

    CONSTRAINT "scanner_one_time_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scanner_one_time_secrets_expires_at_idx" ON "scanner_one_time_secrets"("expires_at");
