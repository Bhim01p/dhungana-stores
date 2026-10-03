CREATE TABLE "admin_login_challenges" (
    "id" TEXT NOT NULL,
    "admin_user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_login_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_login_challenges_admin_user_id_expires_at_idx"
ON "admin_login_challenges"("admin_user_id", "expires_at");

ALTER TABLE "admin_login_challenges"
ADD CONSTRAINT "admin_login_challenges_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
