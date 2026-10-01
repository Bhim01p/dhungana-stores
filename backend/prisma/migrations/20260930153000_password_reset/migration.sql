CREATE TYPE "PasswordResetAccountType" AS ENUM ('CUSTOMER', 'ADMIN');

ALTER TABLE "admin_users" ADD COLUMN "recovery_email" TEXT;
CREATE UNIQUE INDEX "admin_users_recovery_email_key" ON "admin_users"("recovery_email");
ALTER TABLE "customers" ADD COLUMN "password_changed_at" TIMESTAMP(3);

CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "account_type" "PasswordResetAccountType" NOT NULL,
    "account_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");
CREATE INDEX "password_reset_tokens_account_type_account_id_idx" ON "password_reset_tokens"("account_type", "account_id");
