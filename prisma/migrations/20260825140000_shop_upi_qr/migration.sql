-- The shop's own UPI QR image, when they have one from their payment app.
ALTER TABLE "Shop" ADD COLUMN     "upiQrData" TEXT NOT NULL DEFAULT '';
