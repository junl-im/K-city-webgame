import type { CardDefinition, CardSetDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, StoryQuestDefinition, MonsterDefinition, MonsterId, SoulDefinition, TileId, ZoneDefinition, SkillDefinition, DropEntry } from '../types';
import { cardArtUrls, textureUrls } from './assetManifest';

export const SAVE_VERSION = 45;
export const MAP_W = 40;
export const MAP_H = 40;


export const SKILL_MAX_LEVEL = 5;
export const PLEDGE_MAX_LEVEL = 20;

export function pledgeExpToNext(level: number) {
  const safe = Math.max(1, Math.min(PLEDGE_MAX_LEVEL, Math.floor(level || 1)));
  return 420 + safe * safe * 180;
}


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
    { id: 'last-soul-front', order: 28, title: '최후의 소울 전선', subtitle: '루미나 원정대가 도달한 알파 최종 전장', description: '모든 성장 축을 점검하는 장기 반복 전장입니다. 장비 공명, 스킬 숙련, 카드 세트, 영혼 수집을 모두 요구합니다.', recommendedLevel: 68, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'crystalBear'], entry: { x: 34.0, y: 24.0 }, unlockLevel: 68, badge: '28' },
  { id: 'astral-pine-road', order: 29, title: '성운 소나무길', subtitle: '밤하늘 수액이 흐르는 고목 숲길', description: '밤하늘 수액이 흐르는 고목 숲길입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 70, monsterIds: ['wolf', 'wraith', 'stormHarpy', 'mossGolem'], entry: { x: 11.9, y: 23.3 }, unlockLevel: 70, badge: '29' },
  { id: 'silverlake-shore', order: 30, title: '은빛 호수 연안', subtitle: '달빛 호수와 하피 둥지가 만나는 연안', description: '달빛 호수와 하피 둥지가 만나는 연안입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 72, monsterIds: ['stormHarpy', 'wolf', 'wraith', 'fireDrake'], entry: { x: 15.0, y: 26.0 }, unlockLevel: 72, badge: '30' },
  { id: 'ruby-canyon', order: 31, title: '홍련 협곡', subtitle: '붉은 광맥과 드레이크의 둥지가 뒤엉킨 협곡', description: '붉은 광맥과 드레이크의 둥지가 뒤엉킨 협곡입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 74, monsterIds: ['fireDrake', 'crystalBear', 'graveKnight', 'fieldBoss'], entry: { x: 18.1, y: 28.7 }, unlockLevel: 74, badge: '31' },
  { id: 'phantom-opera', order: 32, title: '환영 오페라 극장', subtitle: '망령 사제의 노래가 전장을 비트는 유적 극장', description: '망령 사제의 노래가 전장을 비트는 유적 극장입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 76, monsterIds: ['wraith', 'graveKnight', 'shadowImp', 'stormHarpy'], entry: { x: 21.2, y: 17.4 }, unlockLevel: 76, badge: '32' },
  { id: 'clockwork-ruin', order: 33, title: '시계장치 폐허', subtitle: '고대 기계와 가디언이 남은 왕국 잔해', description: '고대 기계와 가디언이 남은 왕국 잔해입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 78, monsterIds: ['crystalBear', 'mossGolem', 'graveKnight', 'fieldBoss'], entry: { x: 24.3, y: 20.1 }, unlockLevel: 78, badge: '33' },
  { id: 'sunken-library', order: 34, title: '침몰한 도서관', subtitle: '수몰된 마법서가 드래곤의 숨결에 불타는 곳', description: '수몰된 마법서가 드래곤의 숨결에 불타는 곳입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 80, monsterIds: ['wraith', 'dragon', 'fireDrake', 'mossGolem'], entry: { x: 27.4, y: 22.8 }, unlockLevel: 80, badge: '34' },
  { id: 'scarlet-battlefield', order: 35, title: '진홍 전장', subtitle: '야전 군주가 반복 출몰하는 장기 토벌 전선', description: '야전 군주가 반복 출몰하는 장기 토벌 전선입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 82, monsterIds: ['fieldBoss', 'graveKnight', 'goblin', 'fireDrake'], entry: { x: 30.5, y: 25.5 }, unlockLevel: 82, badge: '35' },
  { id: 'mirror-ice-cavern', order: 36, title: '거울얼음 동굴', subtitle: '얼음 결정에 몬스터의 분신이 비치는 동굴', description: '얼음 결정에 몬스터의 분신이 비치는 동굴입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 84, monsterIds: ['crystalBear', 'wolf', 'wraith', 'dragon'], entry: { x: 33.6, y: 28.2 }, unlockLevel: 84, badge: '36' },
  { id: 'void-orchid-garden', order: 37, title: '공허 난초 정원', subtitle: '공허꽃과 그림자 임프가 넘치는 정원', description: '공허꽃과 그림자 임프가 넘치는 정원입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 86, monsterIds: ['shadowImp', 'wraith', 'stormHarpy', 'mossGolem'], entry: { x: 8.7, y: 16.9 }, unlockLevel: 86, badge: '37' },
  { id: 'sky-whale-port', order: 38, title: '천공 고래 항구', subtitle: '공중 부유선과 하피 군단의 항구', description: '공중 부유선과 하피 군단의 항구입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 88, monsterIds: ['stormHarpy', 'fireDrake', 'dragon', 'fieldBoss'], entry: { x: 11.8, y: 19.6 }, unlockLevel: 88, badge: '38' },
  { id: 'golden-archive', order: 39, title: '황금 기록보관소', subtitle: '잊힌 왕국의 금서와 보물 수호자', description: '잊힌 왕국의 금서와 보물 수호자입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 90, monsterIds: ['graveKnight', 'crystalBear', 'wraith', 'fieldBoss'], entry: { x: 14.9, y: 22.3 }, unlockLevel: 90, badge: '39' },
  { id: 'ash-rain-shrine', order: 40, title: '잿비 사당', subtitle: '붉은 재와 성소 룬이 떨어지는 신전', description: '붉은 재와 성소 룬이 떨어지는 신전입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 92, monsterIds: ['fireDrake', 'wraith', 'graveKnight', 'dragon'], entry: { x: 18.0, y: 25.0 }, unlockLevel: 92, badge: '40' },
  { id: 'nightmare-circus', order: 41, title: '악몽 서커스', subtitle: '현실이 뒤틀린 몽환 사냥터', description: '현실이 뒤틀린 몽환 사냥터입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 94, monsterIds: ['shadowImp', 'goblin', 'stormHarpy', 'fieldBoss'], entry: { x: 21.1, y: 27.7 }, unlockLevel: 94, badge: '41' },
  { id: 'obsidian-railway', order: 42, title: '흑요석 철도', subtitle: '검은 광산을 가로지르는 고대 수송로', description: '검은 광산을 가로지르는 고대 수송로입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 96, monsterIds: ['crystalBear', 'mossGolem', 'graveKnight', 'fieldBoss'], entry: { x: 24.2, y: 16.4 }, unlockLevel: 96, badge: '42' },
  { id: 'dragonbone-desert', order: 43, title: '용골 사막', subtitle: '용의 뼈가 능선처럼 솟은 사막 전장', description: '용의 뼈가 능선처럼 솟은 사막 전장입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 98, monsterIds: ['dragon', 'fireDrake', 'graveKnight', 'fieldBoss'], entry: { x: 27.3, y: 19.1 }, unlockLevel: 98, badge: '43' },
  { id: 'aurora-monastery', order: 44, title: '오로라 수도원', subtitle: '빛과 어둠이 갈라지는 최상급 수도원', description: '빛과 어둠이 갈라지는 최상급 수도원입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 100, monsterIds: ['wraith', 'graveKnight', 'dragon', 'crystalBear'], entry: { x: 30.4, y: 21.8 }, unlockLevel: 100, badge: '44' },
  { id: 'lost-royal-garden', order: 45, title: '잃어버린 왕가 정원', subtitle: '왕가의 정원이 괴물 군락으로 변한 곳', description: '왕가의 정원이 괴물 군락으로 변한 곳입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 102, monsterIds: ['wolf', 'mossGolem', 'stormHarpy', 'fieldBoss'], entry: { x: 33.5, y: 24.5 }, unlockLevel: 102, badge: '45' },
  { id: 'red-moon-keep', order: 46, title: '적월 성채', subtitle: '붉은 달 아래 최상위 보스군이 주둔한 요새', description: '붉은 달 아래 최상위 보스군이 주둔한 요새입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 104, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'fireDrake'], entry: { x: 8.6, y: 27.2 }, unlockLevel: 104, badge: '46' },
  { id: 'abyssal-throne', order: 47, title: '심연왕좌 입구', subtitle: '아케론의 진짜 둥지로 향하는 입구', description: '아케론의 진짜 둥지로 향하는 입구입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 108, monsterIds: ['dragon', 'fieldBoss', 'fireDrake', 'wraith'], entry: { x: 11.7, y: 15.9 }, unlockLevel: 108, badge: '47' },
  { id: 'genesis-rift', order: 48, title: '창세 균열', subtitle: '알파 최종 반복 파밍을 위한 초월 전선', description: '알파 최종 반복 파밍을 위한 초월 전선입니다. 장비 공명, 스킬 숙련, 카드 세트, 자동전술을 모두 점검하는 장기 콘텐츠 구간입니다.', recommendedLevel: 112, monsterIds: ['dragon', 'fieldBoss', 'graveKnight', 'crystalBear'], entry: { x: 14.8, y: 18.6 }, unlockLevel: 112, badge: '48' }
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
  { id: 'set-boss-oath', name: '심연 군주의 서약', requiredCardIds: ['card-field-boss', 'card-dragon'], effectText: 'HP +220, 공격 +30, 방어 +16', bonus: { hp: 220, atk: 30, def: 16 } },
  { id: 'set-endless-frontier', name: '끝없는 전선', requiredCardIds: ['card-storm-harpy', 'card-fire-drake', 'card-grave-knight', 'card-field-boss'], effectText: '공격 +34, 공속 +10%, 이동속도 +0.18', bonus: { atk: 34, aspd: 0.10, move: 0.18 } },
  { id: 'set-abyss-king', name: '심연왕의 징표', requiredCardIds: ['card-dragon', 'card-field-boss', 'card-crystal-bear'], effectText: 'HP +360, 공격 +42, 치명 +7%', bonus: { hp: 360, atk: 42, crit: 0.07 } }
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
  { id: 'story-lumina-endless-oath', chapter: 31, title: '끝나지 않는 루미나의 서약', subtitle: '반복 성장 개방', npc: '등불지기 리아', dialogue: '이제부터는 매일 다른 의뢰와 전선 토벌로 루미나를 지켜 주세요. 콘텐츠는 계속 확장됩니다.', goalText: '캐릭터 Lv.72 달성', goalType: 'level', target: 72, unlockZoneId: 'last-soul-front', reward: { gold: 230000, gems: 900, itemId: 'dragon-slayer', itemCount: 1, exp: 150000 } },
  { id: 'story-049-astral-pine-road-entry', chapter: 33, title: '성운 소나무길 개방', subtitle: '밤하늘 수액이 흐르는 고목 숲길', npc: '루미나 전략관 이리스', dialogue: '성운 소나무길에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.70 달성', goalType: 'level', target: 70, unlockZoneId: 'astral-pine-road', reward: { gold: 85000, gems: 360, itemId: 'lumina-seal', itemCount: 2, exp: 42000 } },
  { id: 'story-049-astral-pine-road-hunt', chapter: 33, title: '성운 소나무길 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '청수정 늑대 누적 85마리 처치', goalType: 'kill', monsterId: 'wolf', target: 85, unlockZoneId: 'astral-pine-road', reward: { gold: 92000, gems: 380, itemId: 'enhance-stone', itemCount: 4, exp: 47000 } },
  { id: 'story-049-astral-pine-road-boss', chapter: 33, title: '성운 소나무길 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '폭풍 하피 누적 65마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 65, unlockZoneId: 'astral-pine-road', reward: { gold: 98000, gems: 410, itemId: 'boss-trophy', itemCount: 1, exp: 52000 } },
  { id: 'story-049-silverlake-shore-entry', chapter: 34, title: '은빛 호수 연안 개방', subtitle: '달빛 호수와 하피 둥지가 만나는 연안', npc: '루미나 전략관 이리스', dialogue: '은빛 호수 연안에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.72 달성', goalType: 'level', target: 72, unlockZoneId: 'silverlake-shore', reward: { gold: 90200, gems: 378, itemId: 'lumina-seal', itemCount: 3, exp: 45800 } },
  { id: 'story-049-silverlake-shore-hunt', chapter: 34, title: '은빛 호수 연안 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '청수정 늑대 누적 91마리 처치', goalType: 'kill', monsterId: 'wolf', target: 91, unlockZoneId: 'silverlake-shore', reward: { gold: 97900, gems: 401, itemId: 'enhance-stone', itemCount: 5, exp: 51100 } },
  { id: 'story-049-silverlake-shore-boss', chapter: 34, title: '은빛 호수 연안 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '화염 드레이크 누적 70마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 70, unlockZoneId: 'silverlake-shore', reward: { gold: 104400, gems: 435, itemId: 'boss-trophy', itemCount: 2, exp: 56500 } },
  { id: 'story-049-ruby-canyon-entry', chapter: 35, title: '홍련 협곡 개방', subtitle: '붉은 광맥과 드레이크의 둥지가 뒤엉킨 협곡', npc: '루미나 전략관 이리스', dialogue: '홍련 협곡에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.74 달성', goalType: 'level', target: 74, unlockZoneId: 'ruby-canyon', reward: { gold: 95400, gems: 396, itemId: 'lumina-seal', itemCount: 4, exp: 49600 } },
  { id: 'story-049-ruby-canyon-hunt', chapter: 35, title: '홍련 협곡 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '묘지 기사 누적 97마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 97, unlockZoneId: 'ruby-canyon', reward: { gold: 103800, gems: 422, itemId: 'enhance-stone', itemCount: 6, exp: 55200 } },
  { id: 'story-049-ruby-canyon-boss', chapter: 35, title: '홍련 협곡 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '화염 드레이크 누적 75마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 75, unlockZoneId: 'ruby-canyon', reward: { gold: 110800, gems: 460, itemId: 'boss-trophy', itemCount: 3, exp: 61000 } },
  { id: 'story-049-phantom-opera-entry', chapter: 36, title: '환영 오페라 극장 개방', subtitle: '망령 사제의 노래가 전장을 비트는 유적 극장', npc: '루미나 전략관 이리스', dialogue: '환영 오페라 극장에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.76 달성', goalType: 'level', target: 76, unlockZoneId: 'phantom-opera', reward: { gold: 100600, gems: 414, itemId: 'lumina-seal', itemCount: 2, exp: 53400 } },
  { id: 'story-049-phantom-opera-hunt', chapter: 36, title: '환영 오페라 극장 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '폭풍 하피 누적 103마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 103, unlockZoneId: 'phantom-opera', reward: { gold: 109700, gems: 443, itemId: 'enhance-stone', itemCount: 7, exp: 59300 } },
  { id: 'story-049-phantom-opera-boss', chapter: 36, title: '환영 오페라 극장 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '묘지 기사 누적 80마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 80, unlockZoneId: 'phantom-opera', reward: { gold: 117200, gems: 485, itemId: 'boss-trophy', itemCount: 1, exp: 65500 } },
  { id: 'story-049-clockwork-ruin-entry', chapter: 37, title: '시계장치 폐허 개방', subtitle: '고대 기계와 가디언이 남은 왕국 잔해', npc: '루미나 전략관 이리스', dialogue: '시계장치 폐허에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.78 달성', goalType: 'level', target: 78, unlockZoneId: 'clockwork-ruin', reward: { gold: 105800, gems: 432, itemId: 'lumina-seal', itemCount: 3, exp: 57200 } },
  { id: 'story-049-clockwork-ruin-hunt', chapter: 37, title: '시계장치 폐허 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '흑요석 가디언 누적 109마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 109, unlockZoneId: 'clockwork-ruin', reward: { gold: 115600, gems: 464, itemId: 'enhance-stone', itemCount: 8, exp: 63400 } },
  { id: 'story-049-clockwork-ruin-boss', chapter: 37, title: '시계장치 폐허 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '묘지 기사 누적 85마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 85, unlockZoneId: 'clockwork-ruin', reward: { gold: 123600, gems: 510, itemId: 'boss-trophy', itemCount: 2, exp: 70000 } },
  { id: 'story-049-sunken-library-entry', chapter: 38, title: '침몰한 도서관 개방', subtitle: '수몰된 마법서가 드래곤의 숨결에 불타는 곳', npc: '루미나 전략관 이리스', dialogue: '침몰한 도서관에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.80 달성', goalType: 'level', target: 80, unlockZoneId: 'sunken-library', reward: { gold: 111000, gems: 450, itemId: 'lumina-seal', itemCount: 4, exp: 61000 } },
  { id: 'story-049-sunken-library-hunt', chapter: 38, title: '침몰한 도서관 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '심연룡 아케론 누적 26마리 처치', goalType: 'kill', monsterId: 'dragon', target: 26, unlockZoneId: 'sunken-library', reward: { gold: 121500, gems: 485, itemId: 'enhance-stone', itemCount: 4, exp: 67500 } },
  { id: 'story-049-sunken-library-boss', chapter: 38, title: '침몰한 도서관 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '이끼 골렘 누적 90마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 90, unlockZoneId: 'sunken-library', reward: { gold: 130000, gems: 535, itemId: 'boss-trophy', itemCount: 3, exp: 74500 } },
  { id: 'story-049-scarlet-battlefield-entry', chapter: 39, title: '진홍 전장 개방', subtitle: '야전 군주가 반복 출몰하는 장기 토벌 전선', npc: '루미나 전략관 이리스', dialogue: '진홍 전장에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.82 달성', goalType: 'level', target: 82, unlockZoneId: 'scarlet-battlefield', reward: { gold: 116200, gems: 468, itemId: 'lumina-seal', itemCount: 2, exp: 64800 } },
  { id: 'story-049-scarlet-battlefield-hunt', chapter: 39, title: '진홍 전장 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '폐허 검병 누적 121마리 처치', goalType: 'kill', monsterId: 'goblin', target: 121, unlockZoneId: 'scarlet-battlefield', reward: { gold: 127400, gems: 506, itemId: 'enhance-stone', itemCount: 5, exp: 71600 } },
  { id: 'story-049-scarlet-battlefield-boss', chapter: 39, title: '진홍 전장 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 30마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 30, unlockZoneId: 'scarlet-battlefield', reward: { gold: 136400, gems: 560, itemId: 'boss-trophy', itemCount: 1, exp: 79000 } },
  { id: 'story-049-mirror-ice-cavern-entry', chapter: 40, title: '거울얼음 동굴 개방', subtitle: '얼음 결정에 몬스터의 분신이 비치는 동굴', npc: '루미나 전략관 이리스', dialogue: '거울얼음 동굴에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.84 달성', goalType: 'level', target: 84, unlockZoneId: 'mirror-ice-cavern', reward: { gold: 121400, gems: 486, itemId: 'lumina-seal', itemCount: 3, exp: 68600 } },
  { id: 'story-049-mirror-ice-cavern-hunt', chapter: 40, title: '거울얼음 동굴 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '심연룡 아케론 누적 30마리 처치', goalType: 'kill', monsterId: 'dragon', target: 30, unlockZoneId: 'mirror-ice-cavern', reward: { gold: 133300, gems: 527, itemId: 'radiant-ore', itemCount: 6, exp: 75700 } },
  { id: 'story-049-mirror-ice-cavern-boss', chapter: 40, title: '거울얼음 동굴 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '청수정 늑대 누적 100마리 처치', goalType: 'kill', monsterId: 'wolf', target: 100, unlockZoneId: 'mirror-ice-cavern', reward: { gold: 142800, gems: 585, itemId: 'boss-trophy', itemCount: 2, exp: 83500 } },
  { id: 'story-049-void-orchid-garden-entry', chapter: 41, title: '공허 난초 정원 개방', subtitle: '공허꽃과 그림자 임프가 넘치는 정원', npc: '루미나 전략관 이리스', dialogue: '공허 난초 정원에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.86 달성', goalType: 'level', target: 86, unlockZoneId: 'void-orchid-garden', reward: { gold: 126600, gems: 504, itemId: 'lumina-seal', itemCount: 4, exp: 72400 } },
  { id: 'story-049-void-orchid-garden-hunt', chapter: 41, title: '공허 난초 정원 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '그림자 임프 누적 133마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 133, unlockZoneId: 'void-orchid-garden', reward: { gold: 139200, gems: 548, itemId: 'radiant-ore', itemCount: 7, exp: 79800 } },
  { id: 'story-049-void-orchid-garden-boss', chapter: 41, title: '공허 난초 정원 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '폭풍 하피 누적 105마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 105, unlockZoneId: 'void-orchid-garden', reward: { gold: 149200, gems: 610, itemId: 'boss-trophy', itemCount: 3, exp: 88000 } },
  { id: 'story-049-sky-whale-port-entry', chapter: 42, title: '천공 고래 항구 개방', subtitle: '공중 부유선과 하피 군단의 항구', npc: '루미나 전략관 이리스', dialogue: '천공 고래 항구에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.88 달성', goalType: 'level', target: 88, unlockZoneId: 'sky-whale-port', reward: { gold: 131800, gems: 522, itemId: 'lumina-seal', itemCount: 2, exp: 76200 } },
  { id: 'story-049-sky-whale-port-hunt', chapter: 42, title: '천공 고래 항구 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '화염 드레이크 누적 139마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 139, unlockZoneId: 'sky-whale-port', reward: { gold: 145100, gems: 569, itemId: 'radiant-ore', itemCount: 8, exp: 83900 } },
  { id: 'story-049-sky-whale-port-boss', chapter: 42, title: '천공 고래 항구 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 36마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 36, unlockZoneId: 'sky-whale-port', reward: { gold: 155600, gems: 635, itemId: 'boss-trophy', itemCount: 1, exp: 92500 } },
  { id: 'story-049-golden-archive-entry', chapter: 43, title: '황금 기록보관소 개방', subtitle: '잊힌 왕국의 금서와 보물 수호자', npc: '루미나 전략관 이리스', dialogue: '황금 기록보관소에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.90 달성', goalType: 'level', target: 90, unlockZoneId: 'golden-archive', reward: { gold: 137000, gems: 540, itemId: 'lumina-seal', itemCount: 3, exp: 80000 } },
  { id: 'story-049-golden-archive-hunt', chapter: 43, title: '황금 기록보관소 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '망령 사제 누적 145마리 처치', goalType: 'kill', monsterId: 'wraith', target: 145, unlockZoneId: 'golden-archive', reward: { gold: 151000, gems: 590, itemId: 'radiant-ore', itemCount: 4, exp: 88000 } },
  { id: 'story-049-golden-archive-boss', chapter: 43, title: '황금 기록보관소 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '묘지 기사 누적 115마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 115, unlockZoneId: 'golden-archive', reward: { gold: 162000, gems: 660, itemId: 'boss-trophy', itemCount: 2, exp: 97000 } },
  { id: 'story-049-ash-rain-shrine-entry', chapter: 44, title: '잿비 사당 개방', subtitle: '붉은 재와 성소 룬이 떨어지는 신전', npc: '루미나 전략관 이리스', dialogue: '잿비 사당에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.92 달성', goalType: 'level', target: 92, unlockZoneId: 'ash-rain-shrine', reward: { gold: 142200, gems: 558, itemId: 'lumina-seal', itemCount: 4, exp: 83800 } },
  { id: 'story-049-ash-rain-shrine-hunt', chapter: 44, title: '잿비 사당 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '심연룡 아케론 누적 38마리 처치', goalType: 'kill', monsterId: 'dragon', target: 38, unlockZoneId: 'ash-rain-shrine', reward: { gold: 156900, gems: 611, itemId: 'radiant-ore', itemCount: 5, exp: 92100 } },
  { id: 'story-049-ash-rain-shrine-boss', chapter: 44, title: '잿비 사당 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '망령 사제 누적 120마리 처치', goalType: 'kill', monsterId: 'wraith', target: 120, unlockZoneId: 'ash-rain-shrine', reward: { gold: 168400, gems: 685, itemId: 'boss-trophy', itemCount: 3, exp: 101500 } },
  { id: 'story-049-nightmare-circus-entry', chapter: 45, title: '악몽 서커스 개방', subtitle: '현실이 뒤틀린 몽환 사냥터', npc: '루미나 전략관 이리스', dialogue: '악몽 서커스에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.94 달성', goalType: 'level', target: 94, unlockZoneId: 'nightmare-circus', reward: { gold: 147400, gems: 576, itemId: 'lumina-seal', itemCount: 2, exp: 87600 } },
  { id: 'story-049-nightmare-circus-hunt', chapter: 45, title: '악몽 서커스 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '그림자 임프 누적 157마리 처치', goalType: 'kill', monsterId: 'shadowImp', target: 157, unlockZoneId: 'nightmare-circus', reward: { gold: 162800, gems: 632, itemId: 'radiant-ore', itemCount: 6, exp: 96200 } },
  { id: 'story-049-nightmare-circus-boss', chapter: 45, title: '악몽 서커스 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '폭풍 하피 누적 125마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 125, unlockZoneId: 'nightmare-circus', reward: { gold: 174800, gems: 710, itemId: 'boss-trophy', itemCount: 1, exp: 106000 } },
  { id: 'story-049-obsidian-railway-entry', chapter: 46, title: '흑요석 철도 개방', subtitle: '검은 광산을 가로지르는 고대 수송로', npc: '루미나 전략관 이리스', dialogue: '흑요석 철도에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.96 달성', goalType: 'level', target: 96, unlockZoneId: 'obsidian-railway', reward: { gold: 152600, gems: 594, itemId: 'lumina-seal', itemCount: 3, exp: 91400 } },
  { id: 'story-049-obsidian-railway-hunt', chapter: 46, title: '흑요석 철도 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '이끼 골렘 누적 163마리 처치', goalType: 'kill', monsterId: 'mossGolem', target: 163, unlockZoneId: 'obsidian-railway', reward: { gold: 168700, gems: 653, itemId: 'radiant-ore', itemCount: 7, exp: 100300 } },
  { id: 'story-049-obsidian-railway-boss', chapter: 46, title: '흑요석 철도 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 44마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 44, unlockZoneId: 'obsidian-railway', reward: { gold: 181200, gems: 735, itemId: 'boss-trophy', itemCount: 2, exp: 110500 } },
  { id: 'story-049-dragonbone-desert-entry', chapter: 47, title: '용골 사막 개방', subtitle: '용의 뼈가 능선처럼 솟은 사막 전장', npc: '루미나 전략관 이리스', dialogue: '용골 사막에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.98 달성', goalType: 'level', target: 98, unlockZoneId: 'dragonbone-desert', reward: { gold: 157800, gems: 612, itemId: 'lumina-seal', itemCount: 4, exp: 95200 } },
  { id: 'story-049-dragonbone-desert-hunt', chapter: 47, title: '용골 사막 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '묘지 기사 누적 169마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 169, unlockZoneId: 'dragonbone-desert', reward: { gold: 174600, gems: 674, itemId: 'radiant-ore', itemCount: 8, exp: 104400 } },
  { id: 'story-049-dragonbone-desert-boss', chapter: 47, title: '용골 사막 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '심연룡 아케론 누적 46마리 처치', goalType: 'kill', monsterId: 'dragon', target: 46, unlockZoneId: 'dragonbone-desert', reward: { gold: 187600, gems: 760, itemId: 'boss-trophy', itemCount: 3, exp: 115000 } },
  { id: 'story-049-aurora-monastery-entry', chapter: 48, title: '오로라 수도원 개방', subtitle: '빛과 어둠이 갈라지는 최상급 수도원', npc: '루미나 전략관 이리스', dialogue: '오로라 수도원에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.100 달성', goalType: 'level', target: 100, unlockZoneId: 'aurora-monastery', reward: { gold: 163000, gems: 630, itemId: 'lumina-seal', itemCount: 2, exp: 99000 } },
  { id: 'story-049-aurora-monastery-hunt', chapter: 48, title: '오로라 수도원 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '흑요석 가디언 누적 175마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 175, unlockZoneId: 'aurora-monastery', reward: { gold: 180500, gems: 695, itemId: 'radiant-ore', itemCount: 4, exp: 108500 } },
  { id: 'story-049-aurora-monastery-boss', chapter: 48, title: '오로라 수도원 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '묘지 기사 누적 140마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 140, unlockZoneId: 'aurora-monastery', reward: { gold: 194000, gems: 785, itemId: 'mythic-map', itemCount: 1, exp: 119500 } },
  { id: 'story-049-lost-royal-garden-entry', chapter: 49, title: '잃어버린 왕가 정원 개방', subtitle: '왕가의 정원이 괴물 군락으로 변한 곳', npc: '루미나 전략관 이리스', dialogue: '잃어버린 왕가 정원에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.102 달성', goalType: 'level', target: 102, unlockZoneId: 'lost-royal-garden', reward: { gold: 168200, gems: 648, itemId: 'lumina-seal', itemCount: 3, exp: 102800 } },
  { id: 'story-049-lost-royal-garden-hunt', chapter: 49, title: '잃어버린 왕가 정원 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '청수정 늑대 누적 181마리 처치', goalType: 'kill', monsterId: 'wolf', target: 181, unlockZoneId: 'lost-royal-garden', reward: { gold: 186400, gems: 716, itemId: 'radiant-ore', itemCount: 5, exp: 112600 } },
  { id: 'story-049-lost-royal-garden-boss', chapter: 49, title: '잃어버린 왕가 정원 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '폭풍 하피 누적 145마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 145, unlockZoneId: 'lost-royal-garden', reward: { gold: 200400, gems: 810, itemId: 'mythic-map', itemCount: 2, exp: 124000 } },
  { id: 'story-049-red-moon-keep-entry', chapter: 50, title: '적월 성채 개방', subtitle: '붉은 달 아래 최상위 보스군이 주둔한 요새', npc: '루미나 전략관 이리스', dialogue: '적월 성채에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.104 달성', goalType: 'level', target: 104, unlockZoneId: 'red-moon-keep', reward: { gold: 173400, gems: 666, itemId: 'lumina-seal', itemCount: 4, exp: 106600 } },
  { id: 'story-049-red-moon-keep-hunt', chapter: 50, title: '적월 성채 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '심연룡 아케론 누적 50마리 처치', goalType: 'kill', monsterId: 'dragon', target: 50, unlockZoneId: 'red-moon-keep', reward: { gold: 192300, gems: 737, itemId: 'radiant-ore', itemCount: 6, exp: 116700 } },
  { id: 'story-049-red-moon-keep-boss', chapter: 50, title: '적월 성채 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '화염 드레이크 누적 150마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 150, unlockZoneId: 'red-moon-keep', reward: { gold: 206800, gems: 835, itemId: 'mythic-map', itemCount: 3, exp: 128500 } },
  { id: 'story-049-abyssal-throne-entry', chapter: 51, title: '심연왕좌 입구 개방', subtitle: '아케론의 진짜 둥지로 향하는 입구', npc: '루미나 전략관 이리스', dialogue: '심연왕좌 입구에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.108 달성', goalType: 'level', target: 108, unlockZoneId: 'abyssal-throne', reward: { gold: 178600, gems: 684, itemId: 'lumina-seal', itemCount: 2, exp: 110400 } },
  { id: 'story-049-abyssal-throne-hunt', chapter: 51, title: '심연왕좌 입구 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '화염 드레이크 누적 193마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 193, unlockZoneId: 'abyssal-throne', reward: { gold: 198200, gems: 758, itemId: 'radiant-ore', itemCount: 7, exp: 120800 } },
  { id: 'story-049-abyssal-throne-boss', chapter: 51, title: '심연왕좌 입구 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '심연룡 아케론 누적 54마리 처치', goalType: 'kill', monsterId: 'dragon', target: 54, unlockZoneId: 'abyssal-throne', reward: { gold: 213200, gems: 860, itemId: 'mythic-map', itemCount: 1, exp: 133000 } },
  { id: 'story-049-genesis-rift-entry', chapter: 52, title: '창세 균열 개방', subtitle: '알파 최종 반복 파밍을 위한 초월 전선', npc: '루미나 전략관 이리스', dialogue: '창세 균열에 도착했습니다. 새로운 전선 기록을 시작하세요.', goalText: '캐릭터 Lv.112 달성', goalType: 'level', target: 112, unlockZoneId: 'genesis-rift', reward: { gold: 183800, gems: 702, itemId: 'lumina-seal', itemCount: 3, exp: 114200 } },
  { id: 'story-049-genesis-rift-hunt', chapter: 52, title: '창세 균열 장기 토벌', subtitle: '전선 안정화', npc: '전투 교관 카엘', dialogue: '이 전선은 한 번 밀어내는 것으로 끝나지 않습니다. 오래 버티는 자가 진짜 영웅입니다.', goalText: '흑요석 가디언 누적 199마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 199, unlockZoneId: 'genesis-rift', reward: { gold: 204100, gems: 779, itemId: 'radiant-ore', itemCount: 8, exp: 124900 } },
  { id: 'story-049-genesis-rift-boss', chapter: 52, title: '창세 균열 결전 기록', subtitle: '보스/정예 반복 토벌', npc: '경비대장 로한', dialogue: '보스 토벌 기록을 남겨야 원정대가 다음 진지를 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 56마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 56, unlockZoneId: 'genesis-rift', reward: { gold: 219600, gems: 885, itemId: 'mythic-map', itemCount: 2, exp: 137500 } },
  { id: 'story-049-genesis-repeat', chapter: 60, title: '창세 균열 반복 작전', subtitle: '초월 전선 장기 목표', npc: '루미나 전략관 이리스', dialogue: '이제부터는 끝없는 작전입니다. 매일 강해지고, 매일 더 깊게 들어가세요.', goalText: '심연룡 아케론 누적 120마리 처치', goalType: 'kill', monsterId: 'dragon', target: 120, unlockZoneId: 'genesis-rift', reward: { gold: 260000, gems: 1200, itemId: 'mythic-map', itemCount: 5, exp: 180000 } }
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
  { id: 'daily-dragon-marathon-6', title: '주간급 · 심연룡 장기 추적 6', description: '심연룡 아케론 40마리 처치', goalType: 'kill', monsterId: 'dragon', target: 40, reward: { gold: 288000, gems: 400, itemId: 'dragon-heart', itemCount: 6 } },
  { id: 'daily-049-astral-pine-road-sweep', title: '순환 · 성운 소나무길 정리', description: '성운 소나무길에서 청수정 늑대 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'wolf', target: 60, reward: { gold: 26000, gems: 90, itemId: 'lumina-seal', itemCount: 1 } },
  { id: 'daily-049-astral-pine-road-long', title: '장기 · 성운 소나무길 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 70, reward: { gold: 18000, gems: 70, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-049-silverlake-shore-sweep', title: '순환 · 은빛 호수 연안 정리', description: '은빛 호수 연안에서 청수정 늑대 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'wolf', target: 64, reward: { gold: 28300, gems: 96, itemId: 'lumina-seal', itemCount: 2 } },
  { id: 'daily-049-silverlake-shore-long', title: '장기 · 은빛 호수 연안 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 72, reward: { gold: 19800, gems: 74, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-049-ruby-canyon-sweep', title: '순환 · 홍련 협곡 정리', description: '홍련 협곡에서 묘지 기사 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'graveKnight', target: 68, reward: { gold: 30600, gems: 102, itemId: 'lumina-seal', itemCount: 3 } },
  { id: 'daily-049-ruby-canyon-long', title: '장기 · 홍련 협곡 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 74, reward: { gold: 21600, gems: 78, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-049-phantom-opera-sweep', title: '순환 · 환영 오페라 극장 정리', description: '환영 오페라 극장에서 폭풍 하피 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'stormHarpy', target: 72, reward: { gold: 32900, gems: 108, itemId: 'lumina-seal', itemCount: 1 } },
  { id: 'daily-049-phantom-opera-long', title: '장기 · 환영 오페라 극장 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 76, reward: { gold: 23400, gems: 82, itemId: 'enhance-stone', itemCount: 8 } },
  { id: 'daily-049-clockwork-ruin-sweep', title: '순환 · 시계장치 폐허 정리', description: '시계장치 폐허에서 흑요석 가디언 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'crystalBear', target: 76, reward: { gold: 35200, gems: 114, itemId: 'lumina-seal', itemCount: 2 } },
  { id: 'daily-049-clockwork-ruin-long', title: '장기 · 시계장치 폐허 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 78, reward: { gold: 25200, gems: 86, itemId: 'enhance-stone', itemCount: 9 } },
  { id: 'daily-049-sunken-library-sweep', title: '순환 · 침몰한 도서관 정리', description: '침몰한 도서관에서 심연룡 아케론 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'dragon', target: 13, reward: { gold: 37500, gems: 120, itemId: 'lumina-seal', itemCount: 3 } },
  { id: 'daily-049-sunken-library-long', title: '장기 · 침몰한 도서관 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 80, reward: { gold: 27000, gems: 90, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-049-scarlet-battlefield-sweep', title: '순환 · 진홍 전장 정리', description: '진홍 전장에서 폐허 검병 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'goblin', target: 84, reward: { gold: 39800, gems: 126, itemId: 'lumina-seal', itemCount: 1 } },
  { id: 'daily-049-scarlet-battlefield-long', title: '장기 · 진홍 전장 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 82, reward: { gold: 28800, gems: 94, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-049-mirror-ice-cavern-sweep', title: '순환 · 거울얼음 동굴 정리', description: '거울얼음 동굴에서 심연룡 아케론 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'dragon', target: 15, reward: { gold: 42100, gems: 132, itemId: 'lumina-seal', itemCount: 2 } },
  { id: 'daily-049-mirror-ice-cavern-long', title: '장기 · 거울얼음 동굴 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 84, reward: { gold: 30600, gems: 98, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-049-void-orchid-garden-sweep', title: '순환 · 공허 난초 정원 정리', description: '공허 난초 정원에서 그림자 임프 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'shadowImp', target: 92, reward: { gold: 44400, gems: 138, itemId: 'lumina-seal', itemCount: 3 } },
  { id: 'daily-049-void-orchid-garden-long', title: '장기 · 공허 난초 정원 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 86, reward: { gold: 32400, gems: 102, itemId: 'enhance-stone', itemCount: 8 } },
  { id: 'daily-049-sky-whale-port-sweep', title: '순환 · 천공 고래 항구 정리', description: '천공 고래 항구에서 화염 드레이크 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'fireDrake', target: 96, reward: { gold: 46700, gems: 144, itemId: 'radiant-ore', itemCount: 1 } },
  { id: 'daily-049-sky-whale-port-long', title: '장기 · 천공 고래 항구 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 88, reward: { gold: 34200, gems: 106, itemId: 'enhance-stone', itemCount: 9 } },
  { id: 'daily-049-golden-archive-sweep', title: '순환 · 황금 기록보관소 정리', description: '황금 기록보관소에서 망령 사제 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'wraith', target: 100, reward: { gold: 49000, gems: 150, itemId: 'radiant-ore', itemCount: 2 } },
  { id: 'daily-049-golden-archive-long', title: '장기 · 황금 기록보관소 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 90, reward: { gold: 36000, gems: 110, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-049-ash-rain-shrine-sweep', title: '순환 · 잿비 사당 정리', description: '잿비 사당에서 심연룡 아케론 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'dragon', target: 19, reward: { gold: 51300, gems: 156, itemId: 'radiant-ore', itemCount: 3 } },
  { id: 'daily-049-ash-rain-shrine-long', title: '장기 · 잿비 사당 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 92, reward: { gold: 37800, gems: 114, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-049-nightmare-circus-sweep', title: '순환 · 악몽 서커스 정리', description: '악몽 서커스에서 그림자 임프 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'shadowImp', target: 108, reward: { gold: 53600, gems: 162, itemId: 'radiant-ore', itemCount: 1 } },
  { id: 'daily-049-nightmare-circus-long', title: '장기 · 악몽 서커스 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 94, reward: { gold: 39600, gems: 118, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-049-obsidian-railway-sweep', title: '순환 · 흑요석 철도 정리', description: '흑요석 철도에서 이끼 골렘 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'mossGolem', target: 112, reward: { gold: 55900, gems: 168, itemId: 'radiant-ore', itemCount: 2 } },
  { id: 'daily-049-obsidian-railway-long', title: '장기 · 흑요석 철도 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 96, reward: { gold: 41400, gems: 122, itemId: 'enhance-stone', itemCount: 8 } },
  { id: 'daily-049-dragonbone-desert-sweep', title: '순환 · 용골 사막 정리', description: '용골 사막에서 묘지 기사 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'graveKnight', target: 116, reward: { gold: 58200, gems: 174, itemId: 'radiant-ore', itemCount: 3 } },
  { id: 'daily-049-dragonbone-desert-long', title: '장기 · 용골 사막 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 98, reward: { gold: 43200, gems: 126, itemId: 'enhance-stone', itemCount: 9 } },
  { id: 'daily-049-aurora-monastery-sweep', title: '순환 · 오로라 수도원 정리', description: '오로라 수도원에서 흑요석 가디언 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'crystalBear', target: 120, reward: { gold: 60500, gems: 180, itemId: 'radiant-ore', itemCount: 1 } },
  { id: 'daily-049-aurora-monastery-long', title: '장기 · 오로라 수도원 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 100, reward: { gold: 45000, gems: 130, itemId: 'enhance-stone', itemCount: 5 } },
  { id: 'daily-049-lost-royal-garden-sweep', title: '순환 · 잃어버린 왕가 정원 정리', description: '잃어버린 왕가 정원에서 청수정 늑대 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'wolf', target: 124, reward: { gold: 62800, gems: 186, itemId: 'radiant-ore', itemCount: 2 } },
  { id: 'daily-049-lost-royal-garden-long', title: '장기 · 잃어버린 왕가 정원 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 102, reward: { gold: 46800, gems: 134, itemId: 'enhance-stone', itemCount: 6 } },
  { id: 'daily-049-red-moon-keep-sweep', title: '순환 · 적월 성채 정리', description: '적월 성채에서 심연룡 아케론 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'dragon', target: 25, reward: { gold: 65100, gems: 192, itemId: 'radiant-ore', itemCount: 3 } },
  { id: 'daily-049-red-moon-keep-long', title: '장기 · 적월 성채 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 104, reward: { gold: 48600, gems: 138, itemId: 'enhance-stone', itemCount: 7 } },
  { id: 'daily-049-abyssal-throne-sweep', title: '순환 · 심연왕좌 입구 정리', description: '심연왕좌 입구에서 화염 드레이크 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'fireDrake', target: 132, reward: { gold: 67400, gems: 198, itemId: 'radiant-ore', itemCount: 1 } },
  { id: 'daily-049-abyssal-throne-long', title: '장기 · 심연왕좌 입구 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 108, reward: { gold: 50400, gems: 142, itemId: 'enhance-stone', itemCount: 8 } },
  { id: 'daily-049-genesis-rift-sweep', title: '순환 · 창세 균열 정리', description: '창세 균열에서 흑요석 가디언 토벌 루틴을 수행하세요.', goalType: 'kill', monsterId: 'crystalBear', target: 136, reward: { gold: 69700, gems: 204, itemId: 'radiant-ore', itemCount: 2 } },
  { id: 'daily-049-genesis-rift-long', title: '장기 · 창세 균열 전선 유지', description: '자동전술과 물약을 세팅하고 장시간 사냥 효율을 확인하세요.', goalType: 'level', target: 112, reward: { gold: 52200, gems: 146, itemId: 'enhance-stone', itemCount: 9 } }
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
  { id: 'azure-dagger', name: '청월 단검', type: 'weapon', rarity: 'R', effectText: '공격 +10, 공속 +4%', bonus: { atk: 10, aspd: 0.04 } },
  { id: 'bone-cleaver', name: '해골 절단도', type: 'weapon', rarity: 'SR', effectText: '공격 +26, 체력 +34', bonus: { atk: 26, hp: 34 } },
  { id: 'storm-bow', name: '폭풍 활', type: 'weapon', rarity: 'SR', effectText: '공격 +24, 치명 +4%, 이속 +0.08', bonus: { atk: 24, crit: 0.04, move: 0.08 } },
  { id: 'omega-blade', name: '오메가 블레이드', type: 'weapon', rarity: 'UR', effectText: '공격 +68, 치명 +10%, 공속 +6%', bonus: { atk: 68, crit: 0.1, aspd: 0.06 } },
  { id: 'wolf-hide-vest', name: '수정늑대 조끼', type: 'armor', rarity: 'R', effectText: '체력 +44, 방어 +8, 이속 +0.04', bonus: { hp: 44, def: 8, move: 0.04 } },
  { id: 'golem-guard', name: '골렘 수호갑', type: 'armor', rarity: 'SR', effectText: '체력 +118, 방어 +25', bonus: { hp: 118, def: 25 } },
  { id: 'storm-mantle', name: '폭풍 망토갑', type: 'armor', rarity: 'SSR', effectText: '체력 +132, 방어 +24, 공속 +3%', bonus: { hp: 132, def: 24, aspd: 0.03 } },
  { id: 'omega-plate', name: '오메가 전선갑', type: 'armor', rarity: 'UR', effectText: '체력 +240, 방어 +42, 마나 +80', bonus: { hp: 240, def: 42, mp: 80 } },
  { id: 'goblin-token', name: '붉은 깃발 토큰', type: 'relic', rarity: 'R', effectText: '공격 +5, 골드 파밍용 유물', bonus: { atk: 5 } },
  { id: 'harpy-feather', name: '폭풍깃 부적', type: 'relic', rarity: 'SR', effectText: '공속 +6%, 이속 +0.12', bonus: { aspd: 0.06, move: 0.12 } },
  { id: 'abyss-crown', name: '심연왕의 작은 왕관', type: 'relic', rarity: 'UR', effectText: 'HP +120, 공격 +24, 치명 +7%', bonus: { hp: 120, atk: 24, crit: 0.07 } },
  { id: 'hp-potion-small', name: '하급 생명 물약', type: 'consumable', rarity: 'N', effectText: 'HP 2% 회복. 사냥을 오래 하려면 충분한 수량을 준비해야 합니다.', bonus: {}, consume: { hpPercent: 0.02 } },
  { id: 'mp-potion-small', name: '하급 마나 물약', type: 'consumable', rarity: 'N', effectText: 'MP 2% 회복. 스킬 사냥을 유지하려면 여러 개를 들고 다녀야 합니다.', bonus: {}, consume: { mpPercent: 0.02 } },
  { id: 'hp-potion-mid', name: '중급 생명 물약', type: 'consumable', rarity: 'R', effectText: 'HP 3.5% 회복. 강한 사냥터에서 꾸준히 소모되는 생존 보급품입니다.', bonus: {}, consume: { hpPercent: 0.035 } },
  { id: 'mp-potion-mid', name: '중급 마나 물약', type: 'consumable', rarity: 'R', effectText: 'MP 3.5% 회복. 자동사냥 스킬 회전을 위한 마나 보급품입니다.', bonus: {}, consume: { mpPercent: 0.035 } },
  { id: 'hp-potion-high', name: '상급 생명 물약', type: 'consumable', rarity: 'SR', effectText: 'HP 5% 회복. 보스전에서 더 효율적인 고급 생존 물약입니다.', bonus: {}, consume: { hpPercent: 0.05 } },
  { id: 'mp-potion-high', name: '상급 마나 물약', type: 'consumable', rarity: 'SR', effectText: 'MP 5% 회복. 고숙련 스킬 운용을 오래 유지하기 위한 고급 물약입니다.', bonus: {}, consume: { mpPercent: 0.05 } },
  { id: 'soul-shard', name: '소울 파편', type: 'material', rarity: 'R', effectText: '카드 합성/장비 강화 재료', bonus: {} },
  { id: 'enhance-stone', name: '강화석', type: 'material', rarity: 'SR', effectText: '+10 이후 강화 재료', bonus: {} },
  { id: 'boss-trophy', name: '균열 토벌 훈장', type: 'material', rarity: 'SSR', effectText: '필드보스와 심연룡을 토벌하면 얻는 훈장. 마을 보스 메뉴에서 보상으로 교환합니다.', bonus: {} },
  { id: 'lumina-seal', name: '루미나 원정 인장', type: 'material', rarity: 'SR', effectText: '후반 메인 퀘스트와 장기 전선 보상으로 얻는 원정대 인장입니다.', bonus: {} },
  { id: 'radiant-ore', name: '찬란한 성운광', type: 'material', rarity: 'SSR', effectText: '최상급 사냥터에서 획득하는 고급 강화 재료입니다.', bonus: {} },
  { id: 'mythic-map', name: '신화 전선 지도', type: 'material', rarity: 'UR', effectText: '창세 균열과 심연왕좌 공략 기록이 담긴 희귀 지도입니다.', bonus: {} },
  { id: 'wolf-pelt', name: '수정늑대 가죽', type: 'material', rarity: 'N', effectText: '초반 방어구 제작과 의뢰 납품에 쓰이는 재료입니다.', bonus: {} },
  { id: 'goblin-steel', name: '폐허 강철조각', type: 'material', rarity: 'R', effectText: '무기 강화와 장비 분해 보정에 쓰이는 금속 재료입니다.', bonus: {} },
  { id: 'harpy-plume', name: '폭풍깃털', type: 'material', rarity: 'R', effectText: '공속 장비와 스킬서 연구에 쓰이는 가벼운 재료입니다.', bonus: {} },
  { id: 'golem-core', name: '골렘 핵편', type: 'material', rarity: 'SR', effectText: '방어구 강화와 공명 연구에 쓰이는 단단한 핵편입니다.', bonus: {} },
  { id: 'abyss-scale', name: '심연 비늘', type: 'material', rarity: 'SSR', effectText: '후반 장비와 보스 보상 교환에 쓰이는 고급 재료입니다.', bonus: {} },

  { id: 'lawful-blade', name: '로우풀 세이버', type: 'weapon', rarity: 'SSR', effectText: '공격 +44, 방어 +12, 성향 수호자에게 어울리는 장검', bonus: { atk: 44, def: 12, crit: 0.035 } },
  { id: 'chaos-reaver', name: '카오틱 리버', type: 'weapon', rarity: 'UR', effectText: '공격 +86, 치명 +13%, 방어 -8. 혼돈의 대가를 요구하는 전쟁검', bonus: { atk: 86, def: -8, crit: 0.13 } },
  { id: 'guardian-aegis', name: '수호자의 에이지스 갑주', type: 'armor', rarity: 'SSR', effectText: 'HP +210, 방어 +38, 라우풀 기사단의 중갑', bonus: { hp: 210, def: 38 } },
  { id: 'nightmare-robe', name: '악몽 사제의 로브', type: 'armor', rarity: 'SSR', effectText: 'MP +150, 공격 +26, 치명 +5%', bonus: { mp: 150, atk: 26, crit: 0.05 } },
  { id: 'celestial-sigil', name: '천계 성흔 유물', type: 'relic', rarity: 'UR', effectText: 'HP +160, MP +120, 공격 +30, 방어 +22', bonus: { hp: 160, mp: 120, atk: 30, def: 22 } },
  { id: 'blood-oath-ring', name: '혈맹 맹세 반지', type: 'relic', rarity: 'SSR', effectText: '공격 +18, 공속 +8%, 치명 +5%', bonus: { atk: 18, aspd: 0.08, crit: 0.05 } },
  { id: 'boss-supply-box', name: '보스 보급 상자', type: 'consumable', rarity: 'SR', effectText: '균열 보급품이 들어 있는 상자. 사용하면 강화 재료와 물약을 획득합니다.', bonus: {} },
  { id: 'elite-boss-box', name: '정예 보스 상자', type: 'consumable', rarity: 'SSR', effectText: '정예 보스의 전리품 상자. 사용하면 고급 재료와 희귀 장비 기회를 얻습니다.', bonus: {} },
  { id: 'ancient-boss-cache', name: '고대 보스 전리품', type: 'consumable', rarity: 'UR', effectText: '고대 보스의 봉인 상자. 사용하면 UR 장비와 고급 재료를 노릴 수 있습니다.', bonus: {} },
  { id: 'lawful-supply-crate', name: '라우풀 보급 궤짝', type: 'consumable', rarity: 'SSR', effectText: '질서 성향 수호자에게 지급되는 보급 궤짝. 사용하면 안정적인 성장 보상을 얻습니다.', bonus: {} },
  { id: 'purity-mark', name: '정화의 표식', type: 'material', rarity: 'SR', effectText: '카오틱 성향을 정화하고 라우풀 보급 교환에 쓰이는 표식입니다.', bonus: {} },
  { id: 'blood-crystal', name: '혈맹 결정', type: 'material', rarity: 'SSR', effectText: '보스 장비와 고급 강화에 쓰이는 붉은 결정입니다.', bonus: {} },
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


// Alpha 0.51: diversified loot table overlay.
// 기존 몬스터 정의를 유지하면서 장비/소모품/재료 드랍 폭을 넓힌다.
const alpha051DropOverlay: Record<string, Array<{ type: 'gold' | 'gem' | 'item' | 'card'; id?: string; amount?: number; chance: number }>> = {
  slime: [
    { type: 'item', id: 'wolf-pelt', chance: 0.12 },
    { type: 'item', id: 'hp-potion-small', chance: 0.16 },
    { type: 'item', id: 'mp-potion-small', chance: 0.10 }
  ],
  wolf: [
    { type: 'item', id: 'wolf-pelt', chance: 0.18 },
    { type: 'item', id: 'wolf-hide-vest', chance: 0.026 },
    { type: 'item', id: 'azure-dagger', chance: 0.018 }
  ],
  shadowImp: [
    { type: 'gem', amount: 1, chance: 0.08 },
    { type: 'item', id: 'goblin-token', chance: 0.018 },
    { type: 'item', id: 'soul-shard', chance: 0.12 }
  ],
  goblin: [
    { type: 'item', id: 'goblin-steel', chance: 0.19 },
    { type: 'item', id: 'goblin-token', chance: 0.032 },
    { type: 'item', id: 'bone-cleaver', chance: 0.012 }
  ],
  mossGolem: [
    { type: 'item', id: 'golem-core', chance: 0.14 },
    { type: 'item', id: 'golem-guard', chance: 0.016 },
    { type: 'item', id: 'goblin-steel', chance: 0.10 }
  ],
  wraith: [
    { type: 'item', id: 'soul-shard', chance: 0.18 },
    { type: 'item', id: 'skillbook-basic', chance: 0.022 },
    { type: 'item', id: 'abyss-scale', chance: 0.018 }
  ],
  crystalBear: [
    { type: 'item', id: 'golem-core', chance: 0.16 },
    { type: 'item', id: 'golem-guard', chance: 0.018 },
    { type: 'item', id: 'radiant-ore', chance: 0.025 }
  ],
  fireDrake: [
    { type: 'item', id: 'abyss-scale', chance: 0.09 },
    { type: 'item', id: 'storm-bow', chance: 0.014 },
    { type: 'item', id: 'hp-potion-high', chance: 0.045 }
  ],
  stormHarpy: [
    { type: 'item', id: 'harpy-plume', chance: 0.18 },
    { type: 'item', id: 'harpy-feather', chance: 0.018 },
    { type: 'item', id: 'storm-mantle', chance: 0.011 }
  ],
  graveKnight: [
    { type: 'item', id: 'goblin-steel', chance: 0.16 },
    { type: 'item', id: 'bone-cleaver', chance: 0.014 },
    { type: 'item', id: 'storm-mantle', chance: 0.012 }
  ],
  fieldBoss: [
    { type: 'item', id: 'abyss-crown', chance: 0.018 },
    { type: 'item', id: 'omega-plate', chance: 0.008 },
    { type: 'item', id: 'omega-token', chance: 0.18 },
    { type: 'item', id: 'abyss-scale', chance: 0.22 }
  ],
  dragon: [
    { type: 'item', id: 'abyss-crown', chance: 0.026 },
    { type: 'item', id: 'omega-blade', chance: 0.01 },
    { type: 'item', id: 'mythic-map', chance: 0.045 },
    { type: 'item', id: 'abyss-scale', chance: 0.26 }
  ]
};

for (const monster of monsters) {
  const extraDrops = alpha051DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}


// Alpha 0.52: lineage-like boss boxes, lawful materials, and higher-tier loot spread.
const alpha052DropOverlay: Record<string, Array<{ type: 'gold' | 'gem' | 'item' | 'card'; id?: string; amount?: number; chance: number }>> = {
  slime: [
    { type: 'item', id: 'purity-mark', chance: 0.018 },
    { type: 'item', id: 'boss-supply-box', chance: 0.004 }
  ],
  wolf: [
    { type: 'item', id: 'purity-mark', chance: 0.024 },
    { type: 'item', id: 'blood-oath-ring', chance: 0.004 }
  ],
  shadowImp: [
    { type: 'item', id: 'purity-mark', chance: 0.026 },
    { type: 'item', id: 'nightmare-robe', chance: 0.003 }
  ],
  goblin: [
    { type: 'item', id: 'blood-crystal', chance: 0.02 },
    { type: 'item', id: 'lawful-blade', chance: 0.004 }
  ],
  mossGolem: [
    { type: 'item', id: 'guardian-aegis', chance: 0.004 },
    { type: 'item', id: 'purity-mark', chance: 0.035 }
  ],
  wraith: [
    { type: 'item', id: 'nightmare-robe', chance: 0.006 },
    { type: 'item', id: 'blood-crystal', chance: 0.026 }
  ],
  crystalBear: [
    { type: 'item', id: 'guardian-aegis', chance: 0.007 },
    { type: 'item', id: 'elite-boss-box', chance: 0.012 }
  ],
  fireDrake: [
    { type: 'item', id: 'blood-oath-ring', chance: 0.012 },
    { type: 'item', id: 'elite-boss-box', chance: 0.018 }
  ],
  stormHarpy: [
    { type: 'item', id: 'lawful-blade', chance: 0.008 },
    { type: 'item', id: 'purity-mark', chance: 0.045 }
  ],
  graveKnight: [
    { type: 'item', id: 'chaos-reaver', chance: 0.004 },
    { type: 'item', id: 'blood-crystal', chance: 0.04 }
  ],
  fieldBoss: [
    { type: 'item', id: 'elite-boss-box', chance: 0.22 },
    { type: 'item', id: 'ancient-boss-cache', chance: 0.035 },
    { type: 'item', id: 'blood-crystal', chance: 0.28 },
    { type: 'item', id: 'lawful-blade', chance: 0.018 }
  ],
  dragon: [
    { type: 'item', id: 'ancient-boss-cache', chance: 0.07 },
    { type: 'item', id: 'celestial-sigil', chance: 0.012 },
    { type: 'item', id: 'chaos-reaver', chance: 0.012 },
    { type: 'item', id: 'blood-crystal', chance: 0.34 }
  ]
};

for (const monster of monsters) {
  const extraDrops = alpha052DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}

export const villageProps = [
  { type: 'tree', x: 5.8, y: 16.6, scale: 0.48 },
  { type: 'tree', x: 12.2, y: 16.0, scale: 0.48 },
  { type: 'tree', x: 6.8, y: 23.8, scale: 0.46 },
  { type: 'crystal', x: 8.0, y: 19.0, scale: 0.38 },
  { type: 'crystal', x: 6.2, y: 21.0, scale: 0.34 },
  { type: 'crystal', x: 11.2, y: 21.4, scale: 0.34 },
  { type: 'rock', x: 7.0, y: 17.6, scale: 0.34 },
  { type: 'rock', x: 13.4, y: 20.8, scale: 0.34 },
  { type: 'ruin', x: 11.8, y: 18.8, scale: 0.36 },
  { type: 'tree', x: 16.2, y: 17.8, scale: 0.42 },
  { type: 'tree', x: 18.9, y: 19.4, scale: 0.36 },
  { type: 'rock', x: 15.0, y: 22.6, scale: 0.28 },
  { type: 'crystal', x: 18.2, y: 23.2, scale: 0.30 },
  { type: 'ruin', x: 20.8, y: 21.2, scale: 0.32 }
] as const;

export const expToNext = (level: number) => 90 + level * level * 32;


// Alpha 0.50: Omega Overdrive expansion pack.
// Keeps the existing monster family for save compatibility, but greatly expands the world route,
// main quest cadence, repeatable objectives, late-game materials and set goals.
const omegaOverdriveZones: ZoneDefinition[] = [
  { id: 'astral-wharf', order: 49, title: '성운 항구 외곽', subtitle: '별빛 선착장과 균열 파도가 맞닿은 항구', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 114, monsterIds: ['stormHarpy', 'wraith', 'dragon', 'fireDrake'], entry: { x: 25.8, y: 28.6 }, unlockLevel: 114, badge: '49' },
  { id: 'sapphire-rail', order: 50, title: '사파이어 철로', subtitle: '푸른 광석 열차가 멈춘 방치된 철도', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 115, monsterIds: ['crystalBear', 'mossGolem', 'graveKnight', 'fieldBoss'], entry: { x: 29.5, y: 15.5 }, unlockLevel: 115, badge: '50' },
  { id: 'hollow-elm-court', order: 51, title: '공허느릅 궁정', subtitle: '고목 왕좌와 망령 기사단의 숲 궁정', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 116, monsterIds: ['wolf', 'wraith', 'graveKnight', 'dragon'], entry: { x: 33.2, y: 18.4 }, unlockLevel: 116, badge: '51' },
  { id: 'meteor-ash-field', order: 52, title: '유성 잿가루 평야', subtitle: '하늘에서 떨어진 잿빛 운석지대', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 117, monsterIds: ['fireDrake', 'fieldBoss', 'dragon', 'graveKnight'], entry: { x: 9.9, y: 21.3 }, unlockLevel: 117, badge: '52' },
  { id: 'red-lotus-canal', order: 53, title: '적련 운하', subtitle: '붉은 연꽃과 심연 안개가 떠도는 수로', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 118, monsterIds: ['wraith', 'stormHarpy', 'crystalBear', 'dragon'], entry: { x: 13.6, y: 24.2 }, unlockLevel: 118, badge: '53' },
  { id: 'phantom-opera', order: 54, title: '유령 오페라 극장', subtitle: '망령 합창과 하피의 고음이 부딪히는 극장', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 119, monsterIds: ['wraith', 'stormHarpy', 'graveKnight', 'fieldBoss'], entry: { x: 17.3, y: 27.1 }, unlockLevel: 119, badge: '54' },
  { id: 'iron-sky-bridge', order: 55, title: '철천교', subtitle: '천공 성채와 용척추를 잇는 거대한 다리', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 120, monsterIds: ['stormHarpy', 'fireDrake', 'dragon', 'fieldBoss'], entry: { x: 21.0, y: 30.0 }, unlockLevel: 120, badge: '55' },
  { id: 'obsidian-harbor', order: 56, title: '흑요석 항만', subtitle: '검은 파도 위에 선 보스 원정 항만', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 121, monsterIds: ['fieldBoss', 'dragon', 'graveKnight', 'fireDrake'], entry: { x: 24.7, y: 16.9 }, unlockLevel: 121, badge: '56' },
  { id: 'mirror-forest', order: 57, title: '거울숲', subtitle: '분신처럼 비치는 수정 늑대의 숲', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 122, monsterIds: ['wolf', 'shadowImp', 'crystalBear', 'stormHarpy'], entry: { x: 28.4, y: 19.8 }, unlockLevel: 122, badge: '57' },
  { id: 'void-monastery', order: 58, title: '무공 수도원', subtitle: '그림자 사제단이 기도하는 폐수도원', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 123, monsterIds: ['wraith', 'graveKnight', 'shadowImp', 'fieldBoss'], entry: { x: 32.1, y: 22.7 }, unlockLevel: 123, badge: '58' },
  { id: 'sunken-clocktower', order: 59, title: '침몰 시계탑', subtitle: '시간이 멈춘 왕국 시계탑 잔해', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 124, monsterIds: ['wraith', 'crystalBear', 'dragon', 'fieldBoss'], entry: { x: 8.8, y: 25.6 }, unlockLevel: 124, badge: '59' },
  { id: 'scarlet-snowfield', order: 60, title: '주홍 설원', subtitle: '붉은 눈보라가 드레이크 숨결과 섞인 설원', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 125, monsterIds: ['fireDrake', 'wolf', 'stormHarpy', 'dragon'], entry: { x: 12.5, y: 28.5 }, unlockLevel: 125, badge: '60' },
  { id: 'skywhale-boneyard', order: 61, title: '천공고래 뼈무덤', subtitle: '거대한 공중 생물의 유해 위 전장', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 126, monsterIds: ['dragon', 'graveKnight', 'fieldBoss', 'fireDrake'], entry: { x: 16.2, y: 15.4 }, unlockLevel: 126, badge: '61' },
  { id: 'aurora-spire', order: 62, title: '오로라 첨탑', subtitle: '빛과 심연의 속성이 뒤엉킨 첨탑', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 127, monsterIds: ['stormHarpy', 'wraith', 'dragon', 'fieldBoss'], entry: { x: 19.9, y: 18.3 }, unlockLevel: 127, badge: '62' },
  { id: 'forgotten-colossus', order: 63, title: '망각 거신의 발등', subtitle: '거신의 발등 위에 세워진 전초기지', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 128, monsterIds: ['crystalBear', 'mossGolem', 'fieldBoss', 'dragon'], entry: { x: 23.6, y: 21.2 }, unlockLevel: 128, badge: '63' },
  { id: 'black-star-arena', order: 64, title: '흑성 투기장', subtitle: '정예 몬스터가 끝없이 호출되는 투기장', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 129, monsterIds: ['fieldBoss', 'graveKnight', 'dragon', 'fireDrake'], entry: { x: 27.3, y: 24.1 }, unlockLevel: 129, badge: '64' },
  { id: 'dream-eater-lab', order: 65, title: '몽식자 연구소', subtitle: '꿈을 먹는 마도 장치가 남은 실험실', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 130, monsterIds: ['shadowImp', 'wraith', 'crystalBear', 'dragon'], entry: { x: 31.0, y: 27.0 }, unlockLevel: 130, badge: '65' },
  { id: 'crimson-crown-road', order: 66, title: '핏빛 왕관로', subtitle: '심연왕좌로 이어지는 마지막 왕도', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 131, monsterIds: ['graveKnight', 'fieldBoss', 'dragon', 'fireDrake'], entry: { x: 7.7, y: 29.9 }, unlockLevel: 131, badge: '66' },
  { id: 'lunar-dragon-gate', order: 67, title: '월룡문', subtitle: '달빛 비늘이 문처럼 솟은 드래곤 관문', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 132, monsterIds: ['dragon', 'fireDrake', 'stormHarpy', 'fieldBoss'], entry: { x: 11.4, y: 16.8 }, unlockLevel: 132, badge: '67' },
  { id: 'celestial-mine', order: 68, title: '천성광맥 심부', subtitle: '성운광이 폭주하는 초월 광산', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 133, monsterIds: ['crystalBear', 'mossGolem', 'dragon', 'fieldBoss'], entry: { x: 15.1, y: 19.7 }, unlockLevel: 133, badge: '68' },
  { id: 'nightmare-orchard', order: 69, title: '악몽 과수원', subtitle: '검은 열매와 그림자 임프가 자라는 숲', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 134, monsterIds: ['shadowImp', 'wolf', 'wraith', 'dragon'], entry: { x: 18.8, y: 22.6 }, unlockLevel: 134, badge: '69' },
  { id: 'oracle-last-post', order: 70, title: '예언자의 최후 초소', subtitle: '원정대 예언자가 남긴 마지막 주둔지', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 135, monsterIds: ['wraith', 'fieldBoss', 'dragon', 'graveKnight'], entry: { x: 22.5, y: 25.5 }, unlockLevel: 135, badge: '70' },
  { id: 'fractured-heaven', order: 71, title: '부서진 천계로', subtitle: '천계의 잔해가 필드에 추락한 길', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 136, monsterIds: ['stormHarpy', 'dragon', 'fieldBoss', 'fireDrake'], entry: { x: 26.2, y: 28.4 }, unlockLevel: 136, badge: '71' },
  { id: 'omega-frontier', order: 72, title: '오메가 최종 전선', subtitle: '현재 알파 버전의 초월 반복 최종 전선', description: '0.50 오메가 원정대가 개척한 초월 전선입니다. 장비 공명, 카드 세트, 스킬 숙련, 물약 보급을 모두 점검해야 오래 버틸 수 있습니다.', recommendedLevel: 137, monsterIds: ['fieldBoss', 'dragon', 'fireDrake', 'graveKnight'], entry: { x: 29.9, y: 15.3 }, unlockLevel: 137, badge: '72' }
];

zones.push(...omegaOverdriveZones);

items.push(
  { id: 'omega-token', name: '오메가 원정 증표', type: 'material', rarity: 'SSR', effectText: '0.50 초월 전선과 원정 마일스톤에서 획득하는 고급 증표입니다.', bonus: {} },
  { id: 'starlight-thread', name: '별빛 재봉실', type: 'material', rarity: 'SR', effectText: '고레벨 장비 보정과 마을 의뢰 보상에 쓰이는 원정 재료입니다.', bonus: {} },
  { id: 'void-memory', name: '공허의 기억', type: 'material', rarity: 'UR', effectText: '오메가 전선의 보스 흔적이 담긴 최고급 기록입니다.', bonus: {} },
  { id: 'ancient-war-banner', name: '고대 전투 깃발', type: 'relic', rarity: 'SSR', effectText: '원정대 사기를 끌어올리는 후반 유물입니다.', bonus: { hp: 260, atk: 28, def: 20, crit: 0.018 } },
  { id: 'omega-core-relic', name: '오메가 코어 유물', type: 'relic', rarity: 'UR', effectText: '오메가 최종 전선에서 발견된 초월 유물입니다.', bonus: { hp: 520, mp: 120, atk: 54, def: 34, crit: 0.028 } }
);

cardSets.push(
  { id: 'set-omega-vanguard', name: '오메가 선봉대', requiredCardIds: ['card-field-boss', 'card-dragon', 'card-fire-drake'], effectText: '보스/드레이크 카드 3종 장착 시 공격 +45, HP +420, 치명 +3%', bonus: { atk: 45, hp: 420, crit: 0.03 } },
  { id: 'set-nightmare-hunt', name: '악몽 사냥꾼', requiredCardIds: ['card-wraith', 'card-grave-knight', 'card-shadow-imp'], effectText: '어둠 계열 카드 3종 장착 시 방어 +34, MP +120, 공격속도 +0.08', bonus: { def: 34, mp: 120, aspd: 0.08 } }
);

const omegaStory: StoryQuestDefinition[] = [
  { id: 'story-050-astral-wharf-arrival', chapter: 61, title: '성운 항구 외곽 진입', subtitle: '별빛 선착장과 균열 파도가 맞닿은 항구', npc: '원정대장 세이라', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.114 달성', goalType: 'level', target: 114, unlockZoneId: 'astral-wharf', reward: { gold: 220000, gems: 900, itemId: 'omega-token', itemCount: 1, exp: 150000 } },
  { id: 'story-050-astral-wharf-scout', chapter: 61, title: '성운 항구 외곽 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '심연룡 아케론 누적 90마리 처치', goalType: 'kill', monsterId: 'dragon', target: 90, unlockZoneId: 'astral-wharf', reward: { gold: 252000, gems: 960, itemId: 'starlight-thread', itemCount: 2, exp: 168000 } },
  { id: 'story-050-astral-wharf-supply', chapter: 61, title: '성운 항구 외곽 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '화염 드레이크 누적 105마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 105, unlockZoneId: 'astral-wharf', reward: { gold: 272000, gems: 1040, itemId: 'lumina-seal', itemCount: 2, exp: 181000 } },
  { id: 'story-050-astral-wharf-boss', chapter: 61, title: '성운 항구 외곽 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 58마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 58, unlockZoneId: 'astral-wharf', reward: { gold: 302000, gems: 1220, itemId: 'void-memory', itemCount: 1, exp: 206000 } },
  { id: 'story-050-astral-wharf-banner', chapter: 61, title: '성운 항구 외곽 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.115 달성', goalType: 'level', target: 115, unlockZoneId: 'astral-wharf', reward: { gold: 332000, gems: 1450, itemId: 'omega-token', itemCount: 3, exp: 232000 } },
  { id: 'story-050-sapphire-rail-arrival', chapter: 62, title: '사파이어 철로 진입', subtitle: '푸른 광석 열차가 멈춘 방치된 철도', npc: '예언자 미온', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.115 달성', goalType: 'level', target: 115, unlockZoneId: 'sapphire-rail', reward: { gold: 233500, gems: 918, itemId: 'omega-token', itemCount: 1, exp: 159000 } },
  { id: 'story-050-sapphire-rail-scout', chapter: 62, title: '사파이어 철로 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '야전 군주 발타르 누적 95마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 95, unlockZoneId: 'sapphire-rail', reward: { gold: 265500, gems: 981, itemId: 'starlight-thread', itemCount: 3, exp: 177000 } },
  { id: 'story-050-sapphire-rail-supply', chapter: 62, title: '사파이어 철로 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '묘지 기사 누적 110마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 110, unlockZoneId: 'sapphire-rail', reward: { gold: 285500, gems: 1063, itemId: 'lumina-seal', itemCount: 3, exp: 190000 } },
  { id: 'story-050-sapphire-rail-boss', chapter: 62, title: '사파이어 철로 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 60마리 처치', goalType: 'kill', monsterId: 'dragon', target: 60, unlockZoneId: 'sapphire-rail', reward: { gold: 315500, gems: 1251, itemId: 'void-memory', itemCount: 1, exp: 215000 } },
  { id: 'story-050-sapphire-rail-banner', chapter: 62, title: '사파이어 철로 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.116 달성', goalType: 'level', target: 116, unlockZoneId: 'sapphire-rail', reward: { gold: 345500, gems: 1486, itemId: 'omega-token', itemCount: 3, exp: 241000 } },
  { id: 'story-050-hollow-elm-court-arrival', chapter: 63, title: '공허느릅 궁정 진입', subtitle: '고목 왕좌와 망령 기사단의 숲 궁정', npc: '대장장이 브람', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.116 달성', goalType: 'level', target: 116, unlockZoneId: 'hollow-elm-court', reward: { gold: 247000, gems: 936, itemId: 'omega-token', itemCount: 1, exp: 168000 } },
  { id: 'story-050-hollow-elm-court-scout', chapter: 63, title: '공허느릅 궁정 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '화염 드레이크 누적 100마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 100, unlockZoneId: 'hollow-elm-court', reward: { gold: 279000, gems: 1002, itemId: 'starlight-thread', itemCount: 4, exp: 186000 } },
  { id: 'story-050-hollow-elm-court-supply', chapter: 63, title: '공허느릅 궁정 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '망령 사제 누적 115마리 처치', goalType: 'kill', monsterId: 'wraith', target: 115, unlockZoneId: 'hollow-elm-court', reward: { gold: 299000, gems: 1086, itemId: 'lumina-seal', itemCount: 4, exp: 199000 } },
  { id: 'story-050-hollow-elm-court-boss', chapter: 63, title: '공허느릅 궁정 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 62마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 62, unlockZoneId: 'hollow-elm-court', reward: { gold: 329000, gems: 1282, itemId: 'void-memory', itemCount: 1, exp: 224000 } },
  { id: 'story-050-hollow-elm-court-banner', chapter: 63, title: '공허느릅 궁정 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.117 달성', goalType: 'level', target: 117, unlockZoneId: 'hollow-elm-court', reward: { gold: 359000, gems: 1522, itemId: 'omega-token', itemCount: 3, exp: 250000 } },
  { id: 'story-050-meteor-ash-field-arrival', chapter: 64, title: '유성 잿가루 평야 진입', subtitle: '하늘에서 떨어진 잿빛 운석지대', npc: '항해사 노아', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.117 달성', goalType: 'level', target: 117, unlockZoneId: 'meteor-ash-field', reward: { gold: 260500, gems: 954, itemId: 'omega-token', itemCount: 1, exp: 177000 } },
  { id: 'story-050-meteor-ash-field-scout', chapter: 64, title: '유성 잿가루 평야 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '묘지 기사 누적 105마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 105, unlockZoneId: 'meteor-ash-field', reward: { gold: 292500, gems: 1023, itemId: 'starlight-thread', itemCount: 5, exp: 195000 } },
  { id: 'story-050-meteor-ash-field-supply', chapter: 64, title: '유성 잿가루 평야 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '흑요석 가디언 누적 120마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 120, unlockZoneId: 'meteor-ash-field', reward: { gold: 312500, gems: 1109, itemId: 'lumina-seal', itemCount: 2, exp: 208000 } },
  { id: 'story-050-meteor-ash-field-boss', chapter: 64, title: '유성 잿가루 평야 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 64마리 처치', goalType: 'kill', monsterId: 'dragon', target: 64, unlockZoneId: 'meteor-ash-field', reward: { gold: 342500, gems: 1313, itemId: 'void-memory', itemCount: 1, exp: 233000 } },
  { id: 'story-050-meteor-ash-field-banner', chapter: 64, title: '유성 잿가루 평야 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.118 달성', goalType: 'level', target: 118, unlockZoneId: 'meteor-ash-field', reward: { gold: 372500, gems: 1558, itemId: 'omega-token', itemCount: 3, exp: 259000 } },
  { id: 'story-050-red-lotus-canal-arrival', chapter: 65, title: '적련 운하 진입', subtitle: '붉은 연꽃과 심연 안개가 떠도는 수로', npc: '전투 교관 카엘', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.118 달성', goalType: 'level', target: 118, unlockZoneId: 'red-lotus-canal', reward: { gold: 274000, gems: 972, itemId: 'omega-token', itemCount: 1, exp: 186000 } },
  { id: 'story-050-red-lotus-canal-scout', chapter: 65, title: '적련 운하 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '망령 사제 누적 110마리 처치', goalType: 'kill', monsterId: 'wraith', target: 110, unlockZoneId: 'red-lotus-canal', reward: { gold: 306000, gems: 1044, itemId: 'starlight-thread', itemCount: 2, exp: 204000 } },
  { id: 'story-050-red-lotus-canal-supply', chapter: 65, title: '적련 운하 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '폭풍 하피 누적 125마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 125, unlockZoneId: 'red-lotus-canal', reward: { gold: 326000, gems: 1132, itemId: 'lumina-seal', itemCount: 3, exp: 217000 } },
  { id: 'story-050-red-lotus-canal-boss', chapter: 65, title: '적련 운하 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 66마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 66, unlockZoneId: 'red-lotus-canal', reward: { gold: 356000, gems: 1344, itemId: 'void-memory', itemCount: 1, exp: 242000 } },
  { id: 'story-050-red-lotus-canal-banner', chapter: 65, title: '적련 운하 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.119 달성', goalType: 'level', target: 119, unlockZoneId: 'red-lotus-canal', reward: { gold: 386000, gems: 1594, itemId: 'omega-token', itemCount: 3, exp: 268000 } },
  { id: 'story-050-phantom-opera-arrival', chapter: 66, title: '유령 오페라 극장 진입', subtitle: '망령 합창과 하피의 고음이 부딪히는 극장', npc: '전략관 이리스', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.119 달성', goalType: 'level', target: 119, unlockZoneId: 'phantom-opera', reward: { gold: 287500, gems: 990, itemId: 'omega-token', itemCount: 1, exp: 195000 } },
  { id: 'story-050-phantom-opera-scout', chapter: 66, title: '유령 오페라 극장 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '흑요석 가디언 누적 115마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 115, unlockZoneId: 'phantom-opera', reward: { gold: 319500, gems: 1065, itemId: 'starlight-thread', itemCount: 3, exp: 213000 } },
  { id: 'story-050-phantom-opera-supply', chapter: 66, title: '유령 오페라 극장 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '심연룡 아케론 누적 130마리 처치', goalType: 'kill', monsterId: 'dragon', target: 130, unlockZoneId: 'phantom-opera', reward: { gold: 339500, gems: 1155, itemId: 'lumina-seal', itemCount: 4, exp: 226000 } },
  { id: 'story-050-phantom-opera-boss', chapter: 66, title: '유령 오페라 극장 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 68마리 처치', goalType: 'kill', monsterId: 'dragon', target: 68, unlockZoneId: 'phantom-opera', reward: { gold: 369500, gems: 1375, itemId: 'void-memory', itemCount: 1, exp: 251000 } },
  { id: 'story-050-phantom-opera-banner', chapter: 66, title: '유령 오페라 극장 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.120 달성', goalType: 'level', target: 120, unlockZoneId: 'phantom-opera', reward: { gold: 399500, gems: 1630, itemId: 'omega-token', itemCount: 3, exp: 277000 } },
  { id: 'story-050-iron-sky-bridge-arrival', chapter: 67, title: '철천교 진입', subtitle: '천공 성채와 용척추를 잇는 거대한 다리', npc: '원정대장 세이라', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.120 달성', goalType: 'level', target: 120, unlockZoneId: 'iron-sky-bridge', reward: { gold: 301000, gems: 1008, itemId: 'omega-token', itemCount: 1, exp: 204000 } },
  { id: 'story-050-iron-sky-bridge-scout', chapter: 67, title: '철천교 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '폭풍 하피 누적 120마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 120, unlockZoneId: 'iron-sky-bridge', reward: { gold: 333000, gems: 1086, itemId: 'starlight-thread', itemCount: 4, exp: 222000 } },
  { id: 'story-050-iron-sky-bridge-supply', chapter: 67, title: '철천교 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '야전 군주 발타르 누적 135마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 135, unlockZoneId: 'iron-sky-bridge', reward: { gold: 353000, gems: 1178, itemId: 'lumina-seal', itemCount: 2, exp: 235000 } },
  { id: 'story-050-iron-sky-bridge-boss', chapter: 67, title: '철천교 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 70마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 70, unlockZoneId: 'iron-sky-bridge', reward: { gold: 383000, gems: 1406, itemId: 'void-memory', itemCount: 1, exp: 260000 } },
  { id: 'story-050-iron-sky-bridge-banner', chapter: 67, title: '철천교 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.121 달성', goalType: 'level', target: 121, unlockZoneId: 'iron-sky-bridge', reward: { gold: 413000, gems: 1666, itemId: 'omega-token', itemCount: 3, exp: 286000 } },
  { id: 'story-050-obsidian-harbor-arrival', chapter: 68, title: '흑요석 항만 진입', subtitle: '검은 파도 위에 선 보스 원정 항만', npc: '예언자 미온', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.121 달성', goalType: 'level', target: 121, unlockZoneId: 'obsidian-harbor', reward: { gold: 314500, gems: 1026, itemId: 'omega-token', itemCount: 1, exp: 213000 } },
  { id: 'story-050-obsidian-harbor-scout', chapter: 68, title: '흑요석 항만 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '심연룡 아케론 누적 125마리 처치', goalType: 'kill', monsterId: 'dragon', target: 125, unlockZoneId: 'obsidian-harbor', reward: { gold: 346500, gems: 1107, itemId: 'starlight-thread', itemCount: 5, exp: 231000 } },
  { id: 'story-050-obsidian-harbor-supply', chapter: 68, title: '흑요석 항만 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '화염 드레이크 누적 140마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 140, unlockZoneId: 'obsidian-harbor', reward: { gold: 366500, gems: 1201, itemId: 'lumina-seal', itemCount: 3, exp: 244000 } },
  { id: 'story-050-obsidian-harbor-boss', chapter: 68, title: '흑요석 항만 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 72마리 처치', goalType: 'kill', monsterId: 'dragon', target: 72, unlockZoneId: 'obsidian-harbor', reward: { gold: 396500, gems: 1437, itemId: 'void-memory', itemCount: 1, exp: 269000 } },
  { id: 'story-050-obsidian-harbor-banner', chapter: 68, title: '흑요석 항만 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.122 달성', goalType: 'level', target: 122, unlockZoneId: 'obsidian-harbor', reward: { gold: 426500, gems: 1702, itemId: 'omega-token', itemCount: 3, exp: 295000 } },
  { id: 'story-050-mirror-forest-arrival', chapter: 69, title: '거울숲 진입', subtitle: '분신처럼 비치는 수정 늑대의 숲', npc: '대장장이 브람', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.122 달성', goalType: 'level', target: 122, unlockZoneId: 'mirror-forest', reward: { gold: 328000, gems: 1044, itemId: 'omega-token', itemCount: 1, exp: 222000 } },
  { id: 'story-050-mirror-forest-scout', chapter: 69, title: '거울숲 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '야전 군주 발타르 누적 130마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 130, unlockZoneId: 'mirror-forest', reward: { gold: 360000, gems: 1128, itemId: 'starlight-thread', itemCount: 2, exp: 240000 } },
  { id: 'story-050-mirror-forest-supply', chapter: 69, title: '거울숲 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '묘지 기사 누적 145마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 145, unlockZoneId: 'mirror-forest', reward: { gold: 380000, gems: 1224, itemId: 'lumina-seal', itemCount: 4, exp: 253000 } },
  { id: 'story-050-mirror-forest-boss', chapter: 69, title: '거울숲 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 74마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 74, unlockZoneId: 'mirror-forest', reward: { gold: 410000, gems: 1468, itemId: 'void-memory', itemCount: 2, exp: 278000 } },
  { id: 'story-050-mirror-forest-banner', chapter: 69, title: '거울숲 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.123 달성', goalType: 'level', target: 123, unlockZoneId: 'mirror-forest', reward: { gold: 440000, gems: 1738, itemId: 'omega-token', itemCount: 3, exp: 304000 } },
  { id: 'story-050-void-monastery-arrival', chapter: 70, title: '무공 수도원 진입', subtitle: '그림자 사제단이 기도하는 폐수도원', npc: '항해사 노아', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.123 달성', goalType: 'level', target: 123, unlockZoneId: 'void-monastery', reward: { gold: 341500, gems: 1062, itemId: 'omega-token', itemCount: 1, exp: 231000 } },
  { id: 'story-050-void-monastery-scout', chapter: 70, title: '무공 수도원 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '화염 드레이크 누적 135마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 135, unlockZoneId: 'void-monastery', reward: { gold: 373500, gems: 1149, itemId: 'starlight-thread', itemCount: 3, exp: 249000 } },
  { id: 'story-050-void-monastery-supply', chapter: 70, title: '무공 수도원 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '망령 사제 누적 150마리 처치', goalType: 'kill', monsterId: 'wraith', target: 150, unlockZoneId: 'void-monastery', reward: { gold: 393500, gems: 1247, itemId: 'lumina-seal', itemCount: 2, exp: 262000 } },
  { id: 'story-050-void-monastery-boss', chapter: 70, title: '무공 수도원 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 76마리 처치', goalType: 'kill', monsterId: 'dragon', target: 76, unlockZoneId: 'void-monastery', reward: { gold: 423500, gems: 1499, itemId: 'void-memory', itemCount: 2, exp: 287000 } },
  { id: 'story-050-void-monastery-banner', chapter: 70, title: '무공 수도원 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.124 달성', goalType: 'level', target: 124, unlockZoneId: 'void-monastery', reward: { gold: 453500, gems: 1774, itemId: 'omega-token', itemCount: 3, exp: 313000 } },
  { id: 'story-050-sunken-clocktower-arrival', chapter: 71, title: '침몰 시계탑 진입', subtitle: '시간이 멈춘 왕국 시계탑 잔해', npc: '전투 교관 카엘', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.124 달성', goalType: 'level', target: 124, unlockZoneId: 'sunken-clocktower', reward: { gold: 355000, gems: 1080, itemId: 'omega-token', itemCount: 1, exp: 240000 } },
  { id: 'story-050-sunken-clocktower-scout', chapter: 71, title: '침몰 시계탑 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '묘지 기사 누적 140마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 140, unlockZoneId: 'sunken-clocktower', reward: { gold: 387000, gems: 1170, itemId: 'starlight-thread', itemCount: 4, exp: 258000 } },
  { id: 'story-050-sunken-clocktower-supply', chapter: 71, title: '침몰 시계탑 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '흑요석 가디언 누적 155마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 155, unlockZoneId: 'sunken-clocktower', reward: { gold: 407000, gems: 1270, itemId: 'lumina-seal', itemCount: 3, exp: 271000 } },
  { id: 'story-050-sunken-clocktower-boss', chapter: 71, title: '침몰 시계탑 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 78마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 78, unlockZoneId: 'sunken-clocktower', reward: { gold: 437000, gems: 1530, itemId: 'void-memory', itemCount: 2, exp: 296000 } },
  { id: 'story-050-sunken-clocktower-banner', chapter: 71, title: '침몰 시계탑 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.125 달성', goalType: 'level', target: 125, unlockZoneId: 'sunken-clocktower', reward: { gold: 467000, gems: 1810, itemId: 'omega-token', itemCount: 3, exp: 322000 } },
  { id: 'story-050-scarlet-snowfield-arrival', chapter: 72, title: '주홍 설원 진입', subtitle: '붉은 눈보라가 드레이크 숨결과 섞인 설원', npc: '전략관 이리스', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.125 달성', goalType: 'level', target: 125, unlockZoneId: 'scarlet-snowfield', reward: { gold: 368500, gems: 1098, itemId: 'omega-token', itemCount: 1, exp: 249000 } },
  { id: 'story-050-scarlet-snowfield-scout', chapter: 72, title: '주홍 설원 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '망령 사제 누적 145마리 처치', goalType: 'kill', monsterId: 'wraith', target: 145, unlockZoneId: 'scarlet-snowfield', reward: { gold: 400500, gems: 1191, itemId: 'starlight-thread', itemCount: 5, exp: 267000 } },
  { id: 'story-050-scarlet-snowfield-supply', chapter: 72, title: '주홍 설원 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '폭풍 하피 누적 160마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 160, unlockZoneId: 'scarlet-snowfield', reward: { gold: 420500, gems: 1293, itemId: 'lumina-seal', itemCount: 4, exp: 280000 } },
  { id: 'story-050-scarlet-snowfield-boss', chapter: 72, title: '주홍 설원 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 80마리 처치', goalType: 'kill', monsterId: 'dragon', target: 80, unlockZoneId: 'scarlet-snowfield', reward: { gold: 450500, gems: 1561, itemId: 'void-memory', itemCount: 2, exp: 305000 } },
  { id: 'story-050-scarlet-snowfield-banner', chapter: 72, title: '주홍 설원 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.126 달성', goalType: 'level', target: 126, unlockZoneId: 'scarlet-snowfield', reward: { gold: 480500, gems: 1846, itemId: 'omega-token', itemCount: 3, exp: 331000 } },
  { id: 'story-050-skywhale-boneyard-arrival', chapter: 73, title: '천공고래 뼈무덤 진입', subtitle: '거대한 공중 생물의 유해 위 전장', npc: '원정대장 세이라', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.126 달성', goalType: 'level', target: 126, unlockZoneId: 'skywhale-boneyard', reward: { gold: 382000, gems: 1116, itemId: 'omega-token', itemCount: 1, exp: 258000 } },
  { id: 'story-050-skywhale-boneyard-scout', chapter: 73, title: '천공고래 뼈무덤 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '흑요석 가디언 누적 150마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 150, unlockZoneId: 'skywhale-boneyard', reward: { gold: 414000, gems: 1212, itemId: 'starlight-thread', itemCount: 2, exp: 276000 } },
  { id: 'story-050-skywhale-boneyard-supply', chapter: 73, title: '천공고래 뼈무덤 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '심연룡 아케론 누적 165마리 처치', goalType: 'kill', monsterId: 'dragon', target: 165, unlockZoneId: 'skywhale-boneyard', reward: { gold: 434000, gems: 1316, itemId: 'lumina-seal', itemCount: 2, exp: 289000 } },
  { id: 'story-050-skywhale-boneyard-boss', chapter: 73, title: '천공고래 뼈무덤 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 82마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 82, unlockZoneId: 'skywhale-boneyard', reward: { gold: 464000, gems: 1592, itemId: 'void-memory', itemCount: 2, exp: 314000 } },
  { id: 'story-050-skywhale-boneyard-banner', chapter: 73, title: '천공고래 뼈무덤 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.127 달성', goalType: 'level', target: 127, unlockZoneId: 'skywhale-boneyard', reward: { gold: 494000, gems: 1882, itemId: 'omega-token', itemCount: 3, exp: 340000 } },
  { id: 'story-050-aurora-spire-arrival', chapter: 74, title: '오로라 첨탑 진입', subtitle: '빛과 심연의 속성이 뒤엉킨 첨탑', npc: '예언자 미온', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.127 달성', goalType: 'level', target: 127, unlockZoneId: 'aurora-spire', reward: { gold: 395500, gems: 1134, itemId: 'omega-token', itemCount: 1, exp: 267000 } },
  { id: 'story-050-aurora-spire-scout', chapter: 74, title: '오로라 첨탑 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '폭풍 하피 누적 155마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 155, unlockZoneId: 'aurora-spire', reward: { gold: 427500, gems: 1233, itemId: 'starlight-thread', itemCount: 3, exp: 285000 } },
  { id: 'story-050-aurora-spire-supply', chapter: 74, title: '오로라 첨탑 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '야전 군주 발타르 누적 170마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 170, unlockZoneId: 'aurora-spire', reward: { gold: 447500, gems: 1339, itemId: 'lumina-seal', itemCount: 3, exp: 298000 } },
  { id: 'story-050-aurora-spire-boss', chapter: 74, title: '오로라 첨탑 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 84마리 처치', goalType: 'kill', monsterId: 'dragon', target: 84, unlockZoneId: 'aurora-spire', reward: { gold: 477500, gems: 1623, itemId: 'void-memory', itemCount: 2, exp: 323000 } },
  { id: 'story-050-aurora-spire-banner', chapter: 74, title: '오로라 첨탑 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.128 달성', goalType: 'level', target: 128, unlockZoneId: 'aurora-spire', reward: { gold: 507500, gems: 1918, itemId: 'omega-token', itemCount: 3, exp: 349000 } },
  { id: 'story-050-forgotten-colossus-arrival', chapter: 75, title: '망각 거신의 발등 진입', subtitle: '거신의 발등 위에 세워진 전초기지', npc: '대장장이 브람', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.128 달성', goalType: 'level', target: 128, unlockZoneId: 'forgotten-colossus', reward: { gold: 409000, gems: 1152, itemId: 'omega-token', itemCount: 1, exp: 276000 } },
  { id: 'story-050-forgotten-colossus-scout', chapter: 75, title: '망각 거신의 발등 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '심연룡 아케론 누적 160마리 처치', goalType: 'kill', monsterId: 'dragon', target: 160, unlockZoneId: 'forgotten-colossus', reward: { gold: 441000, gems: 1254, itemId: 'starlight-thread', itemCount: 4, exp: 294000 } },
  { id: 'story-050-forgotten-colossus-supply', chapter: 75, title: '망각 거신의 발등 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '화염 드레이크 누적 175마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 175, unlockZoneId: 'forgotten-colossus', reward: { gold: 461000, gems: 1362, itemId: 'lumina-seal', itemCount: 4, exp: 307000 } },
  { id: 'story-050-forgotten-colossus-boss', chapter: 75, title: '망각 거신의 발등 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 86마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 86, unlockZoneId: 'forgotten-colossus', reward: { gold: 491000, gems: 1654, itemId: 'void-memory', itemCount: 2, exp: 332000 } },
  { id: 'story-050-forgotten-colossus-banner', chapter: 75, title: '망각 거신의 발등 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.129 달성', goalType: 'level', target: 129, unlockZoneId: 'forgotten-colossus', reward: { gold: 521000, gems: 1954, itemId: 'omega-token', itemCount: 3, exp: 358000 } },
  { id: 'story-050-black-star-arena-arrival', chapter: 76, title: '흑성 투기장 진입', subtitle: '정예 몬스터가 끝없이 호출되는 투기장', npc: '항해사 노아', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.129 달성', goalType: 'level', target: 129, unlockZoneId: 'black-star-arena', reward: { gold: 422500, gems: 1170, itemId: 'omega-token', itemCount: 1, exp: 285000 } },
  { id: 'story-050-black-star-arena-scout', chapter: 76, title: '흑성 투기장 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '야전 군주 발타르 누적 165마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 165, unlockZoneId: 'black-star-arena', reward: { gold: 454500, gems: 1275, itemId: 'starlight-thread', itemCount: 5, exp: 303000 } },
  { id: 'story-050-black-star-arena-supply', chapter: 76, title: '흑성 투기장 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '묘지 기사 누적 180마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 180, unlockZoneId: 'black-star-arena', reward: { gold: 474500, gems: 1385, itemId: 'lumina-seal', itemCount: 2, exp: 316000 } },
  { id: 'story-050-black-star-arena-boss', chapter: 76, title: '흑성 투기장 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 88마리 처치', goalType: 'kill', monsterId: 'dragon', target: 88, unlockZoneId: 'black-star-arena', reward: { gold: 504500, gems: 1685, itemId: 'void-memory', itemCount: 2, exp: 341000 } },
  { id: 'story-050-black-star-arena-banner', chapter: 76, title: '흑성 투기장 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.130 달성', goalType: 'level', target: 130, unlockZoneId: 'black-star-arena', reward: { gold: 534500, gems: 1990, itemId: 'omega-token', itemCount: 3, exp: 367000 } },
  { id: 'story-050-dream-eater-lab-arrival', chapter: 77, title: '몽식자 연구소 진입', subtitle: '꿈을 먹는 마도 장치가 남은 실험실', npc: '전투 교관 카엘', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.130 달성', goalType: 'level', target: 130, unlockZoneId: 'dream-eater-lab', reward: { gold: 436000, gems: 1188, itemId: 'omega-token', itemCount: 1, exp: 294000 } },
  { id: 'story-050-dream-eater-lab-scout', chapter: 77, title: '몽식자 연구소 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '화염 드레이크 누적 170마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 170, unlockZoneId: 'dream-eater-lab', reward: { gold: 468000, gems: 1296, itemId: 'starlight-thread', itemCount: 2, exp: 312000 } },
  { id: 'story-050-dream-eater-lab-supply', chapter: 77, title: '몽식자 연구소 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '망령 사제 누적 185마리 처치', goalType: 'kill', monsterId: 'wraith', target: 185, unlockZoneId: 'dream-eater-lab', reward: { gold: 488000, gems: 1408, itemId: 'lumina-seal', itemCount: 3, exp: 325000 } },
  { id: 'story-050-dream-eater-lab-boss', chapter: 77, title: '몽식자 연구소 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 90마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 90, unlockZoneId: 'dream-eater-lab', reward: { gold: 518000, gems: 1716, itemId: 'void-memory', itemCount: 3, exp: 350000 } },
  { id: 'story-050-dream-eater-lab-banner', chapter: 77, title: '몽식자 연구소 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.131 달성', goalType: 'level', target: 131, unlockZoneId: 'dream-eater-lab', reward: { gold: 548000, gems: 2026, itemId: 'omega-token', itemCount: 3, exp: 376000 } },
  { id: 'story-050-crimson-crown-road-arrival', chapter: 78, title: '핏빛 왕관로 진입', subtitle: '심연왕좌로 이어지는 마지막 왕도', npc: '전략관 이리스', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.131 달성', goalType: 'level', target: 131, unlockZoneId: 'crimson-crown-road', reward: { gold: 449500, gems: 1206, itemId: 'omega-token', itemCount: 1, exp: 303000 } },
  { id: 'story-050-crimson-crown-road-scout', chapter: 78, title: '핏빛 왕관로 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '묘지 기사 누적 175마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 175, unlockZoneId: 'crimson-crown-road', reward: { gold: 481500, gems: 1317, itemId: 'starlight-thread', itemCount: 3, exp: 321000 } },
  { id: 'story-050-crimson-crown-road-supply', chapter: 78, title: '핏빛 왕관로 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '흑요석 가디언 누적 190마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 190, unlockZoneId: 'crimson-crown-road', reward: { gold: 501500, gems: 1431, itemId: 'lumina-seal', itemCount: 4, exp: 334000 } },
  { id: 'story-050-crimson-crown-road-boss', chapter: 78, title: '핏빛 왕관로 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 92마리 처치', goalType: 'kill', monsterId: 'dragon', target: 92, unlockZoneId: 'crimson-crown-road', reward: { gold: 531500, gems: 1747, itemId: 'void-memory', itemCount: 3, exp: 359000 } },
  { id: 'story-050-crimson-crown-road-banner', chapter: 78, title: '핏빛 왕관로 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.132 달성', goalType: 'level', target: 132, unlockZoneId: 'crimson-crown-road', reward: { gold: 561500, gems: 2062, itemId: 'omega-token', itemCount: 3, exp: 385000 } },
  { id: 'story-050-lunar-dragon-gate-arrival', chapter: 79, title: '월룡문 진입', subtitle: '달빛 비늘이 문처럼 솟은 드래곤 관문', npc: '원정대장 세이라', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.132 달성', goalType: 'level', target: 132, unlockZoneId: 'lunar-dragon-gate', reward: { gold: 463000, gems: 1224, itemId: 'omega-token', itemCount: 1, exp: 312000 } },
  { id: 'story-050-lunar-dragon-gate-scout', chapter: 79, title: '월룡문 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '망령 사제 누적 180마리 처치', goalType: 'kill', monsterId: 'wraith', target: 180, unlockZoneId: 'lunar-dragon-gate', reward: { gold: 495000, gems: 1338, itemId: 'starlight-thread', itemCount: 4, exp: 330000 } },
  { id: 'story-050-lunar-dragon-gate-supply', chapter: 79, title: '월룡문 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '폭풍 하피 누적 195마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 195, unlockZoneId: 'lunar-dragon-gate', reward: { gold: 515000, gems: 1454, itemId: 'lumina-seal', itemCount: 2, exp: 343000 } },
  { id: 'story-050-lunar-dragon-gate-boss', chapter: 79, title: '월룡문 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 94마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 94, unlockZoneId: 'lunar-dragon-gate', reward: { gold: 545000, gems: 1778, itemId: 'void-memory', itemCount: 3, exp: 368000 } },
  { id: 'story-050-lunar-dragon-gate-banner', chapter: 79, title: '월룡문 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.133 달성', goalType: 'level', target: 133, unlockZoneId: 'lunar-dragon-gate', reward: { gold: 575000, gems: 2098, itemId: 'omega-token', itemCount: 3, exp: 394000 } },
  { id: 'story-050-celestial-mine-arrival', chapter: 80, title: '천성광맥 심부 진입', subtitle: '성운광이 폭주하는 초월 광산', npc: '예언자 미온', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.133 달성', goalType: 'level', target: 133, unlockZoneId: 'celestial-mine', reward: { gold: 476500, gems: 1242, itemId: 'omega-token', itemCount: 1, exp: 321000 } },
  { id: 'story-050-celestial-mine-scout', chapter: 80, title: '천성광맥 심부 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '흑요석 가디언 누적 185마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 185, unlockZoneId: 'celestial-mine', reward: { gold: 508500, gems: 1359, itemId: 'starlight-thread', itemCount: 5, exp: 339000 } },
  { id: 'story-050-celestial-mine-supply', chapter: 80, title: '천성광맥 심부 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '심연룡 아케론 누적 200마리 처치', goalType: 'kill', monsterId: 'dragon', target: 200, unlockZoneId: 'celestial-mine', reward: { gold: 528500, gems: 1477, itemId: 'lumina-seal', itemCount: 3, exp: 352000 } },
  { id: 'story-050-celestial-mine-boss', chapter: 80, title: '천성광맥 심부 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 96마리 처치', goalType: 'kill', monsterId: 'dragon', target: 96, unlockZoneId: 'celestial-mine', reward: { gold: 558500, gems: 1809, itemId: 'void-memory', itemCount: 3, exp: 377000 } },
  { id: 'story-050-celestial-mine-banner', chapter: 80, title: '천성광맥 심부 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.134 달성', goalType: 'level', target: 134, unlockZoneId: 'celestial-mine', reward: { gold: 588500, gems: 2134, itemId: 'omega-token', itemCount: 3, exp: 403000 } },
  { id: 'story-050-nightmare-orchard-arrival', chapter: 81, title: '악몽 과수원 진입', subtitle: '검은 열매와 그림자 임프가 자라는 숲', npc: '대장장이 브람', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.134 달성', goalType: 'level', target: 134, unlockZoneId: 'nightmare-orchard', reward: { gold: 490000, gems: 1260, itemId: 'omega-token', itemCount: 1, exp: 330000 } },
  { id: 'story-050-nightmare-orchard-scout', chapter: 81, title: '악몽 과수원 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '폭풍 하피 누적 190마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 190, unlockZoneId: 'nightmare-orchard', reward: { gold: 522000, gems: 1380, itemId: 'starlight-thread', itemCount: 2, exp: 348000 } },
  { id: 'story-050-nightmare-orchard-supply', chapter: 81, title: '악몽 과수원 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '야전 군주 발타르 누적 205마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 205, unlockZoneId: 'nightmare-orchard', reward: { gold: 542000, gems: 1500, itemId: 'lumina-seal', itemCount: 4, exp: 361000 } },
  { id: 'story-050-nightmare-orchard-boss', chapter: 81, title: '악몽 과수원 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 98마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 98, unlockZoneId: 'nightmare-orchard', reward: { gold: 572000, gems: 1840, itemId: 'void-memory', itemCount: 3, exp: 386000 } },
  { id: 'story-050-nightmare-orchard-banner', chapter: 81, title: '악몽 과수원 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.135 달성', goalType: 'level', target: 135, unlockZoneId: 'nightmare-orchard', reward: { gold: 602000, gems: 2170, itemId: 'omega-token', itemCount: 3, exp: 412000 } },
  { id: 'story-050-oracle-last-post-arrival', chapter: 82, title: '예언자의 최후 초소 진입', subtitle: '원정대 예언자가 남긴 마지막 주둔지', npc: '항해사 노아', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.135 달성', goalType: 'level', target: 135, unlockZoneId: 'oracle-last-post', reward: { gold: 503500, gems: 1278, itemId: 'omega-token', itemCount: 1, exp: 339000 } },
  { id: 'story-050-oracle-last-post-scout', chapter: 82, title: '예언자의 최후 초소 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '심연룡 아케론 누적 195마리 처치', goalType: 'kill', monsterId: 'dragon', target: 195, unlockZoneId: 'oracle-last-post', reward: { gold: 535500, gems: 1401, itemId: 'starlight-thread', itemCount: 3, exp: 357000 } },
  { id: 'story-050-oracle-last-post-supply', chapter: 82, title: '예언자의 최후 초소 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '화염 드레이크 누적 210마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 210, unlockZoneId: 'oracle-last-post', reward: { gold: 555500, gems: 1523, itemId: 'lumina-seal', itemCount: 2, exp: 370000 } },
  { id: 'story-050-oracle-last-post-boss', chapter: 82, title: '예언자의 최후 초소 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 100마리 처치', goalType: 'kill', monsterId: 'dragon', target: 100, unlockZoneId: 'oracle-last-post', reward: { gold: 585500, gems: 1871, itemId: 'void-memory', itemCount: 3, exp: 395000 } },
  { id: 'story-050-oracle-last-post-banner', chapter: 82, title: '예언자의 최후 초소 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.136 달성', goalType: 'level', target: 136, unlockZoneId: 'oracle-last-post', reward: { gold: 615500, gems: 2206, itemId: 'omega-token', itemCount: 3, exp: 421000 } },
  { id: 'story-050-fractured-heaven-arrival', chapter: 83, title: '부서진 천계로 진입', subtitle: '천계의 잔해가 필드에 추락한 길', npc: '전투 교관 카엘', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.136 달성', goalType: 'level', target: 136, unlockZoneId: 'fractured-heaven', reward: { gold: 517000, gems: 1296, itemId: 'omega-token', itemCount: 1, exp: 348000 } },
  { id: 'story-050-fractured-heaven-scout', chapter: 83, title: '부서진 천계로 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '야전 군주 발타르 누적 200마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 200, unlockZoneId: 'fractured-heaven', reward: { gold: 549000, gems: 1422, itemId: 'starlight-thread', itemCount: 4, exp: 366000 } },
  { id: 'story-050-fractured-heaven-supply', chapter: 83, title: '부서진 천계로 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '묘지 기사 누적 215마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 215, unlockZoneId: 'fractured-heaven', reward: { gold: 569000, gems: 1546, itemId: 'lumina-seal', itemCount: 3, exp: 379000 } },
  { id: 'story-050-fractured-heaven-boss', chapter: 83, title: '부서진 천계로 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '야전 군주 발타르 누적 102마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 102, unlockZoneId: 'fractured-heaven', reward: { gold: 599000, gems: 1902, itemId: 'void-memory', itemCount: 3, exp: 404000 } },
  { id: 'story-050-fractured-heaven-banner', chapter: 83, title: '부서진 천계로 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.137 달성', goalType: 'level', target: 137, unlockZoneId: 'fractured-heaven', reward: { gold: 629000, gems: 2242, itemId: 'omega-token', itemCount: 3, exp: 430000 } },
  { id: 'story-050-omega-frontier-arrival', chapter: 84, title: '오메가 최종 전선 진입', subtitle: '현재 알파 버전의 초월 반복 최종 전선', npc: '전략관 이리스', dialogue: '새 전선이 열렸습니다. 루미나의 이름으로 이 지역을 기록하세요.', goalText: '캐릭터 Lv.137 달성', goalType: 'level', target: 137, unlockZoneId: 'omega-frontier', reward: { gold: 530500, gems: 1314, itemId: 'omega-token', itemCount: 1, exp: 357000 } },
  { id: 'story-050-omega-frontier-scout', chapter: 84, title: '오메가 최종 전선 정찰 작전', subtitle: '원정대 길목 확보', npc: '정찰병 루카', dialogue: '길목의 마물 흐름을 파악해야 다음 진지를 만들 수 있습니다.', goalText: '화염 드레이크 누적 205마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 205, unlockZoneId: 'omega-frontier', reward: { gold: 562500, gems: 1443, itemId: 'starlight-thread', itemCount: 5, exp: 375000 } },
  { id: 'story-050-omega-frontier-supply', chapter: 84, title: '오메가 최종 전선 보급선 복구', subtitle: '장기 사냥을 위한 보급선', npc: '보급관 밀라', dialogue: '전선이 길어질수록 보급이 생명입니다. 반복 사냥 루프를 안정화하세요.', goalText: '망령 사제 누적 220마리 처치', goalType: 'kill', monsterId: 'wraith', target: 220, unlockZoneId: 'omega-frontier', reward: { gold: 582500, gems: 1569, itemId: 'lumina-seal', itemCount: 4, exp: 388000 } },
  { id: 'story-050-omega-frontier-boss', chapter: 84, title: '오메가 최종 전선 결전 기록', subtitle: '정예/보스 흔적 추적', npc: '경비대장 로한', dialogue: '전선의 지배자를 처치해야 루미나의 깃발을 세울 수 있습니다.', goalText: '심연룡 아케론 누적 104마리 처치', goalType: 'kill', monsterId: 'dragon', target: 104, unlockZoneId: 'omega-frontier', reward: { gold: 612500, gems: 1933, itemId: 'void-memory', itemCount: 3, exp: 413000 } },
  { id: 'story-050-omega-frontier-banner', chapter: 84, title: '오메가 최종 전선 루미나 깃발', subtitle: '전선 완전 안정화', npc: '원정대장 세이라', dialogue: '이곳에 깃발을 세우면 다음 초월 전선으로 향하는 길이 열립니다.', goalText: '캐릭터 Lv.138 달성', goalType: 'level', target: 138, unlockZoneId: 'omega-frontier', reward: { gold: 642500, gems: 2278, itemId: 'omega-core-relic', itemCount: 1, exp: 439000 } }
];
storyQuests.push(...omegaStory);

const omegaDaily: DailyQuestDefinition[] = [
  { id: 'daily-050-astral-wharf-patrol', title: '오메가 · 성운 항구 외곽 순찰', description: '성운 항구 외곽에서 심연룡 아케론 70마리 처치', goalType: 'kill', monsterId: 'dragon', target: 70, reward: { gold: 18000, gems: 44, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-astral-wharf-longrun', title: '장기 · 성운 항구 외곽 전선 유지', description: '성운 항구 외곽에서 묘지 기사 110마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 110, reward: { gold: 26000, gems: 62, itemId: 'starlight-thread', itemCount: 3 } },
  { id: 'daily-050-astral-wharf-boss', title: '보스 · 성운 항구 외곽 지배자 추적', description: '야전 군주 발타르 5마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 5, reward: { gold: 42000, gems: 96, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-sapphire-rail-patrol', title: '오메가 · 사파이어 철로 순찰', description: '사파이어 철로에서 야전 군주 발타르 73마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 73, reward: { gold: 19300, gems: 45, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-sapphire-rail-longrun', title: '장기 · 사파이어 철로 전선 유지', description: '사파이어 철로에서 망령 사제 114마리 처치', goalType: 'kill', monsterId: 'wraith', target: 114, reward: { gold: 27700, gems: 64, itemId: 'starlight-thread', itemCount: 4 } },
  { id: 'daily-050-hollow-elm-court-patrol', title: '오메가 · 공허느릅 궁정 순찰', description: '공허느릅 궁정에서 화염 드레이크 76마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 76, reward: { gold: 20600, gems: 46, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-hollow-elm-court-longrun', title: '장기 · 공허느릅 궁정 전선 유지', description: '공허느릅 궁정에서 흑요석 가디언 118마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 118, reward: { gold: 29400, gems: 66, itemId: 'starlight-thread', itemCount: 5 } },
  { id: 'daily-050-meteor-ash-field-patrol', title: '오메가 · 유성 잿가루 평야 순찰', description: '유성 잿가루 평야에서 묘지 기사 79마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 79, reward: { gold: 21900, gems: 47, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-meteor-ash-field-longrun', title: '장기 · 유성 잿가루 평야 전선 유지', description: '유성 잿가루 평야에서 폭풍 하피 122마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 122, reward: { gold: 31100, gems: 68, itemId: 'starlight-thread', itemCount: 6 } },
  { id: 'daily-050-meteor-ash-field-boss', title: '보스 · 유성 잿가루 평야 지배자 추적', description: '심연룡 아케론 6마리 처치', goalType: 'kill', monsterId: 'dragon', target: 6, reward: { gold: 48600, gems: 105, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-red-lotus-canal-patrol', title: '오메가 · 적련 운하 순찰', description: '적련 운하에서 망령 사제 82마리 처치', goalType: 'kill', monsterId: 'wraith', target: 82, reward: { gold: 23200, gems: 48, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-red-lotus-canal-longrun', title: '장기 · 적련 운하 전선 유지', description: '적련 운하에서 심연룡 아케론 126마리 처치', goalType: 'kill', monsterId: 'dragon', target: 126, reward: { gold: 32800, gems: 70, itemId: 'starlight-thread', itemCount: 7 } },
  { id: 'daily-050-phantom-opera-patrol', title: '오메가 · 유령 오페라 극장 순찰', description: '유령 오페라 극장에서 흑요석 가디언 85마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 85, reward: { gold: 24500, gems: 49, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-phantom-opera-longrun', title: '장기 · 유령 오페라 극장 전선 유지', description: '유령 오페라 극장에서 야전 군주 발타르 130마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 130, reward: { gold: 34500, gems: 72, itemId: 'starlight-thread', itemCount: 3 } },
  { id: 'daily-050-iron-sky-bridge-patrol', title: '오메가 · 철천교 순찰', description: '철천교에서 폭풍 하피 88마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 88, reward: { gold: 25800, gems: 50, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-iron-sky-bridge-longrun', title: '장기 · 철천교 전선 유지', description: '철천교에서 화염 드레이크 134마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 134, reward: { gold: 36200, gems: 74, itemId: 'starlight-thread', itemCount: 4 } },
  { id: 'daily-050-iron-sky-bridge-boss', title: '보스 · 철천교 지배자 추적', description: '야전 군주 발타르 7마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 7, reward: { gold: 55200, gems: 114, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-obsidian-harbor-patrol', title: '오메가 · 흑요석 항만 순찰', description: '흑요석 항만에서 심연룡 아케론 91마리 처치', goalType: 'kill', monsterId: 'dragon', target: 91, reward: { gold: 27100, gems: 51, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-obsidian-harbor-longrun', title: '장기 · 흑요석 항만 전선 유지', description: '흑요석 항만에서 묘지 기사 138마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 138, reward: { gold: 37900, gems: 76, itemId: 'starlight-thread', itemCount: 5 } },
  { id: 'daily-050-mirror-forest-patrol', title: '오메가 · 거울숲 순찰', description: '거울숲에서 야전 군주 발타르 94마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 94, reward: { gold: 28400, gems: 52, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-mirror-forest-longrun', title: '장기 · 거울숲 전선 유지', description: '거울숲에서 망령 사제 142마리 처치', goalType: 'kill', monsterId: 'wraith', target: 142, reward: { gold: 39600, gems: 78, itemId: 'starlight-thread', itemCount: 6 } },
  { id: 'daily-050-void-monastery-patrol', title: '오메가 · 무공 수도원 순찰', description: '무공 수도원에서 화염 드레이크 97마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 97, reward: { gold: 29700, gems: 53, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-void-monastery-longrun', title: '장기 · 무공 수도원 전선 유지', description: '무공 수도원에서 흑요석 가디언 146마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 146, reward: { gold: 41300, gems: 80, itemId: 'starlight-thread', itemCount: 7 } },
  { id: 'daily-050-void-monastery-boss', title: '보스 · 무공 수도원 지배자 추적', description: '심연룡 아케론 8마리 처치', goalType: 'kill', monsterId: 'dragon', target: 8, reward: { gold: 61800, gems: 123, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-sunken-clocktower-patrol', title: '오메가 · 침몰 시계탑 순찰', description: '침몰 시계탑에서 묘지 기사 100마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 100, reward: { gold: 31000, gems: 54, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-sunken-clocktower-longrun', title: '장기 · 침몰 시계탑 전선 유지', description: '침몰 시계탑에서 폭풍 하피 150마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 150, reward: { gold: 43000, gems: 82, itemId: 'starlight-thread', itemCount: 3 } },
  { id: 'daily-050-scarlet-snowfield-patrol', title: '오메가 · 주홍 설원 순찰', description: '주홍 설원에서 망령 사제 103마리 처치', goalType: 'kill', monsterId: 'wraith', target: 103, reward: { gold: 32300, gems: 55, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-scarlet-snowfield-longrun', title: '장기 · 주홍 설원 전선 유지', description: '주홍 설원에서 심연룡 아케론 154마리 처치', goalType: 'kill', monsterId: 'dragon', target: 154, reward: { gold: 44700, gems: 84, itemId: 'starlight-thread', itemCount: 4 } },
  { id: 'daily-050-skywhale-boneyard-patrol', title: '오메가 · 천공고래 뼈무덤 순찰', description: '천공고래 뼈무덤에서 흑요석 가디언 106마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 106, reward: { gold: 33600, gems: 56, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-skywhale-boneyard-longrun', title: '장기 · 천공고래 뼈무덤 전선 유지', description: '천공고래 뼈무덤에서 야전 군주 발타르 158마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 158, reward: { gold: 46400, gems: 86, itemId: 'starlight-thread', itemCount: 5 } },
  { id: 'daily-050-skywhale-boneyard-boss', title: '보스 · 천공고래 뼈무덤 지배자 추적', description: '야전 군주 발타르 9마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 9, reward: { gold: 68400, gems: 132, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-aurora-spire-patrol', title: '오메가 · 오로라 첨탑 순찰', description: '오로라 첨탑에서 폭풍 하피 109마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 109, reward: { gold: 34900, gems: 57, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-aurora-spire-longrun', title: '장기 · 오로라 첨탑 전선 유지', description: '오로라 첨탑에서 화염 드레이크 162마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 162, reward: { gold: 48100, gems: 88, itemId: 'starlight-thread', itemCount: 6 } },
  { id: 'daily-050-forgotten-colossus-patrol', title: '오메가 · 망각 거신의 발등 순찰', description: '망각 거신의 발등에서 심연룡 아케론 112마리 처치', goalType: 'kill', monsterId: 'dragon', target: 112, reward: { gold: 36200, gems: 58, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-forgotten-colossus-longrun', title: '장기 · 망각 거신의 발등 전선 유지', description: '망각 거신의 발등에서 묘지 기사 166마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 166, reward: { gold: 49800, gems: 90, itemId: 'starlight-thread', itemCount: 7 } },
  { id: 'daily-050-black-star-arena-patrol', title: '오메가 · 흑성 투기장 순찰', description: '흑성 투기장에서 야전 군주 발타르 115마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 115, reward: { gold: 37500, gems: 59, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-black-star-arena-longrun', title: '장기 · 흑성 투기장 전선 유지', description: '흑성 투기장에서 망령 사제 170마리 처치', goalType: 'kill', monsterId: 'wraith', target: 170, reward: { gold: 51500, gems: 92, itemId: 'starlight-thread', itemCount: 3 } },
  { id: 'daily-050-black-star-arena-boss', title: '보스 · 흑성 투기장 지배자 추적', description: '심연룡 아케론 10마리 처치', goalType: 'kill', monsterId: 'dragon', target: 10, reward: { gold: 75000, gems: 141, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-dream-eater-lab-patrol', title: '오메가 · 몽식자 연구소 순찰', description: '몽식자 연구소에서 화염 드레이크 118마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 118, reward: { gold: 38800, gems: 60, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-dream-eater-lab-longrun', title: '장기 · 몽식자 연구소 전선 유지', description: '몽식자 연구소에서 흑요석 가디언 174마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 174, reward: { gold: 53200, gems: 94, itemId: 'starlight-thread', itemCount: 4 } },
  { id: 'daily-050-crimson-crown-road-patrol', title: '오메가 · 핏빛 왕관로 순찰', description: '핏빛 왕관로에서 묘지 기사 121마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 121, reward: { gold: 40100, gems: 61, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-crimson-crown-road-longrun', title: '장기 · 핏빛 왕관로 전선 유지', description: '핏빛 왕관로에서 폭풍 하피 178마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 178, reward: { gold: 54900, gems: 96, itemId: 'starlight-thread', itemCount: 5 } },
  { id: 'daily-050-lunar-dragon-gate-patrol', title: '오메가 · 월룡문 순찰', description: '월룡문에서 망령 사제 124마리 처치', goalType: 'kill', monsterId: 'wraith', target: 124, reward: { gold: 41400, gems: 62, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-lunar-dragon-gate-longrun', title: '장기 · 월룡문 전선 유지', description: '월룡문에서 심연룡 아케론 182마리 처치', goalType: 'kill', monsterId: 'dragon', target: 182, reward: { gold: 56600, gems: 98, itemId: 'starlight-thread', itemCount: 6 } },
  { id: 'daily-050-lunar-dragon-gate-boss', title: '보스 · 월룡문 지배자 추적', description: '야전 군주 발타르 11마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 11, reward: { gold: 81600, gems: 150, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-celestial-mine-patrol', title: '오메가 · 천성광맥 심부 순찰', description: '천성광맥 심부에서 흑요석 가디언 127마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 127, reward: { gold: 42700, gems: 63, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-celestial-mine-longrun', title: '장기 · 천성광맥 심부 전선 유지', description: '천성광맥 심부에서 야전 군주 발타르 186마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 186, reward: { gold: 58300, gems: 100, itemId: 'starlight-thread', itemCount: 7 } },
  { id: 'daily-050-nightmare-orchard-patrol', title: '오메가 · 악몽 과수원 순찰', description: '악몽 과수원에서 폭풍 하피 130마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 130, reward: { gold: 44000, gems: 64, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-nightmare-orchard-longrun', title: '장기 · 악몽 과수원 전선 유지', description: '악몽 과수원에서 화염 드레이크 190마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 190, reward: { gold: 60000, gems: 102, itemId: 'starlight-thread', itemCount: 3 } },
  { id: 'daily-050-oracle-last-post-patrol', title: '오메가 · 예언자의 최후 초소 순찰', description: '예언자의 최후 초소에서 심연룡 아케론 133마리 처치', goalType: 'kill', monsterId: 'dragon', target: 133, reward: { gold: 45300, gems: 65, itemId: 'omega-token', itemCount: 1 } },
  { id: 'daily-050-oracle-last-post-longrun', title: '장기 · 예언자의 최후 초소 전선 유지', description: '예언자의 최후 초소에서 묘지 기사 194마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 194, reward: { gold: 61700, gems: 104, itemId: 'starlight-thread', itemCount: 4 } },
  { id: 'daily-050-oracle-last-post-boss', title: '보스 · 예언자의 최후 초소 지배자 추적', description: '심연룡 아케론 12마리 처치', goalType: 'kill', monsterId: 'dragon', target: 12, reward: { gold: 88200, gems: 159, itemId: 'void-memory', itemCount: 1 } },
  { id: 'daily-050-fractured-heaven-patrol', title: '오메가 · 부서진 천계로 순찰', description: '부서진 천계로에서 야전 군주 발타르 136마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 136, reward: { gold: 46600, gems: 66, itemId: 'omega-token', itemCount: 2 } },
  { id: 'daily-050-fractured-heaven-longrun', title: '장기 · 부서진 천계로 전선 유지', description: '부서진 천계로에서 망령 사제 198마리 처치', goalType: 'kill', monsterId: 'wraith', target: 198, reward: { gold: 63400, gems: 106, itemId: 'starlight-thread', itemCount: 5 } },
  { id: 'daily-050-omega-frontier-patrol', title: '오메가 · 오메가 최종 전선 순찰', description: '오메가 최종 전선에서 화염 드레이크 139마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 139, reward: { gold: 47900, gems: 67, itemId: 'omega-token', itemCount: 3 } },
  { id: 'daily-050-omega-frontier-longrun', title: '장기 · 오메가 최종 전선 전선 유지', description: '오메가 최종 전선에서 흑요석 가디언 202마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 202, reward: { gold: 65100, gems: 108, itemId: 'starlight-thread', itemCount: 6 } }
];
dailyQuests.push(...omegaDaily);

dailyQuests.push(
  { id: 'daily-050-weekly-omega-1', title: '주간 · 오메가 보스 집결', description: '야전 군주 발타르 18마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 18, reward: { gold: 120000, gems: 260, itemId: 'void-memory', itemCount: 2 } },
  { id: 'daily-050-weekly-omega-2', title: '주간 · 심연룡 대추적', description: '심연룡 아케론 18마리 처치', goalType: 'kill', monsterId: 'dragon', target: 18, reward: { gold: 135000, gems: 300, itemId: 'void-memory', itemCount: 2 } },
  { id: 'daily-050-weekly-omega-3', title: '주간 · 드레이크 화염 봉쇄', description: '화염 드레이크 240마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 240, reward: { gold: 98000, gems: 180, itemId: 'omega-token', itemCount: 8 } },
  { id: 'daily-050-weekly-omega-4', title: '주간 · 묘지 기사단 해체', description: '묘지 기사 240마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 240, reward: { gold: 98000, gems: 180, itemId: 'omega-token', itemCount: 8 } },
  { id: 'daily-050-weekly-omega-5', title: '주간 · 망령 합창 정지', description: '망령 사제 260마리 처치', goalType: 'kill', monsterId: 'wraith', target: 260, reward: { gold: 104000, gems: 190, itemId: 'starlight-thread', itemCount: 12 } },
  { id: 'daily-050-weekly-omega-6', title: '주간 · 가디언 장갑 파쇄', description: '흑요석 가디언 220마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 220, reward: { gold: 108000, gems: 200, itemId: 'radiant-ore', itemCount: 4 } },
  { id: 'daily-050-weekly-omega-7', title: '주간 · 폭풍 하피 제공권 장악', description: '폭풍 하피 260마리 처치', goalType: 'kill', monsterId: 'stormHarpy', target: 260, reward: { gold: 102000, gems: 185, itemId: 'starlight-thread', itemCount: 12 } },
  { id: 'daily-050-weekly-omega-8', title: '주간 · 오메가 최종 훈련', description: '캐릭터 Lv.137 달성', goalType: 'level', target: 137, reward: { gold: 160000, gems: 360, itemId: 'omega-core-relic', itemCount: 1 } }
);


// Alpha 0.53: Blood Pledge, NPC contracts, prestige frontier and design overhaul data.
const alpha053Items: ItemDefinition[] = [
  { id: 'pledge-coin', name: '혈맹 공헌 주화', type: 'material', rarity: 'SR', effectText: '혈맹 훈련과 마을 의뢰에 쓰이는 공헌 주화입니다.', bonus: {} },
  { id: 'royal-seal', name: '군주의 인장', type: 'material', rarity: 'SSR', effectText: '보스 토벌대와 성채 전선에서 얻는 고급 혈맹 재료입니다.', bonus: {} },
  { id: 'npc-favor', name: '루미나 평판 증서', type: 'material', rarity: 'R', effectText: '마을 NPC 의뢰를 완료하면 받는 평판 증서입니다.', bonus: {} },
  { id: 'pledge-banner', name: '혈맹 전투 깃발', type: 'relic', rarity: 'SSR', effectText: 'HP +180, 공격 +18, 방어 +14. 혈맹 전선에서 빛나는 전투 깃발입니다.', bonus: { hp: 180, atk: 18, def: 14 } },
  { id: 'royal-commander-sword', name: '군주 지휘검', type: 'weapon', rarity: 'UR', effectText: '공격 +72, 방어 +18, 치명 +5%. 혈맹 지휘관에게 내려지는 장검입니다.', bonus: { atk: 72, def: 18, crit: 0.05 } },
  { id: 'sentinel-plate', name: '성채 파수갑주', type: 'armor', rarity: 'UR', effectText: 'HP +360, 방어 +44, 공격 +10. 성채 수호자의 중갑입니다.', bonus: { hp: 360, def: 44, atk: 10 } },
  { id: 'village-contract-box', name: '마을 의뢰 보급함', type: 'consumable', rarity: 'SR', effectText: '마을 NPC 의뢰 보상 상자입니다. 사용하면 공헌 주화와 재료를 얻습니다.', bonus: {} },
  { id: 'pledge-war-cache', name: '혈맹 전쟁 궤짝', type: 'consumable', rarity: 'SSR', effectText: '혈맹 공헌으로 교환하는 전쟁 궤짝입니다. 희귀 장비와 재료를 노릴 수 있습니다.', bonus: {} }
];
for (const item of alpha053Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha053Zones: ZoneDefinition[] = [
  { id: 'pledge-training-yard', order: 73, title: '혈맹 훈련장', subtitle: '루미나 혈맹이 새로 세운 실전 훈련장', description: '혈맹 공헌과 NPC 계약 의뢰를 함께 진행하는 신규 전선입니다.', recommendedLevel: 138, monsterIds: ['goblin', 'graveKnight', 'fieldBoss', 'stormHarpy'], entry: { x: 9.2, y: 23.8 }, unlockLevel: 138, badge: '73' },
  { id: 'moon-pledge-road', order: 74, title: '월광 혈맹로', subtitle: '깃발과 등불이 이어지는 밤의 전장', description: '성향과 혈맹 보너스가 체감되는 고위험 사냥터입니다.', recommendedLevel: 139, monsterIds: ['wolf', 'wraith', 'stormHarpy', 'dragon'], entry: { x: 12.8, y: 21.6 }, unlockLevel: 139, badge: '74' },
  { id: 'sentinel-fortress', order: 75, title: '파수 성채', subtitle: '고대 성벽 위에서 보스 군단이 집결하는 곳', description: '혈맹 전쟁 궤짝과 군주의 인장을 노리는 성채형 전선입니다.', recommendedLevel: 140, monsterIds: ['graveKnight', 'crystalBear', 'fieldBoss', 'dragon'], entry: { x: 15.6, y: 24.0 }, unlockLevel: 140, badge: '75' },
  { id: 'red-banner-front', order: 76, title: '적기 전초전', subtitle: '붉은 깃발이 몰려드는 전선의 시작', description: '장기 자동사냥과 수동 보스 대응 모두를 요구하는 신규 전초전입니다.', recommendedLevel: 141, monsterIds: ['fireDrake', 'graveKnight', 'fieldBoss', 'wraith'], entry: { x: 18.5, y: 25.4 }, unlockLevel: 141, badge: '76' },
  { id: 'oracle-mirror-town', order: 77, title: '거울 예언촌', subtitle: '마을의 그림자가 투영된 환영 전장', description: '마을 NPC 의뢰와 연결되는 스토리형 사냥터입니다.', recommendedLevel: 142, monsterIds: ['wraith', 'mossGolem', 'stormHarpy', 'dragon'], entry: { x: 22.4, y: 19.2 }, unlockLevel: 142, badge: '77' },
  { id: 'crown-raid-gate', order: 78, title: '왕관 레이드 관문', subtitle: '군주 보상 루프가 열리는 최상위 관문', description: '보스 훈장, 군주의 인장, 혈맹 궤짝을 노리는 레이드 관문입니다.', recommendedLevel: 143, monsterIds: ['fieldBoss', 'dragon', 'fireDrake', 'graveKnight'], entry: { x: 26.0, y: 23.0 }, unlockLevel: 143, badge: '78' }
];
for (const zone of alpha053Zones) {
  if (!zones.some((old) => old.id === zone.id)) zones.push(zone);
}
zones.sort((a, b) => a.order - b.order);

const alpha053Story: StoryQuestDefinition[] = alpha053Zones.flatMap((zone, index) => {
  const chapter = 81 + index;
  const level = zone.recommendedLevel;
  const monsterA = zone.monsterIds[0];
  const monsterB = zone.monsterIds[1];
  const boss = zone.monsterIds.includes('dragon') ? 'dragon' : 'fieldBoss';
  return [
    { id: `story-053-${zone.id}-arrival`, chapter, title: `${zone.title} 진입`, subtitle: '혈맹 원정 개시', npc: '혈맹 지휘관 아렌', dialogue: '루미나의 깃발은 이제 혼자가 아니라 혈맹의 이름으로 세워집니다.', goalText: `캐릭터 Lv.${level} 달성`, goalType: 'level', target: level, unlockZoneId: zone.id, reward: { gold: 590000 + index * 38000, gems: 2200 + index * 120, itemId: 'pledge-coin', itemCount: 3 + index, exp: 410000 + index * 25000 } },
    { id: `story-053-${zone.id}-contract`, chapter, title: `${zone.title} 마을 계약`, subtitle: 'NPC 계약 의뢰', npc: '상단장 밀라', dialogue: '사냥만으로는 전선을 유지할 수 없어요. 마을 계약품을 회수해 주세요.', goalText: `${monsterName(monsterA)} 누적 ${150 + index * 20}마리 처치`, goalType: 'kill', monsterId: monsterA, target: 150 + index * 20, unlockZoneId: zone.id, reward: { gold: 630000 + index * 42000, gems: 2400 + index * 130, itemId: 'npc-favor', itemCount: 4 + index, exp: 438000 + index * 28000 } },
    { id: `story-053-${zone.id}-banner`, chapter, title: `${zone.title} 깃발 세우기`, subtitle: '혈맹 전선 안정화', npc: '대장장이 브람', dialogue: '깃발은 무기가 아니라 약속입니다. 지켜낼 힘을 증명하세요.', goalText: `${monsterName(monsterB)} 누적 ${165 + index * 22}마리 처치`, goalType: 'kill', monsterId: monsterB, target: 165 + index * 22, unlockZoneId: zone.id, reward: { gold: 680000 + index * 46000, gems: 2600 + index * 140, itemId: 'pledge-banner', itemCount: index === 0 ? 1 : 0, exp: 468000 + index * 30000 } },
    { id: `story-053-${zone.id}-lord`, chapter, title: `${zone.title} 군주 토벌`, subtitle: '레이드 보상 루프', npc: '경비대장 로한', dialogue: '보스의 깃발을 꺾으면 군주의 인장이 떨어질 겁니다.', goalText: `${monsterName(boss)} 누적 ${100 + index * 8}마리 처치`, goalType: 'kill', monsterId: boss, target: 100 + index * 8, unlockZoneId: zone.id, reward: { gold: 760000 + index * 52000, gems: 2900 + index * 160, itemId: 'royal-seal', itemCount: 1 + Math.floor(index / 2), exp: 520000 + index * 34000 } }
  ];
});
for (const quest of alpha053Story) {
  if (!storyQuests.some((old) => old.id === quest.id)) storyQuests.push(quest);
}
storyQuests.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));

const alpha053Daily: DailyQuestDefinition[] = [
  { id: 'daily-053-pledge-training', title: '혈맹 · 훈련장 정화', description: '혈맹 훈련장에서 묘지 기사 160마리 처치', goalType: 'kill', monsterId: 'graveKnight', target: 160, reward: { gold: 72000, gems: 120, itemId: 'pledge-coin', itemCount: 5 } },
  { id: 'daily-053-pledge-boss', title: '혈맹 · 보스 깃발 탈환', description: '야전 군주 발타르 12마리 처치', goalType: 'kill', monsterId: 'fieldBoss', target: 12, reward: { gold: 125000, gems: 230, itemId: 'royal-seal', itemCount: 1 } },
  { id: 'daily-053-village-contract', title: '마을 · NPC 계약품 회수', description: '망령 사제 180마리 처치', goalType: 'kill', monsterId: 'wraith', target: 180, reward: { gold: 88000, gems: 140, itemId: 'npc-favor', itemCount: 6 } },
  { id: 'daily-053-dragon-watch', title: '혈맹 · 심연룡 감시', description: '심연룡 아케론 10마리 처치', goalType: 'kill', monsterId: 'dragon', target: 10, reward: { gold: 148000, gems: 280, itemId: 'pledge-war-cache', itemCount: 1 } },
  { id: 'daily-053-red-banner', title: '성채 · 붉은 깃발 파괴', description: '화염 드레이크 220마리 처치', goalType: 'kill', monsterId: 'fireDrake', target: 220, reward: { gold: 96000, gems: 170, itemId: 'pledge-coin', itemCount: 8 } },
  { id: 'daily-053-sentinel-wall', title: '성채 · 파수벽 복구', description: '흑요석 가디언 190마리 처치', goalType: 'kill', monsterId: 'crystalBear', target: 190, reward: { gold: 102000, gems: 180, itemId: 'npc-favor', itemCount: 8 } }
];
for (const quest of alpha053Daily) {
  if (!dailyQuests.some((old) => old.id === quest.id)) dailyQuests.push(quest);
}

const alpha053DropOverlay: Record<string, Array<{ type: 'gold' | 'gem' | 'item' | 'card'; id?: string; amount?: number; chance: number }>> = {
  goblin: [{ type: 'item', id: 'pledge-coin', chance: 0.06 }, { type: 'item', id: 'village-contract-box', chance: 0.012 }],
  wraith: [{ type: 'item', id: 'npc-favor', chance: 0.05 }, { type: 'item', id: 'pledge-coin', chance: 0.035 }],
  graveKnight: [{ type: 'item', id: 'pledge-coin', chance: 0.075 }, { type: 'item', id: 'pledge-banner', chance: 0.006 }],
  fireDrake: [{ type: 'item', id: 'royal-seal', chance: 0.018 }, { type: 'item', id: 'pledge-war-cache', chance: 0.012 }],
  fieldBoss: [{ type: 'item', id: 'royal-seal', chance: 0.20 }, { type: 'item', id: 'royal-commander-sword', chance: 0.012 }, { type: 'item', id: 'pledge-war-cache', chance: 0.18 }],
  dragon: [{ type: 'item', id: 'royal-seal', chance: 0.30 }, { type: 'item', id: 'sentinel-plate', chance: 0.014 }, { type: 'item', id: 'pledge-war-cache', chance: 0.24 }]
};
for (const monster of monsters) {
  const extraDrops = alpha053DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}


// Alpha 0.54: Combat art, field quality, broader loot tables and Lineage-like long-tail farming polish.
const alpha054Items: ItemDefinition[] = [
  { id: 'orc-war-axe', name: '오크 전쟁도끼', type: 'weapon', rarity: 'SR', effectText: '공격 +31, HP +42. 거친 근접 파밍용 전투 도끼입니다.', bonus: { atk: 31, hp: 42 } },
  { id: 'phantom-claw', name: '악몽 박쥐 발톱', type: 'weapon', rarity: 'SSR', effectText: '공격 +46, 공속 +7%, 치명 +4%. 빠른 타격감용 쌍수 무기입니다.', bonus: { atk: 46, aspd: 0.07, crit: 0.04 } },
  { id: 'frost-oracle-wand', name: '빙결 예언봉', type: 'weapon', rarity: 'SSR', effectText: '공격 +40, MP +140, 치명 +3%. 빙결 의식이 새겨진 지팡이입니다.', bonus: { atk: 40, mp: 140, crit: 0.03 } },
  { id: 'rift-beast-core', name: '균열수 심장핵', type: 'relic', rarity: 'UR', effectText: 'HP +220, 공격 +38, 방어 +18, 치명 +5%. 균열수의 심장 에너지가 응축된 유물입니다.', bonus: { hp: 220, atk: 38, def: 18, crit: 0.05 } },
  { id: 'royal-guard-halberd', name: '왕실 파수장창', type: 'weapon', rarity: 'UR', effectText: '공격 +92, 방어 +16, 치명 +9%. 왕관 레이드 관문을 지키던 장창입니다.', bonus: { atk: 92, def: 16, crit: 0.09 } },
  { id: 'molten-guard-plate', name: '용암 골렘 판갑', type: 'armor', rarity: 'SSR', effectText: 'HP +260, 방어 +46, 공격 +12. 불길을 견디는 중갑입니다.', bonus: { hp: 260, def: 46, atk: 12 } },
  { id: 'ice-silk-robe', name: '서리실크 로브', type: 'armor', rarity: 'SSR', effectText: 'MP +190, 방어 +26, 공속 +4%. 마법형 사냥에 어울리는 로브입니다.', bonus: { mp: 190, def: 26, aspd: 0.04 } },
  { id: 'battle-coin', name: '전장 주화', type: 'material', rarity: 'R', effectText: '일반 사냥과 반복 의뢰에서 모으는 장기 파밍 재료입니다.', bonus: {} },
  { id: 'monster-essence', name: '몬스터 정수', type: 'material', rarity: 'SR', effectText: '몬스터별 전리품 제작과 강화 보조 재료입니다.', bonus: {} },
  { id: 'field-repair-kit', name: '야전 수리 키트', type: 'consumable', rarity: 'R', effectText: 'HP와 MP를 각각 1.5% 회복하는 보조 보급품입니다.', bonus: {}, consume: { hpPercent: 0.015, mpPercent: 0.015 } },
  { id: 'blessed-scroll', name: '축복받은 강화 주문서', type: 'material', rarity: 'SSR', effectText: '+12 이후 강화 보조 재료. 후반 강화 성공 체감을 보강합니다.', bonus: {} },
  { id: 'blood-mark', name: '성향의 혈흔', type: 'material', rarity: 'SR', effectText: '라우풀/카오틱 성향 보상과 보스 상자 교환에 쓰입니다.', bonus: {} }
];
for (const item of alpha054Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha054Monsters: MonsterDefinition[] = [
  { id: 'orcBerserker', name: '오크 광전사', level: 28, sprite: textureUrls.monsterGoblin, stats: { hp: 2100, mp: 0, atk: 230, def: 88, aspd: 0.92, crit: 0.12, move: 1.85 }, exp: 420, gold: 330, respawnMs: 9800, drops: [{ type: 'gold', amount: 280, chance: 1 }, { type: 'item', id: 'battle-coin', chance: 0.18 }, { type: 'item', id: 'orc-war-axe', chance: 0.018 }, { type: 'item', id: 'field-repair-kit', chance: 0.055 }] },
  { id: 'nightmareBat', name: '악몽 박쥐', level: 42, sprite: textureUrls.monsterWolf, stats: { hp: 1850, mp: 0, atk: 310, def: 72, aspd: 1.46, crit: 0.2, move: 2.85 }, exp: 620, gold: 460, respawnMs: 8400, drops: [{ type: 'gold', amount: 380, chance: 1 }, { type: 'item', id: 'monster-essence', chance: 0.11 }, { type: 'item', id: 'phantom-claw', chance: 0.012 }, { type: 'item', id: 'mp-potion-high', chance: 0.045 }] },
  { id: 'lavaGolem', name: '용암 골렘', level: 66, sprite: textureUrls.monsterBear, stats: { hp: 9200, mp: 0, atk: 610, def: 260, aspd: 0.65, crit: 0.08, move: 1.18 }, exp: 1800, gold: 1450, respawnMs: 16000, drops: [{ type: 'gold', amount: 1200, chance: 1 }, { type: 'item', id: 'enhance-stone', chance: 0.34 }, { type: 'item', id: 'molten-guard-plate', chance: 0.011 }, { type: 'item', id: 'blessed-scroll', chance: 0.035 }] },
  { id: 'iceWitch', name: '빙결 예언마녀', level: 88, sprite: textureUrls.monsterWraithSheet, stats: { hp: 7200, mp: 0, atk: 760, def: 180, aspd: 0.96, crit: 0.18, move: 1.72 }, exp: 2600, gold: 1980, respawnMs: 14000, drops: [{ type: 'gold', amount: 1600, chance: 1 }, { type: 'item', id: 'frost-oracle-wand', chance: 0.013 }, { type: 'item', id: 'ice-silk-robe', chance: 0.012 }, { type: 'item', id: 'blood-mark', chance: 0.08 }] },
  { id: 'royalGuard', name: '왕실 파수병', level: 118, sprite: textureUrls.monsterFieldBossSheet, stats: { hp: 24000, mp: 0, atk: 1180, def: 420, aspd: 0.82, crit: 0.14, move: 1.46 }, exp: 5200, gold: 4200, respawnMs: 32000, drops: [{ type: 'gold', amount: 3600, chance: 1 }, { type: 'item', id: 'royal-seal', chance: 0.22 }, { type: 'item', id: 'royal-guard-halberd', chance: 0.012 }, { type: 'item', id: 'pledge-war-cache', chance: 0.08 }] },
  { id: 'riftBeast', name: '균열수 베히모스', level: 145, sprite: textureUrls.bossDragon, stats: { hp: 54000, mp: 0, atk: 1680, def: 560, aspd: 0.58, crit: 0.18, move: 1.12 }, exp: 9800, gold: 9200, respawnMs: 65000, drops: [{ type: 'gold', amount: 7600, chance: 1 }, { type: 'gem', amount: 34, chance: 0.58 }, { type: 'item', id: 'rift-beast-core', chance: 0.018 }, { type: 'item', id: 'ancient-boss-cache', chance: 0.16 }, { type: 'item', id: 'blood-mark', chance: 0.18 }] }
];
for (const monster of alpha054Monsters) {
  if (!monsters.some((old) => old.id === monster.id)) monsters.push(monster);
}

const alpha054Zones: ZoneDefinition[] = [
  { id: 'orc-battlefield', order: 79, title: '오크 격전 평원', subtitle: '광전사와 붉은 깃발이 충돌하는 평원', description: '일반 몬스터 체급을 올리고 타격감과 드랍 루프를 점검하는 신규 전장입니다.', recommendedLevel: 144, monsterIds: ['orcBerserker', 'graveKnight', 'fieldBoss', 'nightmareBat'], entry: { x: 8.6, y: 23.8 }, unlockLevel: 144, badge: '79' },
  { id: 'nightmare-roost', order: 80, title: '악몽 박쥐 둥지', subtitle: '빠른 비행형 몬스터가 몰려드는 어둠의 둥지', description: '빠른 접근과 다단 공격 피드백을 체감하는 사냥터입니다.', recommendedLevel: 146, monsterIds: ['nightmareBat', 'wraith', 'stormHarpy', 'iceWitch'], entry: { x: 12.4, y: 21.2 }, unlockLevel: 146, badge: '80' },
  { id: 'molten-core-works', order: 81, title: '용암 핵 제련장', subtitle: '불길 속 강화 재료와 골렘 판갑이 잠든 제련장', description: '강화석, 축복 주문서, 방어구 파밍을 노리는 중후반 제련장입니다.', recommendedLevel: 148, monsterIds: ['lavaGolem', 'fireDrake', 'crystalBear', 'fieldBoss'], entry: { x: 17.8, y: 24.0 }, unlockLevel: 148, badge: '81' },
  { id: 'frost-oracle-court', order: 82, title: '서리 예언 궁정', subtitle: '빙결 마녀와 파수병이 지키는 하얀 궁정', description: '마법형 장비와 성향 재료를 노리는 고급 사냥터입니다.', recommendedLevel: 150, monsterIds: ['iceWitch', 'royalGuard', 'wraith', 'dragon'], entry: { x: 22.0, y: 18.6 }, unlockLevel: 150, badge: '82' },
  { id: 'royal-blood-keep', order: 83, title: '왕혈 성채', subtitle: '혈맹과 라우풀 성향이 시험받는 붉은 성채', description: '왕실 파수 장비와 성향의 혈흔을 노리는 리니지식 장기 파밍 전선입니다.', recommendedLevel: 152, monsterIds: ['royalGuard', 'orcBerserker', 'fieldBoss', 'dragon'], entry: { x: 26.2, y: 24.6 }, unlockLevel: 152, badge: '83' },
  { id: 'behemoth-rift', order: 84, title: '베히모스 균열', subtitle: '균열수 베히모스가 잠복한 최상위 균열', description: '상자, UR 유물, 성향 보상, 보스 연출을 모두 노리는 0.55 품질 패스 최상위 전선입니다.', recommendedLevel: 155, monsterIds: ['riftBeast', 'royalGuard', 'lavaGolem', 'dragon'], entry: { x: 31.0, y: 22.2 }, unlockLevel: 155, badge: '84' }
];
for (const zone of alpha054Zones) {
  if (!zones.some((old) => old.id === zone.id)) zones.push(zone);
}
zones.sort((a, b) => a.order - b.order);

const alpha054Story: StoryQuestDefinition[] = alpha054Zones.flatMap((zone, index) => {
  const chapter = 90 + index;
  const first = zone.monsterIds[0];
  const second = zone.monsterIds[1];
  return [
    { id: `story-054-${zone.id}-scout`, chapter, title: `${zone.title} 정찰`, subtitle: '신규 전선 개방', npc: '전선 설계사 라일', dialogue: '이제 숫자만 많은 전장이 아니라, 몬스터와 바닥, 오브젝트가 서로 맞물리는 전장을 만들어야 합니다.', goalText: `캐릭터 Lv.${zone.recommendedLevel} 달성`, goalType: 'level', target: zone.recommendedLevel, unlockZoneId: zone.id, reward: { gold: 860000 + index * 64000, gems: 3100 + index * 220, itemId: 'battle-coin', itemCount: 10 + index * 2, exp: 620000 + index * 43000 } },
    { id: `story-054-${zone.id}-hunt-a`, chapter, title: `${zone.title} 주력 토벌`, subtitle: '사냥 모션 검수', npc: '무기교관 세이라', dialogue: '모션은 보기만 좋아서는 안 됩니다. 타격 순간, 몬스터 반응, 드랍 연출이 동시에 살아야 하죠.', goalText: `${monsterName(first)} 누적 ${180 + index * 24}마리 처치`, goalType: 'kill', monsterId: first, target: 180 + index * 24, unlockZoneId: zone.id, reward: { gold: 940000 + index * 70000, gems: 3400 + index * 240, itemId: 'monster-essence', itemCount: 8 + index, exp: 680000 + index * 46000 } },
    { id: `story-054-${zone.id}-hunt-b`, chapter, title: `${zone.title} 전장 정비`, subtitle: '필드 오브젝트 검수', npc: '마을 장인 브람', dialogue: '바닥 하나, 나무 하나도 전장의 일부입니다. 부자연스러운 장식은 전부 다시 고치겠습니다.', goalText: `${monsterName(second)} 누적 ${160 + index * 20}마리 처치`, goalType: 'kill', monsterId: second, target: 160 + index * 20, unlockZoneId: zone.id, reward: { gold: 980000 + index * 76000, gems: 3600 + index * 260, itemId: 'blessed-scroll', itemCount: index > 1 ? 1 : 0, exp: 720000 + index * 50000 } },
    { id: `story-054-${zone.id}-boss`, chapter, title: `${zone.title} 지배자 토벌`, subtitle: '라우풀 전선 검증', npc: '혈맹 지휘관 아렌', dialogue: '라우풀은 숫자가 아니라 선택입니다. 전장의 질서를 다시 세웁시다.', goalText: `${zone.monsterIds.includes('riftBeast') ? '균열수 베히모스' : '야전 군주 발타르'} 누적 ${80 + index * 10}마리 처치`, goalType: 'kill', monsterId: zone.monsterIds.includes('riftBeast') ? 'riftBeast' : 'fieldBoss', target: 80 + index * 10, unlockZoneId: zone.id, reward: { gold: 1120000 + index * 88000, gems: 4200 + index * 320, itemId: 'blood-mark', itemCount: 3 + index, exp: 820000 + index * 56000 } }
  ];
});
for (const quest of alpha054Story) {
  if (!storyQuests.some((old) => old.id === quest.id)) storyQuests.push(quest);
}
storyQuests.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));

const alpha054Daily: DailyQuestDefinition[] = [
  { id: 'daily-054-orc-cleave', title: '일일 · 오크 광전사 제압', description: '오크 광전사 120마리 처치', goalType: 'kill', monsterId: 'orcBerserker', target: 120, reward: { gold: 118000, gems: 190, itemId: 'battle-coin', itemCount: 10 } },
  { id: 'daily-054-bat-speed', title: '일일 · 악몽 비행로 차단', description: '악몽 박쥐 140마리 처치', goalType: 'kill', monsterId: 'nightmareBat', target: 140, reward: { gold: 126000, gems: 210, itemId: 'monster-essence', itemCount: 7 } },
  { id: 'daily-054-lava-armor', title: '주간 · 용암 핵 회수', description: '용암 골렘 90마리 처치', goalType: 'kill', monsterId: 'lavaGolem', target: 90, reward: { gold: 186000, gems: 280, itemId: 'blessed-scroll', itemCount: 1 } },
  { id: 'daily-054-ice-court', title: '주간 · 서리 궁정 봉쇄', description: '빙결 예언마녀 100마리 처치', goalType: 'kill', monsterId: 'iceWitch', target: 100, reward: { gold: 202000, gems: 310, itemId: 'blood-mark', itemCount: 2 } },
  { id: 'daily-054-royal-guard', title: '주간 · 왕실 파수병 토벌', description: '왕실 파수병 80마리 처치', goalType: 'kill', monsterId: 'royalGuard', target: 80, reward: { gold: 260000, gems: 420, itemId: 'royal-seal', itemCount: 2 } },
  { id: 'daily-054-behemoth', title: '주간 · 베히모스 균열 봉인', description: '균열수 베히모스 16마리 처치', goalType: 'kill', monsterId: 'riftBeast', target: 16, reward: { gold: 420000, gems: 760, itemId: 'ancient-boss-cache', itemCount: 1 } }
];
for (const quest of alpha054Daily) {
  if (!dailyQuests.some((old) => old.id === quest.id)) dailyQuests.push(quest);
}

const alpha054DropOverlay: Record<string, DropEntry[]> = {
  slime: [{ type: 'item', id: 'battle-coin', chance: 0.025 }],
  wolf: [{ type: 'item', id: 'wolf-pelt', chance: 0.13 }, { type: 'item', id: 'field-repair-kit', chance: 0.025 }],
  shadowImp: [{ type: 'item', id: 'monster-essence', chance: 0.035 }, { type: 'item', id: 'battle-coin', chance: 0.055 }],
  goblin: [{ type: 'item', id: 'goblin-steel', chance: 0.13 }, { type: 'item', id: 'battle-coin', chance: 0.075 }],
  mossGolem: [{ type: 'item', id: 'golem-core', chance: 0.09 }, { type: 'item', id: 'field-repair-kit', chance: 0.035 }],
  wraith: [{ type: 'item', id: 'monster-essence', chance: 0.085 }, { type: 'item', id: 'blood-mark', chance: 0.018 }],
  crystalBear: [{ type: 'item', id: 'golem-core', chance: 0.12 }, { type: 'item', id: 'blessed-scroll', chance: 0.012 }],
  fireDrake: [{ type: 'item', id: 'abyss-scale', chance: 0.08 }, { type: 'item', id: 'blessed-scroll', chance: 0.018 }],
  stormHarpy: [{ type: 'item', id: 'harpy-plume', chance: 0.12 }, { type: 'item', id: 'monster-essence', chance: 0.045 }],
  graveKnight: [{ type: 'item', id: 'battle-coin', chance: 0.11 }, { type: 'item', id: 'blood-mark', chance: 0.025 }],
  fieldBoss: [{ type: 'item', id: 'blessed-scroll', chance: 0.16 }, { type: 'item', id: 'blood-mark', chance: 0.13 }, { type: 'item', id: 'royal-guard-halberd', chance: 0.004 }],
  dragon: [{ type: 'item', id: 'blood-mark', chance: 0.2 }, { type: 'item', id: 'rift-beast-core', chance: 0.004 }]
};
for (const monster of monsters) {
  const extraDrops = alpha054DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}


// Alpha 0.55: quality polish overlay - clearer long-tail drops and field utility supplies.
const alpha055Items: ItemDefinition[] = [
  { id: 'weapon-polish-oil', name: '무기 연마유', type: 'material', rarity: 'R', effectText: '강화 공방과 의뢰 납품에 쓰이는 무기 손질 재료입니다.', bonus: {} },
  { id: 'armor-rivet-kit', name: '갑주 리벳 키트', type: 'material', rarity: 'R', effectText: '방어구 보강과 혈맹 보급 의뢰에 쓰이는 보강 키트입니다.', bonus: {} },
  { id: 'field-camp-lantern', name: '야전 캠프 랜턴', type: 'material', rarity: 'SR', effectText: '고레벨 전선 정비와 안전지대 확장 연구에 쓰이는 빛나는 랜턴입니다.', bonus: {} },
  { id: 'rift-survey-map', name: '균열 탐사 지도', type: 'material', rarity: 'SSR', effectText: '균열 전선과 보스 토벌 루트를 기록한 고급 지도입니다.', bonus: {} },
  { id: 'royal-repair-scroll', name: '왕실 수리 주문서', type: 'consumable', rarity: 'SR', effectText: 'HP 2%, MP 2%를 동시에 회복하는 비상 정비 주문서입니다.', bonus: {}, consume: { hpPercent: 0.02, mpPercent: 0.02 } },
  { id: 'frontier-talisman', name: '전선 개척 부적', type: 'relic', rarity: 'SSR', effectText: 'HP +120, 공격 +18, 이속 +0.10. 장기 자동사냥용 개척 부적입니다.', bonus: { hp: 120, atk: 18, move: 0.1 } },
  { id: 'citadel-vanguard-blade', name: '성채 선봉검', type: 'weapon', rarity: 'SSR', effectText: '공격 +58, 공속 +5%, 치명 +4%. 혈맹 성채 전선용 선봉검입니다.', bonus: { atk: 58, aspd: 0.05, crit: 0.04 } },
  { id: 'riftwarden-coat', name: '균열수 감시갑', type: 'armor', rarity: 'UR', effectText: 'HP +320, 방어 +58, MP +90. 균열수 베히모스를 감시하던 수호갑입니다.', bonus: { hp: 320, def: 58, mp: 90 } }
];
for (const item of alpha055Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha055DropOverlay: Record<string, DropEntry[]> = {
  wolf: [{ type: 'item', id: 'weapon-polish-oil', chance: 0.055 }],
  goblin: [{ type: 'item', id: 'armor-rivet-kit', chance: 0.06 }],
  mossGolem: [{ type: 'item', id: 'field-camp-lantern', chance: 0.024 }],
  fireDrake: [{ type: 'item', id: 'field-camp-lantern', chance: 0.035 }, { type: 'item', id: 'royal-repair-scroll', chance: 0.018 }],
  stormHarpy: [{ type: 'item', id: 'weapon-polish-oil', chance: 0.05 }, { type: 'item', id: 'royal-repair-scroll', chance: 0.014 }],
  graveKnight: [{ type: 'item', id: 'armor-rivet-kit', chance: 0.07 }, { type: 'item', id: 'frontier-talisman', chance: 0.004 }],
  fieldBoss: [{ type: 'item', id: 'rift-survey-map', chance: 0.095 }, { type: 'item', id: 'citadel-vanguard-blade', chance: 0.01 }],
  dragon: [{ type: 'item', id: 'rift-survey-map', chance: 0.13 }, { type: 'item', id: 'frontier-talisman', chance: 0.012 }],
  royalGuard: [{ type: 'item', id: 'citadel-vanguard-blade', chance: 0.018 }, { type: 'item', id: 'field-camp-lantern', chance: 0.12 }],
  riftBeast: [{ type: 'item', id: 'riftwarden-coat', chance: 0.014 }, { type: 'item', id: 'rift-survey-map', chance: 0.18 }]
};
for (const monster of monsters) {
  const extraDrops = alpha055DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}


// Alpha 0.56: visual immersion pass - loot silhouettes, premium field dressing, and clearer reward cadence.
const alpha056Items: ItemDefinition[] = [
  { id: 'cinematic-loot-cache', name: '시네마틱 전리품 상자', type: 'consumable', rarity: 'SSR', effectText: '희귀 드랍 연출과 함께 열리는 고급 전리품 상자입니다. 강화석, 성운광, 보스 재료를 노릴 수 있습니다.', bonus: {} },
  { id: 'soul-engrave-stone', name: '영혼 각인석', type: 'material', rarity: 'SSR', effectText: '장비 외형 각인과 후반 강화 의뢰에 쓰이는 빛나는 각인석입니다.', bonus: {} },
  { id: 'hero-banner-silk', name: '영웅 장식 깃', type: 'material', rarity: 'SR', effectText: '혈맹 깃발과 전선 장식 제작에 쓰이는 장식 재료입니다.', bonus: {} },
  { id: 'ancient-seal-fragment', name: '고대 인장 조각', type: 'material', rarity: 'SSR', effectText: '고대 전선의 문양이 새겨진 인장 조각입니다. 보스 상자 교환에 사용됩니다.', bonus: {} },
  { id: 'aurora-polish', name: '오로라 광택제', type: 'material', rarity: 'R', effectText: '장비 아이콘과 외형 강화 의뢰에 쓰이는 광택 재료입니다.', bonus: {} },
  { id: 'field-scenery-token', name: '전장 풍경 토큰', type: 'material', rarity: 'R', effectText: '필드 장식과 마을 세트 드레싱 의뢰에 납품하는 토큰입니다.', bonus: {} },
  { id: 'royal-hunter-coat', name: '왕실 사냥꾼 코트', type: 'armor', rarity: 'SSR', effectText: 'HP +260, 방어 +42, 이속 +0.12. 장기 사냥에 특화된 고급 코트입니다.', bonus: { hp: 260, def: 42, move: 0.12 } },
  { id: 'starfall-edge', name: '성운 낙하검', type: 'weapon', rarity: 'UR', effectText: '공격 +96, 치명 +14%, 공속 +8%. 별빛 궤적을 남기는 최상급 검입니다.', bonus: { atk: 96, crit: 0.14, aspd: 0.08 } }
];
for (const item of alpha056Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha056DropOverlay: Record<string, DropEntry[]> = {
  slime: [{ type: 'item', id: 'field-scenery-token', chance: 0.04 }, { type: 'item', id: 'aurora-polish', chance: 0.018 }],
  wolf: [{ type: 'item', id: 'field-scenery-token', chance: 0.055 }, { type: 'item', id: 'aurora-polish', chance: 0.032 }],
  goblin: [{ type: 'item', id: 'hero-banner-silk', chance: 0.032 }, { type: 'item', id: 'aurora-polish', chance: 0.045 }],
  shadowImp: [{ type: 'item', id: 'soul-engrave-stone', chance: 0.006 }, { type: 'item', id: 'field-scenery-token', chance: 0.045 }],
  mossGolem: [{ type: 'item', id: 'ancient-seal-fragment', chance: 0.012 }, { type: 'item', id: 'aurora-polish', chance: 0.042 }],
  wraith: [{ type: 'item', id: 'soul-engrave-stone', chance: 0.018 }, { type: 'item', id: 'hero-banner-silk', chance: 0.038 }],
  fireDrake: [{ type: 'item', id: 'cinematic-loot-cache', chance: 0.018 }, { type: 'item', id: 'soul-engrave-stone', chance: 0.025 }],
  stormHarpy: [{ type: 'item', id: 'hero-banner-silk', chance: 0.06 }, { type: 'item', id: 'royal-hunter-coat', chance: 0.004 }],
  graveKnight: [{ type: 'item', id: 'ancient-seal-fragment', chance: 0.035 }, { type: 'item', id: 'royal-hunter-coat', chance: 0.008 }],
  crystalBear: [{ type: 'item', id: 'soul-engrave-stone', chance: 0.024 }, { type: 'item', id: 'cinematic-loot-cache', chance: 0.01 }],
  fieldBoss: [{ type: 'item', id: 'cinematic-loot-cache', chance: 0.18 }, { type: 'item', id: 'starfall-edge', chance: 0.006 }, { type: 'item', id: 'ancient-seal-fragment', chance: 0.09 }],
  dragon: [{ type: 'item', id: 'cinematic-loot-cache', chance: 0.24 }, { type: 'item', id: 'starfall-edge', chance: 0.012 }, { type: 'item', id: 'soul-engrave-stone', chance: 0.12 }],
  orcBerserker: [{ type: 'item', id: 'hero-banner-silk', chance: 0.08 }, { type: 'item', id: 'royal-hunter-coat', chance: 0.006 }],
  nightmareBat: [{ type: 'item', id: 'soul-engrave-stone', chance: 0.035 }, { type: 'item', id: 'cinematic-loot-cache', chance: 0.014 }],
  lavaGolem: [{ type: 'item', id: 'ancient-seal-fragment', chance: 0.07 }, { type: 'item', id: 'cinematic-loot-cache', chance: 0.026 }],
  iceWitch: [{ type: 'item', id: 'soul-engrave-stone', chance: 0.075 }, { type: 'item', id: 'royal-hunter-coat', chance: 0.012 }],
  royalGuard: [{ type: 'item', id: 'hero-banner-silk', chance: 0.1 }, { type: 'item', id: 'royal-hunter-coat', chance: 0.022 }],
  riftBeast: [{ type: 'item', id: 'cinematic-loot-cache', chance: 0.32 }, { type: 'item', id: 'starfall-edge', chance: 0.018 }, { type: 'item', id: 'soul-engrave-stone', chance: 0.18 }]
};
for (const monster of monsters) {
  const extraDrops = alpha056DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}

const alpha056Daily: DailyQuestDefinition[] = [
  { id: 'daily-056-visual-check', title: '일일 · 전장 풍경 검수', description: '아무 몬스터나 180마리 처치하고 전장 풍경 토큰을 모으세요.', goalType: 'kill', monsterId: 'wolf', target: 180, reward: { gold: 180000, gems: 260, itemId: 'field-scenery-token', itemCount: 12 } },
  { id: 'daily-056-hero-banner', title: '주간 · 영웅 깃 장식 회수', description: '성채 계열 몬스터를 처치하고 장식 깃을 회수하세요.', goalType: 'kill', monsterId: 'royalGuard', target: 90, reward: { gold: 360000, gems: 620, itemId: 'hero-banner-silk', itemCount: 4 } },
  { id: 'daily-056-cinematic-cache', title: '주간 · 시네마틱 전리품 수색', description: '보스 또는 드래곤 전선에서 고급 전리품 상자를 노리세요.', goalType: 'kill', monsterId: 'dragon', target: 18, reward: { gold: 520000, gems: 900, itemId: 'cinematic-loot-cache', itemCount: 1 } }
];
for (const quest of alpha056Daily) {
  if (!dailyQuests.some((old) => old.id === quest.id)) dailyQuests.push(quest);
}

function monsterName(id: MonsterId) {
  return monsters.find((monster) => monster.id === id)?.name || id;
}


// Alpha 0.58: immersive refinement pass - cinematic NPC touchpoints, premium loot pacing, and late-field visual goals.
const alpha058Items: ItemDefinition[] = [
  { id: 'cinematic-raid-contract', name: '시네마틱 레이드 계약서', type: 'consumable', rarity: 'SSR', effectText: '마을 NPC와 보스 전선을 잇는 특수 계약 보급품입니다. 사용하면 보스 보급 재료를 얻습니다.', bonus: {} },
  { id: 'boss-omen-stone', name: '보스 예고석', type: 'material', rarity: 'SR', effectText: '강력한 몬스터 출현을 예고하는 붉은 예언석. 보스 보상 교환과 의뢰 납품에 쓰입니다.', bonus: {} },
  { id: 'npc-affinity-token', name: 'NPC 인연 토큰', type: 'material', rarity: 'R', effectText: '마을 인물들과의 계약 의뢰를 진행하며 쌓이는 인연 증표입니다.', bonus: {} },
  { id: 'field-light-core', name: '전장 조명핵', type: 'material', rarity: 'SR', effectText: '필드 장식과 전장 광원 연출을 강화하는 마력 코어입니다.', bonus: {} },
  { id: 'impact-rune', name: '타격 각인 룬', type: 'relic', rarity: 'SSR', effectText: '공격 +22, 치명 +6%, 타격 순간의 영혼 반동을 증폭시키는 룬', bonus: { atk: 22, crit: 0.06 } },
  { id: 'royal-gold-blade', name: '왕가 황금검', type: 'weapon', rarity: 'UR', effectText: '공격 +92, 치명 +12%, 방어 +10. 왕실 파수 전선에서 발견되는 의장검', bonus: { atk: 92, crit: 0.12, def: 10 } },
  { id: 'aurora-battlecoat', name: '오로라 전투 코트', type: 'armor', rarity: 'SSR', effectText: 'HP +260, MP +110, 공속 +5%. 시각 몰입 전선을 상징하는 전투복', bonus: { hp: 260, mp: 110, aspd: 0.05 } },
  { id: 'sovereign-visual-cache', name: '소버린 비주얼 궤짝', type: 'consumable', rarity: 'UR', effectText: '고급 장비, 조명핵, 보스 예고석을 노릴 수 있는 최상급 전리품 상자입니다.', bonus: {} }
];
for (const item of alpha058Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha058Zones: ZoneDefinition[] = [
  { id: 'cinematic-raid-gate', order: 85, title: '시네마틱 레이드 관문', subtitle: '보스 등장 연출과 전장 조명이 교차하는 관문', description: '보스 전리품과 NPC 계약 보상을 동시에 노리는 0.58 몰입형 전선입니다.', recommendedLevel: 158, monsterIds: ['royalGuard', 'fieldBoss', 'dragon', 'iceWitch'], entry: { x: 10.4, y: 23.8 }, unlockLevel: 158, badge: '85' },
  { id: 'aurora-market-road', order: 86, title: '오로라 시장길', subtitle: '무너진 시장과 오로라 광원이 남은 전장', description: '마을에서 이어지는 듯한 시장형 필드입니다. 물약, 조명핵, 인연 토큰 파밍을 병행합니다.', recommendedLevel: 160, monsterIds: ['nightmareBat', 'stormHarpy', 'royalGuard', 'wraith'], entry: { x: 13.2, y: 22.4 }, unlockLevel: 160, badge: '86' },
  { id: 'sovereign-boss-yard', order: 87, title: '소버린 보스 마당', subtitle: '거대한 보스 토템과 붉은 깃발이 둘러싼 전장', description: '보스 상자, 라우풀 보급, 고급 장비 드랍을 모두 노리는 상위 전선입니다.', recommendedLevel: 162, monsterIds: ['fieldBoss', 'dragon', 'riftBeast', 'lavaGolem'], entry: { x: 17.8, y: 24.6 }, unlockLevel: 162, badge: '87' },
  { id: 'hero-stage-approach', order: 88, title: '영웅 무대 진입로', subtitle: '타이틀 히어로가 바라보던 최전선의 길', description: '0.58의 시각 완성도를 검수하는 최고 난도 장기 사냥터입니다.', recommendedLevel: 165, monsterIds: ['riftBeast', 'royalGuard', 'dragon', 'fieldBoss'], entry: { x: 22.0, y: 22.0 }, unlockLevel: 165, badge: '88' }
];
for (const zone of alpha058Zones) {
  if (!zones.some((old) => old.id === zone.id)) zones.push(zone);
}

for (const [index, zone] of alpha058Zones.entries()) {
  const chapter = 28 + index;
  const first = zone.monsterIds[0];
  const second = zone.monsterIds[1];
  const quests: StoryQuestDefinition[] = [
    { id: `story-058-${zone.id}-scout`, chapter, title: `${zone.title} 정찰`, subtitle: '몰입형 전선 개방', npc: '예언자 미온', dialogue: '이번 전선은 눈으로 먼저 기억될 겁니다. 빛, 소리, 전리품의 흐름까지 모두 기록해 주세요.', goalText: `${monsterName(first)} 누적 ${190 + index * 35}마리 처치`, goalType: 'kill', monsterId: first, target: 190 + index * 35, unlockZoneId: zone.id, reward: { gold: 1280000 + index * 115000, gems: 4600 + index * 380, itemId: 'field-light-core', itemCount: 3 + index, exp: 920000 + index * 68000 } },
    { id: `story-058-${zone.id}-contract`, chapter, title: `${zone.title} NPC 계약`, subtitle: '마을과 전장의 연결', npc: '대장장이 브람', dialogue: '마을이 살아 있으려면 전장에서 돌아오는 손맛도 살아 있어야 합니다. 이번엔 장비와 연출을 함께 보겠습니다.', goalText: `${monsterName(second)} 누적 ${160 + index * 28}마리 처치`, goalType: 'kill', monsterId: second, target: 160 + index * 28, unlockZoneId: zone.id, reward: { gold: 1320000 + index * 125000, gems: 5000 + index * 420, itemId: 'npc-affinity-token', itemCount: 6 + index, exp: 980000 + index * 72000 } },
    { id: `story-058-${zone.id}-omen`, chapter, title: `${zone.title} 보스 예고`, subtitle: '보스 연출 검수', npc: '혈맹 지휘관 아렌', dialogue: '진짜 보스전은 등장 전부터 긴장감이 있어야 합니다. 깃발, 바닥, 보상까지 모두 지휘하겠습니다.', goalText: `보스 계열 누적 ${85 + index * 12}마리 처치`, goalType: 'kill', monsterId: zone.monsterIds.includes('riftBeast') ? 'riftBeast' : 'fieldBoss', target: 85 + index * 12, unlockZoneId: zone.id, reward: { gold: 1460000 + index * 148000, gems: 5600 + index * 460, itemId: 'boss-omen-stone', itemCount: 3 + index, exp: 1060000 + index * 82000 } },
    { id: `story-058-${zone.id}-cache`, chapter, title: `${zone.title} 전리품 회수`, subtitle: '희귀 드랍 루프', npc: '무기교관 세이라', dialogue: '좋은 전투는 마지막 전리품 팝업까지 기억에 남아야 합니다. 소버린 궤짝을 회수하세요.', goalText: `${zone.title} 전선 Lv.${zone.recommendedLevel + 1} 달성`, goalType: 'level', target: zone.recommendedLevel + 1, unlockZoneId: zone.id, reward: { gold: 1580000 + index * 150000, gems: 6200 + index * 520, itemId: index >= 2 ? 'sovereign-visual-cache' : 'cinematic-raid-contract', itemCount: index >= 2 ? 1 : 2, exp: 1140000 + index * 90000 } }
  ];
  for (const quest of quests) {
    if (!storyQuests.some((old) => old.id === quest.id)) storyQuests.push(quest);
  }
}

const alpha058Dailies: DailyQuestDefinition[] = [
  { id: 'daily-058-npc-affinity', title: '일일 · NPC 인연 보급', description: '마을 NPC 계약 전선을 순찰하고 인연 토큰을 회수하세요.', goalType: 'kill', monsterId: 'royalGuard', target: 120, reward: { gold: 210000, gems: 340, itemId: 'npc-affinity-token', itemCount: 8 } },
  { id: 'daily-058-light-core', title: '일일 · 전장 조명핵 수집', description: '고레벨 전선에서 전장 조명핵을 모아 필드 연출을 보강하세요.', goalType: 'kill', monsterId: 'nightmareBat', target: 160, reward: { gold: 230000, gems: 360, itemId: 'field-light-core', itemCount: 4 } },
  { id: 'daily-058-boss-omen', title: '주간 · 보스 예고석 회수', description: '보스 계열 몬스터를 처치하고 붉은 예고석을 회수하세요.', goalType: 'kill', monsterId: 'fieldBoss', target: 24, reward: { gold: 560000, gems: 900, itemId: 'boss-omen-stone', itemCount: 5 } },
  { id: 'daily-058-sovereign-cache', title: '주간 · 소버린 궤짝 추적', description: '심연룡과 균열수 계열을 추적해 최상급 전리품 루프를 완성하세요.', goalType: 'kill', monsterId: 'dragon', target: 24, reward: { gold: 720000, gems: 1200, itemId: 'sovereign-visual-cache', itemCount: 1 } },
  { id: 'daily-058-impact-rune', title: '주간 · 타격 각인 실험', description: '강타 이펙트가 잘 보이는 전선에서 전투 데이터를 모으세요.', goalType: 'kill', monsterId: 'riftBeast', target: 14, reward: { gold: 780000, gems: 1360, itemId: 'impact-rune', itemCount: 1 } }
];
for (const quest of alpha058Dailies) {
  if (!dailyQuests.some((old) => old.id === quest.id)) dailyQuests.push(quest);
}

const alpha058DropOverlay: Partial<Record<MonsterId, DropEntry[]>> = {
  wolf: [{ type: 'item', id: 'npc-affinity-token', chance: 0.018 }],
  goblin: [{ type: 'item', id: 'npc-affinity-token', chance: 0.026 }, { type: 'item', id: 'field-light-core', chance: 0.012 }],
  stormHarpy: [{ type: 'item', id: 'field-light-core', chance: 0.035 }, { type: 'item', id: 'aurora-battlecoat', chance: 0.004 }],
  nightmareBat: [{ type: 'item', id: 'field-light-core', chance: 0.05 }, { type: 'item', id: 'cinematic-raid-contract', chance: 0.014 }],
  royalGuard: [{ type: 'item', id: 'boss-omen-stone', chance: 0.065 }, { type: 'item', id: 'royal-gold-blade', chance: 0.006 }],
  fieldBoss: [{ type: 'item', id: 'boss-omen-stone', chance: 0.18 }, { type: 'item', id: 'impact-rune', chance: 0.018 }, { type: 'item', id: 'sovereign-visual-cache', chance: 0.018 }],
  dragon: [{ type: 'item', id: 'boss-omen-stone', chance: 0.22 }, { type: 'item', id: 'royal-gold-blade', chance: 0.011 }, { type: 'item', id: 'sovereign-visual-cache', chance: 0.024 }],
  riftBeast: [{ type: 'item', id: 'sovereign-visual-cache', chance: 0.065 }, { type: 'item', id: 'royal-gold-blade', chance: 0.018 }, { type: 'item', id: 'impact-rune', chance: 0.045 }]
};
for (const monster of monsters) {
  const extraDrops = alpha058DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}


// Alpha 0.61-0.62: raster visual pipeline and reference-grade visual direction pass.
const alpha059Items: ItemDefinition[] = [
  { id: 'luminous-hunt-pass', name: '루미나 사냥 허가증', type: 'material', rarity: 'R', effectText: '마을 의뢰소와 고레벨 전선 사이를 잇는 사냥 허가 증표입니다. 반복 의뢰 납품에 쓰입니다.', bonus: {} },
  { id: 'royal-impact-oil', name: '왕실 타격 연마유', type: 'consumable', rarity: 'SR', effectText: '무기의 타격감을 높이는 연마유입니다. 사용하면 강화 재료와 골드를 소량 회수합니다.', bonus: {} },
  { id: 'moonlit-repair-thread', name: '월광 수선실', type: 'material', rarity: 'SR', effectText: '방어구 강화와 수리 의뢰에 쓰이는 푸른 실입니다.', bonus: {} },
  { id: 'ancient-polish-stone', name: '고대 광택석', type: 'material', rarity: 'SSR', effectText: '장비 아이콘의 고급감을 상징하는 광택석. 장비 강화와 보급 교환 재료입니다.', bonus: {} },
  { id: 'soulbound-starter-cache', name: '영혼 귀속 보급함', type: 'consumable', rarity: 'SSR', effectText: '장비, 재료, 물약을 함께 노리는 시각 품질 검수용 보급함입니다.', bonus: {} },
  { id: 'duelist-crimson-blade', name: '결투가의 적광검', type: 'weapon', rarity: 'UR', effectText: '공격 +118, 치명 +14%, 공속 +7%. 타격감 검수 전선에서 얻을 수 있는 적광검', bonus: { atk: 118, crit: 0.14, aspd: 0.07 } },
  { id: 'luminous-warden-plate', name: '루미나 수호 판금갑', type: 'armor', rarity: 'SSR', effectText: 'HP +360, 방어 +44, MP +80. 필드 생존과 자동사냥 안정성을 높이는 갑주', bonus: { hp: 360, def: 44, mp: 80 } },
  { id: 'hunter-focus-charm', name: '사냥꾼 집중 부적', type: 'relic', rarity: 'SSR', effectText: '공격 +34, 치명 +8%, 이동 +0.10. 사냥 루프와 전선 이동을 보조하는 부적', bonus: { atk: 34, crit: 0.08, move: 0.10 } }
];
for (const item of alpha059Items) {
  if (!items.some((old) => old.id === item.id)) items.push(item);
}

const alpha059Zones: ZoneDefinition[] = [
  { id: 'luminous-hunt-yard', order: 89, title: '루미나 사냥 연무장', subtitle: '타격감과 보상 루프를 검수하는 전초 연무장', description: '짧은 이동, 선명한 타격 이펙트, 다양한 재료 드랍을 함께 확인하는 품질 점검형 전선입니다.', recommendedLevel: 166, monsterIds: ['royalGuard', 'orcBerserker', 'fieldBoss', 'nightmareBat'], entry: { x: 11.0, y: 23.0 }, unlockLevel: 166, badge: '89' },
  { id: 'moon-market-canal', order: 90, title: '월광 시장 수로', subtitle: '마을 풍경과 필드 사냥이 이어지는 야시장 수로', description: '마을과 사냥터가 그림처럼 이어지는 지역입니다. 소모품, 수선실, 허가증 파밍에 좋습니다.', recommendedLevel: 168, monsterIds: ['nightmareBat', 'wraith', 'stormHarpy', 'royalGuard'], entry: { x: 14.4, y: 22.2 }, unlockLevel: 168, badge: '90' },
  { id: 'crimson-duel-road', order: 91, title: '적광 결투로', subtitle: '검격 잔상과 강타 연출을 확인하는 붉은 길', description: '고공격 몬스터가 등장하는 전선입니다. 물약 설정과 강화 상태를 함께 점검하세요.', recommendedLevel: 170, monsterIds: ['orcBerserker', 'graveKnight', 'fieldBoss', 'lavaGolem'], entry: { x: 18.0, y: 24.0 }, unlockLevel: 170, badge: '91' },
  { id: 'sovereign-gallery-field', order: 92, title: '소버린 회랑 전장', subtitle: '보스 게이트와 왕실 장식이 늘어선 최상급 회랑', description: '상급 장비, 고급 재료, 보스 상자, 라우풀 보너스를 함께 노리는 최종급 반복 전선입니다.', recommendedLevel: 172, monsterIds: ['riftBeast', 'dragon', 'fieldBoss', 'royalGuard'], entry: { x: 22.4, y: 21.8 }, unlockLevel: 172, badge: '92' }
];
for (const zone of alpha059Zones) {
  if (!zones.some((old) => old.id === zone.id)) zones.push(zone);
}

for (const [index, zone] of alpha059Zones.entries()) {
  const chapter = 32 + index;
  const first = zone.monsterIds[0];
  const second = zone.monsterIds[1];
  const story: StoryQuestDefinition[] = [
    { id: `story-059-${zone.id}-arrival`, chapter, title: `${zone.title} 진입`, subtitle: '시각 품질 전선', npc: '예언자 미온', dialogue: '마을, 전장, 전리품이 하나의 그림처럼 이어져야 합니다. 이번 전선의 첫 흐름을 확인해 주세요.', goalText: `${monsterName(first)} 누적 ${230 + index * 40}마리 처치`, goalType: 'kill', monsterId: first, target: 230 + index * 40, unlockZoneId: zone.id, reward: { gold: 1720000 + index * 180000, gems: 6800 + index * 520, itemId: 'luminous-hunt-pass', itemCount: 5 + index, exp: 1280000 + index * 90000 } },
    { id: `story-059-${zone.id}-impact`, chapter, title: `${zone.title} 타격 검수`, subtitle: '전투 손맛 강화', npc: '무기교관 세이라', dialogue: '보기 좋은 전투는 맞는 순간의 무게가 달라야 합니다. 크리티컬, 강타, 드랍 타이밍을 같이 보겠습니다.', goalText: `${monsterName(second)} 누적 ${210 + index * 36}마리 처치`, goalType: 'kill', monsterId: second, target: 210 + index * 36, unlockZoneId: zone.id, reward: { gold: 1840000 + index * 195000, gems: 7300 + index * 560, itemId: 'royal-impact-oil', itemCount: 2 + index, exp: 1360000 + index * 96000 } },
    { id: `story-059-${zone.id}-dressing`, chapter, title: `${zone.title} 장식 보강`, subtitle: '바닥·오브젝트 점검', npc: '대장장이 브람', dialogue: '좋은 필드는 바닥부터 다릅니다. 길, 깃발, 등불, 균열 장식이 몬스터와 어울리는지 확인합시다.', goalText: `${zone.title} 전선 Lv.${zone.recommendedLevel + 1} 달성`, goalType: 'level', target: zone.recommendedLevel + 1, unlockZoneId: zone.id, reward: { gold: 1980000 + index * 210000, gems: 7900 + index * 600, itemId: index >= 2 ? 'ancient-polish-stone' : 'moonlit-repair-thread', itemCount: 3 + index, exp: 1480000 + index * 104000 } },
    { id: `story-059-${zone.id}-trophy`, chapter, title: `${zone.title} 전리품 완성`, subtitle: '희귀 드랍 목표', npc: '혈맹 지휘관 아렌', dialogue: '전리품이 다양해야 사냥을 멈추지 않습니다. 상자, 장비, 재료, 성향 보상을 모두 회수하세요.', goalText: `보스 계열 누적 ${100 + index * 14}마리 처치`, goalType: 'kill', monsterId: zone.monsterIds.includes('riftBeast') ? 'riftBeast' : 'fieldBoss', target: 100 + index * 14, unlockZoneId: zone.id, reward: { gold: 2150000 + index * 225000, gems: 8600 + index * 660, itemId: index >= 2 ? 'soulbound-starter-cache' : 'hunter-focus-charm', itemCount: index >= 2 ? 1 : 1, exp: 1600000 + index * 118000 } }
  ];
  for (const quest of story) {
    if (!storyQuests.some((old) => old.id === quest.id)) storyQuests.push(quest);
  }
}

const alpha059Dailies: DailyQuestDefinition[] = [
  { id: 'daily-059-hunt-pass', title: '일일 · 사냥 허가증 회수', description: '루미나 후반 전선에서 사냥 허가증을 회수하세요.', goalType: 'kill', monsterId: 'royalGuard', target: 180, reward: { gold: 320000, gems: 520, itemId: 'luminous-hunt-pass', itemCount: 10 } },
  { id: 'daily-059-impact-oil', title: '일일 · 타격 연마유 보급', description: '강타 연출이 뚜렷한 전선에서 타격 연마유를 확보하세요.', goalType: 'kill', monsterId: 'orcBerserker', target: 150, reward: { gold: 360000, gems: 580, itemId: 'royal-impact-oil', itemCount: 2 } },
  { id: 'daily-059-repair-thread', title: '일일 · 월광 수선실 납품', description: '마을 수선공에게 전달할 월광 수선실을 모으세요.', goalType: 'kill', monsterId: 'wraith', target: 180, reward: { gold: 340000, gems: 540, itemId: 'moonlit-repair-thread', itemCount: 5 } },
  { id: 'daily-059-polish-stone', title: '주간 · 고대 광택석 탐사', description: '최상급 전선에서 고대 광택석을 찾아 장비 품질 루프를 보강하세요.', goalType: 'kill', monsterId: 'riftBeast', target: 20, reward: { gold: 960000, gems: 1500, itemId: 'ancient-polish-stone', itemCount: 2 } },
  { id: 'daily-059-crimson-blade', title: '주간 · 적광검 추적', description: '보스 계열을 반복 토벌해 결투가의 적광검을 노려보세요.', goalType: 'kill', monsterId: 'fieldBoss', target: 32, reward: { gold: 1180000, gems: 1800, itemId: 'soulbound-starter-cache', itemCount: 1 } }
];
for (const quest of alpha059Dailies) {
  if (!dailyQuests.some((old) => old.id === quest.id)) dailyQuests.push(quest);
}

const alpha059DropOverlay: Partial<Record<MonsterId, DropEntry[]>> = {
  wraith: [{ type: 'item', id: 'moonlit-repair-thread', chance: 0.035 }, { type: 'item', id: 'luminous-hunt-pass', chance: 0.025 }],
  stormHarpy: [{ type: 'item', id: 'moonlit-repair-thread', chance: 0.04 }, { type: 'item', id: 'hunter-focus-charm', chance: 0.006 }],
  royalGuard: [{ type: 'item', id: 'luminous-hunt-pass', chance: 0.09 }, { type: 'item', id: 'luminous-warden-plate', chance: 0.008 }, { type: 'item', id: 'soulbound-starter-cache', chance: 0.018 }],
  orcBerserker: [{ type: 'item', id: 'royal-impact-oil', chance: 0.055 }, { type: 'item', id: 'duelist-crimson-blade', chance: 0.004 }],
  lavaGolem: [{ type: 'item', id: 'ancient-polish-stone', chance: 0.03 }, { type: 'item', id: 'royal-impact-oil', chance: 0.045 }],
  fieldBoss: [{ type: 'item', id: 'soulbound-starter-cache', chance: 0.03 }, { type: 'item', id: 'duelist-crimson-blade', chance: 0.012 }, { type: 'item', id: 'ancient-polish-stone', chance: 0.08 }],
  dragon: [{ type: 'item', id: 'soulbound-starter-cache', chance: 0.035 }, { type: 'item', id: 'luminous-warden-plate', chance: 0.014 }, { type: 'item', id: 'ancient-polish-stone', chance: 0.1 }],
  riftBeast: [{ type: 'item', id: 'soulbound-starter-cache', chance: 0.08 }, { type: 'item', id: 'duelist-crimson-blade', chance: 0.02 }, { type: 'item', id: 'hunter-focus-charm', chance: 0.03 }]
};
for (const monster of monsters) {
  const extraDrops = alpha059DropOverlay[monster.id] || [];
  const existing = new Set(monster.drops.map((drop) => `${drop.type}:${drop.id || ''}:${drop.amount || 0}`));
  for (const drop of extraDrops) {
    const key = `${drop.type}:${drop.id || ''}:${drop.amount || 0}`;
    if (!existing.has(key)) monster.drops.push(drop);
  }
}
