// One human decision or move receives one countdown. UI rerenders cannot
// restart it; a new turn number or decision phase can.
export const HUMAN_TURN_SECONDS = 20;
export const HUMAN_TURN_MS = HUMAN_TURN_SECONDS * 1000;

export function humanTurnSignature(screen, game) {
  if (screen !== 'game' || !game || game.phase === 'round-ended') return null;
  const isPlaying = game.phase === 'playing' && game.currentPlayer === 'human';
  const isDecision = game.pendingDecision === 'human'
    && (game.phase === 'awaiting-go-stop' || game.phase === 'awaiting-chongtong');
  if (!isPlaying && !isDecision) return null;
  return `${game.gameUuid}:${game.turnNumber}:${game.phase}:${isDecision ? 'decision' : 'move'}`;
}

export function secondsLeft(milliseconds) {
  return Math.min(HUMAN_TURN_SECONDS, Math.max(0, Math.ceil(milliseconds / 1000)));
}
