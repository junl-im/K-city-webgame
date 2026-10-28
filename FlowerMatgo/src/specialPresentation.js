import { getCard } from './engine/cards';

// Presentation-only labels. The actual special events and captures are always
// decided by the rules engine; visual effects cannot affect scores or cards.
const EVENT_PRIORITY = [
  ['bomb', 'bomb', 'bomb'],
  ['sweep', 'sweep', 'sweep'],
  ['ppeok-capture', 'ppeok', 'ppeok'],
  ['self-ppeok', 'ppeok', 'ppeok'],
  ['ppeok', 'ppeok', 'ppeok'],
  ['ttadak', 'ttadak', 'ttadak'],
  ['jjok', 'jjok', 'jjok']
];

export function specialPresentation(result) {
  if (!result) return null;
  const events = Array.isArray(result.specialEvents) ? result.specialEvents : [];
  const labels = events.map(event => event.label).filter(Boolean);
  for (const [eventKind, visualKind, soundKind] of EVENT_PRIORITY) {
    if (events.some(event => event.kind === eventKind)) {
      const headline = labels.length ? labels.join(' · ') : eventKind;
      return {kind: visualKind, sound: soundKind, text: /[!?]$/.test(headline) ? headline : headline + '!'};
    }
  }
  if (result.ppeok) return {kind: 'ppeok',sound:'ppeok',text:'뻑!'};
  if (events.length) return {kind:'special',sound:'special',text:labels.join(' · ') || '특수 패!'};
  const captured = Array.isArray(result.captured) ? result.captured : [];
  if (captured.some(id => getCard(id)?.type === 'bright')) return {kind:'bright',sound:'bright',text:'광 획득!'};
  if (captured.some(id => getCard(id)?.type === 'doubleJunk')) return {kind:'double',sound:'double',text:'쌍피 획득!'};
  return null;
}
