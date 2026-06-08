import type { CardDefinition, CardSetDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, StoryQuestDefinition, MonsterDefinition, SoulDefinition, TileId, ZoneDefinition, SkillDefinition } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 13;
export const MAP_W = 40;
export const MAP_H = 40;

export const classes: Record<string, CharacterClass> = {
  warrior: {
    id: 'warrior',
    name: '검혼',
    glyph: 'W',
    description: '소울검으로 전장을 가르는 근접 돌격형 수호자',
    roleText: '근접 브레이커',
    skillName: '혼월참',
    attackStyle: 'melee',
    accent: 0xe2b95f,
    sprite: textureUrls.heroWarrior,
    baseStats: { hp: 280, mp: 42, atk: 40, def: 24, aspd: 1.12, crit: 0.08, move: 3.05 },
    attackRange: 1.16
  },
  taoist: {
    id: 'taoist',
    name: '영술사',
    glyph: 'T',
    description: '영혼결정을 탄환으로 빚어 쏘는 원거리 폭딜러',
    roleText: '원거리 캐스터',
    skillName: '소울 탄환',
    attackStyle: 'projectile',
    accent: 0x72e7ff,
    sprite: textureUrls.heroTaoist,
    baseStats: { hp: 178, mp: 132, atk: 52, def: 9, aspd: 0.88, crit: 0.16, move: 3.0 },
    attackRange: 3.35
  },
  cleric: {
    id: 'cleric',
    name: '성휘사',
    glyph: 'C',
    description: '빛의 영혼으로 자신을 회복하며 전선을 버티는 지원형 전투가',
    roleText: '회복 서포터',
    skillName: '성휘',
    attackStyle: 'holy',
    accent: 0xf2d66c,
    sprite: textureUrls.heroCleric,
    baseStats: { hp: 226, mp: 118, atk: 31, def: 17, aspd: 0.98, crit: 0.06, move: 3.08 },
    attackRange: 2.25
  }
};

export const zones: ZoneDefinition[] = [
  {
    id: 'slime-forest',
    order: 1,
    title: '초록 숲 입구',
    subtitle: '루미나 결계 바깥의 첫 사냥터',
    description: '슬라임과 어린 수정 늑대가 배회하는 입문 지역입니다. 자동사냥 튜토리얼과 초반 카드 파밍에 적합합니다.',
    recommendedLevel: 1,
    monsterIds: ['slime', 'slime', 'slime', 'wolf'],
    entry: { x: 7.5, y: 19.4 },
    badge: '01'
  },
  {
    id: 'crystal-moss',
    order: 2,
    title: '수정 이끼길',
    subtitle: '영혼 결정이 자라난 숲길',
    description: '수정 늑대의 비중이 늘어납니다. 이동 속도 카드와 소울 링크 성장을 노리기 좋은 구간입니다.',
    recommendedLevel: 3,
    monsterIds: ['slime', 'wolf', 'wolf', 'wolf'],
    entry: { x: 9.2, y: 21.0 },
    unlockQuestId: 'story-cleanse-slimes',
    unlockLevel: 3,
    badge: '02'
  },
  {
    id: 'goblin-road',
    order: 3,
    title: '고블린 길목',
    subtitle: '검은 깃발이 꽂힌 폐허 입구',
    description: '고블린 추적자가 등장합니다. 장비 드랍과 골드 수급을 위한 중반 진입 사냥터입니다.',
    recommendedLevel: 5,
    monsterIds: ['wolf', 'goblin', 'goblin', 'goblin'],
    entry: { x: 8.4, y: 20.4 },
    unlockQuestId: 'story-crystal-wolf',
    unlockLevel: 4,
    badge: '03'
  },
  {
    id: 'black-cave',
    order: 4,
    title: '흑수정 동굴',
    subtitle: '거대한 영혼 파편이 박힌 동굴',
    description: '흑수정 곰이 본격적으로 등장합니다. 방어와 체력 세팅을 확인해야 하는 위험 지역입니다.',
    recommendedLevel: 7,
    monsterIds: ['goblin', 'goblin', 'crystalBear', 'crystalBear'],
    entry: { x: 9.5, y: 22.2 },
    unlockQuestId: 'story-goblin-road',
    unlockLevel: 6,
    badge: '04'
  },
  {
    id: 'crystal-raid',
    order: 5,
    title: '수정 레이드 터',
    subtitle: '잠든 용의 그림자가 내려앉은 제단',
    description: '흑수정 곰과 드래곤이 등장하는 보스 테스트 지역입니다. 현재는 솔로 인스턴스 형태로 동작합니다.',
    recommendedLevel: 8,
    monsterIds: ['goblin', 'crystalBear', 'dragon'],
    entry: { x: 10.8, y: 23.2 },
    unlockQuestId: 'story-soul-growth',
    unlockLevel: 8,
    badge: '05'
  }
];

export const skills: SkillDefinition[] = [
  { id: 'warrior-basic', classId: 'warrior', name: '혼월참', hotkey: '1', unlockLevel: 1, cooldownSec: 3.2, mpCost: 5, damageMultiplier: 1.25, range: 1.45, radius: 0.85, kind: 'damage', description: '전방의 적을 베고 주변 적에게 범위 피해를 줍니다.' },
  { id: 'warrior-guard', classId: 'warrior', name: '철혼 파동', hotkey: '2', unlockLevel: 4, cooldownSec: 8, mpCost: 12, damageMultiplier: 1.1, range: 1.8, radius: 1.35, kind: 'damageHeal', description: '검의 파동으로 주변을 밀어내고 HP를 조금 회복합니다.' },
  { id: 'warrior-cleave', classId: 'warrior', name: '파혼난무', hotkey: '3', unlockLevel: 8, cooldownSec: 14, mpCost: 22, damageMultiplier: 1.8, range: 1.65, radius: 1.65, kind: 'damage', description: '근처 적들을 연속으로 베는 강력한 광역 기술입니다.' },
  { id: 'taoist-basic', classId: 'taoist', name: '소울 탄환', hotkey: '1', unlockLevel: 1, cooldownSec: 3.8, mpCost: 8, damageMultiplier: 1.35, range: 4.0, radius: 0.72, kind: 'damage', description: '영혼 결정을 발사해 원거리 적과 주변 적을 타격합니다.' },
  { id: 'taoist-orb', classId: 'taoist', name: '결정 구체', hotkey: '2', unlockLevel: 4, cooldownSec: 7, mpCost: 18, damageMultiplier: 1.22, range: 4.2, radius: 1.45, kind: 'damage', description: '폭발하는 구체를 만들어 다수의 몬스터를 견제합니다.' },
  { id: 'taoist-rain', classId: 'taoist', name: '영혼비', hotkey: '3', unlockLevel: 8, cooldownSec: 15, mpCost: 34, damageMultiplier: 1.65, range: 4.6, radius: 2.1, kind: 'damage', description: '넓은 범위에 영혼 탄환을 떨어뜨리는 광역 기술입니다.' },
  { id: 'cleric-basic', classId: 'cleric', name: '성휘', hotkey: '1', unlockLevel: 1, cooldownSec: 3.5, mpCost: 7, damageMultiplier: 1.08, range: 2.8, radius: 0.92, kind: 'damageHeal', description: '빛의 줄기로 적을 타격하고 자신의 HP를 회복합니다.' },
  { id: 'cleric-shield', classId: 'cleric', name: '소울 보호막', hotkey: '2', unlockLevel: 4, cooldownSec: 9, mpCost: 20, damageMultiplier: 0, range: 0, radius: 0, kind: 'heal', description: '소울 보호막을 펼쳐 HP를 크게 회복합니다.' },
  { id: 'cleric-nova', classId: 'cleric', name: '루미나 노바', hotkey: '3', unlockLevel: 8, cooldownSec: 16, mpCost: 36, damageMultiplier: 1.48, range: 2.8, radius: 2.2, kind: 'damageHeal', description: '주변을 정화하며 회복과 범위 피해를 동시에 줍니다.' }
];


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


export const cardSets: CardSetDefinition[] = [
  {
    id: 'set-forest-memory',
    name: '초록 숲의 기억',
    requiredCardIds: ['card-slime', 'card-wolf', 'card-goblin'],
    effectText: 'HP +50, 공격 +4, 이동속도 +0.12',
    bonus: { hp: 50, atk: 4, move: 0.12 }
  },
  {
    id: 'set-soul-oath',
    name: '소울 바인더의 서약',
    requiredCardIds: ['card-soul-knight', 'card-slime'],
    effectText: '방어 +5, 체력 +35',
    bonus: { def: 5, hp: 35 }
  },
  {
    id: 'set-crystal-rage',
    name: '흑수정의 분노',
    requiredCardIds: ['card-rune-taoist', 'card-crystal-bear'],
    effectText: '공격 +10, 치명 +4%',
    bonus: { atk: 10, crit: 0.04 }
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



export const storyQuests: StoryQuestDefinition[] = [
  {
    id: 'story-lumina-oath',
    chapter: 1,
    title: '꺼져가는 루미나의 등불',
    subtitle: '프롤로그 · 소울 바인더의 서약',
    npc: '등불지기 리아',
    dialogue: '마을의 결계가 약해지고 있어요. 당신의 소울 코어가 마지막 불씨를 붙잡을 수 있을지 시험해야 합니다.',
    goalText: '등불지기 리아와 대화 완료',
    goalType: 'talk',
    target: 1,
    reward: { gold: 60, gems: 1, exp: 35 }
  },
  {
    id: 'story-cleanse-slimes',
    chapter: 1,
    title: '숲 입구의 첫 정화',
    subtitle: '초록 숲 입구 개방',
    npc: '경비대장 로한',
    dialogue: '슬라임에게 붙은 어둠은 약하지만, 그대로 두면 숲 전체가 썩어갑니다. 초록 숲 입구에서 정화를 시작하세요.',
    goalText: '초록 슬라임 5마리 처치',
    goalType: 'kill',
    monsterId: 'slime',
    target: 5,
    unlockZoneId: 'slime-forest',
    reward: { gold: 130, gems: 2, itemId: 'soul-shard', itemCount: 1, exp: 80 }
  },
  {
    id: 'story-crystal-wolf',
    chapter: 2,
    title: '수정 늑대의 울음',
    subtitle: '결정화된 영혼의 흔적',
    npc: '소울 연구가 세린',
    dialogue: '늑대들의 몸에 수정 파편이 자라고 있어요. 이건 자연스러운 변이가 아닙니다. 영혼 오염의 흔적을 모아주세요.',
    goalText: '수정 늑대 3마리 처치',
    goalType: 'kill',
    monsterId: 'wolf',
    target: 3,
    unlockZoneId: 'slime-forest',
    reward: { gold: 180, gems: 3, exp: 110 }
  },
  {
    id: 'story-goblin-road',
    chapter: 3,
    title: '고블린 길목의 검은 깃발',
    subtitle: '폐허로 가는 길',
    npc: '방랑 상인 모루',
    dialogue: '고블린들이 검은 제단으로 가는 길을 막고 있어요. 길목을 확보하면 더 깊은 사냥터가 열릴 겁니다.',
    goalText: '고블린 추적자 2마리 처치',
    goalType: 'kill',
    monsterId: 'goblin',
    target: 2,
    unlockZoneId: 'goblin-road',
    reward: { gold: 240, gems: 4, itemId: 'iron-sword', itemCount: 1, exp: 140 }
  },
  {
    id: 'story-soul-growth',
    chapter: 4,
    title: '소울 코어 공명',
    subtitle: '성장 튜토리얼',
    npc: '소울 성소의 엘린',
    dialogue: '레벨이 오르면 소울 코어가 더 큰 영혼을 받아들일 수 있습니다. 지금의 힘으로 다음 결계를 열어보세요.',
    goalText: '캐릭터 Lv.5 달성',
    goalType: 'level',
    target: 5,
    reward: { gold: 320, gems: 6, itemId: 'fox-charm', itemCount: 1, exp: 180 }
  },
  {
    id: 'story-crystal-bear',
    chapter: 5,
    title: '흑수정 곰의 심장',
    subtitle: '보스 토벌 예고',
    npc: '경비대장 로한',
    dialogue: '흑수정 곰은 마을 결계를 직접 두드리는 존재입니다. 쓰러뜨릴 준비가 되면 수정 레이드 터로 향하세요.',
    goalText: '흑수정 곰 1마리 처치',
    goalType: 'kill',
    monsterId: 'crystalBear',
    target: 1,
    unlockZoneId: 'crystal-raid',
    reward: { gold: 500, gems: 10, itemId: 'soul-shard', itemCount: 3, exp: 260 }
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
    effectText: '카드 합성/장비 강화 재료',
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


export const MAX_ENHANCE_LEVEL = 10;

export function enhancementCost(level: number) {
  const next = Math.min(MAX_ENHANCE_LEVEL, Math.max(0, level) + 1);
  return {
    next,
    gold: 90 + next * 70 + Math.max(0, next - 5) * 60,
    shard: next <= 3 ? 0 : Math.ceil((next - 3) / 2)
  };
}

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

const pathTiles = new Set<string>();
for (let i = 3; i < MAP_W - 3; i += 1) {
  pathTiles.add(`${i},${Math.round(23 + Math.sin(i * 0.36) * 2.2)}`);
  pathTiles.add(`${i},${Math.round(17 + Math.sin(i * 0.22) * 1.8)}`);
}
for (let i = 7; i < MAP_H - 4; i += 1) {
  pathTiles.add(`${Math.round(8 + Math.sin(i * 0.32) * 2.4)},${i}`);
  pathTiles.add(`${Math.round(17 + Math.sin(i * 0.26) * 3.2)},${i}`);
  pathTiles.add(`${Math.round(27 + Math.sin(i * 0.24) * 2.5)},${i}`);
}

export const worldMap: TileId[][] = Array.from({ length: MAP_H }, (_, y) =>
  Array.from({ length: MAP_W }, (_, x) => {
    const key = `${x},${y}`;
    if (x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1) return 'cliff';
    if ((x <= 2 && y < 14) || (y <= 2 && x < 12) || (x > 35 && y > 24) || (x + y > 72)) return 'water';
    if ((x < 4 && y > 28) || (x > 33 && y < 10) || (x + y > 69)) return 'cliff';
    if (x === 8 && y === 21) return 'portal';
    if ((x >= 5 && x <= 12 && y >= 18 && y <= 24) || (x >= 9 && x <= 15 && y >= 14 && y <= 19)) return 'stone';
    if (pathTiles.has(key)) return 'dirt';
    if ((x >= 12 && x <= 24 && y >= 7 && y <= 16) || (x >= 18 && x <= 30 && y >= 14 && y <= 22)) return 'moss';
    if ((x >= 22 && y >= 24) || (x >= 25 && y >= 12 && y <= 19)) return 'crystal';
    if ((x >= 17 && y >= 22) || (x >= 25 && y >= 19)) return 'stone';
    if ((x + y) % 13 === 0 && x > 4 && y > 5) return 'moss';
    return 'grass';
  })
);

export const spawnTable = [
  { monsterId: 'slime', x: 8.8, y: 20.2 },
  { monsterId: 'slime', x: 10.4, y: 22.0 },
  { monsterId: 'slime', x: 12.4, y: 18.4 },
  { monsterId: 'wolf', x: 16.2, y: 15.2 },
  { monsterId: 'wolf', x: 19.4, y: 16.6 },
  { monsterId: 'goblin', x: 18.6, y: 22.8 },
  { monsterId: 'goblin', x: 22.2, y: 23.6 },
  { monsterId: 'crystalBear', x: 25.0, y: 25.2 },
  { monsterId: 'dragon', x: 27.0, y: 18.8 }
] as const;

export const villageProps = [
  { type: 'tree', x: 5.8, y: 16.6, scale: 0.48 },
  { type: 'tree', x: 12.2, y: 16.0, scale: 0.48 },
  { type: 'tree', x: 6.8, y: 23.8, scale: 0.46 },
  { type: 'crystal', x: 8.0, y: 19.0, scale: 0.38 },
  { type: 'crystal', x: 6.2, y: 21.0, scale: 0.34 },
  { type: 'crystal', x: 11.2, y: 21.4, scale: 0.34 },
  { type: 'rock', x: 7.0, y: 17.6, scale: 0.34 },
  { type: 'rock', x: 13.4, y: 20.8, scale: 0.34 },
  { type: 'ruin', x: 11.8, y: 18.8, scale: 0.36 }
] as const;

export const expToNext = (level: number) => 90 + level * level * 32;
