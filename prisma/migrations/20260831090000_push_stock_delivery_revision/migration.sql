-- Six shipped gaps, one migration. Every change here is additive: a new enum,
-- a new table, and columns that are either nullable or carry a default. None of
-- it can drop a row, which is the only kind of change this database takes.

-- Feature: web push, for the owner's new orders and the customer's own order.
CREATE TYPE "PushRole" AS ENUM ('OWNER', 'CUSTOMER');

CREATE TABLE "PushSubscription" (
    "id" UUID NOT NULL,
    "role" "PushRole" NOT NULL,
    "shopId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_shopId_role_idx" ON "PushSubscription"("shopId", "role");
CREATE INDEX "PushSubscription_shopId_customerPhone_idx" ON "PushSubscription"("shopId", "customerPhone");

ALTER TABLE "PushSubscription"
  ADD CONSTRAINT "PushSubscription_shopId_fkey"
  FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Feature: a delivery charge and a minimum order.
ALTER TABLE "Shop" ADD COLUMN "deliveryFeePaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "freeDeliveryAbovePaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Shop" ADD COLUMN "minOrderPaise" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "deliveryFeePaise" INTEGER NOT NULL DEFAULT 0;

-- Feature: cutting an order down to what the shop actually has.
ALTER TABLE "Order" ADD COLUMN "revisedAt" TIMESTAMP(3);

-- Feature: a stock count for the countable half of the shop. NULL — nobody is
-- counting — is deliberately the default, and stays the right answer for
-- anything sold loose off a scale.
ALTER TABLE "Item" ADD COLUMN "stockQty" INTEGER;
