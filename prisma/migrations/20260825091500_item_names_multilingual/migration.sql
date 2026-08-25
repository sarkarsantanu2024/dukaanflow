-- Bengali and Hindi names for each item. Empty means "no override" — the
-- customer page falls back to `name`, so existing rows keep working untouched.
ALTER TABLE "Item" ADD COLUMN     "nameBn" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nameHi" TEXT NOT NULL DEFAULT '';
