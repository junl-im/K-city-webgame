/** The ripe illustration is reserved for crops that can actually be harvested. */
export function cropStage(progress: number): 0 | 1 | 2 | 3 {
  if (progress >= 1) return 3;
  if (progress >= .5) return 2;
  if (progress >= .25) return 1;
  return 0;
}
