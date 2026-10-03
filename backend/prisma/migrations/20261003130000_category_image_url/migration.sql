ALTER TABLE "categories" ADD COLUMN "image_url" TEXT;

-- Seed a representative image from an active product for existing categories.
-- Owners can replace these URLs from the category editor at any time.
UPDATE "categories" AS category
SET "image_url" = COALESCE(
  (
    SELECT product."image"
    FROM "products" AS product
    WHERE product."categoryId" = category."id"
      AND product."active" = true
      AND product."image" IS NOT NULL
    ORDER BY product."featured" DESC, product."updatedAt" DESC
    LIMIT 1
  ),
  (
    SELECT product."image"
    FROM "categories" AS child
    JOIN "products" AS product ON product."categoryId" = child."id"
    WHERE child."parentId" = category."id"
      AND child."active" = true
      AND product."active" = true
      AND product."image" IS NOT NULL
    ORDER BY product."featured" DESC, product."updatedAt" DESC
    LIMIT 1
  )
)
WHERE category."image_url" IS NULL;
