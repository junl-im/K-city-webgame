import type { CardDefinition, CharacterClass, ItemDefinition, MonsterDefinition, SoulDefinition, TileId } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 1;
export const MAP_W = 18;
export const MAP_H = 18;

export const classes: Record<string, CharacterClass> = {
  warrior: {
    id: 'warrior',
    name: '전사',
    glyph: 'W',
    description: '검과 갑옷으로 버티며 사냥하는 근접형',
    sprite: textureUrls.heroWarrior,
    baseStats: { hp: 240, mp: 45, atk: 34, def: 18, aspd: 1.05, crit: 0.08, move: 3.1 },
    attackRange: 1.16
  },
  taoist: {
    id: 'taoist',
    name: '술사',
    glyph: 'T',
    description: '부적과 수정 지팡이로 강한 한 방을 넣는 원거리형',
    sprite: textureUrls.heroTaoist,
    baseStats: { hp: 180, mp: 110, atk: 43, def: 11, aspd: 0.88, crit: 0.14, move: 3.0 },
    attackRange: 2.55
  },
  cleric: {
    id: 'cleric',
    name: '성직자',
    glyph: 'C',
    description: '회복과 보호막으로 오래 사냥하는 안정형',
    sprite: textureUrls.heroCleric,
    baseStats: { hp: 210, mp: 95, atk: 28, def: 15, aspd: 0.98, crit: 0.06, move: 3.05 },
    attackRange: 1.85
  }
};

export const cards: CardDefinition[] = [
  {
    id: 'card-soul-knight',
    name: '소울 기사 카드',
    rarity: 'SR',
    art: cardArtUrls.warrior,
    effectText: '공격 +8, 방어 +4',
    bonus: { atk: 8, def: 4 }
  },
  {
    id: 'card-rune-taoist',
    name: '룬 술사 카드',
    rarity: 'SR',
    art: cardArtUrls.taoist,
    effectText: '공격 +7, 치명 +5%',
    bonus: { atk: 7, crit: 0.05 }
  },
  {
    id: 'card-slime',
    name: '초록 슬라임 카드',
    monsterId: 'slime',
    rarity: 'N',
    art: cardArtUrls.uiIcons,
    effectText: '체력 +18',
    bonus: { hp: 18 }
  },
  {
    id: 'card-wolf',
    name: '수정 늑대 카드',
    monsterId: 'wolf',
    rarity: 'R',
    art: cardArtUrls.crystalFox,
    effectText: '공격속도 +6%',
    bonus: { aspd: 0.06 }
  },
  {
    id: 'card-goblin',
    name: '고블린 추적자 카드',
    monsterId: 'goblin',
    rarity: 'R',
    art: cardArtUrls.equipmentPack,
    effectText: '이동속도 +0.18, 방어 +2',
    bonus: { move: 0.18, def: 2 }
  },
  {
    id: 'card-crystal-bear',
    name: '흑수정 곰 카드',
    monsterId: 'crystalBear',
    rarity: 'SSR',
    art: cardArtUrls.crystalBear,
    effectText: '체력 +70, 공격 +12',
    bonus: { hp: 70, atk: 12 }
  }
];

export const souls: SoulDefinition[] = [
  {
    id: 'soul-slime',
    name: '슬라임 영혼',
    monsterId: 'slime',
    effectText: '체력 +25',
    bonus: { hp: 25 },
    requiredKills: 12
  },
  {
    id: 'soul-wolf',
    name: '수정 늑대 영혼',
    monsterId: 'wolf',
    effectText: '이동속도 +0.22',
    bonus: { move: 0.22 },
    requiredKills: 16
  },
  {
    id: 'soul-goblin',
    name: '고블린 영혼',
    monsterId: 'goblin',
    effectText: '방어 +5',
    bonus: { def: 5 },
    requiredKills: 18
  },
  {
    id: 'soul-bear',
    name: '흑수정 곰 영혼',
    monsterId: 'crystalBear',
    effectText: '공격 +14, 치명 +4%',
    bonus: { atk: 14, crit: 0.04 },
    requiredKills: 10
  }
];

export const items: ItemDefinition[] = [
  {
    id: 'iron-sword',
    name: '금간 철검',
    type: 'weapon',
    rarity: 'N',
    effectText: '공격 +5',
    bonus: { atk: 5 }
  },
  {
    id: 'rune-staff',
    name: '수정 지팡이',
    type: 'weapon',
    rarity: 'R',
    effectText: '공격 +9, 마나 +18',
    bonus: { atk: 9, mp: 18 }
  },
  {
    id: 'leather-armor',
    name: '낡은 가죽갑옷',
    type: 'armor',
    rarity: 'N',
    effectText: '체력 +20, 방어 +4',
    bonus: { hp: 20, def: 4 }
  },
  {
    id: 'soul-shard',
    name: '소울 파편',
    type: 'material',
    rarity: 'R',
    effectText: '카드 합성 재료',
    bonus: {}
  }
];

export const monsters: MonsterDefinition[] = [
  {
    id: 'slime',
    name: '초록 슬라임',
    level: 1,
    sprite: textureUrls.monsterSlime,
    stats: { hp: 75, mp: 0, atk: 10, def: 3, aspd: 0.8, crit: 0.02, move: 1.6 },
    exp: 18,
    gold: 12,
    respawnMs: 3300,
    drops: [
      { type: 'gold', amount: 9, chance: 1 },
      { type: 'card', id: 'card-slime', chance: 0.08 },
      { type: 'item', id: 'leather-armor', chance: 0.04 }
    ]
  },
  {
    id: 'wolf',
    name: '수정 늑대',
    level: 3,
    sprite: textureUrls.monsterWolf,
    stats: { hp: 118, mp: 0, atk: 16, def: 5, aspd: 1.02, crit: 0.08, move: 2.15 },
    exp: 32,
    gold: 22,
    respawnMs: 4200,
    drops: [
      { type: 'gold', amount: 16, chance: 1 },
      { type: 'card', id: 'card-wolf', chance: 0.055 },
      { type: 'item', id: 'iron-sword', chance: 0.055 }
    ]
  },
  {
    id: 'goblin',
    name: '고블린 추적자',
    level: 5,
    sprite: textureUrls.monsterGoblin,
    stats: { hp: 168, mp: 0, atk: 21, def: 8, aspd: 0.92, crit: 0.05, move: 1.92 },
    exp: 48,
    gold: 34,
    respawnMs: 5200,
    drops: [
      { type: 'gold', amount: 24, chance: 1 },
      { type: 'gem', amount: 1, chance: 0.12 },
      { type: 'card', id: 'card-goblin', chance: 0.052 },
      { type: 'item', id: 'rune-staff', chance: 0.032 }
    ]
  },
  {
    id: 'crystalBear',
    name: '흑수정 곰',
    level: 8,
    sprite: textureUrls.monsterBear,
    stats: { hp: 360, mp: 0, atk: 34, def: 16, aspd: 0.72, crit: 0.06, move: 1.45 },
    exp: 105,
    gold: 85,
    respawnMs: 8200,
    drops: [
      { type: 'gold', amount: 70, chance: 1 },
      { type: 'gem', amount: 3, chance: 0.16 },
      { type: 'card', id: 'card-crystal-bear', chance: 0.026 },
      { type: 'item', id: 'soul-shard', chance: 0.16 }
    ]
  },
  {
    id: 'dragon',
    name: '저녁 레이드 드래곤',
    level: 15,
    sprite: textureUrls.bossDragon,
    stats: { hp: 1800, mp: 0, atk: 62, def: 28, aspd: 0.58, crit: 0.1, move: 1.15 },
    exp: 420,
    gold: 420,
    respawnMs: 60000,
    drops: [
      { type: 'gold', amount: 280, chance: 1 },
      { type: 'gem', amount: 12, chance: 0.4 },
      { type: 'card', id: 'card-crystal-bear', chance: 0.08 },
      { type: 'item', id: 'soul-shard', chance: 0.5 }
    ]
  }
];

export const worldMap: TileId[][] = Array.from({ length: MAP_H }, (_, y) =>
  Array.from({ length: MAP_W }, (_, x) => {
    if ((x === 0 && y < 6) || (y === 0 && x < 5) || x + y > 28) return 'water';
    if ((x > 8 && y > 10) || (x > 11 && y > 5 && y < 10)) return 'stone';
    if (x === 8 && y === 8) return 'portal';
    return 'grass';
  })
);

export const spawnTable = [
  { monsterId: 'slime', x: 5.5, y: 5.4 },
  { monsterId: 'slime', x: 7.2, y: 4.9 },
  { monsterId: 'slime', x: 4.4, y: 8.8 },
  { monsterId: 'wolf', x: 10.8, y: 6.5 },
  { monsterId: 'wolf', x: 12.4, y: 7.8 },
  { monsterId: 'goblin', x: 9.5, y: 11.2 },
  { monsterId: 'goblin', x: 12.8, y: 12.6 },
  { monsterId: 'crystalBear', x: 14.2, y: 14.1 },
  { monsterId: 'dragon', x: 15.2, y: 9.8 }
] as const;

export const expToNext = (level: number) => 90 + level * level * 32;
