import { findBombOptions, findShakeOptions } from './engine/rules/specialRules';
import { evaluateMoves } from './engine/ai/evaluator';
import { getCard } from './engine/cards';

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

// Choose a matching or bonus card before discarding an unrelated card.
// The existing evaluator ranks available captures without mutating the game.
export function automaticMove(game, onlyMonth = null) {
  const options=evaluateMoves(game,'human');
  const legal=onlyMonth==null?options:options.filter(item=>item.move.kind==='card' && getCard(item.move.cardId)?.month===onlyMonth);
  const productive=legal.find(item=>item.move.kind==='card' && (
    getCard(item.move.cardId)?.tags.includes('bonus-pee') ||
    game.floorCards.some(id=>getCard(id)?.month===getCard(item.move.cardId)?.month)
  ));
  return (productive || legal[0])?.move || null;
}
