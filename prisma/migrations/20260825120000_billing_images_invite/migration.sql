-- Billing, owner profile images, and one-time invite links.

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO');

-- CreateEnum
CREATE TYPE "SubStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Shop"
  ADD COLUMN "inviteTokenHash" TEXT,
  ADD COLUMN "inviteTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "ownerName" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "imageData" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ownerImageData" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "plan" "Plan" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "subscriptionStatus" "SubStatus" NOT NULL DEFAULT 'TRIALING',
  ADD COLUMN "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
  ADD COLUMN "activatedAt" TIMESTAMP(3);

-- Existing shops predate billing, so give them a full trial from today rather
-- than a trial that already expired.
UPDATE "Shop" SET "trialEndsAt" = NOW() + INTERVAL '14 days' WHERE "trialEndsAt" IS NULL;

-- CreateIndex
CREATE INDEX "Shop_subscriptionStatus_idx" ON "Shop"("subscriptionStatus");

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "plan" "Plan" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'UPI',
    "reference" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Payment_shopId_createdAt_idx" ON "Payment"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Sale" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "itemsJson" JSONB NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sale_shopId_createdAt_idx" ON "Sale"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
