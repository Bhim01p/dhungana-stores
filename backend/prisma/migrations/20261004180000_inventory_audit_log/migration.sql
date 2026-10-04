CREATE TYPE "InventoryMovementType" AS ENUM (
  'INITIAL_STOCK', 'RESTOCK', 'ADJUSTMENT', 'ONLINE_ORDER',
  'ONLINE_CANCELLED', 'STORE_SALE', 'STORE_VOID', 'HOUSE_USE', 'EXPIRED'
);

ALTER TABLE "products"
  ADD COLUMN "supplier_name" TEXT,
  ADD COLUMN "expires_at" DATE;

CREATE TABLE "inventory_movements" (
  "id" TEXT NOT NULL,
  "product_id" TEXT,
  "product_name" TEXT NOT NULL,
  "type" "InventoryMovementType" NOT NULL,
  "quantity_change" INTEGER NOT NULL,
  "stock_after" INTEGER NOT NULL,
  "reason" TEXT,
  "reference" TEXT,
  "actor_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "inventory_movements_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "inventory_movements_product_id_created_at_idx" ON "inventory_movements"("product_id", "created_at");
CREATE INDEX "inventory_movements_type_created_at_idx" ON "inventory_movements"("type", "created_at");

CREATE TABLE "admin_audit_logs" (
  "id" TEXT NOT NULL,
  "actor_id" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "admin_audit_logs_created_at_idx" ON "admin_audit_logs"("created_at");
CREATE INDEX "admin_audit_logs_actor_id_created_at_idx" ON "admin_audit_logs"("actor_id", "created_at");

INSERT INTO "inventory_movements" (
  "id", "product_id", "product_name", "type", "quantity_change", "stock_after", "reason"
)
SELECT 'initial-stock-' || "id", "id", "name", 'INITIAL_STOCK', "stockQuantity", "stockQuantity", 'Opening stock recorded when inventory history was introduced.'
FROM "products" WHERE "stockQuantity" > 0;
ALTER TABLE "inventory_movements" ADD COLUMN "unit_cost" DECIMAL(10,2);
