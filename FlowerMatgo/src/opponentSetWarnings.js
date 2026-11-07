import { HWATU_CARDS } from './engine/cards';

// A warning applies only while one side has two and the other has none.
const SETS = [
  {tag:'hongdan', label:'홍단 비상', group:'ribbon'},
  {tag:'cheongdan', label:'청단 비상', group:'ribbon'},
  {tag:'chodan', label:'초단 비상', group:'ribbon'},
  {tag:'godori', label:'고도리 비상', group:'animal'}
];
export function setWarnings(game, owner = 'computer') {
  const rival = new Set((owner==='human'?game?.humanCaptured:game?.computerCaptured) || []);
  const mine = new Set((owner==='human'?game?.computerCaptured:game?.humanCaptured) || []);
  return SETS.filter(({tag}) => {
    const cards = HWATU_CARDS.filter(card => card.tags.includes(tag));
    return cards.filter(card => rival.has(card.id)).length === 2 &&
      cards.some(card => !rival.has(card.id) && !mine.has(card.id));
  }).map(({tag,label,group}) => ({tag,label,group}));
}
export function opponentSetWarnings(game) { return setWarnings(game,'computer').map(({label,group})=>({label,group})); }

// Announce only the transition to two cards; recomputing a rack does not replay it.
export function newlyAvailableSetWarnings(previous, next) {
  if (!previous || !next) return [];
  return ['human','computer'].flatMap(player => {
    const before=new Set((player==='human'?previous.humanCaptured:previous.computerCaptured) || []);
    return setWarnings(next,player).filter(({tag})=>
      HWATU_CARDS.filter(card=>card.tags.includes(tag) && before.has(card.id)).length < 2
    ).map(warning=>({...warning,player}));
  });
}
export function newlyAvailableOpponentWarnings(previous,next) {
  return newlyAvailableSetWarnings(previous,next).filter(warning=>warning.player==='computer');
}
