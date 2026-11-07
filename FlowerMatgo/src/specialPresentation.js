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

// Preserve every rule event in the visible status line, even when a stronger
// simultaneous event is chosen as the animation/sound priority.
export function eventAnnouncement(result, actor = 'human', {omitBonusTransfer = false} = {}) {
  if (!result) return null;
  const events = Array.isArray(result.specialEvents) ? result.specialEvents : [];
  const labels = [...new Set(events.map(event => String(event.label || '').trim()).filter(Boolean))];
  if (!labels.length && result.ppeok) labels.push('뻑');
  const bonus = new Set(omitBonusTransfer ? result.bonusStolenPee || [] : []);
  const stolen = Array.isArray(result.stolenPee) ? new Set(result.stolenPee.filter(id=>!bonus.has(id))).size : 0;
  const text = labels.map(label => /[!?]$/.test(label) ? label : label + '!').join(' · ');
  const event = text && actor === 'computer' ? '상대 ' + text : text;
  const transfer = stolen ? (actor === 'computer' ? `내 피 ${stolen}장 뺏김!` : `상대 피 ${stolen}장 뺏기!`) : '';
  return [event,transfer].filter(Boolean).join(' · ') || null;
}

// Wording is always from the human player's perspective and uses real transfers.
export function piTransferAnnouncement(result) {
  if (!result) return '';
  const transfer=result.missionTransfer;
  if (!transfer || !Array.isArray(transfer.cardIds) || !transfer.cardIds.length) return '';
  const n=transfer.cardIds.length;
  return transfer.to === 'human' ? `상대 피 ${n}장 내게 이동` : `내 피 ${n}장 상대에게 이동`;
}
