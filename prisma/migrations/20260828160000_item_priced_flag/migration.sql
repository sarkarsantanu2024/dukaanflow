-- Whether a human has actually chosen an item's price.
--
-- This was inferred from `price > 1`, which was wrong in a way that cost a shop
-- its whole storefront: a kirana really does sell a toffee, a matchbox or a
-- single biscuit for one rupee, and every one of them was silently hidden from
-- customers as "not priced yet".
--
-- The backfill preserves the old rule exactly: anything above the Re 1
-- placeholder was a deliberate price and stays on sale.

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "priced" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Item" SET "priced" = true WHERE "price" > 1;
