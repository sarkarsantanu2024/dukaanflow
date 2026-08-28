-- DropIndex
DROP INDEX "Occasion_name_state_startsOn_key";

-- DropIndex
DROP INDEX "Occasion_startsOn_idx";

-- DropIndex
DROP INDEX "Occasion_state_startsOn_idx";

-- AlterTable
ALTER TABLE "Occasion" DROP COLUMN "endsOn",
DROP COLUMN "startsOn",
ADD COLUMN     "fixedDay" INTEGER,
ADD COLUMN     "fixedMonth" INTEGER,
ADD COLUMN     "spanDays" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "OccasionDate" (
    "id" UUID NOT NULL,
    "occasionId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "startsOn" DATE NOT NULL,
    "endsOn" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccasionDate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OccasionDate_year_idx" ON "OccasionDate"("year");

-- CreateIndex
CREATE UNIQUE INDEX "OccasionDate_occasionId_year_key" ON "OccasionDate"("occasionId", "year");

-- CreateIndex
CREATE INDEX "Occasion_state_idx" ON "Occasion"("state");

-- CreateIndex
CREATE UNIQUE INDEX "Occasion_name_state_key" ON "Occasion"("name", "state");

-- AddForeignKey
ALTER TABLE "OccasionDate" ADD CONSTRAINT "OccasionDate_occasionId_fkey" FOREIGN KEY ("occasionId") REFERENCES "Occasion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

