import type { CardDefinition, CardSetDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, StoryQuestDefinition, MonsterDefinition, SoulDefinition, TileId, ZoneDefinition, SkillDefinition } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 17;
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
  { id: 'slime-forest', order: 1, title: '루미나 숲 초입', subtitle: '마을 결계 바깥의 입문 사냥터', description: '입문자용 숲길입니다. 지금부터 몬스터 공격력이 올라가므로 장비 강화와 HP 관리를 익혀야 합니다.', recommendedLevel: 1, monsterIds: ['slime', 'wolf', 'shadowImp'], entry: { x: 7.5, y: 19.4 }, badge: '01' },
  { id: 'crystal-moss', order: 2, title: '청수정 이끼길', subtitle: '수정화된 짐승들이 배회하는 숲길', description: '수정 늑대와 그림자 임프가 빠르게 달려듭니다. +3 이상 장비를 권장합니다.', recommendedLevel: 3, monsterIds: ['wolf', 'shadowImp', 'mossGolem'], entry: { x: 9.2, y: 21.0 }, unlockQuestId: 'story-cleanse-slimes', unlockLevel: 3, badge: '02' },
  { id: 'goblin-road', order: 3, title: '붉은 깃발 폐허로', subtitle: '도적화된 마물 군단의 길목', description: '폐허 검병과 망령 사제가 함께 등장합니다. 물량전이 시작되는 구간입니다.', recommendedLevel: 5, monsterIds: ['goblin', 'wraith', 'wolf'], entry: { x: 8.4, y: 20.4 }, unlockQuestId: 'story-crystal-wolf', unlockLevel: 4, badge: '03' },
  { id: 'black-cave', order: 4, title: '흑요석 동굴', subtitle: '무거운 가디언이 지키는 동굴', description: '흑요석 가디언의 일격이 강합니다. +5 이상 강화와 카드 세팅을 권장합니다.', recommendedLevel: 7, monsterIds: ['crystalBear', 'mossGolem', 'graveKnight'], entry: { x: 9.5, y: 22.2 }, unlockQuestId: 'story-goblin-road', unlockLevel: 6, badge: '04' },
  { id: 'ember-ridge', order: 5, title: '불씨 능선', subtitle: '하늘에서 화염 드레이크가 내려찍는 절벽길', description: '화염 드레이크의 원거리 공격과 폭발 패턴을 조심하세요.', recommendedLevel: 9, monsterIds: ['fireDrake', 'wraith', 'graveKnight'], entry: { x: 12.5, y: 18.8 }, unlockQuestId: 'story-soul-growth', unlockLevel: 8, badge: '05' },
  { id: 'moonlit-grove', order: 6, title: '달빛 고목숲', subtitle: '푸른 혼불이 떠도는 심야 숲', description: '폭풍 하피와 늑대 무리가 빠르게 지원 어그로를 부릅니다.', recommendedLevel: 10, monsterIds: ['stormHarpy', 'wolf', 'goblin', 'mossGolem'], entry: { x: 7.8, y: 20.8 }, unlockQuestId: 'story-crystal-bear', unlockLevel: 10, badge: '06' },
  { id: 'soul-ruins', order: 7, title: '망각의 성소 폐허', subtitle: '오래된 성소가 무너진 전장', description: '망령 사제와 묘지 기사가 몰려옵니다. 광역 스킬과 강화가 중요합니다.', recommendedLevel: 12, monsterIds: ['wraith', 'graveKnight', 'crystalBear'], entry: { x: 8.8, y: 22.0 }, unlockLevel: 12, badge: '07' },
  { id: 'storm-citadel', order: 8, title: '폭풍 감시초소', subtitle: '하피 군단이 점령한 높은 성벽', description: '공격 속도가 빠른 몬스터가 많습니다. 방어구 강화와 회복 스킬을 준비하세요.', recommendedLevel: 14, monsterIds: ['stormHarpy', 'fireDrake', 'graveKnight'], entry: { x: 14.0, y: 16.2 }, unlockLevel: 14, badge: '08' },
  { id: 'dragon-nest', order: 9, title: '용그림자 둥지', subtitle: '잠든 용의 영혼이 새어나오는 협곡', description: '고위험 필드보스 전초 사냥터입니다. +10 이상 장비를 권장합니다.', recommendedLevel: 16, monsterIds: ['fireDrake', 'crystalBear', 'dragon'], entry: { x: 10.4, y: 23.6 }, unlockLevel: 16, badge: '09' },
  { id: 'crystal-raid', order: 10, title: '심연 수정 레이드터', subtitle: '필드보스와 심연룡의 그림자가 출몰하는 제단', description: '자주 출몰하는 필드보스와 드래곤을 상대하는 고위험 지역입니다.', recommendedLevel: 18, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'fireDrake'], entry: { x: 10.8, y: 23.2 }, unlockLevel: 18, badge: '10' }
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
  { id: 'story-cleanse-slimes', chapter: 1, title: '숲 초입의 첫 정화', subtitle: '루미나 숲 초입 개방', npc: '경비대장 로한', dialogue: '약해진 마물도 방심하면 위험합니다. 장비를 강화하며 숲 초입을 정리하세요.', goalText: '숲정령 젤리 8마리 처치', goalType: 'kill', monsterId: 'slime', target: 8, unlockZoneId: 'slime-forest', reward: { gold: 220, gems: 2, itemId: 'soul-shard', itemCount: 2, exp: 110 } },
  { id: 'story-crystal-wolf', chapter: 2, title: '청수정 늑대의 울음', subtitle: '결정화된 영혼의 흔적', npc: '소울 연구가 세린', dialogue: '늑대와 임프가 같은 오염 파동에 반응하고 있어요. 빠른 적에게 대비하세요.', goalText: '청수정 늑대 6마리 처치', goalType: 'kill', monsterId: 'wolf', target: 6, unlockZoneId: 'crystal-moss', reward: { gold: 320, gems: 3, itemId: 'crystal-mail', itemCount: 1, exp: 160 } },
  { id: 'story-imp-shadow', chapter: 2, title: '그림자 임프의 속삭임', subtitle: '첫 전문화 스킬서', npc: '방랑 상인 모루', dialogue: '임프들이 훔친 스킬서를 되찾아오면 두 번째 각인을 열어드리죠.', goalText: '그림자 임프 5마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 5, unlockZoneId: 'crystal-moss', reward: { gold: 360, gems: 4, itemId: 'skillbook-second', itemCount: 1, exp: 190 } },
  { id: 'story-goblin-road', chapter: 3, title: '붉은 깃발 폐허로', subtitle: '폐허로 가는 길', npc: '방랑 상인 모루', dialogue: '폐허 검병들이 길목을 막고 있습니다. 여기서부터는 강화 없이는 오래 버티기 어렵습니다.', goalText: '폐허 검병 6마리 처치', goalType: 'kill', monsterId: 'goblin', target: 6, unlockZoneId: 'goblin-road', reward: { gold: 520, gems: 5, itemId: 'moon-blade', itemCount: 1, exp: 240 } },
  { id: 'story-soul-growth', chapter: 4, title: '소울 코어 공명', subtitle: '성장 튜토리얼', npc: '소울 성소의 엘린', dialogue: '장비 강화와 카드 세트를 맞추면 코어가 더 큰 영혼을 받아들일 수 있습니다.', goalText: '캐릭터 Lv.6 달성', goalType: 'level', target: 6, reward: { gold: 700, gems: 7, itemId: 'fox-charm', itemCount: 1, exp: 260 } },
  { id: 'story-crystal-bear', chapter: 5, title: '흑요석 가디언의 심장', subtitle: '방어 세팅 점검', npc: '경비대장 로한', dialogue: '가디언의 일격은 강력합니다. 방어구와 유물을 강화하고 도전하세요.', goalText: '흑요석 가디언 3마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 3, unlockZoneId: 'black-cave', reward: { gold: 900, gems: 10, itemId: 'enhance-stone', itemCount: 3, exp: 360 } },
  { id: 'story-ember-ridge', chapter: 6, title: '불씨 능선의 포효', subtitle: '낙하형 스킬 훈련', npc: '전투 교관 카엘', dialogue: '하늘에서 떨어지는 마법과 번개를 익히면 몬스터 무리를 제압할 수 있습니다.', goalText: '화염 드레이크 2마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 2, unlockZoneId: 'ember-ridge', reward: { gold: 1200, gems: 12, itemId: 'skillbook-third', itemCount: 1, exp: 460 } },
  { id: 'story-ruin-priest', chapter: 7, title: '망령 사제의 성소', subtitle: '심화 지역 개방', npc: '소울 연구가 세린', dialogue: '망령 사제는 결계를 직접 오염시킵니다. 폐허를 정리하고 필드보스 징조를 확인하세요.', goalText: '망령 사제 5마리 처치', goalType: 'kill', monsterId: 'wraith', target: 5, unlockZoneId: 'soul-ruins', reward: { gold: 1500, gems: 15, itemId: 'soul-core', itemCount: 1, exp: 620 } },
  { id: 'story-field-lord', chapter: 8, title: '야전 군주 발타르', subtitle: '필드보스 첫 조우', npc: '등불지기 리아', dialogue: '발타르가 루미나 결계를 두드리고 있어요. 강화를 충분히 마친 뒤 도전하세요.', goalText: '야전 군주 발타르 1마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 1, unlockZoneId: 'crystal-raid', reward: { gold: 2600, gems: 25, itemId: 'dragon-heart', itemCount: 1, exp: 980 } }
];

export const dailyQuests: DailyQuestDefinition[] = [
  { id: 'daily-cleanse-any', title: '일일 · 결계 주변 정화', description: '숲정령 젤리 12마리 처치', goalType: 'kill', monsterId: 'slime', target: 12, reward: { gold: 260, gems: 2, itemId: 'soul-shard', itemCount: 1 } },
  { id: 'daily-wolf-trace', title: '일일 · 청수정 발톱 회수', description: '청수정 늑대 8마리 처치', goalType: 'kill', monsterId: 'wolf', target: 8, reward: { gold: 340, itemId: 'soul-shard', itemCount: 2 } },
  { id: 'daily-imp-shadow', title: '일일 · 그림자 임프 토벌', description: '그림자 임프 7마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 7, reward: { gold: 420, gems: 3 } },
  { id: 'daily-ruin-road', title: '일일 · 폐허길 확보', description: '폐허 검병 7마리 처치', goalType: 'kill', monsterId: 'goblin', target: 7, reward: { gold: 520, itemId: 'enhance-stone', itemCount: 1 } },
  { id: 'daily-golem-core', title: '일일 · 골렘 코어 회수', description: '이끼 골렘 5마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 5, reward: { gold: 680, gems: 4 } },
  { id: 'daily-field-boss', title: '주간 · 야전 군주 징조', description: '야전 군주 발타르 1마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 1, reward: { gold: 1800, gems: 15, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-grow-soul', title: '일일 · 소울 성장 점검', description: '오늘 캐릭터 레벨 6 이상 달성', goalType: 'level', target: 6, reward: { gold: 450, gems: 4 } }
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
  { id: 'soul-shard', name: '소울 파편', type: 'material', rarity: 'R', effectText: '카드 합성/장비 강화 재료', bonus: {} },
  { id: 'enhance-stone', name: '강화석', type: 'material', rarity: 'SR', effectText: '+10 이후 강화 재료', bonus: {} },
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
  { id: 'slime', name: '숲정령 젤리', level: 1, sprite: textureUrls.monsterSlime, stats: { hp: 115, mp: 0, atk: 18, def: 6, aspd: 0.85, crit: 0.03, move: 1.65 }, exp: 22, gold: 16, respawnMs: 3000, drops: [{ type: 'gold', amount: 12, chance: 1 }, { type: 'card', id: 'card-slime', chance: 0.09 }, { type: 'item', id: 'leather-armor', chance: 0.04 }, { type: 'item', id: 'soul-shard', chance: 0.08 }] },
  { id: 'wolf', name: '청수정 늑대', level: 3, sprite: textureUrls.monsterWolf, stats: { hp: 178, mp: 0, atk: 28, def: 9, aspd: 1.08, crit: 0.08, move: 2.22 }, exp: 40, gold: 28, respawnMs: 3800, drops: [{ type: 'gold', amount: 20, chance: 1 }, { type: 'card', id: 'card-wolf', chance: 0.06 }, { type: 'item', id: 'iron-sword', chance: 0.055 }, { type: 'item', id: 'moon-blade', chance: 0.018 }] },
  { id: 'shadowImp', name: '그림자 임프', level: 4, sprite: textureUrls.monsterGoblin, stats: { hp: 150, mp: 0, atk: 32, def: 7, aspd: 1.16, crit: 0.12, move: 2.05 }, exp: 46, gold: 30, respawnMs: 4100, drops: [{ type: 'gold', amount: 24, chance: 1 }, { type: 'card', id: 'card-shadow-imp', chance: 0.05 }, { type: 'item', id: 'skillbook-basic', chance: 0.018 }] },
  { id: 'goblin', name: '폐허 검병', level: 5, sprite: textureUrls.monsterGoblin, stats: { hp: 242, mp: 0, atk: 39, def: 13, aspd: 0.98, crit: 0.06, move: 1.95 }, exp: 62, gold: 42, respawnMs: 4800, drops: [{ type: 'gold', amount: 32, chance: 1 }, { type: 'gem', amount: 1, chance: 0.13 }, { type: 'card', id: 'card-goblin', chance: 0.055 }, { type: 'item', id: 'rune-staff', chance: 0.032 }, { type: 'item', id: 'crystal-mail', chance: 0.025 }] },
  { id: 'mossGolem', name: '이끼 골렘', level: 6, sprite: textureUrls.monsterBear, stats: { hp: 340, mp: 0, atk: 42, def: 19, aspd: 0.7, crit: 0.04, move: 1.35 }, exp: 82, gold: 58, respawnMs: 5600, drops: [{ type: 'gold', amount: 44, chance: 1 }, { type: 'card', id: 'card-moss-golem', chance: 0.04 }, { type: 'item', id: 'enhance-stone', chance: 0.08 }, { type: 'item', id: 'ruin-plate', chance: 0.018 }] },
  { id: 'wraith', name: '망령 사제', level: 7, sprite: textureUrls.monsterWolf, stats: { hp: 230, mp: 0, atk: 52, def: 12, aspd: 0.92, crit: 0.1, move: 1.7 }, exp: 92, gold: 66, respawnMs: 6100, drops: [{ type: 'gold', amount: 52, chance: 1 }, { type: 'card', id: 'card-wraith', chance: 0.04 }, { type: 'item', id: 'skillbook-second', chance: 0.018 }, { type: 'item', id: 'ember-orb', chance: 0.014 }] },
  { id: 'crystalBear', name: '흑요석 가디언', level: 8, sprite: textureUrls.monsterBear, stats: { hp: 560, mp: 0, atk: 60, def: 28, aspd: 0.75, crit: 0.07, move: 1.48 }, exp: 135, gold: 105, respawnMs: 7600, drops: [{ type: 'gold', amount: 82, chance: 1 }, { type: 'gem', amount: 3, chance: 0.16 }, { type: 'card', id: 'card-crystal-bear', chance: 0.03 }, { type: 'item', id: 'soul-shard', chance: 0.2 }, { type: 'item', id: 'soul-core', chance: 0.018 }] },
  { id: 'fireDrake', name: '화염 드레이크', level: 10, sprite: textureUrls.bossDragon, stats: { hp: 470, mp: 0, atk: 78, def: 20, aspd: 0.82, crit: 0.14, move: 1.62 }, exp: 168, gold: 135, respawnMs: 8200, drops: [{ type: 'gold', amount: 110, chance: 1 }, { type: 'gem', amount: 3, chance: 0.17 }, { type: 'card', id: 'card-fire-drake', chance: 0.027 }, { type: 'item', id: 'abyss-spear', chance: 0.012 }] },
  { id: 'stormHarpy', name: '폭풍 하피', level: 12, sprite: textureUrls.monsterWolf, stats: { hp: 430, mp: 0, atk: 72, def: 18, aspd: 1.28, crit: 0.16, move: 2.35 }, exp: 185, gold: 148, respawnMs: 8200, drops: [{ type: 'gold', amount: 120, chance: 1 }, { type: 'card', id: 'card-storm-harpy', chance: 0.026 }, { type: 'item', id: 'enhance-stone', chance: 0.12 }] },
  { id: 'graveKnight', name: '묘지 기사', level: 13, sprite: textureUrls.monsterGoblin, stats: { hp: 690, mp: 0, atk: 86, def: 34, aspd: 0.86, crit: 0.1, move: 1.55 }, exp: 230, gold: 178, respawnMs: 9200, drops: [{ type: 'gold', amount: 145, chance: 1 }, { type: 'card', id: 'card-grave-knight', chance: 0.023 }, { type: 'item', id: 'abyss-armor', chance: 0.011 }, { type: 'item', id: 'skillbook-third', chance: 0.014 }] },
  { id: 'fieldBoss', name: '야전 군주 발타르', level: 16, sprite: textureUrls.monsterBear, stats: { hp: 2200, mp: 0, atk: 128, def: 52, aspd: 0.68, crit: 0.12, move: 1.38 }, exp: 660, gold: 620, respawnMs: 45000, drops: [{ type: 'gold', amount: 420, chance: 1 }, { type: 'gem', amount: 10, chance: 0.45 }, { type: 'card', id: 'card-field-boss', chance: 0.08 }, { type: 'item', id: 'dragon-heart', chance: 0.02 }, { type: 'item', id: 'enhance-stone', chance: 0.5 }] },
  { id: 'dragon', name: '심연룡 아케론', level: 20, sprite: textureUrls.bossDragon, stats: { hp: 4200, mp: 0, atk: 168, def: 72, aspd: 0.62, crit: 0.16, move: 1.18 }, exp: 980, gold: 980, respawnMs: 60000, drops: [{ type: 'gold', amount: 720, chance: 1 }, { type: 'gem', amount: 18, chance: 0.55 }, { type: 'card', id: 'card-dragon', chance: 0.08 }, { type: 'item', id: 'dragon-slayer', chance: 0.012 }, { type: 'item', id: 'dragon-heart', chance: 0.022 }] }
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
