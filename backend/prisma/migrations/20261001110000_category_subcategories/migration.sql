ALTER TABLE "categories" ADD COLUMN "parentId" TEXT;

CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

ALTER TABLE "categories"
ADD CONSTRAINT "categories_parentId_fkey"
FOREIGN KEY ("parentId") REFERENCES "categories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
