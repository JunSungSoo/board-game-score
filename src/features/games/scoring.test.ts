import { describe, expect, it } from 'vitest';
import { calculateSkullkingScore, remainingTricks } from './scoring';

describe('Skull King scoring', () => {
  it.each([
    [3, 0, 0, 20, 50], [3, 0, 1, 40, -30],
    [3, 2, 2, 40, 80], [3, 2, 2, -20, 20],
    [3, 2, 1, 40, -10], [3, 2, 1, -20, -10],
  ])('round %i bid %i tricks %i bonus %i = %i', (round, bid, tricks, bonus, total) => {
    expect(calculateSkullkingScore(round, bid, tricks, bonus).total).toBe(total);
  });
  it('shares remaining tricks across every player and releases removed tricks', () => {
    expect(remainingTricks(3, [0, 0, 1])).toBe(2);
    expect(remainingTricks(3, [1, 1, 1])).toBe(0);
    expect(remainingTricks(3, [0, 1, 1])).toBe(1);
  });
});
