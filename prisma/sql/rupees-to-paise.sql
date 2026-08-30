-- Move every money column from integer RUPEES to integer PAISE, in place.
--
-- WHY THIS FILE EXISTS. `prisma db push` cannot make this change: the new
-- columns are NOT NULL with no default, and the tables have rows, so push stops
-- and offers `--force-reset` — which drops the whole database. That flag is what
-- destroyed this project's data once already. Adding, backfilling and only then
-- enforcing NOT NULL does the same job with nothing lost.
--
-- Safe to run twice: every step is guarded, so a re-run on an
-- already-converted database changes nothing.
--
--   npx prisma db execute --file prisma/sql/rupees-to-paise.sql --schema prisma/schema.prisma
--   npx prisma db push          -- should then report no changes

-- The new billing tier. Postgres refuses a duplicate enum label, so this is
-- guarded rather than repeated.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'Plan' AND e.enumlabel = 'EX'
  ) THEN
    ALTER TYPE "Plan" ADD VALUE 'EX';
  END IF;
END $$;

-- One table at a time: add the paise column nullable, fill it from the rupee
-- column times a hundred, make it required, then drop the old one.
DO $$
DECLARE
  step RECORD;
BEGIN
  FOR step IN
    SELECT * FROM (VALUES
      ('Item',           'price',       'pricePaise'),
      ('Order',          'totalAmount', 'totalAmountPaise'),
      ('Sale',           'totalAmount', 'totalAmountPaise'),
      ('LedgerEntry',    'amount',      'amountPaise'),
      ('Payment',        'amount',      'amountPaise'),
      ('ItemPeriodStat', 'revenue',     'revenuePaise'),
      ('AreaPeriodStat', 'revenue',     'revenuePaise')
    ) AS t(tbl, old_col, new_col)
  LOOP
    -- Already converted? Leave it entirely alone.
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = step.tbl AND column_name = step.new_col
    ) THEN
      RAISE NOTICE '% already has % — skipping', step.tbl, step.new_col;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE %I ADD COLUMN %I INTEGER', step.tbl, step.new_col);
    -- × 100. COALESCE covers a nullable legacy column; there should be none.
    EXECUTE format(
      'UPDATE %I SET %I = COALESCE(%I, 0) * 100', step.tbl, step.new_col, step.old_col
    );
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL', step.tbl, step.new_col);
    EXECUTE format('ALTER TABLE %I DROP COLUMN %I', step.tbl, step.old_col);

    RAISE NOTICE '% : % -> % converted', step.tbl, step.old_col, step.new_col;
  END LOOP;
END $$;

-- The two new Payment columns. Both have defaults, so they need no backfill —
-- every existing row is a subscription payment, which is what the default says.
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'SUBSCRIPTION';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "itemsListed" INTEGER NOT NULL DEFAULT 0;

-- NOTE ON SNAPSHOTS. Order.itemsJson and Sale.itemsJson also hold money, under
-- the keys `price`, `amount` and `lineTotal`, and those are NOT rewritten here.
-- They are immutable records of what was charged at the time, and rewriting
-- history to a new unit is a worse idea than reading it correctly: the decoders
-- (`linePaise` in lib/analytics.ts and lib/rollup.ts, `snapshotPaise` in the
-- owner's orders page) treat the bare names as rupees and multiply, and only
-- the newer `pricePaise`/`amountPaise` keys as paise.
