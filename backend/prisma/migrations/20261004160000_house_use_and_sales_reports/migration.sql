CREATE TYPE "StoreSaleKind" AS ENUM ('SALE', 'HOUSE_USE');

ALTER TABLE "store_sales"
ADD COLUMN "sale_kind" "StoreSaleKind" NOT NULL DEFAULT 'SALE';

ALTER TABLE "store_sales"
ALTER COLUMN "payment_type" DROP NOT NULL;
