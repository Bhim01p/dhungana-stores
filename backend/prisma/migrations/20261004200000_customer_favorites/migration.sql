CREATE TABLE "customer_favorites" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_favorites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "customer_favorites_customer_id_product_id_key"
    ON "customer_favorites"("customer_id", "product_id");
CREATE INDEX "customer_favorites_customer_id_created_at_idx"
    ON "customer_favorites"("customer_id", "created_at");

ALTER TABLE "customer_favorites"
    ADD CONSTRAINT "customer_favorites_customer_id_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_favorites"
    ADD CONSTRAINT "customer_favorites_product_id_fkey"
    FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
