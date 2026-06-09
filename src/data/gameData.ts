import type { CardDefinition, CardSetDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, StoryQuestDefinition, MonsterDefinition, SoulDefinition, TileId, ZoneDefinition, SkillDefinition } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 32;
export const MAP_W = 40;
export const MAP_H = 40;


export const SKILL_MAX_LEVEL = 5;

export function skillMasteryCost(currentLevel: number) {
  const level = Math.max(1, Math.min(SKILL_MAX_LEVEL, Math.floor(currentLevel || 1)));
  return {
    gold: 420 * level * level + 180 * level,
    shard: level + 1,
    stone: level >= 3 ? level - 2 : 0,
    levelReq: level <= 1 ? 1 : level * 3
  };
}

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
    baseStats: { hp: 280, mp: 42, atk: 40, def: 24, aspd: 1.12, crit: 0.08, move: 2.36 },
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
    baseStats: { hp: 178, mp: 132, atk: 52, def: 9, aspd: 0.88, crit: 0.16, move: 2.30 },
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
    baseStats: { hp: 226, mp: 118, atk: 31, def: 17, aspd: 0.98, crit: 0.06, move: 2.308 },
    attackRange: 2.25
  }
};

export const zones: ZoneDefinition[] = [
  { id: 'slime-forest', order: 1, title: '루미나 숲 초입', subtitle: '마을 결계 바깥의 입문 사냥터', description: '입문자용 숲길입니다. 지금부터 몬스터 공격력이 올라가므로 장비 강화와 HP 관리를 익혀야 합니다.', recommendedLevel: 1, monsterIds: ['slime', 'wolf', 'shadowImp'], entry: { x: 7.5, y: 19.4 }, badge: '01' },
  { id: 'crystal-moss', order: 2, title: '청수정 이끼길', subtitle: '수정화된 짐승들이 배회하는 숲길', description: '수정 늑대와 그림자 임프가 빠르게 달려듭니다. +3 이상 장비를 권장합니다.', recommendedLevel: 3, monsterIds: ['wolf', 'shadowImp', 'mossGolem'], entry: { x: 9.2, y: 21.0 }, unlockQuestId: 'story-cleanse-slimes', unlockLevel: 3, badge: '02' },
  { id: 'goblin-road', order: 3, title: '붉은 깃발 폐허로', subtitle: '도적화된 마물 군단의 길목', description: '폐허 검병과 망령 사제가 함께 등장합니다. 물량전이 시작되는 구간입니다.', recommendedLevel: 5, monsterIds: ['goblin', 'wraith', 'wolf'], entry: { x: 8.4, y: 20.4 }, unlockQuestId: 'story-crystal-wolf', unlockLevel: 4, badge: '03' },
  { id: 'black-cave', order: 4, title: '흑요석 동굴', subtitle: '무거운 가디언이 지키는 동굴', description: '흑요석 가디언의 일격이 강합니다. +5 이상 강화와 카드 세팅을 권장합니다.', recommendedLevel: 7, monsterIds: ['crystalBear', 'mossGolem', 'graveKnight'], entry: { x: 9.5, y: 22.2 }, unlockQuestId: 'story-goblin-road', unlockLevel: 6, badge: '04' },
  { id: 'ember-ridge', order: 5, title: '불씨 능선', subtitle: '하늘에서 화염 드레이크가 내려찍는 절벽길', description: '화염 드레이크의 원거리 공격과 폭발 패턴을 조심하세요.', recommendedLevel: 9, monsterIds: ['fireDrake', 'wraith', 'graveKnight'], entry: { x: 12.5, y: 18.8 }, unlockQuestId: 'story-soul-growth', unlockLevel: 8, badge: '05' },
  { id: 'moonlit-grove', order: 6, title: '달빛 고목숲', subtitle: '푸른 혼불이 떠도는 심야 숲', description: '폭풍 하피와 늑대 무리가 빠르게 지원 어그로를 부릅니다.', recommendedLevel: 10, monsterIds: ['stormHarpy', 'wolf', 'goblin', 'mossGolem'], entry: { x: 7.8, y: 20.8 }, unlockQuestId: 'story-crystal-bear', unlockLevel: 10, badge: '06' },
  { id: 'soul-ruins', order: 7, title: '망각의 성소 폐허', subtitle: '오래된 성소가 무너진 전장', description: '망령 사제와 묘지 기사가 몰려옵니다. 광역 스킬과 강화가 중요합니다.', recommendedLevel: 12, monsterIds: ['wraith', 'graveKnight', 'crystalBear'], entry: { x: 8.8, y: 22.0 }, unlockLevel: 12, badge: '07' },
  { id: 'storm-citadel', order: 8, title: '폭풍 감시초소', subtitle: '하피 군단이 점령한 높은 성벽', description: '공격 속도가 빠른 몬스터가 많습니다. 방어구 강화와 회복 스킬을 준비하세요.', recommendedLevel: 14, monsterIds: ['stormHarpy', 'fireDrake', 'graveKnight'], entry: { x: 14.0, y: 16.2 }, unlockLevel: 14, badge: '08' },
  { id: 'dragon-nest', order: 9, title: '용그림자 둥지', subtitle: '잠든 용의 영혼이 새어나오는 협곡', description: '고위험 필드보스 전초 사냥터입니다. +10 이상 장비를 권장합니다.', recommendedLevel: 16, monsterIds: ['fireDrake', 'crystalBear', 'dragon'], entry: { x: 10.4, y: 23.6 }, unlockLevel: 16, badge: '09' },
  { id: 'crystal-raid', order: 10, title: '심연 수정 레이드터', subtitle: '필드보스와 심연룡의 그림자가 출몰하는 제단', description: '자주 출몰하는 필드보스와 드래곤을 상대하는 고위험 지역입니다.', recommendedLevel: 18, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'fireDrake'], entry: { x: 10.8, y: 23.2 }, unlockLevel: 18, badge: '10' },
  { id: 'bloodstone-mine', order: 11, title: '혈석 광산 심층', subtitle: '고대 광산 아래 붉은 혼석이 숨 쉬는 곳', description: '강화 +12 이상을 권장하는 고난도 광산 필드입니다. 가디언과 기사형 몬스터가 밀집합니다.', recommendedLevel: 22, monsterIds: ['crystalBear', 'graveKnight', 'fieldBoss'], entry: { x: 11.2, y: 24.4 }, unlockLevel: 22, badge: '11' },
  { id: 'sky-citadel', order: 12, title: '천공 성채 외곽', subtitle: '폭풍 하피와 드레이크가 공중에서 습격하는 성벽', description: '빠른 몬스터와 원거리 압박이 강한 상급 사냥터입니다.', recommendedLevel: 26, monsterIds: ['stormHarpy', 'fireDrake', 'dragon'], entry: { x: 13.2, y: 18.4 }, unlockLevel: 26, badge: '12' },
  { id: 'demon-rift', order: 13, title: '마왕의 균열', subtitle: '심연룡과 야전 군주가 동시에 출몰하는 균열 지역', description: '균열 심부로 가기 위한 마지막 알파 중급 전선입니다. +15 이상 장비와 카드 세트가 필요합니다.', recommendedLevel: 30, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'fireDrake'], entry: { x: 9.6, y: 25.0 }, unlockLevel: 30, badge: '13' },
  { id: 'azure-mushroom-valley', order: 14, title: '푸른 버섯 계곡', subtitle: '거대한 야광 버섯과 늑대 무리가 뒤엉킨 협곡', description: '중상급 장비 공명과 물약 보급을 확인하는 장기 사냥터입니다. 늑대와 하피가 빠르게 달려듭니다.', recommendedLevel: 34, monsterIds: ['wolf', 'stormHarpy', 'mossGolem', 'wraith'], entry: { x: 6.8, y: 18.8 }, unlockLevel: 34, badge: '14' },
    { id: 'forgotten-waterway', order: 15, title: '잊힌 왕국 수로', subtitle: '폐허 아래 잠긴 수로와 그림자 의식장', description: '망령 사제와 묘지 기사가 좁은 길목을 봉쇄합니다. 광역 스킬 숙련을 권장합니다.', recommendedLevel: 36, monsterIds: ['wraith', 'graveKnight', 'goblin', 'crystalBear'], entry: { x: 10.2, y: 24.8 }, unlockLevel: 36, badge: '15' },
    { id: 'twilight-desert-gate', order: 16, title: '황혼 사막 관문', subtitle: '붉은 모래와 불비늘이 흩날리는 전초기지', description: '화염 드레이크와 폐허 검병이 동시에 압박합니다. MP 물약과 원거리 회피가 중요합니다.', recommendedLevel: 38, monsterIds: ['fireDrake', 'goblin', 'shadowImp', 'stormHarpy'], entry: { x: 13.8, y: 17.8 }, unlockLevel: 38, badge: '16' },
    { id: 'frozen-white-night', order: 17, title: '얼어붙은 백야령', subtitle: '하얀 안개 속 수정 짐승의 능선', description: '가디언과 늑대가 단단한 방어선을 형성합니다. 방어구 강화와 장비 공명을 권장합니다.', recommendedLevel: 40, monsterIds: ['crystalBear', 'wolf', 'mossGolem', 'graveKnight'], entry: { x: 15.6, y: 15.6 }, unlockLevel: 40, badge: '17' },
    { id: 'star-grave-hill', order: 18, title: '별무덤 언덕', subtitle: '별빛 비석과 망령의 노래가 흐르는 언덕', description: '망령 사제와 묘지 기사 토벌량이 많은 장기 퀘스트 구간입니다.', recommendedLevel: 42, monsterIds: ['wraith', 'graveKnight', 'stormHarpy', 'fieldBoss'], entry: { x: 18.4, y: 21.6 }, unlockLevel: 42, badge: '18' },
    { id: 'obsidian-monastery', order: 19, title: '칠흑 수도원', subtitle: '검은 사제단이 봉인을 뒤틀어 놓은 수도원', description: '망령 의식과 가디언 방어선이 중첩된 고난도 사냥터입니다.', recommendedLevel: 44, monsterIds: ['wraith', 'crystalBear', 'graveKnight', 'dragon'], entry: { x: 20.2, y: 23.4 }, unlockLevel: 44, badge: '19' },
    { id: 'thunder-highland', order: 20, title: '천둥 고원', subtitle: '하피 군단과 드레이크가 번갈아 습격하는 고원', description: '빠른 몬스터가 많아 자동사냥 설정과 물약 기준을 세밀하게 맞추면 좋습니다.', recommendedLevel: 46, monsterIds: ['stormHarpy', 'fireDrake', 'wolf', 'dragon'], entry: { x: 23.0, y: 17.2 }, unlockLevel: 46, badge: '20' },
    { id: 'ancient-king-corridor', order: 21, title: '고대왕의 회랑', subtitle: '무너진 왕의 길과 묘지 기사단의 행군로', description: '묘지 기사와 야전 군주가 길목을 장악합니다. 보스 우선 타겟팅을 활용하세요.', recommendedLevel: 48, monsterIds: ['graveKnight', 'fieldBoss', 'crystalBear', 'wraith'], entry: { x: 24.6, y: 25.8 }, unlockLevel: 48, badge: '21' },
    { id: 'magma-forge', order: 22, title: '용암 제련소', subtitle: '불씨 능선 아래 고대 제련장', description: '드레이크와 가디언이 강화석을 지키는 파밍 특화 지역입니다.', recommendedLevel: 50, monsterIds: ['fireDrake', 'crystalBear', 'mossGolem', 'fieldBoss'], entry: { x: 28.4, y: 22.4 }, unlockLevel: 50, badge: '22' },
    { id: 'abyss-coast', order: 23, title: '심연 해안', subtitle: '검은 파도와 용의 그림자가 닿는 해안선', description: '심연룡의 그림자가 잦게 출몰합니다. 장기 보스 토벌 루프를 위한 고위험 지역입니다.', recommendedLevel: 52, monsterIds: ['dragon', 'fireDrake', 'stormHarpy', 'wraith'], entry: { x: 31.8, y: 20.2 }, unlockLevel: 52, badge: '23' },
    { id: 'dream-ruins', order: 24, title: '몽환의 유적', subtitle: '현실과 꿈의 경계가 뒤섞인 폐허', description: '모든 계열 몬스터가 뒤섞여 등장하는 혼합 파밍 지역입니다.', recommendedLevel: 54, monsterIds: ['shadowImp', 'wraith', 'graveKnight', 'dragon'], entry: { x: 12.6, y: 26.6 }, unlockLevel: 54, badge: '24' },
    { id: 'lumina-sanctum-depth', order: 25, title: '루미나 성역 심층', subtitle: '마을 아래 숨겨진 오래된 성역', description: '소울 코어 성장과 카드 세트를 모두 요구하는 심층 성역입니다.', recommendedLevel: 56, monsterIds: ['mossGolem', 'crystalBear', 'fieldBoss', 'dragon'], entry: { x: 8.2, y: 24.2 }, unlockLevel: 56, badge: '25' },
    { id: 'eclipse-fortress', order: 26, title: '일식 요새', subtitle: '검은 태양 아래 야전 군단이 주둔한 요새', description: '야전 군주와 기사단이 함께 출몰합니다. 보스 토벌 훈장과 장비 파밍을 동시에 노릴 수 있습니다.', recommendedLevel: 60, monsterIds: ['fieldBoss', 'graveKnight', 'goblin', 'fireDrake'], entry: { x: 27.0, y: 27.0 }, unlockLevel: 60, badge: '26' },
    { id: 'dragon-spine-peak', order: 27, title: '용척추 봉우리', subtitle: '심연룡의 비늘이 산맥처럼 솟은 최상급 능선', description: '드레이크와 심연룡 토벌을 반복하는 최상급 성장 사냥터입니다.', recommendedLevel: 64, monsterIds: ['dragon', 'fireDrake', 'stormHarpy', 'fieldBoss'], entry: { x: 32.8, y: 16.6 }, unlockLevel: 64, badge: '27' },
    { id: 'last-soul-front', order: 28, title: '최후의 소울 전선', subtitle: '루미나 원정대가 도달한 알파 최종 전장', description: '모든 성장 축을 점검하는 장기 반복 전장입니다. 장비 공명, 스킬 숙련, 카드 세트, 영혼 수집을 모두 요구합니다.', recommendedLevel: 68, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'crystalBear'], entry: { x: 34.0, y: 24.0 }, unlockLevel: 68, badge: '28' }
];

export const skills: SkillDefinition[] = [
  { id: 'warrior-basic', classId: 'warrior', name: '혼월참', hotkey: '1', unlockLevel: 1, cooldownSec: 3.2, mpCost: 6, damageMultiplier: 1.35, range: 1.55, radius: 0.95, kind: 'damage', description: '초승달 검기를 전방에 그어 근접 범위 피해를 줍니다. 스토리 보상 또는 상점 스킬서로 습득합니다.' },
  { id: 'warrior-guard', classId: 'warrior', name: '천뢰검', hotkey: '2', unlockLevel: 4, cooldownSec: 8, mpCost: 16, damageMultiplier: 1.22, range: 2.2, radius: 1.55, kind: 'damageHeal', description: '하늘에서 번개검을 내리꽂아 주변을 타격하고 HP를 회복합니다.' },
  { id: 'warrior-cleave', classId: 'warrior', name: '파멸난무', hotkey: '3', unlockLevel: 8, cooldownSec: 14, mpCost: 28, damageMultiplier: 1.95, range: 1.85, radius: 1.9, kind: 'damage', description: '연속 검격으로 넓은 범위의 적을 베어냅니다.' },
  { id: 'taoist-basic', classId: 'taoist', name: '소울 탄환', hotkey: '1', unlockLevel: 1, cooldownSec: 3.8, mpCost: 9, damageMultiplier: 1.45, range: 4.15, radius: 0.78, kind: 'damage', description: '영혼 결정을 발사해 원거리 적을 타격합니다. 스토리 보상 또는 상점 스킬서로 습득합니다.' },
  { id: 'taoist-orb', classId: 'taoist', name: '낙화염구', hotkey: '2', unlockLevel: 4, cooldownSec: 7, mpCost: 22, damageMultiplier: 1.32, range: 4.4, radius: 1.55, kind: 'damage', description: '하늘에서 파이어볼을 떨어뜨려 폭발 피해를 줍니다.' },
  { id: 'taoist-rain', classId: 'taoist', name: '천뇌폭우', hotkey: '3', unlockLevel: 8, cooldownSec: 15, mpCost: 38, damageMultiplier: 1.75, range: 4.8, radius: 2.35, kind: 'damage', description: '여러 줄기의 낙뢰를 위에서 아래로 내리꽂는 광역 기술입니다.' },
  { id: 'cleric-basic', classId: 'cleric', name: '성휘', hotkey: '1', unlockLevel: 1, cooldownSec: 3.5, mpCost: 8, damageMultiplier: 1.18, range: 2.9, radius: 0.98, kind: 'damageHeal', description: '빛의 줄기로 적을 타격하고 자신의 HP를 회복합니다. 스토리 보상 또는 상점 스킬서로 습득합니다.' },
  { id: 'cleric-shield', classId: 'cleric', name: '루미나 장막', hotkey: '2', unlockLevel: 4, cooldownSec: 9, mpCost: 22, damageMultiplier: 0, range: 0, radius: 0, kind: 'heal', description: '소울 보호막을 펼쳐 HP를 크게 회복합니다.' },
  { id: 'cleric-nova', classId: 'cleric', name: '심판의 성광', hotkey: '3', unlockLevel: 8, cooldownSec: 16, mpCost: 40, damageMultiplier: 1.58, range: 3.0, radius: 2.25, kind: 'damageHeal', description: '수직으로 내려오는 성광 기둥이 주변을 정화합니다.' }
];


export const cards: CardDefinition[] = [
  { id: 'card-soul-knight', name: '루미나 기사 카드', rarity: 'SR', art: cardArtUrls.warrior, effectText: '공격 +8, 방어 +4', bonus: { atk: 8, def: 4 } },
  { id: 'card-rune-taoist', name: '별빛 술사 카드', rarity: 'SR', art: cardArtUrls.taoist, effectText: '공격 +7, 치명 +5%', bonus: { atk: 7, crit: 0.05 } },
  { id: 'card-slime', name: '숲정령 젤리 카드', monsterId: 'slime', rarity: 'N', art: cardArtUrls.slime, effectText: '체력 +22', bonus: { hp: 22 } },
  { id: 'card-wolf', name: '청수정 늑대 카드', monsterId: 'wolf', rarity: 'R', art: cardArtUrls.wolf, effectText: '공격속도 +6%', bonus: { aspd: 0.06 } },
  { id: 'card-goblin', name: '폐허 검병 카드', monsterId: 'goblin', rarity: 'R', art: cardArtUrls.goblin, effectText: '이동속도 +0.18, 방어 +2', bonus: { move: 0.18, def: 2 } },
  { id: 'card-shadow-imp', name: '그림자 임프 카드', monsterId: 'shadowImp', rarity: 'R', art: cardArtUrls.imp, effectText: '치명 +3%, 공격 +3', bonus: { crit: 0.03, atk: 3 } },
  { id: 'card-moss-golem', name: '이끼 골렘 카드', monsterId: 'mossGolem', rarity: 'SR', art: cardArtUrls.golem, effectText: '체력 +55, 방어 +5', bonus: { hp: 55, def: 5 } },
  { id: 'card-wraith', name: '망령 사제 카드', monsterId: 'wraith', rarity: 'SR', art: cardArtUrls.wraith, effectText: '마나 +45, 공격 +5', bonus: { mp: 45, atk: 5 } },
  { id: 'card-fire-drake', name: '화염 드레이크 카드', monsterId: 'fireDrake', rarity: 'SSR', art: cardArtUrls.fireDrake, effectText: '공격 +14, 치명 +4%', bonus: { atk: 14, crit: 0.04 } },
  { id: 'card-storm-harpy', name: '폭풍 하피 카드', monsterId: 'stormHarpy', rarity: 'SSR', art: cardArtUrls.harpy, effectText: '공격속도 +8%, 이동속도 +0.18', bonus: { aspd: 0.08, move: 0.18 } },
  { id: 'card-grave-knight', name: '묘지 기사 카드', monsterId: 'graveKnight', rarity: 'SSR', art: cardArtUrls.graveKnight, effectText: '방어 +9, 체력 +70', bonus: { def: 9, hp: 70 } },
  { id: 'card-crystal-bear', name: '흑요석 가디언 카드', monsterId: 'crystalBear', rarity: 'SSR', art: cardArtUrls.crystalBear, effectText: '체력 +85, 공격 +14', bonus: { hp: 85, atk: 14 } },
  { id: 'card-field-boss', name: '야전 군주 카드', monsterId: 'fieldBoss', rarity: 'UR', art: cardArtUrls.fieldBoss, effectText: '공격 +22, 방어 +12, 치명 +5%', bonus: { atk: 22, def: 12, crit: 0.05 } },
  { id: 'card-dragon', name: '심연룡 카드', monsterId: 'dragon', rarity: 'UR', art: cardArtUrls.dragon, effectText: '체력 +140, 공격 +26, 마나 +80', bonus: { hp: 140, atk: 26, mp: 80 } }
];


export const cardSets: CardSetDefinition[] = [
  { id: 'set-forest-memory', name: '루미나 숲의 기억', requiredCardIds: ['card-slime', 'card-wolf', 'card-shadow-imp'], effectText: 'HP +60, 공격 +5, 이동속도 +0.12', bonus: { hp: 60, atk: 5, move: 0.12 } },
  { id: 'set-ruin-march', name: '폐허 행군', requiredCardIds: ['card-goblin', 'card-wraith', 'card-grave-knight'], effectText: '방어 +10, 마나 +40', bonus: { def: 10, mp: 40 } },
  { id: 'set-crystal-rage', name: '흑요석의 분노', requiredCardIds: ['card-moss-golem', 'card-crystal-bear', 'card-fire-drake'], effectText: '공격 +16, 치명 +5%', bonus: { atk: 16, crit: 0.05 } },
  { id: 'set-tempest-wing', name: '폭풍의 날개', requiredCardIds: ['card-storm-harpy', 'card-wolf'], effectText: '공격속도 +7%, 이동속도 +0.25', bonus: { aspd: 0.07, move: 0.25 } },
  { id: 'set-boss-oath', name: '심연 군주의 서약', requiredCardIds: ['card-field-boss', 'card-dragon'], effectText: 'HP +220, 공격 +30, 방어 +16', bonus: { hp: 220, atk: 30, def: 16 } }
];

export const souls: SoulDefinition[] = [
  { id: 'soul-slime', name: '숲정령 젤리 영혼', monsterId: 'slime', effectText: '체력 +30', bonus: { hp: 30 }, requiredKills: 16 },
  { id: 'soul-wolf', name: '청수정 늑대 영혼', monsterId: 'wolf', effectText: '이동속도 +0.22', bonus: { move: 0.22 }, requiredKills: 20 },
  { id: 'soul-imp', name: '그림자 임프 영혼', monsterId: 'shadowImp', effectText: '치명 +3%', bonus: { crit: 0.03 }, requiredKills: 18 },
  { id: 'soul-goblin', name: '폐허 검병 영혼', monsterId: 'goblin', effectText: '방어 +6', bonus: { def: 6 }, requiredKills: 22 },
  { id: 'soul-golem', name: '이끼 골렘 영혼', monsterId: 'mossGolem', effectText: '체력 +70, 방어 +4', bonus: { hp: 70, def: 4 }, requiredKills: 16 },
  { id: 'soul-wraith', name: '망령 사제 영혼', monsterId: 'wraith', effectText: '마나 +60', bonus: { mp: 60 }, requiredKills: 16 },
  { id: 'soul-firedrake', name: '화염 드레이크 영혼', monsterId: 'fireDrake', effectText: '공격 +16', bonus: { atk: 16 }, requiredKills: 14 },
  { id: 'soul-harpy', name: '폭풍 하피 영혼', monsterId: 'stormHarpy', effectText: '공격속도 +6%', bonus: { aspd: 0.06 }, requiredKills: 14 },
  { id: 'soul-knight', name: '묘지 기사 영혼', monsterId: 'graveKnight', effectText: '방어 +11', bonus: { def: 11 }, requiredKills: 12 },
  { id: 'soul-bear', name: '흑요석 가디언 영혼', monsterId: 'crystalBear', effectText: '공격 +16, 치명 +4%', bonus: { atk: 16, crit: 0.04 }, requiredKills: 12 },
  { id: 'soul-fieldboss', name: '야전 군주 영혼', monsterId: 'fieldBoss', effectText: '체력 +160, 공격 +18', bonus: { hp: 160, atk: 18 }, requiredKills: 4 },
  { id: 'soul-dragon', name: '심연룡 영혼', monsterId: 'dragon', effectText: '공격 +28, 마나 +90', bonus: { atk: 28, mp: 90 }, requiredKills: 3 }
];



export const storyQuests: StoryQuestDefinition[] = [
  { id: 'story-lumina-oath', chapter: 1, title: '꺼져가는 루미나의 등불', subtitle: '프롤로그 · 소울 바인더의 서약', npc: '등불지기 리아', dialogue: '마을의 결계가 약해지고 있어요. 첫 번째 스킬 각인을 깨우고 결계 밖으로 나가세요.', goalText: '등불지기 리아와 대화 완료', goalType: 'talk', target: 1, reward: { gold: 90, gems: 2, exp: 50, skillId: 'class-basic' } },
  { id: 'story-cleanse-slimes', chapter: 1, title: '숲 초입의 첫 정화', subtitle: '루미나 숲 초입 개방', npc: '경비대장 로한', dialogue: '약해진 마물도 방심하면 위험합니다. 장비를 강화하며 숲 초입을 정리하세요.', goalText: '숲정령 젤리 누적 8마리 처치', goalType: 'kill', monsterId: 'slime', target: 8, unlockZoneId: 'slime-forest', reward: { gold: 220, gems: 2, itemId: 'soul-shard', itemCount: 2, exp: 110 } },
  { id: 'story-forest-lanterns', chapter: 1, title: '숲길 등불 재점화', subtitle: '결계 바깥의 첫 거점', npc: '등불지기 리아', dialogue: '꺼진 등불이 다시 켜지면 자동사냥 중에도 길을 잃지 않을 거예요.', goalText: '숲정령 젤리 누적 18마리 처치', goalType: 'kill', monsterId: 'slime', target: 18, unlockZoneId: 'slime-forest', reward: { gold: 300, gems: 2, itemId: 'leather-armor', itemCount: 1, exp: 150 } },
  { id: 'story-wolf-warning', chapter: 1, title: '푸른 발자국 경보', subtitle: '늑대 무리의 이동', npc: '정찰대장 유나', dialogue: '청수정 늑대가 숲 안쪽에서 내려왔어요. 이동속도와 물약 없이 버틸 체력을 확인하세요.', goalText: '청수정 늑대 누적 6마리 처치', goalType: 'kill', monsterId: 'wolf', target: 6, unlockZoneId: 'slime-forest', reward: { gold: 340, gems: 2, itemId: 'iron-sword', itemCount: 1, exp: 170 } },
  { id: 'story-first-camp-report', chapter: 1, title: '초소 보고서', subtitle: '루미나 초소 복구', npc: '경비대장 로한', dialogue: '초소가 다시 열렸습니다. 이제 이끼길의 수정 오염을 조사할 수 있겠군요.', goalText: '캐릭터 Lv.3 달성', goalType: 'level', target: 3, reward: { gold: 380, gems: 3, itemId: 'soul-shard', itemCount: 2, exp: 120 } },
  { id: 'story-crystal-wolf', chapter: 2, title: '청수정 늑대의 울음', subtitle: '결정화된 영혼의 흔적', npc: '소울 연구가 세린', dialogue: '늑대와 임프가 같은 오염 파동에 반응하고 있어요. 빠른 적에게 대비하세요.', goalText: '청수정 늑대 누적 14마리 처치', goalType: 'kill', monsterId: 'wolf', target: 14, unlockZoneId: 'crystal-moss', reward: { gold: 460, gems: 3, itemId: 'crystal-mail', itemCount: 1, exp: 210 } },
  { id: 'story-imp-shadow', chapter: 2, title: '그림자 임프의 속삭임', subtitle: '첫 전문화 스킬서', npc: '방랑 상인 모루', dialogue: '임프들이 훔친 스킬서를 되찾아오면 두 번째 각인을 열어드리죠.', goalText: '그림자 임프 누적 7마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 7, unlockZoneId: 'crystal-moss', reward: { gold: 520, gems: 4, itemId: 'skillbook-second', itemCount: 1, exp: 230 } },
  { id: 'story-moss-pulse', chapter: 2, title: '이끼 아래의 맥동', subtitle: '골렘 코어의 전조', npc: '소울 연구가 세린', dialogue: '이끼가 심장처럼 뛰고 있어요. 작은 골렘 코어를 회수하면 오염의 방향을 알 수 있습니다.', goalText: '이끼 골렘 누적 4마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 4, unlockZoneId: 'crystal-moss', reward: { gold: 620, gems: 4, itemId: 'enhance-stone', itemCount: 1, exp: 260 } },
  { id: 'story-crystal-sample', chapter: 2, title: '청수정 표본 분석', subtitle: '붉은 깃발의 실마리', npc: '소울 연구가 세린', dialogue: '표본 안에 붉은 깃발 문양이 비칩니다. 폐허길의 검병들과 연결된 것 같아요.', goalText: '캐릭터 Lv.4 달성', goalType: 'level', target: 4, reward: { gold: 660, gems: 5, itemId: 'soul-shard', itemCount: 3, exp: 260 } },
  { id: 'story-goblin-road', chapter: 3, title: '붉은 깃발 폐허로', subtitle: '폐허로 가는 길', npc: '방랑 상인 모루', dialogue: '폐허 검병들이 길목을 막고 있습니다. 여기서부터는 강화 없이는 오래 버티기 어렵습니다.', goalText: '폐허 검병 누적 6마리 처치', goalType: 'kill', monsterId: 'goblin', target: 6, unlockZoneId: 'goblin-road', reward: { gold: 760, gems: 5, itemId: 'moon-blade', itemCount: 1, exp: 300 } },
  { id: 'story-ruin-banner', chapter: 3, title: '붉은 깃발 회수', subtitle: '폐허 군단의 명령서', npc: '정찰대장 유나', dialogue: '깃발 안쪽에 군단 명령문이 새겨져 있어요. 검병들은 누군가의 명령을 받고 움직입니다.', goalText: '폐허 검병 누적 16마리 처치', goalType: 'kill', monsterId: 'goblin', target: 16, unlockZoneId: 'goblin-road', reward: { gold: 860, gems: 6, itemId: 'rune-staff', itemCount: 1, exp: 360 } },
  { id: 'story-wraith-incense', chapter: 3, title: '망령 향로 파괴', subtitle: '사제의 저주', npc: '소울 성소의 엘린', dialogue: '망령 사제가 향로로 전장을 묶고 있습니다. 향로를 부수려면 사제를 계속 압박해야 해요.', goalText: '망령 사제 누적 5마리 처치', goalType: 'kill', monsterId: 'wraith', target: 5, unlockZoneId: 'goblin-road', reward: { gold: 920, gems: 6, itemId: 'soul-shard', itemCount: 4, exp: 380 } },
  { id: 'story-soul-growth', chapter: 4, title: '소울 코어 공명', subtitle: '성장 튜토리얼', npc: '소울 성소의 엘린', dialogue: '장비 강화와 카드 세트를 맞추면 코어가 더 큰 영혼을 받아들일 수 있습니다.', goalText: '캐릭터 Lv.6 달성', goalType: 'level', target: 6, reward: { gold: 980, gems: 7, itemId: 'fox-charm', itemCount: 1, exp: 420 } },
  { id: 'story-plate-scraps', chapter: 4, title: '기사 판금 파편', subtitle: '흑요석 동굴의 지도', npc: '대장장이 브란', dialogue: '이 파편은 동굴 수호자의 갑주와 같은 재질입니다. 더 깊은 방어 세팅이 필요하겠군요.', goalText: '묘지 기사 누적 3마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 3, unlockZoneId: 'goblin-road', reward: { gold: 1080, gems: 8, itemId: 'ruin-plate', itemCount: 1, exp: 470 } },
  { id: 'story-golem-line', chapter: 4, title: '골렘 행렬 차단', subtitle: '동굴 입구 봉쇄 해제', npc: '경비대장 로한', dialogue: '골렘들이 동굴 입구로 모이고 있습니다. 진입로가 막히기 전에 흩어 놓아야 합니다.', goalText: '이끼 골렘 누적 10마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 10, unlockZoneId: 'crystal-moss', reward: { gold: 1180, gems: 8, itemId: 'enhance-stone', itemCount: 2, exp: 520 } },
  { id: 'story-crystal-bear', chapter: 5, title: '흑요석 가디언의 심장', subtitle: '방어 세팅 점검', npc: '경비대장 로한', dialogue: '가디언의 일격은 강력합니다. 방어구와 유물을 강화하고 도전하세요.', goalText: '흑요석 가디언 누적 3마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 3, unlockZoneId: 'black-cave', reward: { gold: 1320, gems: 10, itemId: 'enhance-stone', itemCount: 3, exp: 600 } },
  { id: 'story-cave-resonance', chapter: 5, title: '동굴 공명 억제', subtitle: '흑요석 결정 안정화', npc: '소울 연구가 세린', dialogue: '결정이 너무 빠르게 자라고 있어요. 가디언을 더 처치해 공명을 낮춰 주세요.', goalText: '흑요석 가디언 누적 8마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 8, unlockZoneId: 'black-cave', reward: { gold: 1480, gems: 11, itemId: 'soul-core', itemCount: 1, exp: 680 } },
  { id: 'story-cave-knights', chapter: 5, title: '동굴 기사단의 망령', subtitle: '방패문 해제', npc: '정찰대장 유나', dialogue: '기사형 망령이 방패문을 지키고 있습니다. 이들을 무너뜨리면 능선으로 향하는 길이 보일 거예요.', goalText: '묘지 기사 누적 8마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 8, unlockZoneId: 'black-cave', reward: { gold: 1600, gems: 12, itemId: 'enhance-stone', itemCount: 4, exp: 720 } },
  { id: 'story-ember-ridge', chapter: 6, title: '불씨 능선의 포효', subtitle: '낙하형 스킬 훈련', npc: '전투 교관 카엘', dialogue: '하늘에서 떨어지는 마법과 번개를 익히면 몬스터 무리를 제압할 수 있습니다.', goalText: '화염 드레이크 누적 2마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 2, unlockZoneId: 'ember-ridge', reward: { gold: 1780, gems: 12, itemId: 'skillbook-third', itemCount: 1, exp: 780 } },
  { id: 'story-drake-scale', chapter: 6, title: '불비늘 수집', subtitle: '비전 스킬 강화', npc: '전투 교관 카엘', dialogue: '불비늘은 세 번째 각인의 촉매입니다. 더 많은 드레이크를 상대해 보세요.', goalText: '화염 드레이크 누적 7마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 7, unlockZoneId: 'ember-ridge', reward: { gold: 1940, gems: 14, itemId: 'ember-orb', itemCount: 1, exp: 860 } },
  { id: 'story-flame-priest', chapter: 6, title: '불꽃을 부르는 사제', subtitle: '망령 의식 중단', npc: '소울 성소의 엘린', dialogue: '망령 사제가 드레이크의 불꽃을 불러오고 있어요. 의식을 끊어야 합니다.', goalText: '망령 사제 누적 14마리 처치', goalType: 'kill', monsterId: 'wraith', target: 14, unlockZoneId: 'ember-ridge', reward: { gold: 2100, gems: 15, itemId: 'skillbook-second', itemCount: 1, exp: 900 } },
  { id: 'story-moonlit-gate', chapter: 7, title: '달빛 고목숲 개방', subtitle: '푸른 혼불 추적', npc: '등불지기 리아', dialogue: '고목숲에서 결계와 비슷한 빛이 느껴져요. 하지만 하피 무리가 길을 지키고 있습니다.', goalText: '캐릭터 Lv.10 달성', goalType: 'level', target: 10, reward: { gold: 2300, gems: 16, itemId: 'soul-shard', itemCount: 6, exp: 960 } },
  { id: 'story-harpy-first-flight', chapter: 7, title: '첫 폭풍깃 추락', subtitle: '공중 몬스터 대응', npc: '정찰대장 유나', dialogue: '하피는 빠르게 움직이지만 착지 순간이 약점입니다. 자동스킬 타이밍을 확인하세요.', goalText: '폭풍 하피 누적 5마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 5, unlockZoneId: 'moonlit-grove', reward: { gold: 2480, gems: 17, itemId: 'enhance-stone', itemCount: 4, exp: 1040 } },
  { id: 'story-grove-hunt', chapter: 7, title: '고목숲 순찰로 확보', subtitle: '숲 내부 전선 확장', npc: '경비대장 로한', dialogue: '늑대와 검병이 동시에 움직입니다. 숲 안쪽 순찰로를 확보해 주세요.', goalText: '청수정 늑대 누적 32마리 처치', goalType: 'kill', monsterId: 'wolf', target: 32, unlockZoneId: 'moonlit-grove', reward: { gold: 2600, gems: 18, itemId: 'moon-blade', itemCount: 1, exp: 1080 } },
  { id: 'story-grove-golem-root', chapter: 7, title: '뿌리 골렘의 핵', subtitle: '고목 오염 정화', npc: '소울 연구가 세린', dialogue: '뿌리에 박힌 골렘 핵을 제거하면 숲의 소울 흐름이 안정될 겁니다.', goalText: '이끼 골렘 누적 18마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 18, unlockZoneId: 'moonlit-grove', reward: { gold: 2780, gems: 18, itemId: 'soul-core', itemCount: 1, exp: 1160 } },
  { id: 'story-ruin-priest', chapter: 8, title: '망령 사제의 성소', subtitle: '심화 지역 개방', npc: '소울 연구가 세린', dialogue: '망령 사제는 결계를 직접 오염시킵니다. 폐허를 정리하고 필드보스 징조를 확인하세요.', goalText: '망령 사제 누적 24마리 처치', goalType: 'kill', monsterId: 'wraith', target: 24, unlockZoneId: 'soul-ruins', reward: { gold: 3000, gems: 20, itemId: 'soul-core', itemCount: 1, exp: 1260 } },
  { id: 'story-ruin-knight-oath', chapter: 8, title: '묘지 기사단의 서약', subtitle: '성소 방어선 돌파', npc: '경비대장 로한', dialogue: '기사단은 쓰러져도 다시 일어납니다. 충분히 몰아내야 성소 중심부에 닿을 수 있습니다.', goalText: '묘지 기사 누적 18마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 18, unlockZoneId: 'soul-ruins', reward: { gold: 3220, gems: 21, itemId: 'ruin-plate', itemCount: 1, exp: 1360 } },
  { id: 'story-ruin-bear-seal', chapter: 8, title: '가디언 봉인의 균열', subtitle: '흑요석 봉인석', npc: '소울 성소의 엘린', dialogue: '흑요석 가디언이 성소의 봉인석을 긁어내고 있어요. 더 깊은 곳의 봉인을 지켜야 합니다.', goalText: '흑요석 가디언 누적 16마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 16, unlockZoneId: 'soul-ruins', reward: { gold: 3440, gems: 22, itemId: 'enhance-stone', itemCount: 6, exp: 1440 } },
  { id: 'story-storm-wall', chapter: 9, title: '폭풍 감시초소', subtitle: '성벽 위의 번개', npc: '정찰대장 유나', dialogue: '폭풍 감시초소는 하피의 둥지가 되었습니다. 성벽을 오르기 전에 장비를 점검하세요.', goalText: '캐릭터 Lv.14 달성', goalType: 'level', target: 14, reward: { gold: 3660, gems: 24, itemId: 'skillbook-third', itemCount: 1, exp: 1540 } },
  { id: 'story-storm-harpy-swarm', chapter: 9, title: '하피 무리 격퇴', subtitle: '번개깃 회수', npc: '정찰대장 유나', dialogue: '하피의 깃털에 번개가 남아 있습니다. 충분히 모으면 폭풍의 중심을 찾을 수 있어요.', goalText: '폭풍 하피 누적 16마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 16, unlockZoneId: 'storm-citadel', reward: { gold: 3900, gems: 25, itemId: 'enhance-stone', itemCount: 6, exp: 1640 } },
  { id: 'story-storm-drakes', chapter: 9, title: '번개 속의 드레이크', subtitle: '성벽 공중전', npc: '전투 교관 카엘', dialogue: '드레이크가 폭풍을 타고 내려옵니다. 광역 스킬로 착지 지점을 장악하세요.', goalText: '화염 드레이크 누적 16마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 16, unlockZoneId: 'storm-citadel', reward: { gold: 4140, gems: 26, itemId: 'abyss-spear', itemCount: 1, exp: 1760 } },
  { id: 'story-storm-knight-break', chapter: 9, title: '성벽 기사 돌파', subtitle: '용그림자 전조', npc: '경비대장 로한', dialogue: '성벽 안쪽의 묘지 기사들이 용의 그림자를 숭배하고 있습니다. 다음 둥지로 이어지는 문을 여세요.', goalText: '묘지 기사 누적 30마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 30, unlockZoneId: 'storm-citadel', reward: { gold: 4400, gems: 28, itemId: 'abyss-armor', itemCount: 1, exp: 1880 } },
  { id: 'story-dragon-nest', chapter: 10, title: '용그림자 둥지', subtitle: '심연룡의 숨결', npc: '소울 연구가 세린', dialogue: '둥지 안의 모든 결정이 같은 방향으로 떨립니다. 심연룡의 심장이 가까워요.', goalText: '캐릭터 Lv.16 달성', goalType: 'level', target: 16, reward: { gold: 4620, gems: 30, itemId: 'soul-core', itemCount: 1, exp: 2000 } },
  { id: 'story-nest-guardians', chapter: 10, title: '둥지 수호자 처치', subtitle: '용비늘 길 열기', npc: '전투 교관 카엘', dialogue: '둥지의 가디언은 용의 비늘로 강화되어 있습니다. 긴 전투를 대비하세요.', goalText: '흑요석 가디언 누적 28마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 28, unlockZoneId: 'dragon-nest', reward: { gold: 4900, gems: 32, itemId: 'enhance-stone', itemCount: 8, exp: 2140 } },
  { id: 'story-nest-first-dragon', chapter: 10, title: '첫 심연룡 격돌', subtitle: '아케론의 그림자', npc: '등불지기 리아', dialogue: '심연룡의 본체는 아니지만 그림자만으로도 결계를 뒤흔듭니다. 침착하게 공략하세요.', goalText: '심연룡 아케론 누적 1마리 처치', goalType: 'kill', monsterId: 'dragon', target: 1, unlockZoneId: 'dragon-nest', reward: { gold: 5400, gems: 36, itemId: 'dragon-heart', itemCount: 1, exp: 2400 } },
  { id: 'story-field-lord', chapter: 11, title: '야전 군주 발타르', subtitle: '필드보스 첫 조우', npc: '등불지기 리아', dialogue: '발타르가 루미나 결계를 두드리고 있어요. 강화를 충분히 마친 뒤 도전하세요.', goalText: '야전 군주 발타르 누적 1마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 1, unlockZoneId: 'crystal-raid', reward: { gold: 6000, gems: 40, itemId: 'dragon-heart', itemCount: 1, exp: 2700 } },
  { id: 'story-raid-altar', chapter: 11, title: '수정 제단 장악', subtitle: '레이드터 안정화', npc: '소울 성소의 엘린', dialogue: '제단의 수정이 심연으로 열리는 문을 붙잡고 있습니다. 보스의 그림자를 계속 밀어내 주세요.', goalText: '야전 군주 발타르 누적 3마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 3, unlockZoneId: 'crystal-raid', reward: { gold: 6600, gems: 44, itemId: 'enhance-stone', itemCount: 10, exp: 3000 } },
  { id: 'story-raid-dragon-echo', chapter: 11, title: '심연룡의 메아리', subtitle: '용심장 공명', npc: '소울 연구가 세린', dialogue: '용심장이 다시 뜁니다. 둥지가 아닌 레이드터에도 아케론의 메아리가 나타났어요.', goalText: '심연룡 아케론 누적 3마리 처치', goalType: 'kill', monsterId: 'dragon', target: 3, unlockZoneId: 'crystal-raid', reward: { gold: 7200, gems: 48, itemId: 'dragon-slayer', itemCount: 1, exp: 3300 } },
  { id: 'story-bloodstone', chapter: 12, title: '혈석 광산의 붉은 심장', subtitle: '상급 사냥터 개방', npc: '대장장이 브란', dialogue: '혈석은 무기를 더 강하게 만들지만, 광산의 수호자들은 쉽게 물러서지 않습니다.', goalText: '흑요석 가디언 누적 40마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 40, unlockZoneId: 'bloodstone-mine', reward: { gold: 8000, gems: 52, itemId: 'enhance-stone', itemCount: 12, exp: 3600 } },
  { id: 'story-mine-knight-shift', chapter: 12, title: '광산 교대 기사단', subtitle: '혈석 채굴로 확보', npc: '대장장이 브란', dialogue: '광산 깊은 곳의 기사단이 교대로 올라옵니다. 긴 사냥을 버틸 세팅을 완성하세요.', goalText: '묘지 기사 누적 45마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 45, unlockZoneId: 'bloodstone-mine', reward: { gold: 8600, gems: 56, itemId: 'abyss-armor', itemCount: 1, exp: 3900 } },
  { id: 'story-sky-citadel', chapter: 13, title: '천공 성채의 번개깃', subtitle: '공중 몬스터 토벌', npc: '정찰대장 유나', dialogue: '성채 외곽에 폭풍 하피가 모였습니다. 빠른 이동과 자동 스킬 사용을 준비하세요.', goalText: '폭풍 하피 누적 32마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 32, unlockZoneId: 'sky-citadel', reward: { gold: 9400, gems: 60, itemId: 'skillbook-third', itemCount: 1, exp: 4300 } },
  { id: 'story-sky-drake-wind', chapter: 13, title: '성채 풍로의 불꽃', subtitle: '드레이크 풍로 봉쇄', npc: '전투 교관 카엘', dialogue: '드레이크가 성채 풍로에 불을 붙였습니다. 하늘길이 완전히 타오르기 전에 막아야 합니다.', goalText: '화염 드레이크 누적 30마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 30, unlockZoneId: 'sky-citadel', reward: { gold: 10200, gems: 64, itemId: 'ember-orb', itemCount: 1, exp: 4700 } },
  { id: 'story-demon-rift', chapter: 14, title: '마왕의 균열', subtitle: '알파 최고 난이도', npc: '소울 성소의 엘린', dialogue: '균열 너머의 심연은 지금의 루미나를 시험합니다. 강화, 카드, 영혼을 모두 점검하세요.', goalText: '심연룡 아케론 누적 6마리 처치', goalType: 'kill', monsterId: 'dragon', target: 6, unlockZoneId: 'demon-rift', reward: { gold: 11800, gems: 72, itemId: 'dragon-heart', itemCount: 1, exp: 5400 } },
  { id: 'story-rift-lord-cycle', chapter: 14, title: '균열 군주의 순환', subtitle: '보스 연속 사냥', npc: '등불지기 리아', dialogue: '균열은 한 번 닫혀도 다시 벌어집니다. 발타르의 순환을 끊어 주세요.', goalText: '야전 군주 발타르 누적 6마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 6, unlockZoneId: 'demon-rift', reward: { gold: 12600, gems: 78, itemId: 'enhance-stone', itemCount: 16, exp: 6000 } },
  { id: 'story-rift-final-stand', chapter: 15, title: '루미나 최후 방어선', subtitle: '장기 플레이 목표', npc: '경비대장 로한', dialogue: '이제 루미나의 방어선은 당신의 성장에 달렸습니다. 균열 사냥을 계속해 최종 세팅을 완성하세요.', goalText: '캐릭터 Lv.30 달성', goalType: 'level', target: 30, unlockZoneId: 'demon-rift', reward: { gold: 15000, gems: 90, itemId: 'dragon-slayer', itemCount: 1, exp: 7200 } },
  { id: 'story-lumina-champion', chapter: 15, title: '루미나 챔피언', subtitle: '알파 장기 반복 목표', npc: '소울 성소의 엘린', dialogue: '당신의 소울 코어는 이미 하나의 등불이 되었습니다. 더 깊은 심연을 기다리며 최종 세팅을 다듬어 주세요.', goalText: '심연룡 아케론 누적 12마리 처치', goalType: 'kill', monsterId: 'dragon', target: 12, unlockZoneId: 'demon-rift', reward: { gold: 18000, gems: 120, itemId: 'dragon-heart', itemCount: 2, exp: 9000 } },
  { id: 'story-mushroom-lights', chapter: 16, title: '푸른 버섯불 조사', subtitle: '푸른 버섯 계곡 개방', npc: '등불지기 리아', dialogue: '버섯 계곡의 빛은 결계의 잔광과 닮았어요. 길을 밝혀 주세요.', goalText: '캐릭터 Lv.34 달성', goalType: 'level', target: 34, unlockZoneId: 'azure-mushroom-valley', reward: { gold: 22000, gems: 140, itemId: 'soul-shard', itemCount: 12, exp: 10500 } },
  { id: 'story-valley-wolf-howl', chapter: 16, title: '계곡 늑대 울음 차단', subtitle: '고속 몬스터 재점검', npc: '정찰대장 유나', dialogue: '늑대 무리가 하피의 바람에 몰려 내려오고 있어요. 진입로를 확보해야 합니다.', goalText: '청수정 늑대 누적 70마리 처치', goalType: 'kill', monsterId: 'wolf', target: 70, unlockZoneId: 'azure-mushroom-valley', reward: { gold: 23500, gems: 145, itemId: 'enhance-stone', itemCount: 8, exp: 11200 } },
  { id: 'story-valley-golem-cap', chapter: 16, title: '버섯뿌리 골렘핵', subtitle: '계곡 결계 안정화', npc: '소울 연구가 세린', dialogue: '버섯 뿌리에 골렘 코어가 박혀 있어요. 뿌리 쪽 공명을 낮춰 주세요.', goalText: '이끼 골렘 누적 46마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 46, unlockZoneId: 'azure-mushroom-valley', reward: { gold: 24800, gems: 150, itemId: 'soul-core', itemCount: 1, exp: 11800 } },
  { id: 'story-waterway-key', chapter: 17, title: '녹슨 수로 열쇠', subtitle: '잊힌 왕국 수로 개방', npc: '방랑 상인 모루', dialogue: '폐허 아래 수로 문양이 열렸습니다. 망령이 지키는 열쇠를 찾아야겠군요.', goalText: '망령 사제 누적 48마리 처치', goalType: 'kill', monsterId: 'wraith', target: 48, unlockZoneId: 'forgotten-waterway', reward: { gold: 26200, gems: 155, itemId: 'skillbook-second', itemCount: 1, exp: 12600 } },
  { id: 'story-waterway-knights', chapter: 17, title: '수로 기사단 격파', subtitle: '좁은 길목 돌파', npc: '경비대장 로한', dialogue: '수로 안쪽의 기사단을 밀어내야 보급로가 이어집니다.', goalText: '묘지 기사 누적 40마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 40, unlockZoneId: 'forgotten-waterway', reward: { gold: 27600, gems: 160, itemId: 'ruin-plate', itemCount: 1, exp: 13400 } },
  { id: 'story-waterway-seal', chapter: 17, title: '잠긴 봉인문', subtitle: '수로 심부 봉인', npc: '소울 성소의 엘린', dialogue: '수로 봉인이 불안정합니다. 레벨과 장비가 충분한지 다시 확인해 주세요.', goalText: '캐릭터 Lv.36 달성', goalType: 'level', target: 36, unlockZoneId: 'forgotten-waterway', reward: { gold: 29200, gems: 170, itemId: 'enhance-stone', itemCount: 10, exp: 14200 } },
  { id: 'story-desert-gate', chapter: 18, title: '황혼 사막 관문', subtitle: '붉은 모래 전초전', npc: '전투 교관 카엘', dialogue: '사막 관문에서는 불꽃과 먼지가 시야를 가립니다. 드레이크의 선딜을 보고 움직이세요.', goalText: '화염 드레이크 누적 34마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 34, unlockZoneId: 'twilight-desert-gate', reward: { gold: 31000, gems: 175, itemId: 'ember-orb', itemCount: 1, exp: 15100 } },
  { id: 'story-desert-banners', chapter: 18, title: '모래 속 붉은 깃발', subtitle: '군단 보급로 차단', npc: '정찰대장 유나', dialogue: '깃발 아래 보급품이 숨겨져 있어요. 검병들을 밀어내야 합니다.', goalText: '폐허 검병 누적 82마리 처치', goalType: 'kill', monsterId: 'goblin', target: 82, unlockZoneId: 'twilight-desert-gate', reward: { gold: 32600, gems: 180, itemId: 'enhance-stone', itemCount: 11, exp: 15900 } },
  { id: 'story-desert-harpy-wind', chapter: 18, title: '황혼의 하피 바람', subtitle: '공중 습격 차단', npc: '경비대장 로한', dialogue: '하피가 사막 바람을 타고 보급로를 흔듭니다. 하늘길을 잠시 닫겠습니다.', goalText: '폭풍 하피 누적 40마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 40, unlockZoneId: 'twilight-desert-gate', reward: { gold: 34000, gems: 185, itemId: 'soul-shard', itemCount: 14, exp: 16600 } },
  { id: 'story-white-night-border', chapter: 19, title: '백야령 경계선', subtitle: '얼어붙은 백야령 개방', npc: '등불지기 리아', dialogue: '차가운 빛이 밤을 없애고 있어요. 결계의 온도를 되찾아 주세요.', goalText: '캐릭터 Lv.40 달성', goalType: 'level', target: 40, unlockZoneId: 'frozen-white-night', reward: { gold: 36000, gems: 190, itemId: 'crystal-mail', itemCount: 1, exp: 17600 } },
  { id: 'story-white-night-guardian', chapter: 19, title: '서리 가디언 파쇄', subtitle: '수정 방어선 파괴', npc: '대장장이 브란', dialogue: '단단한 가디언을 부수면 방어구 강화법을 더 배울 수 있습니다.', goalText: '흑요석 가디언 누적 42마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 42, unlockZoneId: 'frozen-white-night', reward: { gold: 37800, gems: 200, itemId: 'soul-core', itemCount: 1, exp: 18500 } },
  { id: 'story-white-night-pack', chapter: 19, title: '백야 늑대 무리', subtitle: '고속 추격전', npc: '정찰대장 유나', dialogue: '안개 속 늑대는 소리보다 먼저 다가옵니다. 자동 사냥 타겟팅을 조심하세요.', goalText: '청수정 늑대 누적 95마리 처치', goalType: 'kill', monsterId: 'wolf', target: 95, unlockZoneId: 'frozen-white-night', reward: { gold: 39000, gems: 205, itemId: 'enhance-stone', itemCount: 12, exp: 19400 } },
  { id: 'story-star-grave', chapter: 20, title: '별무덤 첫 비석', subtitle: '별무덤 언덕 개방', npc: '소울 성소의 엘린', dialogue: '별빛 비석마다 영혼의 이름이 새겨져 있습니다. 사제들의 합창을 멈춰 주세요.', goalText: '망령 사제 누적 62마리 처치', goalType: 'kill', monsterId: 'wraith', target: 62, unlockZoneId: 'star-grave-hill', reward: { gold: 41000, gems: 210, itemId: 'skillbook-third', itemCount: 1, exp: 20500 } },
  { id: 'story-star-knight-march', chapter: 20, title: '별빛 기사단 행군', subtitle: '언덕 방어선 돌파', npc: '경비대장 로한', dialogue: '기사단이 별빛 아래 끝없이 행군합니다. 방패문이 열릴 때까지 몰아내세요.', goalText: '묘지 기사 누적 55마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 55, unlockZoneId: 'star-grave-hill', reward: { gold: 43000, gems: 220, itemId: 'abyss-armor', itemCount: 1, exp: 21600 } },
  { id: 'story-star-boss-sign', chapter: 20, title: '야전 군주의 별표식', subtitle: '필드보스 징조', npc: '정찰대장 유나', dialogue: '발타르의 깃발이 별무덤에 꽂혔습니다. 한 번은 직접 부숴야 해요.', goalText: '야전 군주 발타르 누적 5마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 5, unlockZoneId: 'star-grave-hill', reward: { gold: 45500, gems: 230, itemId: 'boss-trophy', itemCount: 2, exp: 23000 } },
  { id: 'story-monastery-door', chapter: 21, title: '칠흑 수도원의 문', subtitle: '칠흑 수도원 개방', npc: '소울 연구가 세린', dialogue: '검은 사제단이 봉인을 뒤틀고 있습니다. 수도원 문을 열겠습니다.', goalText: '캐릭터 Lv.44 달성', goalType: 'level', target: 44, unlockZoneId: 'obsidian-monastery', reward: { gold: 48000, gems: 240, itemId: 'soul-shard', itemCount: 18, exp: 24400 } },
  { id: 'story-monastery-rite', chapter: 21, title: '검은 사제단 의식', subtitle: '의식장 정화', npc: '소울 성소의 엘린', dialogue: '수도원 안쪽 의식장을 정화해야 성역으로 돌아갈 길이 보입니다.', goalText: '망령 사제 누적 78마리 처치', goalType: 'kill', monsterId: 'wraith', target: 78, unlockZoneId: 'obsidian-monastery', reward: { gold: 50500, gems: 250, itemId: 'enhance-stone', itemCount: 14, exp: 25800 } },
  { id: 'story-monastery-dragon-shadow', chapter: 21, title: '수도원의 용그림자', subtitle: '심연 그림자 감지', npc: '전투 교관 카엘', dialogue: '수도원 천장 위로 용그림자가 스쳤습니다. 준비가 부족하면 물러나세요.', goalText: '심연룡 아케론 누적 8마리 처치', goalType: 'kill', monsterId: 'dragon', target: 8, unlockZoneId: 'obsidian-monastery', reward: { gold: 54000, gems: 265, itemId: 'dragon-heart', itemCount: 1, exp: 27600 } },
  { id: 'story-thunder-skyline', chapter: 22, title: '천둥 고원 진입', subtitle: '천둥 고원 개방', npc: '정찰대장 유나', dialogue: '하늘길이 번개로 갈라졌습니다. 하피와 드레이크를 동시에 상대해야 합니다.', goalText: '폭풍 하피 누적 62마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 62, unlockZoneId: 'thunder-highland', reward: { gold: 56500, gems: 275, itemId: 'enhance-stone', itemCount: 15, exp: 29200 } },
  { id: 'story-thunder-drake', chapter: 22, title: '번개비늘 드레이크', subtitle: '고원 폭풍 억제', npc: '전투 교관 카엘', dialogue: '드레이크가 번개구름을 먹고 있습니다. 숨결 패턴을 끊어야 합니다.', goalText: '화염 드레이크 누적 52마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 52, unlockZoneId: 'thunder-highland', reward: { gold: 59000, gems: 285, itemId: 'abyss-spear', itemCount: 1, exp: 31000 } },
  { id: 'story-thunder-level', chapter: 22, title: '하늘길 숙련 검증', subtitle: '상급 자동전투 점검', npc: '경비대장 로한', dialogue: '이제부터는 장기 전투입니다. 자동사냥 설정과 물약 보급을 다시 확인하세요.', goalText: '캐릭터 Lv.46 달성', goalType: 'level', target: 46, unlockZoneId: 'thunder-highland', reward: { gold: 61000, gems: 295, itemId: 'hp-potion-high', itemCount: 60, exp: 32400 } },
  { id: 'story-king-corridor', chapter: 23, title: '고대왕의 회랑', subtitle: '고대왕의 회랑 개방', npc: '방랑 상인 모루', dialogue: '왕의 길은 돈 냄새가 납니다. 물론 기사단의 검도 따라오겠지만요.', goalText: '묘지 기사 누적 72마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 72, unlockZoneId: 'ancient-king-corridor', reward: { gold: 64000, gems: 305, itemId: 'ruin-plate', itemCount: 1, exp: 34200 } },
  { id: 'story-king-guardian', chapter: 23, title: '왕의 수문장', subtitle: '회랑 방어선 붕괴', npc: '대장장이 브란', dialogue: '가디언 껍질을 더 가져오면 장비 공명 연구에 도움이 됩니다.', goalText: '흑요석 가디언 누적 60마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 60, unlockZoneId: 'ancient-king-corridor', reward: { gold: 66500, gems: 315, itemId: 'soul-core', itemCount: 1, exp: 36000 } },
  { id: 'story-king-bounty', chapter: 23, title: '왕의 현상수배', subtitle: '보스 토벌 루프', npc: '경비대장 로한', dialogue: '발타르를 반복 토벌해 훈장을 모으세요. 원정대 보급이 걸려 있습니다.', goalText: '야전 군주 발타르 누적 9마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 9, unlockZoneId: 'ancient-king-corridor', reward: { gold: 70000, gems: 330, itemId: 'boss-trophy', itemCount: 3, exp: 38200 } },
  { id: 'story-forge-flame', chapter: 24, title: '용암 제련소 점화', subtitle: '용암 제련소 개방', npc: '대장장이 브란', dialogue: '이 제련소를 되찾으면 강화석 수급이 달라질 겁니다. 뜨거운 몬스터부터 정리하죠.', goalText: '화염 드레이크 누적 70마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 70, unlockZoneId: 'magma-forge', reward: { gold: 73000, gems: 340, itemId: 'enhance-stone', itemCount: 18, exp: 40500 } },
  { id: 'story-forge-core', chapter: 24, title: '제련핵 회수', subtitle: '강화 재료 파밍', npc: '소울 연구가 세린', dialogue: '제련핵은 소울 코어와 반응합니다. 가디언을 쓰러뜨리고 핵을 안정화하세요.', goalText: '흑요석 가디언 누적 76마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 76, unlockZoneId: 'magma-forge', reward: { gold: 76000, gems: 350, itemId: 'soul-core', itemCount: 2, exp: 43000 } },
  { id: 'story-forge-boss', chapter: 24, title: '제련소의 군주', subtitle: '용암 보스전', npc: '전투 교관 카엘', dialogue: '발타르가 제련소를 점거했습니다. 패턴을 보고 피하면서 토벌하세요.', goalText: '야전 군주 발타르 누적 12마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 12, unlockZoneId: 'magma-forge', reward: { gold: 80000, gems: 365, itemId: 'boss-trophy', itemCount: 4, exp: 45500 } },
  { id: 'story-abyss-coast', chapter: 25, title: '검은 파도 경계', subtitle: '심연 해안 개방', npc: '등불지기 리아', dialogue: '해안의 파도가 검게 변했어요. 용의 그림자가 바다 쪽에서 오고 있습니다.', goalText: '캐릭터 Lv.52 달성', goalType: 'level', target: 52, unlockZoneId: 'abyss-coast', reward: { gold: 84000, gems: 380, itemId: 'mp-potion-high', itemCount: 80, exp: 48500 } },
  { id: 'story-abyss-dragon', chapter: 25, title: '해안의 심연룡', subtitle: '용심장 파밍', npc: '전투 교관 카엘', dialogue: '아케론이 해안선에 내려앉았습니다. 회피와 물약을 동시에 써야 합니다.', goalText: '심연룡 아케론 누적 14마리 처치', goalType: 'kill', monsterId: 'dragon', target: 14, unlockZoneId: 'abyss-coast', reward: { gold: 89000, gems: 400, itemId: 'dragon-heart', itemCount: 2, exp: 52000 } },
  { id: 'story-abyss-flames', chapter: 25, title: '검은 파도 위 불비늘', subtitle: '드레이크 잔당 정리', npc: '정찰대장 유나', dialogue: '드레이크 떼가 해안 상공을 막고 있습니다. 하늘을 잠시 비워 주세요.', goalText: '화염 드레이크 누적 88마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 88, unlockZoneId: 'abyss-coast', reward: { gold: 92500, gems: 410, itemId: 'abyss-spear', itemCount: 1, exp: 54800 } },
  { id: 'story-dream-ruins', chapter: 26, title: '몽환의 유적 입장', subtitle: '몽환의 유적 개방', npc: '소울 성소의 엘린', dialogue: '꿈과 현실이 겹치는 곳입니다. 오늘의 전투 기록이 내일의 길이 됩니다.', goalText: '캐릭터 Lv.54 달성', goalType: 'level', target: 54, unlockZoneId: 'dream-ruins', reward: { gold: 96000, gems: 425, itemId: 'soul-shard', itemCount: 25, exp: 58000 } },
  { id: 'story-dream-imp', chapter: 26, title: '꿈속 임프 추적', subtitle: '환영 잔상 제거', npc: '방랑 상인 모루', dialogue: '임프들이 꿈속에서도 물건을 훔치는군요. 꽤 성가십니다.', goalText: '그림자 임프 누적 88마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 88, unlockZoneId: 'dream-ruins', reward: { gold: 99000, gems: 435, itemId: 'skillbook-basic', itemCount: 2, exp: 60600 } },
  { id: 'story-dream-dragon', chapter: 26, title: '꿈의 용비늘', subtitle: '몽환 보스 사냥', npc: '소울 연구가 세린', dialogue: '꿈속의 용비늘도 현실의 힘을 가집니다. 아케론을 더 추적하세요.', goalText: '심연룡 아케론 누적 18마리 처치', goalType: 'kill', monsterId: 'dragon', target: 18, unlockZoneId: 'dream-ruins', reward: { gold: 104000, gems: 455, itemId: 'dragon-heart', itemCount: 2, exp: 64000 } },
  { id: 'story-sanctum-depth', chapter: 27, title: '루미나 성역 심층', subtitle: '성역 심층 개방', npc: '등불지기 리아', dialogue: '마을 아래에도 전장이 있었습니다. 등불의 뿌리까지 내려가야 해요.', goalText: '캐릭터 Lv.56 달성', goalType: 'level', target: 56, unlockZoneId: 'lumina-sanctum-depth', reward: { gold: 108000, gems: 470, itemId: 'soul-core', itemCount: 2, exp: 67500 } },
  { id: 'story-sanctum-core', chapter: 27, title: '성역 핵 안정화', subtitle: '소울 코어 점검', npc: '소울 연구가 세린', dialogue: '성역 핵은 당신의 장비 공명과 반응합니다. 가디언을 쓰러뜨려 흐름을 맞추세요.', goalText: '흑요석 가디언 누적 96마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 96, unlockZoneId: 'lumina-sanctum-depth', reward: { gold: 112000, gems: 485, itemId: 'enhance-stone', itemCount: 22, exp: 70800 } },
  { id: 'story-sanctum-boss', chapter: 27, title: '등불 아래 군주', subtitle: '성역 보스 토벌', npc: '경비대장 로한', dialogue: '발타르가 성역 아래까지 내려왔습니다. 마을을 지키려면 반드시 막아야 합니다.', goalText: '야전 군주 발타르 누적 16마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 16, unlockZoneId: 'lumina-sanctum-depth', reward: { gold: 118000, gems: 500, itemId: 'boss-trophy', itemCount: 5, exp: 74800 } },
  { id: 'story-eclipse-fortress', chapter: 28, title: '일식 요새 정찰', subtitle: '일식 요새 개방', npc: '정찰대장 유나', dialogue: '검은 태양 아래 요새가 나타났습니다. 보급로를 확보하고 천천히 밀어붙이죠.', goalText: '캐릭터 Lv.60 달성', goalType: 'level', target: 60, unlockZoneId: 'eclipse-fortress', reward: { gold: 124000, gems: 520, itemId: 'abyss-armor', itemCount: 1, exp: 79000 } },
  { id: 'story-eclipse-legion', chapter: 28, title: '일식 군단 격파', subtitle: '요새 외곽 전투', npc: '전투 교관 카엘', dialogue: '군단이 진형을 갖췄습니다. 콤보 보너스를 유지하며 밀어내세요.', goalText: '묘지 기사 누적 110마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 110, unlockZoneId: 'eclipse-fortress', reward: { gold: 130000, gems: 540, itemId: 'enhance-stone', itemCount: 25, exp: 83200 } },
  { id: 'story-eclipse-lord', chapter: 28, title: '검은 태양의 군주', subtitle: '일식 보스 루프', npc: '경비대장 로한', dialogue: '발타르가 일식 아래 더 강해졌습니다. 반복 토벌이 필요합니다.', goalText: '야전 군주 발타르 누적 22마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 22, unlockZoneId: 'eclipse-fortress', reward: { gold: 138000, gems: 565, itemId: 'boss-trophy', itemCount: 6, exp: 88000 } },
  { id: 'story-dragon-spine', chapter: 29, title: '용척추 봉우리', subtitle: '용척추 봉우리 개방', npc: '전투 교관 카엘', dialogue: '심연룡의 뼈가 산맥처럼 솟았습니다. 여기부터는 정말 최상급 전장입니다.', goalText: '캐릭터 Lv.64 달성', goalType: 'level', target: 64, unlockZoneId: 'dragon-spine-peak', reward: { gold: 146000, gems: 590, itemId: 'dragon-heart', itemCount: 2, exp: 93000 } },
  { id: 'story-dragon-spine-flame', chapter: 29, title: '용척추 불비늘', subtitle: '드레이크 무리 격파', npc: '대장장이 브란', dialogue: '불비늘을 모으면 무기 공명 실험에 쓸 수 있습니다. 더 많이 가져오세요.', goalText: '화염 드레이크 누적 120마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 120, unlockZoneId: 'dragon-spine-peak', reward: { gold: 154000, gems: 615, itemId: 'abyss-spear', itemCount: 1, exp: 98000 } },
  { id: 'story-dragon-spine-acheron', chapter: 29, title: '아케론의 척추', subtitle: '심연룡 장기 토벌', npc: '소울 성소의 엘린', dialogue: '아케론의 영혼이 여러 조각으로 갈라졌습니다. 끝까지 추적해야 합니다.', goalText: '심연룡 아케론 누적 28마리 처치', goalType: 'kill', monsterId: 'dragon', target: 28, unlockZoneId: 'dragon-spine-peak', reward: { gold: 164000, gems: 645, itemId: 'dragon-slayer', itemCount: 1, exp: 104000 } },
  { id: 'story-last-front-open', chapter: 30, title: '최후의 소울 전선', subtitle: '최후의 소울 전선 개방', npc: '등불지기 리아', dialogue: '이제 루미나 원정대의 마지막 전선입니다. 하지만 끝은 아닙니다. 계속 할 일이 생길 거예요.', goalText: '캐릭터 Lv.68 달성', goalType: 'level', target: 68, unlockZoneId: 'last-soul-front', reward: { gold: 174000, gems: 680, itemId: 'soul-core', itemCount: 3, exp: 110000 } },
  { id: 'story-last-front-legion', chapter: 30, title: '최후 전선 총공세', subtitle: '장기 사냥 목표', npc: '경비대장 로한', dialogue: '모든 전선의 잔당이 이곳으로 모이고 있습니다. 긴 전투를 준비하세요.', goalText: '묘지 기사 누적 140마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 140, unlockZoneId: 'last-soul-front', reward: { gold: 184000, gems: 715, itemId: 'enhance-stone', itemCount: 30, exp: 118000 } },
  { id: 'story-last-front-boss', chapter: 30, title: '루미나 원정대의 이름', subtitle: '보스 장기 토벌', npc: '정찰대장 유나', dialogue: '당신의 이름이 원정대 기록에 남았습니다. 하지만 전선은 계속 움직입니다.', goalText: '야전 군주 발타르 누적 30마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 30, unlockZoneId: 'last-soul-front', reward: { gold: 196000, gems: 760, itemId: 'boss-trophy', itemCount: 8, exp: 126000 } },
  { id: 'story-last-front-dragon', chapter: 31, title: '심연룡 최종 추적', subtitle: '알파 장기 최종 목표', npc: '소울 성소의 엘린', dialogue: '아케론을 여러 번 쓰러뜨려도 심연은 다시 균열을 냅니다. 그래도 우리는 계속 봉인합니다.', goalText: '심연룡 아케론 누적 40마리 처치', goalType: 'kill', monsterId: 'dragon', target: 40, unlockZoneId: 'last-soul-front', reward: { gold: 210000, gems: 820, itemId: 'dragon-heart', itemCount: 4, exp: 136000 } },
  { id: 'story-lumina-endless-oath', chapter: 31, title: '끝나지 않는 루미나의 서약', subtitle: '반복 성장 개방', npc: '등불지기 리아', dialogue: '이제부터는 매일 다른 의뢰와 전선 토벌로 루미나를 지켜 주세요. 콘텐츠는 계속 확장됩니다.', goalText: '캐릭터 Lv.72 달성', goalType: 'level', target: 72, unlockZoneId: 'last-soul-front', reward: { gold: 230000, gems: 900, itemId: 'dragon-slayer', itemCount: 1, exp: 150000 } }
];

export const dailyQuests: DailyQuestDefinition[] = [
  { id: 'daily-cleanse-any', title: '일일 · 결계 주변 정화', description: '숲정령 젤리 12마리 처치', goalType: 'kill', monsterId: 'slime', target: 12, reward: { gold: 260, gems: 2, itemId: 'soul-shard', itemCount: 1 } },
  { id: 'daily-slime-sweep', title: '일일 · 숲길 점액 제거', description: '숲정령 젤리 24마리 처치', goalType: 'kill', monsterId: 'slime', target: 24, reward: { gold: 420, gems: 2, itemId: 'soul-shard', itemCount: 2 } },
  { id: 'daily-wolf-trace', title: '일일 · 청수정 발톱 회수', description: '청수정 늑대 8마리 처치', goalType: 'kill', monsterId: 'wolf', target: 8, reward: { gold: 340, itemId: 'soul-shard', itemCount: 2 } },
  { id: 'daily-wolf-pack', title: '일일 · 늑대 무리 차단', description: '청수정 늑대 18마리 처치', goalType: 'kill', monsterId: 'wolf', target: 18, reward: { gold: 620, gems: 3 } },
  { id: 'daily-imp-shadow', title: '일일 · 그림자 임프 토벌', description: '그림자 임프 7마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 7, reward: { gold: 420, gems: 3 } },
  { id: 'daily-imp-pouch', title: '일일 · 임프 약탈품 회수', description: '그림자 임프 16마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 16, reward: { gold: 760, itemId: 'skillbook-basic', itemCount: 1 } },
  { id: 'daily-ruin-road', title: '일일 · 폐허길 확보', description: '폐허 검병 7마리 처치', goalType: 'kill', monsterId: 'goblin', target: 7, reward: { gold: 520, itemId: 'enhance-stone', itemCount: 1 } },
  { id: 'daily-ruin-banner', title: '일일 · 붉은 깃발 절단', description: '폐허 검병 18마리 처치', goalType: 'kill', monsterId: 'goblin', target: 18, reward: { gold: 920, gems: 4, itemId: 'soul-shard', itemCount: 3 } },
  { id: 'daily-golem-core', title: '일일 · 골렘 코어 회수', description: '이끼 골렘 5마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 5, reward: { gold: 680, gems: 4 } },
  { id: 'daily-golem-line', title: '일일 · 골렘 행렬 분산', description: '이끼 골렘 12마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 12, reward: { gold: 1040, itemId: 'enhance-stone', itemCount: 2 } },
  { id: 'daily-wraith-incense', title: '일일 · 망령 향로 소거', description: '망령 사제 8마리 처치', goalType: 'kill', monsterId: 'wraith', target: 8, reward: { gold: 780, gems: 4 } },
  { id: 'daily-wraith-choir', title: '일일 · 망령 합창 중단', description: '망령 사제 18마리 처치', goalType: 'kill', monsterId: 'wraith', target: 18, reward: { gold: 1280, gems: 6, itemId: 'skillbook-second', itemCount: 1 } },
  { id: 'daily-bear-guard', title: '일일 · 흑요석 방어선', description: '흑요석 가디언 4마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 4, reward: { gold: 1180, gems: 5, itemId: 'enhance-stone', itemCount: 2 } },
  { id: 'daily-bear-shell', title: '일일 · 가디언 장갑 파쇄', description: '흑요석 가디언 10마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 10, reward: { gold: 1900, gems: 8, itemId: 'soul-core', itemCount: 1 } },
  { id: 'daily-drake-flame', title: '일일 · 드레이크 화염 진압', description: '화염 드레이크 5마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 5, reward: { gold: 1420, gems: 6, itemId: 'enhance-stone', itemCount: 3 } },
  { id: 'daily-drake-scale', title: '일일 · 불비늘 회수', description: '화염 드레이크 12마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 12, reward: { gold: 2300, gems: 10, itemId: 'ember-orb', itemCount: 1 } },
  { id: 'daily-harpy-wing', title: '일일 · 폭풍깃 회수', description: '폭풍 하피 8마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 8, reward: { gold: 1540, gems: 6 } },
  { id: 'daily-harpy-skyline', title: '일일 · 하늘길 확보', description: '폭풍 하피 20마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 20, reward: { gold: 2600, gems: 11, itemId: 'enhance-stone', itemCount: 4 } },
  { id: 'daily-knight-plate', title: '일일 · 묘지 판금 회수', description: '묘지 기사 6마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 6, reward: { gold: 1720, gems: 7, itemId: 'enhance-stone', itemCount: 3 } },
  { id: 'daily-knight-march', title: '일일 · 기사단 행군 저지', description: '묘지 기사 16마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 16, reward: { gold: 3100, gems: 12, itemId: 'ruin-plate', itemCount: 1 } },
  { id: 'daily-field-boss', title: '순환 · 야전 군주 징조', description: '야전 군주 발타르 1마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 1, reward: { gold: 1800, gems: 15, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-field-boss-chain', title: '순환 · 발타르 연속 토벌', description: '야전 군주 발타르 3마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 3, reward: { gold: 4600, gems: 26, itemId: 'dragon-heart', itemCount: 1 } },
  { id: 'daily-dragon-shadow', title: '순환 · 심연룡 그림자', description: '심연룡 아케론 1마리 처치', goalType: 'kill', monsterId: 'dragon', target: 1, reward: { gold: 3200, gems: 22, itemId: 'enhance-stone', itemCount: 8 } },
  { id: 'daily-dragon-hunt', title: '순환 · 용심장 사냥', description: '심연룡 아케론 3마리 처치', goalType: 'kill', monsterId: 'dragon', target: 3, reward: { gold: 7600, gems: 42, itemId: 'dragon-heart', itemCount: 1 } },
  { id: 'daily-grow-soul', title: '일일 · 소울 성장 점검', description: '오늘 캐릭터 레벨 6 이상 달성', goalType: 'level', target: 6, reward: { gold: 450, gems: 4 } },
  { id: 'daily-grow-adept', title: '일일 · 숙련자 점검', description: '오늘 캐릭터 레벨 12 이상 달성', goalType: 'level', target: 12, reward: { gold: 1200, gems: 8, itemId: 'enhance-stone', itemCount: 2 } },
  { id: 'daily-grow-veteran', title: '일일 · 베테랑 점검', description: '오늘 캐릭터 레벨 20 이상 달성', goalType: 'level', target: 20, reward: { gold: 3200, gems: 16, itemId: 'soul-core', itemCount: 1 } },
  { id: 'daily-all-fronts', title: '순환 · 전선 확대 작전', description: '폐허 검병 24마리 처치', goalType: 'kill', monsterId: 'goblin', target: 24, reward: { gold: 3600, gems: 14, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-forest-long', title: '순환 · 긴 숲길 정화', description: '숲정령 젤리 40마리 처치', goalType: 'kill', monsterId: 'slime', target: 40, reward: { gold: 980, gems: 5, itemId: 'soul-shard', itemCount: 5 } },
  { id: 'daily-crystal-long', title: '순환 · 청수정 장기 순찰', description: '청수정 늑대 32마리 처치', goalType: 'kill', monsterId: 'wolf', target: 32, reward: { gold: 2400, gems: 9, itemId: 'enhance-stone', itemCount: 3 } },
  { id: 'daily-expedition-31', title: '원정 · 숲정령 젤리 집중 토벌', description: '숲정령 젤리 55마리 처치', goalType: 'kill', monsterId: 'slime', target: 55, reward: { gold: 6140, gems: 15, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-longrun-32', title: '장기 · 숲정령 젤리 전선 유지', description: '숲정령 젤리 72마리 처치', goalType: 'kill', monsterId: 'slime', target: 72, reward: { gold: 8360, gems: 20, itemId: 'soul-shard', itemCount: 8 } },
  { id: 'daily-expedition-33', title: '원정 · 청수정 늑대 집중 토벌', description: '청수정 늑대 57마리 처치', goalType: 'kill', monsterId: 'wolf', target: 57, reward: { gold: 6420, gems: 16, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-longrun-34', title: '장기 · 청수정 늑대 전선 유지', description: '청수정 늑대 74마리 처치', goalType: 'kill', monsterId: 'wolf', target: 74, reward: { gold: 8720, gems: 21, itemId: 'soul-shard', itemCount: 8 } },
  { id: 'daily-expedition-35', title: '원정 · 그림자 임프 집중 토벌', description: '그림자 임프 59마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 59, reward: { gold: 6700, gems: 16, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-longrun-36', title: '장기 · 그림자 임프 전선 유지', description: '그림자 임프 76마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 76, reward: { gold: 9080, gems: 22, itemId: 'soul-shard', itemCount: 8 } },
  { id: 'daily-expedition-37', title: '원정 · 폐허 검병 집중 토벌', description: '폐허 검병 61마리 처치', goalType: 'kill', monsterId: 'goblin', target: 61, reward: { gold: 6980, gems: 17, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-longrun-38', title: '장기 · 폐허 검병 전선 유지', description: '폐허 검병 78마리 처치', goalType: 'kill', monsterId: 'goblin', target: 78, reward: { gold: 9440, gems: 22, itemId: 'soul-shard', itemCount: 8 } },
  { id: 'daily-expedition-39', title: '원정 · 이끼 골렘 집중 토벌', description: '이끼 골렘 63마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 63, reward: { gold: 7260, gems: 17, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-longrun-40', title: '장기 · 이끼 골렘 전선 유지', description: '이끼 골렘 80마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 80, reward: { gold: 9800, gems: 23, itemId: 'soul-shard', itemCount: 9 } },
  { id: 'daily-expedition-41', title: '원정 · 망령 사제 집중 토벌', description: '망령 사제 65마리 처치', goalType: 'kill', monsterId: 'wraith', target: 65, reward: { gold: 7540, gems: 18, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-longrun-42', title: '장기 · 망령 사제 전선 유지', description: '망령 사제 82마리 처치', goalType: 'kill', monsterId: 'wraith', target: 82, reward: { gold: 10160, gems: 24, itemId: 'soul-shard', itemCount: 9 } },
  { id: 'daily-expedition-43', title: '원정 · 흑요석 가디언 집중 토벌', description: '흑요석 가디언 67마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 67, reward: { gold: 7820, gems: 18, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-longrun-44', title: '장기 · 흑요석 가디언 전선 유지', description: '흑요석 가디언 84마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 84, reward: { gold: 10520, gems: 24, itemId: 'soul-shard', itemCount: 9 } },
  { id: 'daily-expedition-45', title: '원정 · 화염 드레이크 집중 토벌', description: '화염 드레이크 69마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 69, reward: { gold: 8100, gems: 19, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-longrun-46', title: '장기 · 화염 드레이크 전선 유지', description: '화염 드레이크 86마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 86, reward: { gold: 10880, gems: 25, itemId: 'soul-shard', itemCount: 9 } },
  { id: 'daily-expedition-47', title: '원정 · 폭풍 하피 집중 토벌', description: '폭풍 하피 71마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 71, reward: { gold: 8380, gems: 19, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-longrun-48', title: '장기 · 폭풍 하피 전선 유지', description: '폭풍 하피 88마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 88, reward: { gold: 11240, gems: 26, itemId: 'soul-shard', itemCount: 10 } },
  { id: 'daily-expedition-49', title: '원정 · 묘지 기사 집중 토벌', description: '묘지 기사 73마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 73, reward: { gold: 8660, gems: 20, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-longrun-50', title: '장기 · 묘지 기사 전선 유지', description: '묘지 기사 90마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 90, reward: { gold: 11600, gems: 26, itemId: 'soul-shard', itemCount: 10 } },
  { id: 'daily-expedition-51', title: '원정 · 야전 군주 발타르 집중 토벌', description: '야전 군주 발타르 75마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 75, reward: { gold: 8940, gems: 20, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-longrun-52', title: '장기 · 야전 군주 발타르 전선 유지', description: '야전 군주 발타르 92마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 92, reward: { gold: 11960, gems: 27, itemId: 'soul-shard', itemCount: 10 } },
  { id: 'daily-expedition-53', title: '원정 · 심연룡 아케론 집중 토벌', description: '심연룡 아케론 77마리 처치', goalType: 'kill', monsterId: 'dragon', target: 77, reward: { gold: 9220, gems: 21, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-longrun-54', title: '장기 · 심연룡 아케론 전선 유지', description: '심연룡 아케론 94마리 처치', goalType: 'kill', monsterId: 'dragon', target: 94, reward: { gold: 12320, gems: 28, itemId: 'soul-shard', itemCount: 10 } },
  { id: 'daily-growth-lv-32', title: '성장 · Lv.32 전투 점검', description: '캐릭터 Lv.32 이상 달성', goalType: 'level', target: 32, reward: { gold: 30400, gems: 16, itemId: 'hp-potion-high', itemCount: 16 } },
  { id: 'daily-growth-lv-36', title: '성장 · Lv.36 전투 점검', description: '캐릭터 Lv.36 이상 달성', goalType: 'level', target: 36, reward: { gold: 34200, gems: 18, itemId: 'hp-potion-high', itemCount: 18 } },
  { id: 'daily-growth-lv-40', title: '성장 · Lv.40 전투 점검', description: '캐릭터 Lv.40 이상 달성', goalType: 'level', target: 40, reward: { gold: 38000, gems: 20, itemId: 'hp-potion-high', itemCount: 20 } },
  { id: 'daily-growth-lv-44', title: '성장 · Lv.44 전투 점검', description: '캐릭터 Lv.44 이상 달성', goalType: 'level', target: 44, reward: { gold: 41800, gems: 22, itemId: 'hp-potion-high', itemCount: 22 } },
  { id: 'daily-growth-lv-48', title: '성장 · Lv.48 전투 점검', description: '캐릭터 Lv.48 이상 달성', goalType: 'level', target: 48, reward: { gold: 45600, gems: 24, itemId: 'hp-potion-high', itemCount: 24 } },
  { id: 'daily-growth-lv-52', title: '성장 · Lv.52 전투 점검', description: '캐릭터 Lv.52 이상 달성', goalType: 'level', target: 52, reward: { gold: 49400, gems: 26, itemId: 'hp-potion-high', itemCount: 26 } },
  { id: 'daily-growth-lv-56', title: '성장 · Lv.56 전투 점검', description: '캐릭터 Lv.56 이상 달성', goalType: 'level', target: 56, reward: { gold: 53200, gems: 28, itemId: 'hp-potion-high', itemCount: 28 } },
  { id: 'daily-growth-lv-60', title: '성장 · Lv.60 전투 점검', description: '캐릭터 Lv.60 이상 달성', goalType: 'level', target: 60, reward: { gold: 57000, gems: 30, itemId: 'hp-potion-high', itemCount: 30 } },
  { id: 'daily-growth-lv-64', title: '성장 · Lv.64 전투 점검', description: '캐릭터 Lv.64 이상 달성', goalType: 'level', target: 64, reward: { gold: 60800, gems: 32, itemId: 'hp-potion-high', itemCount: 32 } },
  { id: 'daily-growth-lv-68', title: '성장 · Lv.68 전투 점검', description: '캐릭터 Lv.68 이상 달성', goalType: 'level', target: 68, reward: { gold: 64600, gems: 34, itemId: 'hp-potion-high', itemCount: 34 } },
  { id: 'daily-growth-lv-72', title: '성장 · Lv.72 전투 점검', description: '캐릭터 Lv.72 이상 달성', goalType: 'level', target: 72, reward: { gold: 68400, gems: 36, itemId: 'hp-potion-high', itemCount: 36 } },
  { id: 'daily-boss-marathon-1', title: '주간급 · 균열 보스 마라톤 1', description: '야전 군주 발타르 6마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 6, reward: { gold: 31200, gems: 48, itemId: 'boss-trophy', itemCount: 2 } },
  { id: 'daily-boss-marathon-2', title: '주간급 · 균열 보스 마라톤 2', description: '야전 군주 발타르 9마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 9, reward: { gold: 46800, gems: 72, itemId: 'boss-trophy', itemCount: 3 } },
  { id: 'daily-boss-marathon-3', title: '주간급 · 균열 보스 마라톤 3', description: '야전 군주 발타르 12마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 12, reward: { gold: 62400, gems: 96, itemId: 'boss-trophy', itemCount: 4 } },
  { id: 'daily-boss-marathon-4', title: '주간급 · 균열 보스 마라톤 4', description: '야전 군주 발타르 18마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 18, reward: { gold: 93600, gems: 144, itemId: 'boss-trophy', itemCount: 5 } },
  { id: 'daily-boss-marathon-5', title: '주간급 · 균열 보스 마라톤 5', description: '야전 군주 발타르 24마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 24, reward: { gold: 124800, gems: 192, itemId: 'boss-trophy', itemCount: 6 } },
  { id: 'daily-boss-marathon-6', title: '주간급 · 균열 보스 마라톤 6', description: '야전 군주 발타르 36마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 36, reward: { gold: 187200, gems: 288, itemId: 'boss-trophy', itemCount: 7 } },
  { id: 'daily-dragon-marathon-1', title: '주간급 · 심연룡 장기 추적 1', description: '심연룡 아케론 5마리 처치', goalType: 'kill', monsterId: 'dragon', target: 5, reward: { gold: 36000, gems: 50, itemId: 'dragon-heart', itemCount: 1 } },
  { id: 'daily-dragon-marathon-2', title: '주간급 · 심연룡 장기 추적 2', description: '심연룡 아케론 8마리 처치', goalType: 'kill', monsterId: 'dragon', target: 8, reward: { gold: 57600, gems: 80, itemId: 'dragon-heart', itemCount: 2 } },
  { id: 'daily-dragon-marathon-3', title: '주간급 · 심연룡 장기 추적 3', description: '심연룡 아케론 12마리 처치', goalType: 'kill', monsterId: 'dragon', target: 12, reward: { gold: 86400, gems: 120, itemId: 'dragon-heart', itemCount: 3 } },
  { id: 'daily-dragon-marathon-4', title: '주간급 · 심연룡 장기 추적 4', description: '심연룡 아케론 18마리 처치', goalType: 'kill', monsterId: 'dragon', target: 18, reward: { gold: 129600, gems: 180, itemId: 'dragon-heart', itemCount: 4 } },
  { id: 'daily-dragon-marathon-5', title: '주간급 · 심연룡 장기 추적 5', description: '심연룡 아케론 28마리 처치', goalType: 'kill', monsterId: 'dragon', target: 28, reward: { gold: 201600, gems: 280, itemId: 'dragon-heart', itemCount: 5 } },
  { id: 'daily-dragon-marathon-6', title: '주간급 · 심연룡 장기 추적 6', description: '심연룡 아케론 40마리 처치', goalType: 'kill', monsterId: 'dragon', target: 40, reward: { gold: 288000, gems: 400, itemId: 'dragon-heart', itemCount: 6 } }
];

export const items: ItemDefinition[] = [
  { id: 'iron-sword', name: '수련용 철검', type: 'weapon', rarity: 'N', effectText: '공격 +7', bonus: { atk: 7 } },
  { id: 'moon-blade', name: '월광 장검', type: 'weapon', rarity: 'R', effectText: '공격 +13, 치명 +2%', bonus: { atk: 13, crit: 0.02 } },
  { id: 'rune-staff', name: '청수정 지팡이', type: 'weapon', rarity: 'R', effectText: '공격 +12, 마나 +24', bonus: { atk: 12, mp: 24 } },
  { id: 'ember-orb', name: '불씨 보주', type: 'weapon', rarity: 'SR', effectText: '공격 +21, 마나 +36', bonus: { atk: 21, mp: 36 } },
  { id: 'abyss-spear', name: '심연창', type: 'weapon', rarity: 'SSR', effectText: '공격 +34, 치명 +5%', bonus: { atk: 34, crit: 0.05 } },
  { id: 'dragon-slayer', name: '용살검', type: 'weapon', rarity: 'UR', effectText: '공격 +52, 치명 +8%', bonus: { atk: 52, crit: 0.08 } },
  { id: 'leather-armor', name: '수련용 가죽갑옷', type: 'armor', rarity: 'N', effectText: '체력 +28, 방어 +5', bonus: { hp: 28, def: 5 } },
  { id: 'crystal-mail', name: '청수정 사슬갑옷', type: 'armor', rarity: 'R', effectText: '체력 +52, 방어 +10', bonus: { hp: 52, def: 10 } },
  { id: 'ruin-plate', name: '폐허 기사 판금갑', type: 'armor', rarity: 'SR', effectText: '체력 +88, 방어 +18', bonus: { hp: 88, def: 18 } },
  { id: 'abyss-armor', name: '심연 수호갑', type: 'armor', rarity: 'SSR', effectText: '체력 +150, 방어 +29', bonus: { hp: 150, def: 29 } },
  { id: 'fox-charm', name: '곰같은여우 부적', type: 'relic', rarity: 'SR', effectText: '공격 +6, 방어 +5, 치명 +3%', bonus: { atk: 6, def: 5, crit: 0.03 } },
  { id: 'soul-core', name: '루미나 소울 코어', type: 'relic', rarity: 'SSR', effectText: '체력 +95, 마나 +65, 공격 +12', bonus: { hp: 95, mp: 65, atk: 12 } },
  { id: 'dragon-heart', name: '심연룡의 심장', type: 'relic', rarity: 'UR', effectText: '공격 +28, 방어 +18, 치명 +6%', bonus: { atk: 28, def: 18, crit: 0.06 } },
  { id: 'hp-potion-small', name: '하급 생명 물약', type: 'consumable', rarity: 'N', effectText: 'HP 2% 회복. 사냥을 오래 하려면 충분한 수량을 준비해야 합니다.', bonus: {}, consume: { hpPercent: 0.02 } },
  { id: 'mp-potion-small', name: '하급 마나 물약', type: 'consumable', rarity: 'N', effectText: 'MP 2% 회복. 스킬 사냥을 유지하려면 여러 개를 들고 다녀야 합니다.', bonus: {}, consume: { mpPercent: 0.02 } },
  { id: 'hp-potion-mid', name: '중급 생명 물약', type: 'consumable', rarity: 'R', effectText: 'HP 3.5% 회복. 강한 사냥터에서 꾸준히 소모되는 생존 보급품입니다.', bonus: {}, consume: { hpPercent: 0.035 } },
  { id: 'mp-potion-mid', name: '중급 마나 물약', type: 'consumable', rarity: 'R', effectText: 'MP 3.5% 회복. 자동사냥 스킬 회전을 위한 마나 보급품입니다.', bonus: {}, consume: { mpPercent: 0.035 } },
  { id: 'hp-potion-high', name: '상급 생명 물약', type: 'consumable', rarity: 'SR', effectText: 'HP 5% 회복. 보스전에서 더 효율적인 고급 생존 물약입니다.', bonus: {}, consume: { hpPercent: 0.05 } },
  { id: 'mp-potion-high', name: '상급 마나 물약', type: 'consumable', rarity: 'SR', effectText: 'MP 5% 회복. 고숙련 스킬 운용을 오래 유지하기 위한 고급 물약입니다.', bonus: {}, consume: { mpPercent: 0.05 } },
  { id: 'soul-shard', name: '소울 파편', type: 'material', rarity: 'R', effectText: '카드 합성/장비 강화 재료', bonus: {} },
  { id: 'enhance-stone', name: '강화석', type: 'material', rarity: 'SR', effectText: '+10 이후 강화 재료', bonus: {} },
  { id: 'boss-trophy', name: '균열 토벌 훈장', type: 'material', rarity: 'SSR', effectText: '필드보스와 심연룡을 토벌하면 얻는 훈장. 마을 보스 메뉴에서 보상으로 교환합니다.', bonus: {} },
  { id: 'skillbook-basic', name: '기초 스킬서', type: 'skillbook', rarity: 'R', effectText: '현재 직업의 1번 스킬을 배웁니다.', bonus: {}, skillId: 'class-basic' },
  { id: 'skillbook-second', name: '전문화 스킬서', type: 'skillbook', rarity: 'SR', effectText: '현재 직업의 2번 스킬을 배웁니다.', bonus: {}, skillId: 'class-second' },
  { id: 'skillbook-third', name: '비전 스킬서', type: 'skillbook', rarity: 'SSR', effectText: '현재 직업의 3번 스킬을 배웁니다.', bonus: {}, skillId: 'class-third' }
];

export const MAX_ENHANCE_LEVEL = 20;

export function enhancementSuccessRate(level: number) {
  const next = Math.min(MAX_ENHANCE_LEVEL, Math.max(0, level) + 1);
  if (next <= 4) return 1;
  return Math.max(0.05, 1 - (next - 4) * 0.1);
}

export function enhancementCost(level: number) {
  const next = Math.min(MAX_ENHANCE_LEVEL, Math.max(0, level) + 1);
  return {
    next,
    gold: 140 + next * 110 + Math.max(0, next - 8) * 140,
    shard: next <= 3 ? 0 : Math.ceil((next - 3) / 2),
    stone: next <= 10 ? 0 : Math.ceil((next - 10) / 2),
    successRate: enhancementSuccessRate(level)
  };
}

export const monsters: MonsterDefinition[] = [
  { id: 'slime', name: '숲정령 젤리', level: 1, sprite: textureUrls.monsterSlime, stats: { hp: 155, mp: 0, atk: 27, def: 8, aspd: 0.85, crit: 0.03, move: 1.65 }, exp: 22, gold: 16, respawnMs: 3000, drops: [{ type: 'gold', amount: 12, chance: 1 }, { type: 'card', id: 'card-slime', chance: 0.09 }, { type: 'item', id: 'leather-armor', chance: 0.04 }, { type: 'item', id: 'soul-shard', chance: 0.08 }, { type: 'item', id: 'hp-potion-small', chance: 0.10 }] },
  { id: 'wolf', name: '청수정 늑대', level: 3, sprite: textureUrls.monsterWolf, stats: { hp: 245, mp: 0, atk: 42, def: 12, aspd: 1.08, crit: 0.08, move: 2.22 }, exp: 40, gold: 28, respawnMs: 3800, drops: [{ type: 'gold', amount: 20, chance: 1 }, { type: 'card', id: 'card-wolf', chance: 0.06 }, { type: 'item', id: 'iron-sword', chance: 0.055 }, { type: 'item', id: 'moon-blade', chance: 0.018 }, { type: 'item', id: 'mp-potion-small', chance: 0.08 }] },
  { id: 'shadowImp', name: '그림자 임프', level: 4, sprite: textureUrls.monsterGoblin, stats: { hp: 215, mp: 0, atk: 48, def: 10, aspd: 1.16, crit: 0.12, move: 2.05 }, exp: 46, gold: 30, respawnMs: 4100, drops: [{ type: 'gold', amount: 24, chance: 1 }, { type: 'card', id: 'card-shadow-imp', chance: 0.05 }, { type: 'item', id: 'skillbook-basic', chance: 0.018 }] },
  { id: 'goblin', name: '폐허 검병', level: 5, sprite: textureUrls.monsterGoblin, stats: { hp: 350, mp: 0, atk: 58, def: 18, aspd: 0.98, crit: 0.06, move: 1.95 }, exp: 62, gold: 42, respawnMs: 4800, drops: [{ type: 'gold', amount: 32, chance: 1 }, { type: 'gem', amount: 1, chance: 0.13 }, { type: 'card', id: 'card-goblin', chance: 0.055 }, { type: 'item', id: 'rune-staff', chance: 0.032 }, { type: 'item', id: 'crystal-mail', chance: 0.025 }] },
  { id: 'mossGolem', name: '이끼 골렘', level: 6, sprite: textureUrls.monsterBear, stats: { hp: 520, mp: 0, atk: 64, def: 27, aspd: 0.7, crit: 0.04, move: 1.35 }, exp: 82, gold: 58, respawnMs: 5600, drops: [{ type: 'gold', amount: 44, chance: 1 }, { type: 'card', id: 'card-moss-golem', chance: 0.04 }, { type: 'item', id: 'enhance-stone', chance: 0.08 }, { type: 'item', id: 'ruin-plate', chance: 0.018 }, { type: 'item', id: 'hp-potion-mid', chance: 0.055 }] },
  { id: 'wraith', name: '망령 사제', level: 7, sprite: textureUrls.monsterWolf, stats: { hp: 390, mp: 0, atk: 78, def: 19, aspd: 0.92, crit: 0.1, move: 1.7 }, exp: 92, gold: 66, respawnMs: 6100, drops: [{ type: 'gold', amount: 52, chance: 1 }, { type: 'card', id: 'card-wraith', chance: 0.04 }, { type: 'item', id: 'skillbook-second', chance: 0.018 }, { type: 'item', id: 'ember-orb', chance: 0.014 }, { type: 'item', id: 'mp-potion-mid', chance: 0.045 }] },
  { id: 'crystalBear', name: '흑요석 가디언', level: 8, sprite: textureUrls.monsterBear, stats: { hp: 880, mp: 0, atk: 94, def: 42, aspd: 0.75, crit: 0.07, move: 1.48 }, exp: 135, gold: 105, respawnMs: 7600, drops: [{ type: 'gold', amount: 82, chance: 1 }, { type: 'gem', amount: 3, chance: 0.16 }, { type: 'card', id: 'card-crystal-bear', chance: 0.03 }, { type: 'item', id: 'soul-shard', chance: 0.2 }, { type: 'item', id: 'soul-core', chance: 0.018 }] },
  { id: 'fireDrake', name: '화염 드레이크', level: 10, sprite: textureUrls.bossDragon, stats: { hp: 760, mp: 0, atk: 118, def: 30, aspd: 0.82, crit: 0.14, move: 1.62 }, exp: 168, gold: 135, respawnMs: 8200, drops: [{ type: 'gold', amount: 110, chance: 1 }, { type: 'gem', amount: 3, chance: 0.17 }, { type: 'card', id: 'card-fire-drake', chance: 0.027 }, { type: 'item', id: 'abyss-spear', chance: 0.012 }, { type: 'item', id: 'hp-potion-high', chance: 0.025 }] },
  { id: 'stormHarpy', name: '폭풍 하피', level: 12, sprite: textureUrls.monsterWolf, stats: { hp: 700, mp: 0, atk: 110, def: 26, aspd: 1.28, crit: 0.16, move: 2.35 }, exp: 185, gold: 148, respawnMs: 8200, drops: [{ type: 'gold', amount: 120, chance: 1 }, { type: 'card', id: 'card-storm-harpy', chance: 0.026 }, { type: 'item', id: 'enhance-stone', chance: 0.12 }, { type: 'item', id: 'mp-potion-high', chance: 0.022 }] },
  { id: 'graveKnight', name: '묘지 기사', level: 13, sprite: textureUrls.monsterGoblin, stats: { hp: 1120, mp: 0, atk: 132, def: 52, aspd: 0.86, crit: 0.1, move: 1.55 }, exp: 230, gold: 178, respawnMs: 9200, drops: [{ type: 'gold', amount: 145, chance: 1 }, { type: 'card', id: 'card-grave-knight', chance: 0.023 }, { type: 'item', id: 'abyss-armor', chance: 0.011 }, { type: 'item', id: 'skillbook-third', chance: 0.014 }] },
  { id: 'fieldBoss', name: '야전 군주 발타르', level: 16, sprite: textureUrls.monsterBear, stats: { hp: 4200, mp: 0, atk: 205, def: 82, aspd: 0.68, crit: 0.12, move: 1.38 }, exp: 660, gold: 620, respawnMs: 45000, drops: [{ type: 'gold', amount: 420, chance: 1 }, { type: 'gem', amount: 10, chance: 0.45 }, { type: 'card', id: 'card-field-boss', chance: 0.08 }, { type: 'item', id: 'dragon-heart', chance: 0.02 }, { type: 'item', id: 'enhance-stone', chance: 0.5 }, { type: 'item', id: 'boss-trophy', chance: 0.45 }] },
  { id: 'dragon', name: '심연룡 아케론', level: 20, sprite: textureUrls.bossDragon, stats: { hp: 7600, mp: 0, atk: 270, def: 118, aspd: 0.62, crit: 0.16, move: 1.18 }, exp: 980, gold: 980, respawnMs: 60000, drops: [{ type: 'gold', amount: 720, chance: 1 }, { type: 'gem', amount: 18, chance: 0.55 }, { type: 'card', id: 'card-dragon', chance: 0.08 }, { type: 'item', id: 'dragon-slayer', chance: 0.012 }, { type: 'item', id: 'dragon-heart', chance: 0.022 }, { type: 'item', id: 'boss-trophy', chance: 0.72 }] }
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
  { monsterId: 'wolf', x: 12.4, y: 18.4 },
  { monsterId: 'shadowImp', x: 14.2, y: 20.8 },
  { monsterId: 'goblin', x: 18.6, y: 22.8 },
  { monsterId: 'mossGolem', x: 21.2, y: 18.6 },
  { monsterId: 'wraith', x: 23.4, y: 23.2 },
  { monsterId: 'crystalBear', x: 25.0, y: 25.2 },
  { monsterId: 'fireDrake', x: 28.0, y: 20.2 },
  { monsterId: 'stormHarpy', x: 30.0, y: 16.8 },
  { monsterId: 'graveKnight', x: 31.8, y: 23.5 },
  { monsterId: 'fieldBoss', x: 28.5, y: 27.5 },
  { monsterId: 'dragon', x: 32.0, y: 18.8 }
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
