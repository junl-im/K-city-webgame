import { getCard } from './engine/cards';

export const CAPTURE_TYPES = Object.freeze([
  { id:'bright', name:'광', description:'광 패' },
  { id:'animal', name:'열끗', description:'열끗 패' },
  { id:'ribbon', name:'띠', description:'띠 패' },
  { id:'junk', name:'피', description:'피·쌍피 패' }
]);

// Captured cards stay visible by category, including the gookjin/junk rule.
export function groupedCaptures(game, who) {
  const captured = who==='human' ? game.humanCaptured : game.computerCaptured;
  const asDoubleJunk = who==='human' ? game.humanGookjinAsDoubleJunk : game.computerGookjinAsDoubleJunk;
  return CAPTURE_TYPES.map(type => ({
    ...type,
    cards: captured.filter(id => {
      const info=getCard(id);
      if (!info) return false;
      if (id==='m09-01' && asDoubleJunk) return type.id==='junk';
      if (info.type==='doubleJunk') return type.id==='junk';
      return info.type===type.id;
    }).sort((a,b)=>(getCard(a)?.month||0)-(getCard(b)?.month||0))
  }));
}
