-- CreateEnum
CREATE TYPE "ShopType" AS ENUM ('GROCERY', 'RESTAURANT', 'TEA_STALL', 'ROLL_MOMO', 'HOME_KITCHEN', 'BAKERY', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Shop" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ShopType" NOT NULL DEFAULT 'GROCERY',
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "upiId" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "inStock" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL DEFAULT '',
    "orderType" "OrderType" NOT NULL DEFAULT 'DELIVERY',
    "itemsJson" JSONB NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_slug_key" ON "Shop"("slug");

-- CreateIndex
CREATE INDEX "Shop_active_idx" ON "Shop"("active");

-- CreateIndex
CREATE INDEX "Item_shopId_idx" ON "Item"("shopId");

-- CreateIndex
CREATE INDEX "Item_shopId_inStock_idx" ON "Item"("shopId", "inStock");

-- CreateIndex
CREATE UNIQUE INDEX "Item_shopId_name_unit_key" ON "Item"("shopId", "name", "unit");

-- CreateIndex
CREATE INDEX "Order_shopId_createdAt_idx" ON "Order"("shopId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
