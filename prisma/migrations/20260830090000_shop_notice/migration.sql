-- The shopkeeper's own notice to their customers, and the days it runs.
--
-- Additive and nullable: nothing existing is touched, and a shop with no
-- notice is the ordinary case rather than a row needing backfill.
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "noticeText" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "noticeFrom" DATE;
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "noticeTo" DATE;
