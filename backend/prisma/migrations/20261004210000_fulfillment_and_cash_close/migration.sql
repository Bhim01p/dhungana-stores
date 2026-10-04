CREATE TYPE "OrderFulfillmentType" AS ENUM ('DELIVERY', 'PICKUP');

ALTER TABLE "store_sales" ADD COLUMN "status_changed_at" TIMESTAMP(3);
UPDATE "store_sales" SET "status_changed_at" = "created_at" WHERE "status" IN ('VOIDED', 'REFUNDED');
CREATE INDEX "store_sales_status_changed_at_idx" ON "store_sales"("status_changed_at");

CREATE TABLE "delivery_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "delivery_charge" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "free_delivery_threshold" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "delivery_areas_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "delivery_areas_active_sort_order_idx" ON "delivery_areas"("active", "sort_order");

CREATE TABLE "delivery_slots" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "weekdays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "delivery_slots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "delivery_slots_active_sort_order_idx" ON "delivery_slots"("active", "sort_order");

CREATE TABLE "cash_drawer_closings" (
    "id" TEXT NOT NULL,
    "business_date" DATE NOT NULL,
    "opening_cash" DECIMAL(10,2) NOT NULL,
    "cash_sales" DECIMAL(10,2) NOT NULL,
    "qr_sales" DECIMAL(10,2) NOT NULL,
    "cash_refunds" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cash_voids" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_in" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_out" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expected_cash" DECIMAL(10,2) NOT NULL,
    "counted_cash" DECIMAL(10,2) NOT NULL,
    "variance" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "closed_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cash_drawer_closings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cash_drawer_closings_business_date_key" ON "cash_drawer_closings"("business_date");
CREATE INDEX "cash_drawer_closings_closed_by_id_idx" ON "cash_drawer_closings"("closed_by_id");
ALTER TABLE "cash_drawer_closings" ADD CONSTRAINT "cash_drawer_closings_closed_by_id_fkey"
    FOREIGN KEY ("closed_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders" ADD COLUMN "fulfillment_type" "OrderFulfillmentType" NOT NULL DEFAULT 'DELIVERY';
ALTER TABLE "orders" ADD COLUMN "delivery_area_id" TEXT;
ALTER TABLE "orders" ADD COLUMN "delivery_date" DATE;
ALTER TABLE "orders" ADD COLUMN "delivery_slot_id" TEXT;
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_area_id_fkey"
    FOREIGN KEY ("delivery_area_id") REFERENCES "delivery_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_slot_id_fkey"
    FOREIGN KEY ("delivery_slot_id") REFERENCES "delivery_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "delivery_areas" ("id", "name", "delivery_charge", "free_delivery_threshold", "sort_order", "updated_at")
VALUES ('default-local-delivery', 'Local delivery', 50, 500, 0, CURRENT_TIMESTAMP);
INSERT INTO "delivery_slots" ("id", "label", "start_time", "end_time", "weekdays", "sort_order", "updated_at") VALUES
('default-slot-morning', 'Morning · 9:00–12:00', '09:00', '12:00', ARRAY[]::INTEGER[], 0, CURRENT_TIMESTAMP),
('default-slot-afternoon', 'Afternoon · 12:00–15:00', '12:00', '15:00', ARRAY[]::INTEGER[], 1, CURRENT_TIMESTAMP),
('default-slot-evening', 'Evening · 15:00–18:00', '15:00', '18:00', ARRAY[]::INTEGER[], 2, CURRENT_TIMESTAMP);
