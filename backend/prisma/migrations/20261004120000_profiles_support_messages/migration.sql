ALTER TABLE "admin_users"
ADD COLUMN "image_url" TEXT;

CREATE TYPE "SupportMessageType" AS ENUM ('HELP', 'COMPLAINT', 'REVIEW', 'OTHER');
CREATE TYPE "SupportMessageStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED');

CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "type" "SupportMessageType" NOT NULL,
    "status" "SupportMessageStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "support_messages_status_created_at_idx"
ON "support_messages"("status", "created_at");
