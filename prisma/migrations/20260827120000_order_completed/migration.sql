-- An order that has been handed over, as distinct from one merely accepted.
-- Placed after CONFIRMED so that ordering by status still walks the queue in
-- the order an owner works it: NEW, CONFIRMED, COMPLETED, CANCELLED.
--
-- Additive only. Existing rows keep their status and nothing needs backfilling.
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'COMPLETED' AFTER 'CONFIRMED';
