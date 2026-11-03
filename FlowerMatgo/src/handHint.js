import { getCard } from './engine/cards';
export function handHint(game,id) {
 const item=getCard(id); if(!item || game.phase!=='playing') return 'none';
 if(item.month===0) return 'bonus';
 if(game.floorCards.some(cardId=>getCard(cardId)?.month===item.month)) return 'match';
 const captured=[...(game.humanCaptured || []),...(game.computerCaptured || [])].filter(cardId=>getCard(cardId)?.month===item.month).length;
 const hand=game.humanHand.filter(cardId=>getCard(cardId)?.month===item.month).length;
 return captured===2 && hand===2 ? 'dead' : 'none';
}
