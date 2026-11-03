import { HWATU_CARDS } from './engine/cards';

// Only warn when the opponent has two of a three-card set and the remaining
// card has not already been captured by the player; hidden hands stay hidden.
const SETS = [
  {tag:'hongdan', label:'홍단 비상', group:'ribbon'},
  {tag:'cheongdan', label:'청단 비상', group:'ribbon'},
  {tag:'chodan', label:'초단 비상', group:'ribbon'},
  {tag:'godori', label:'고도리 비상', group:'animal'}
];
export function opponentSetWarnings(game) {
  const rival = new Set(game?.computerCaptured || []);
  const mine = new Set(game?.humanCaptured || []);
  return SETS.filter(({tag}) => {
    const cards = HWATU_CARDS.filter(card => card.tags.includes(tag));
    return cards.filter(card => rival.has(card.id)).length === 2 &&
      cards.some(card => !rival.has(card.id) && !mine.has(card.id));
  }).map(({label,group}) => ({label,group}));
}
