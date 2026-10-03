ALTER TABLE "orders"
ADD COLUMN "payment_method_name" TEXT,
ADD COLUMN "payment_method_qr_image_url" TEXT,
ADD COLUMN "payment_method_account_info" TEXT;
