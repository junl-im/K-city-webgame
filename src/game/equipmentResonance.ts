import type { CardRarity, EquipmentSlot, ItemDefinition, PlayerSave, Stats } from '../types';

export type EquipmentResonanceEffect = {
  id: string;
  title: string;
  tier: string;
  description: string;
  bonus: Partial<Stats>;
};

const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'relic'];
const rarityRank: Record<CardRarity, number> = { N: 0, R: 1, SR: 2, SSR: 3, UR: 4 };
const rarityTierName: Record<number, string> = { 1: 'R+', 2: 'SR+', 3: 'SSR+', 4: 'UR' };

export function equippedGear(save: PlayerSave, itemDefs: ItemDefinition[]) {
  return equipmentSlots.flatMap((slot) => {
    const uidValue = save.equipment?.[slot];
    const instance = uidValue ? save.inventory.find((entry) => entry.uid === uidValue) : null;
    const def = instance ? itemDefs.find((item) => item.id === instance.itemId) : null;
    if (!uidValue || !instance || !def || def.type !== slot) return [];
    return [{ slot, uid: uidValue, instance, def, enhance: save.enhancements?.[uidValue] || 0 }];
  });
}

export function equipmentResonanceEffects(save: PlayerSave, itemDefs: ItemDefinition[]): EquipmentResonanceEffect[] {
  const gear = equippedGear(save, itemDefs);
  const effects: EquipmentResonanceEffect[] = [];

  if (gear.length >= 3) {
    effects.push({
      id: 'triad',
      title: '삼위 장비 공명',
      tier: '3 SET',
      description: '무기·방어구·유물을 모두 장착해 기본 전투 흐름이 안정됩니다.',
      bonus: { hp: 80, atk: 6, def: 4 }
    });
  }

  if (gear.length >= 3) {
    const minRarity = Math.min(...gear.map((entry) => rarityRank[entry.def.rarity] ?? 0));
    if (minRarity >= 4) {
      effects.push({ id: 'rarity-ur', title: '신화 장비 공명', tier: 'UR', description: '세 부위가 모두 UR 등급 이상입니다.', bonus: { hp: 300, mp: 100, atk: 25, def: 16, aspd: 0.08, crit: 0.03 } });
    } else if (minRarity >= 3) {
      effects.push({ id: 'rarity-ssr', title: '전설 장비 공명', tier: 'SSR+', description: '세 부위가 모두 SSR 등급 이상입니다.', bonus: { hp: 180, atk: 15, def: 10, crit: 0.02 } });
    } else if (minRarity >= 2) {
      effects.push({ id: 'rarity-sr', title: '영웅 장비 공명', tier: 'SR+', description: '세 부위가 모두 SR 등급 이상입니다.', bonus: { hp: 90, mp: 30, atk: 8, def: 6 } });
    } else if (minRarity >= 1) {
      effects.push({ id: 'rarity-r', title: '희귀 장비 공명', tier: 'R+', description: '세 부위가 모두 R 등급 이상입니다.', bonus: { atk: 4, crit: 0.01 } });
    }
  }

  if (gear.length >= 3) {
    const minEnhance = Math.min(...gear.map((entry) => entry.enhance));
    if (minEnhance >= 20) {
      effects.push({ id: 'enhance-20', title: '초월 강화 공명', tier: '+20', description: '모든 장비가 +20 이상입니다.', bonus: { hp: 400, atk: 40, def: 30, aspd: 0.08, crit: 0.04 } });
    } else if (minEnhance >= 15) {
      effects.push({ id: 'enhance-15', title: '심연 강화 공명', tier: '+15', description: '모든 장비가 +15 이상입니다.', bonus: { hp: 240, atk: 24, def: 18, aspd: 0.04, crit: 0.02 } });
    } else if (minEnhance >= 10) {
      effects.push({ id: 'enhance-10', title: '숙련 강화 공명', tier: '+10', description: '모든 장비가 +10 이상입니다.', bonus: { hp: 140, atk: 12, def: 10, crit: 0.01 } });
    } else if (minEnhance >= 5) {
      effects.push({ id: 'enhance-5', title: '기초 강화 공명', tier: '+5', description: '모든 장비가 +5 이상입니다.', bonus: { hp: 75, atk: 6, def: 5 } });
    }
  }

  return effects;
}

export function applyEquipmentResonance(stats: Stats, effects: EquipmentResonanceEffect[]) {
  for (const effect of effects) {
    for (const [key, value] of Object.entries(effect.bonus) as [keyof Stats, number][]) {
      stats[key] += value;
    }
  }
}

export function nextEquipmentResonanceHint(save: PlayerSave, itemDefs: ItemDefinition[]) {
  const gear = equippedGear(save, itemDefs);
  if (gear.length < 3) return '무기·방어구·유물을 모두 장착하면 장비 공명이 열립니다.';
  const minRarity = Math.min(...gear.map((entry) => rarityRank[entry.def.rarity] ?? 0));
  const minEnhance = Math.min(...gear.map((entry) => entry.enhance));
  const rarityHint = minRarity < 4 ? `세 부위 모두 ${rarityTierName[Math.min(4, minRarity + 1)]} 등급 이상을 맞추면 등급 공명이 상승합니다.` : '등급 공명은 최고 단계입니다.';
  const enhanceTargets = [5, 10, 15, 20];
  const nextEnhance = enhanceTargets.find((target) => minEnhance < target);
  const enhanceHint = nextEnhance ? `세 부위 모두 +${nextEnhance} 이상이면 강화 공명이 상승합니다.` : '강화 공명은 최고 단계입니다.';
  return `${rarityHint} ${enhanceHint}`;
}

export function resonanceBonusText(bonus: Partial<Stats>) {
  const labels: Array<[keyof Stats, string, (value: number) => string]> = [
    ['hp', 'HP', (value) => `+${Math.round(value)}`],
    ['mp', 'MP', (value) => `+${Math.round(value)}`],
    ['atk', '공격', (value) => `+${Math.round(value)}`],
    ['def', '방어', (value) => `+${Math.round(value)}`],
    ['aspd', '공속', (value) => `+${Math.round(value * 100)}%`],
    ['crit', '치명', (value) => `+${Math.round(value * 100)}%`],
    ['move', '이속', (value) => `+${value.toFixed(2)}`]
  ];
  return labels
    .flatMap(([key, label, format]) => {
      const value = bonus[key];
      return typeof value === 'number' && value !== 0 ? [`${label} ${format(value)}`] : [];
    })
    .join(' · ');
}
