ALTER TABLE "support_messages"
ADD COLUMN "customer_id" TEXT;

CREATE INDEX "support_messages_customer_id_created_at_idx"
ON "support_messages"("customer_id", "created_at");

ALTER TABLE "support_messages"
ADD CONSTRAINT "support_messages_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "support_message_replies" (
    "id" TEXT NOT NULL,
    "support_message_id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "responder_name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email_sent_at" TIMESTAMP(3),
    CONSTRAINT "support_message_replies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_message_replies_support_message_id_created_at_idx"
ON "support_message_replies"("support_message_id", "created_at");

ALTER TABLE "support_message_replies"
ADD CONSTRAINT "support_message_replies_support_message_id_fkey"
FOREIGN KEY ("support_message_id") REFERENCES "support_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_message_replies"
ADD CONSTRAINT "support_message_replies_admin_user_id_fkey"
FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
