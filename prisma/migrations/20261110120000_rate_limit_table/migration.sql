-- A table for the rate-limit counters, so the limit is global rather than per
-- serverless instance. Additive only: a new table, nothing touched elsewhere.
-- Until it exists the code falls back to the old in-memory counter and logs
-- that it has done so.

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");
