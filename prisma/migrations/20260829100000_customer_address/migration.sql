-- Where a customer lives, as last given on an order. Kept on the customer so
-- the console can show it without reading back through their orders, and so a
-- delivery still has an address after those orders are purged.

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT NOT NULL DEFAULT '';

-- Backfill from the most recent order that carried one.
UPDATE "Customer" c
   SET "address" = o."customerAddress"
  FROM (
    SELECT DISTINCT ON ("shopId", "customerPhone")
           "shopId", "customerPhone", "customerAddress"
      FROM "Order"
     WHERE "customerAddress" <> ''
     ORDER BY "shopId", "customerPhone", "createdAt" DESC
  ) o
 WHERE c."shopId" = o."shopId" AND c."phone" = o."customerPhone" AND c."address" = '';
