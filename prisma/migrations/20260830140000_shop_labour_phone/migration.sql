-- Whoever runs the deliveries, so the owner can forward the round in one tap.
--
-- Additive with a default: nothing existing is touched, and a shop with nobody
-- doing the running is the ordinary case rather than a row needing backfill.
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "labourPhone" TEXT NOT NULL DEFAULT '';
