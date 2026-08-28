-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerPincode" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "state" TEXT NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE "Occasion" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT '',
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occasion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPeriodStat" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "occasionKey" TEXT NOT NULL DEFAULT '',
    "occasionName" TEXT NOT NULL DEFAULT '',
    "itemName" TEXT NOT NULL,
    "itemUnit" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "transactions" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPeriodStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaPeriodStat" (
    "id" UUID NOT NULL,
    "shopId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "pincode" TEXT NOT NULL,
    "orders" INTEGER NOT NULL,
    "revenue" INTEGER NOT NULL,
    "customers" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AreaPeriodStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Occasion_state_startsOn_idx" ON "Occasion"("state", "startsOn");

-- CreateIndex
CREATE INDEX "Occasion_startsOn_idx" ON "Occasion"("startsOn");

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_name_state_startsOn_key" ON "Occasion"("name", "state", "startsOn");

-- CreateIndex
CREATE INDEX "ItemPeriodStat_shopId_year_idx" ON "ItemPeriodStat"("shopId", "year");

-- CreateIndex
CREATE INDEX "ItemPeriodStat_occasionName_year_idx" ON "ItemPeriodStat"("occasionName", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPeriodStat_shopId_year_occasionKey_itemName_itemUnit_key" ON "ItemPeriodStat"("shopId", "year", "occasionKey", "itemName", "itemUnit");

-- CreateIndex
CREATE INDEX "AreaPeriodStat_shopId_year_idx" ON "AreaPeriodStat"("shopId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "AreaPeriodStat_shopId_year_pincode_key" ON "AreaPeriodStat"("shopId", "year", "pincode");

-- CreateIndex
CREATE INDEX "Order_shopId_customerPincode_idx" ON "Order"("shopId", "customerPincode");

-- CreateIndex
CREATE INDEX "Shop_state_idx" ON "Shop"("state");

-- AddForeignKey
ALTER TABLE "ItemPeriodStat" ADD CONSTRAINT "ItemPeriodStat_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaPeriodStat" ADD CONSTRAINT "AreaPeriodStat_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
