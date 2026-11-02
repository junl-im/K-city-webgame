// Continue the original held win: a successful ×2 becomes a ×4 offer.
// Normal earnings from the later round remain a separate wallet settlement.
export function doubleOffer(game) {
  if (!game || game.phase !== 'round-ended' || game.roundResult === 'nagari' || game.winner !== 'human') return null;
  const continuing = Number.isSafeInteger(game.doublePayout) && game.doublePayout > 0;
  const amount = continuing ? game.doublePayout : Math.round(game.settlement?.displayAmount || 0);
  const previousLevel = Number.isSafeInteger(game.doubleLevel) && game.doubleLevel >= 2 ? game.doubleLevel : 2;
  const level = continuing ? previousLevel * 2 : 2;
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(amount * 2) || !Number.isSafeInteger(level)) return null;
  return { amount, level };
}
