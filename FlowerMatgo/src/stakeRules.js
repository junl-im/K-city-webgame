// Each AI tier has its own approachable virtual-money table.
// Adjacent tiers overlap so players can advance without a sudden cost jump.
export const ALLOWED_STAKES = Object.freeze({
  easy: Object.freeze([10, 100]),
  normal: Object.freeze([100, 1000]),
  hard: Object.freeze([1000, 10000])
});

export const STAKES = Object.freeze([10, 100, 1000, 10000]);

export function canUseStake(difficulty, stake) {
  return !!ALLOWED_STAKES[difficulty]?.includes(stake);
}

export function normalizeStake(difficulty, stake) {
  if (canUseStake(difficulty, stake)) return stake;
  return ALLOWED_STAKES[difficulty]?.[0] ?? ALLOWED_STAKES.normal[0];
}
