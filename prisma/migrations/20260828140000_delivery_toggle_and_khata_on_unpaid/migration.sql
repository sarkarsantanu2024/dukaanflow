-- Home delivery is a shop's own choice, payment is confirmed at completion, and
-- an order completed unpaid becomes a khata debt.
--
-- Purely additive. The unique index on "orderId" is what stops one order being
-- posted to the credit book twice — a double tap on "not paid yet" would
-- otherwise double what the customer owes.

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "deliveryEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentReceived" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "orderId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_orderId_key" ON "LedgerEntry"("orderId");
