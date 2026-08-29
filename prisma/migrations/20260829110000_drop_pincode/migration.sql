-- Pincode leaves the product; the area a customer already types takes its job.
--
-- A six-digit code aggregates perfectly and nobody in a para thinks in one, so
-- asking for it bought tidy grouping at the cost of a field customers skipped.
-- The locality report now groups on the area, which is the answer they were
-- going to give anyway.

-- Rename rather than drop-and-add, so stats already collected keep their
-- numbers and only stop being labelled with a code nobody uses.
ALTER TABLE "AreaPeriodStat" RENAME COLUMN "pincode" TO "area";
ALTER INDEX "AreaPeriodStat_shopId_year_pincode_key" RENAME TO "AreaPeriodStat_shopId_year_area_key";

DROP INDEX IF EXISTS "Order_shopId_customerPincode_idx";
ALTER TABLE "Order" DROP COLUMN "customerPincode";
CREATE INDEX "Order_shopId_customerArea_idx" ON "Order"("shopId", "customerArea");
