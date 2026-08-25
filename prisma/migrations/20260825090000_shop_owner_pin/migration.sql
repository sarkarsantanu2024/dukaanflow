-- Owner access for a single shop. Null hash = no owner login for that shop,
-- which is the default for every existing row.
ALTER TABLE "Shop" ADD COLUMN     "ownerPinHash" TEXT,
ADD COLUMN     "ownerPinSetAt" TIMESTAMP(3);
