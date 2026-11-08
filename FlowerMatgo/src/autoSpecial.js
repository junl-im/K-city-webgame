import { findBombOptions, findShakeOptions } from './engine/rules/specialRules';
import { evaluateMoves } from './engine/ai/evaluator';
import { getCard } from './engine/cards';

// A declared shake must be played before selecting a new special action.
export function automaticSpecial(game, onlyMonth = null) {
  if (!game || game.phase !== 'playing' || game.currentPlayer !== 'human' || game.humanPendingShakeMonth) return null;
  const matching = option => onlyMonth == null || option.month === onlyMonth;
  const bombs = findBombOptions(game.humanHand,game.floorCards,true).filter(matching);
  // Complete a bomb instead of playing one card and missing the other captures.
  // Within the same type, use the evaluator rather than hand order.
  const rankings=evaluateMoves(game,'human');
  const rank=month=>rankings.findIndex(item=>item.move.kind==='bomb' && item.move.month===month);
  const best=kind=>bombs.filter(option=>option.kind===kind).sort((a,b)=>rank(a.month)-rank(b.month))[0];
  const bomb = best('three-card-bomb') || best('four-card-bomb') || best('two-card-bomb');
  if (bomb) return {kind:'bomb',month:bomb.month};
  // Shaking forces the next card to be of that month. Do not discard it while
  // a different playable capture or a bonus is already available.
  if (onlyMonth == null && game.humanHand.some(id=>{
    const item=getCard(id);
    return item && (item.tags.includes('bonus-pee') || game.floorCards.some(floorId=>getCard(floorId)?.month===item.month));
  })) return null;
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
