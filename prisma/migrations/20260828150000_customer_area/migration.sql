-- Which para or lane a khata regular is from. Free text: this exists to tell
-- two customers with the same name apart, not to be aggregated — the pincode on
-- an order is what reporting counts.

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "area" TEXT NOT NULL DEFAULT '';
