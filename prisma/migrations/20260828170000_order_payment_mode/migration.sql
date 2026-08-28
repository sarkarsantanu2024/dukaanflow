-- How a WhatsApp order was paid, so the Orders page can take a payment and the
-- till is never needed for one. Without it the till was the only screen that
-- could show a UPI QR, which is what sent owners there to re-enter an order
-- they already had — and double-count it.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paymentMode" TEXT NOT NULL DEFAULT '';
