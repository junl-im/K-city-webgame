import type { CardDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, MonsterDefinition, SoulDefinition, TileId } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 3;
export const MAP_W = 20;
export const MAP_H = 20;

export const classes: Record<string, CharacterClass> = {
  warrior: {
    id: 'warrior',
    name: '전사',
    glyph: 'W',
    description: '짧은 사거리, 높은 체력과 방어, 근접 폭발력',
    roleText: '근접 탱커',
    skillName: '반월참',
    attackStyle: 'melee',
    accent: 0xe2b95f,
    sprite: textureUrls.heroWarrior,
    baseStats: { hp: 280, mp: 42, atk: 40, def: 24, aspd: 1.12, crit: 0.08, move: 3.05 },
    attackRange: 1.16
  },
  taoist: {
    id: 'taoist',
    name: '술사',
    glyph: 'T',
    description: '긴 사거리, 높은 공격력과 치명타, 낮은 생존력',
    roleText: '원거리 딜러',
    skillName: '수정 탄환',
    attackStyle: 'projectile',
    accent: 0x72e7ff,
    sprite: textureUrls.heroTaoist,
    baseStats: { hp: 178, mp: 132, atk: 52, def: 9, aspd: 0.88, crit: 0.16, move: 3.0 },
    attackRange: 3.35
  },
  cleric: {
    id: 'cleric',
    name: '성직자',
    glyph: 'C',
    description: '중거리, 낮은 화력, 타격 시 회복으로 안정 사냥',
    roleText: '회복 서포터',
    skillName: '성광',
    attackStyle: 'holy',
    accent: 0xf2d66c,
    sprite: textureUrls.heroCleric,
    baseStats: { hp: 226, mp: 118, atk: 31, def: 17, aspd: 0.98, crit: 0.06, move: 3.08 },
    attackRange: 2.25
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


export const dailyQuests: DailyQuestDefinition[] = [
  {
    id: 'daily-slime-cleanup',
    title: '마을 앞 슬라임 정화',
    description: '초록 숲 입구에서 슬라임을 5마리 처치',
    goalType: 'kill',
    monsterId: 'slime',
    target: 5,
    reward: { gold: 80, gems: 2 }
  },
  {
    id: 'daily-wolf-trace',
    title: '수정 늑대 흔적 회수',
    description: '수정 늑대를 3마리 처치',
    goalType: 'kill',
    monsterId: 'wolf',
    target: 3,
    reward: { gold: 120, itemId: 'soul-shard', itemCount: 1 }
  },
  {
    id: 'daily-goblin-road',
    title: '고블린 길목 확보',
    description: '고블린 추적자를 2마리 처치',
    goalType: 'kill',
    monsterId: 'goblin',
    target: 2,
    reward: { gold: 180, gems: 3 }
  },
  {
    id: 'daily-grow-soul',
    title: '소울 성장 점검',
    description: '오늘 캐릭터 레벨 3 이상 달성',
    goalType: 'level',
    target: 3,
    reward: { gold: 150, gems: 4 }
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
  },
  {
    id: 'fox-charm',
    name: '곰같은여우 부적',
    type: 'relic',
    rarity: 'SR',
    effectText: '공격 +4, 방어 +3, 치명 +3%',
    bonus: { atk: 4, def: 3, crit: 0.03 }
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
    if ((x <= 1 && y < 8) || (y <= 1 && x < 7) || x + y > 33) return 'water';
    if (x >= 6 && x <= 10 && y >= 6 && y <= 10) return 'stone';
    if ((x > 10 && y > 12) || (x > 13 && y > 6 && y < 11)) return 'stone';
    if (x === 8 && y === 8) return 'portal';
    return 'grass';
  })
);

export const spawnTable = [
  { monsterId: 'slime', x: 5.1, y: 12.3 },
  { monsterId: 'slime', x: 6.3, y: 13.4 },
  { monsterId: 'slime', x: 4.4, y: 15.2 },
  { monsterId: 'wolf', x: 12.0, y: 8.0 },
  { monsterId: 'wolf', x: 13.6, y: 9.1 },
  { monsterId: 'goblin', x: 11.5, y: 13.2 },
  { monsterId: 'goblin', x: 14.4, y: 14.4 },
  { monsterId: 'crystalBear', x: 16.2, y: 16.1 },
  { monsterId: 'dragon', x: 17.2, y: 10.8 }
] as const;

export const villageProps = [
  { type: 'tree', x: 5.6, y: 6.1, scale: 0.62 },
  { type: 'tree', x: 10.8, y: 6.0, scale: 0.62 },
  { type: 'crystal', x: 8.0, y: 8.0, scale: 0.5 },
  { type: 'crystal', x: 6.3, y: 9.8, scale: 0.42 },
  { type: 'crystal', x: 10.0, y: 9.7, scale: 0.42 }
] as const;

export const expToNext = (level: number) => 90 + level * level * 32;
