export function calculateSkullkingScore(round: number, bid: number, tricks: number, bonus: number) {
  const exact = bid === tricks;
  const base = bid === 0 ? round * (exact ? 10 : -10) : exact ? tricks * 20 : Math.abs(bid - tricks) * -10;
  const appliedBonus = exact ? bonus : 0;
  return { base, bonus: appliedBonus, total: base + appliedBonus, exact };
}

export function remainingTricks(round: number, tricks: number[]) {
  return Math.max(0, round - tricks.reduce((sum, value) => sum + value, 0));
}

export function calculateTichuTeamScore(cardA: number, oneTwo: 'none' | 'A' | 'B', callA = 0, callB = 0) {
  if (oneTwo === 'A') return { a: 200 + callA, b: callB };
  if (oneTwo === 'B') return { a: callA, b: 200 + callB };
  return { a: cardA + callA, b: 100 - cardA + callB };
}
