import { getCard } from './engine/cards';
export function handHint(game,id) {
 const item=getCard(id); if(!item || game.phase!=='playing') return 'none';
 if(item.month===0) return 'bonus';
 const captured=[...(game.humanCaptured || []),...(game.computerCaptured || [])].filter(cardId=>getCard(cardId)?.month===item.month).length;
 const hand=game.humanHand.filter(cardId=>getCard(cardId)?.month===item.month).length;
 const floor=game.floorCards.filter(cardId=>getCard(cardId)?.month===item.month).length;
 if(floor) return captured===2 && hand===1 && floor===1 ? 'quiet-match' : 'match';
 return ((captured===2 && hand===2) || (captured===3 && hand===1)) ? 'dead' : 'none';
}
