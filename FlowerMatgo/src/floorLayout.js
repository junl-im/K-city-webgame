import { getCard } from './engine/cards';

// Group recorded ppeok piles and matching floor cards without changing
// ownership or any rule-engine state. Preserve the floor order inside groups.
export function groupFloorCards(floor, piles = []) {
  const cards = Array.isArray(floor) ? floor : [];
  const available = new Set(cards);
  const byCard = new Map();
  for (const pile of piles || []) {
    if (!Array.isArray(pile?.cardIds) || !pile.cardIds.every(id=>available.has(id))) continue;
    const members = new Set([...pile.cardIds,...(pile.bonusCardIds || [])]);
    const ids = cards.filter(id=>members.has(id));
    if (ids.length < 3 || ids.some(id=>byCard.has(id))) continue;
    const group = {ids, kind:'ppeok'};
    ids.forEach(id=>byCard.set(id,group));
  }
  const months = new Map();
  for (const id of cards) {
    if (byCard.has(id)) continue;
    const month = getCard(id)?.month;
    if (month) months.set(month,[...(months.get(month) || []),id]);
  }
  for (const ids of months.values()) if (ids.length === 2 || ids.length === 3) {
    const group = {ids, kind:ids.length === 2 ? 'pair' : 'triple'};
    ids.forEach(id=>byCard.set(id,group));
  }
  const emitted = new Set();
  return cards.flatMap(id=>{
    const group = byCard.get(id);
    if (!group) return [{ids:[id],kind:'single'}];
    if (emitted.has(group)) return [];
    emitted.add(group);
    return [group];
  });
}

// Presentation-only tiers: keep all table cards on the phone board when the
// count grows. The engine still owns the exact card list and game rules.
export function floorDensity(count) {
  const value = Math.max(0, Math.floor(Number(count) || 0));
  if (value >= 22) return 'full';
  if (value >= 17) return 'dense';
  if (value >= 13) return 'packed';
  if (value >= 9) return 'busy';
  return 'normal';
}

// Text shown only as a brief visual cue near the capture rack.
// Existing lastAction and scores remain the accessible source of truth.
export function capturedCardNotice(count) {
  const cards = Math.max(0, Math.floor(Number(count) || 0));
  return cards ? `+${cards}장 획득` : '';
}
