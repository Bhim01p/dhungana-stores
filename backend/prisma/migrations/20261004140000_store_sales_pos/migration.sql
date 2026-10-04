CREATE TYPE "StoreSalePaymentType" AS ENUM ('CASH', 'QR');
CREATE TYPE "StoreSaleStatus" AS ENUM ('COMPLETED', 'VOIDED', 'REFUNDED');

CREATE TABLE "store_sales" (
    "id" TEXT NOT NULL,
    "sale_number" TEXT NOT NULL,
    "cashier_id" TEXT,
    "cashier_name" TEXT NOT NULL,
    "customer_name" TEXT,
    "customer_phone" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_type" "StoreSalePaymentType" NOT NULL,
    "tendered_amount" DECIMAL(10,2),
    "change_amount" DECIMAL(10,2),
    "status" "StoreSaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "status_reason" TEXT,
    "status_changed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "store_sales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "store_sale_items" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "unit" "Unit" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "sale_id" TEXT NOT NULL,
    CONSTRAINT "store_sale_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "store_sales_sale_number_key" ON "store_sales"("sale_number");
CREATE INDEX "store_sales_created_at_idx" ON "store_sales"("created_at");
CREATE INDEX "store_sales_status_created_at_idx" ON "store_sales"("status", "created_at");
CREATE INDEX "store_sale_items_sale_id_idx" ON "store_sale_items"("sale_id");

ALTER TABLE "store_sales" ADD CONSTRAINT "store_sales_cashier_id_fkey"
FOREIGN KEY ("cashier_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "store_sale_items" ADD CONSTRAINT "store_sale_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "store_sale_items" ADD CONSTRAINT "store_sale_items_sale_id_fkey"
FOREIGN KEY ("sale_id") REFERENCES "store_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
