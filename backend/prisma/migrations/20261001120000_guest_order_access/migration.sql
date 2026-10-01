ALTER TABLE "orders" ADD COLUMN "guest_lookup_token_hash" TEXT;
CREATE UNIQUE INDEX "orders_guest_lookup_token_hash_key" ON "orders"("guest_lookup_token_hash");
ALTER TABLE "orders" ADD COLUMN "stock_reserved" BOOLEAN NOT NULL DEFAULT false;
