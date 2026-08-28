-- Demonstration shops, marked rather than guessed at by name.
-- Applied to the live database with `prisma db push`; recorded here so a fresh
-- deployment built from migrations reaches the same schema.

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Shop_isDemo_idx" ON "Shop"("isDemo");
