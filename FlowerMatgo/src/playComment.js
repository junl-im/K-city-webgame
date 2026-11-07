import { getCard } from './engine/cards';
import { getMatchingFloorCards } from './engine/gameState';

// Describe only the played card and choices the human was allowed to make.
export function humanPlayComment(game, cardId) {
  const card=getCard(cardId);
  if (!game || game.phase!=='playing' || game.currentPlayer!=='human' || !card?.month || !game.humanHand.includes(cardId)) return null;
  if (getMatchingFloorCards(game.floorCards,cardId).length) return null;
  const available=game.humanPendingShakeMonth
    ? game.humanHand.filter(id=>getCard(id)?.month===game.humanPendingShakeMonth)
    : game.humanHand;
  return available.some(id=>getCard(id)?.month && getMatchingFloorCards(game.floorCards,id).length)
    ? 'missed_match' : 'no_match';
}
