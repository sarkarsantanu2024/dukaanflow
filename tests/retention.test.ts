import { describe, expect, it, vi } from 'vitest';

// retention.ts imports the Prisma client for its database helpers; the
// functions tested here are pure and never touch it.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

const { anniversaryCutoff, shopCutoff } = await import('@/lib/retention');
const { shopClock, shopMonthStart } = await import('@/lib/time');

const jan1 = (year: number) => shopMonthStart(year, 1);
// 10:00 IST on a day, as a real instant.
const ist = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 4, 30));

describe('shopCutoff: only whole calendar years are ever deleted', () => {
  const started = ist(2025, 3, 15);

  it('deletes nothing a first-year shop made while subscribed', () => {
    const cutoff = shopCutoff(started, ist(2025, 12, 31));
    expect(cutoff.getTime()).toBeLessThanOrEqual(started.getTime());
    expect(cutoff).toEqual(jan1(2025));
  });

  it('on the first anniversary deletes the previous calendar year, never part of the current one', () => {
    const cutoff = shopCutoff(started, ist(2026, 3, 16));
    expect(anniversaryCutoff(started, ist(2026, 3, 16))).toEqual(ist(2026, 3, 15));
    expect(cutoff).toEqual(jan1(2026)); // January to mid-March 2026 is kept
  });

  it('never cuts later than the anniversary rule did, so it only ever keeps more', () => {
    for (let month = 1; month <= 12; month += 1) {
      for (const day of [1, 15, 28]) {
        const now = ist(2027, month, day);
        expect(shopCutoff(started, now).getTime()).toBeLessThanOrEqual(anniversaryCutoff(started, now).getTime());
      }
    }
  });

  it('always lands on 1 January in shop time', () => {
    for (const now of [ist(2026, 2, 1), ist(2026, 6, 30), ist(2027, 4, 1), ist(2030, 12, 31)]) {
      const cutoff = shopCutoff(started, now);
      const clock = shopClock(cutoff);
      expect([clock.month, clock.day, clock.hour]).toEqual([1, 1, 0]);
    }
  });

  it('does not move before the anniversary arrives', () => {
    expect(shopCutoff(started, ist(2026, 3, 14))).toEqual(jan1(2025));
  });

  it('rolls a 29 February start forward a day in common years', () => {
    const leap = ist(2024, 2, 29);
    expect(anniversaryCutoff(leap, ist(2025, 3, 2))).toEqual(ist(2025, 3, 1));
    expect(shopCutoff(leap, ist(2025, 3, 2))).toEqual(jan1(2025));
  });
});
