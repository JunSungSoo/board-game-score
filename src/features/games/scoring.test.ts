import { describe, expect, it } from 'vitest';
import { calculateSkullkingScore, calculateTichuTeamScore, remainingTricks } from './scoring';

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

describe('Tichu team scoring', () => {
  it('adds declarations to the automatic 100-point card split', () => {
    expect(calculateTichuTeamScore(65, 'none', 100, -100)).toEqual({ a: 165, b: -65 });
  });
  it('uses 200 points for a one-two finish before declaration scores', () => {
    expect(calculateTichuTeamScore(50, 'B', 100, 200)).toEqual({ a: 100, b: 400 });
  });
});
