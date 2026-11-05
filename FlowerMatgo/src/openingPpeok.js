// Opening ppeok pays seven points immediately, separately from round settlement.
// The per-round ledger makes animation checkpoints and reloads idempotent.
export function settleOpeningPpeok(app, next) {
  if (!next?.gameUuid) return null;
  const previous = app.game?.gameUuid === next.gameUuid ? app.game : null;
  const count = (game, side) => Math.max(0, Math.min(1, Number(game?.[`${side}OpeningPpeokCount`]) || 0));
  const prior = app.openingPpeokLedger?.gameUuid === next.gameUuid
    ? app.openingPpeokLedger
    : {gameUuid:next.gameUuid, human:count(previous,'human'), computer:count(previous,'computer')};
  const ledger = {gameUuid:next.gameUuid, human:count(next,'human'), computer:count(next,'computer')};
  const amount = 7 * (Number(next.pointValue) || 100);
  let notice = null;
  if (ledger.human > prior.human) {
    app.wallet += amount;
    notice = {player:'human', amount};
  }
  if (ledger.computer > prior.computer) {
    const paid = Math.min(app.wallet, amount);
    app.wallet -= paid;
    notice = {player:'computer', amount:paid};
  }
  app.openingPpeokLedger = ledger;
  return notice;
}
