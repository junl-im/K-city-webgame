// In this game's rule, zero pi is exempt; pi values include double/triple pi.
export function isPiBak(winnerJunk: number, loserJunk: number, scoringThreshold = 10): boolean {
  return winnerJunk >= scoringThreshold && loserJunk >= 1 && loserJunk <= 7;
}
