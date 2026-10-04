ALTER TABLE "products"
ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "products"
SET "images" = ARRAY["image"]
WHERE "image" IS NOT NULL AND "image" <> '';
