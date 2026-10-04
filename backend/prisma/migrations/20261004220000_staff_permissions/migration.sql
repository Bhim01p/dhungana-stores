ALTER TABLE "admin_users"
ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve the existing cashier/staff workflow while giving the owner control
-- over additional areas from the Staff Access page.
UPDATE "admin_users"
SET "permissions" = ARRAY['ORDERS', 'STORE_SALES', 'CASH_DRAWER']::TEXT[]
WHERE "role" = 'STAFF';
