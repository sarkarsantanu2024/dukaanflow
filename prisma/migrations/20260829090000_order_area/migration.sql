-- The para or lane an order goes to, in the customer's own words. Free text,
-- unlike the pincode beside it: that one is counted, this one is how a delivery
-- is actually found.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerArea" TEXT NOT NULL DEFAULT '';
