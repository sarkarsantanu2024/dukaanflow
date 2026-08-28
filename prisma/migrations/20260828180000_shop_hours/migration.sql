-- When the shutter goes up and comes down. Shown to customers; it does not
-- close the shop page or refuse orders — a kirana keeps serving whoever is
-- still at the counter at closing time. `active` stays the switch that stops
-- orders.

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "openTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Shop" ADD COLUMN     "closeTime" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Shop" ADD COLUMN     "closedNote" TEXT NOT NULL DEFAULT '';
