// A score-set announcement is visual only. It is derived from the engine's
// scoring lines and can never grant points or alter the game state.
const SET_CODES = new Set(['godori','hongdan','cheongdan','chodan']);

export function newlyCompletedCombos(previousScore, nextScore) {
  const previous = new Set((previousScore?.lines || []).map(line => line.code));
  return (nextScore?.lines || [])
    .filter(line => SET_CODES.has(line.code) && !previous.has(line.code))
    .map(line => ({label:line.label,points:line.points}));
}
