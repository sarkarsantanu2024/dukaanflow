-- A photo per item, so a shopper who cannot read the list can still recognise
-- what they are buying, and an owner can show the brand they actually stock.
--
-- Additive with a default, so every existing row is valid the moment it lands
-- and nothing needs backfilling.
ALTER TABLE "Item" ADD COLUMN IF NOT EXISTS "imageData" TEXT NOT NULL DEFAULT '';
