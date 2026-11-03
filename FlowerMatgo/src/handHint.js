import { getCard } from './engine/cards';
export function handHint(game,id) {
 const item=getCard(id); if(!item || game.phase!=='playing') return 'none';
 if(item.month===0) return 'bonus';
 if(game.floorCards.some(cardId=>getCard(cardId)?.month===item.month)) return 'match';
 const own=game.humanCaptured.filter(cardId=>getCard(cardId)?.month===item.month).length;
 const hand=game.humanHand.filter(cardId=>getCard(cardId)?.month===item.month).length;
 return own>=2 && own+hand===4 ? 'dead' : 'none';
}
