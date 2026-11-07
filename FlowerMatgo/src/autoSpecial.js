import { findBombOptions, findShakeOptions } from './engine/rules/specialRules';

// A declared shake must be played before selecting a new special action.
export function automaticSpecial(game, onlyMonth = null) {
  if (!game || game.phase !== 'playing' || game.currentPlayer !== 'human' || game.humanPendingShakeMonth) return null;
  const matching = option => onlyMonth == null || option.month === onlyMonth;
  const bombs = findBombOptions(game.humanHand,game.floorCards,true).filter(matching);
  // Prefer the classic three-card bomb, then a four-card bomb. Two-card bombs
  // remain a strategic choice for the normal AI evaluator.
  const bomb = bombs.find(option=>option.kind==='three-card-bomb') || bombs.find(option=>option.kind==='four-card-bomb');
  if (bomb) return {kind:'bomb',month:bomb.month};
  const shake = findShakeOptions(game.humanHand,game.floorCards,game.humanShakenMonths || []).find(matching);
  return shake ? {kind:'shake',month:shake.month} : null;
}
