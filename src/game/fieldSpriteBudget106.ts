import { zones } from '../data/gameData';
import type { CharacterClassId } from '../types';

export type SpriteAtlasMode106 = 'standard' | 'lite' | 'high' | 'standard-2p5d';

type NavigatorBudget106 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function flag106(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

export function shouldUseLiteSpriteAtlas106() {
  // Alpha 1.23: 저화질/고화질 자동 전환은 계속 제거하되,
  // textureUrls는 2.5D 고해상도 시트를 단일 표준 경로로 가리킵니다.
  return false;
}


export function classSheetKey106(classId: CharacterClassId) {
  if (classId === 'taoist') return ['heroTaoistMaleSheet', 'heroTaoistFemaleSheet'];
  if (classId === 'cleric') return ['heroClericMaleSheet', 'heroClericFemaleSheet'];
  return ['heroWarriorMaleSheet', 'heroWarriorFemaleSheet'];
}

export function monsterSheetKey106(monsterId: string) {
  if (monsterId === 'wolf') return 'monsterWolfSheet';
  if (monsterId === 'goblin') return 'monsterGoblinSheet';
  if (monsterId === 'crystalBear') return 'monsterBearSheet';
  if (monsterId === 'dragon') return 'bossDragonSheet';
  if (monsterId === 'imp') return 'monsterImpSheet';
  if (monsterId === 'golem') return 'monsterGolemSheet';
  if (monsterId === 'wraith') return 'monsterWraithSheet';
  if (monsterId === 'fireDrake') return 'monsterFireDrakeSheet';
  if (monsterId === 'stormHarpy') return 'monsterHarpySheet';
  if (monsterId === 'graveKnight') return 'monsterGraveKnightSheet';
  if (monsterId === 'fieldBoss') return 'monsterFieldBossSheet';
  if (monsterId === 'orcBerserker') return 'monsterOrcSheet';
  if (monsterId === 'nightmareBat') return 'monsterBatSheet';
  if (monsterId === 'lavaGolem') return 'monsterLavaGolemSheet';
  if (monsterId === 'iceWitch') return 'monsterIceWitchSheet';
  if (monsterId === 'royalGuard') return 'monsterRoyalGuardSheet';
  if (monsterId === 'riftBeast') return 'monsterRiftBeastSheet';
  return 'monsterSlimeSheet';
}

export function getTexturePriority106(key: string, zoneId: string, classId: CharacterClassId) {
  const classKeys = classSheetKey106(classId);
  if (classKeys.includes(key)) return 0;
  const zoneMonsterKeys: string[] = (zones.find((zone) => zone.id === zoneId)?.monsterIds || []).map(monsterSheetKey106);
  if (zoneMonsterKeys.includes(key)) return 1;
  if (/^monster.*Sheet$|^boss.*Sheet$/.test(key)) return 4;
  if (/^effect/.test(key)) return 6;
  if (/^tile/.test(key)) return 8;
  if (/^prop(Tree|Rock|Chest|Torch)\d+/.test(key)) return 18;
  if (/^prop/.test(key) || /^infernus/.test(key)) return 14;
  return 10;
}

export function inspectFieldSpriteAtlas106(mode: SpriteAtlasMode106, textures: Map<string, unknown>) {
  const loadedKeys = [...textures.keys()];
  const sheetKeys = loadedKeys.filter((key) => /Sheet$/.test(key));
  const heavySheets = sheetKeys.filter((key) => /Dragon|Rift|Golem|Taoist|Cleric|Wolf|Slime|Fire|Bear|Royal/.test(key));
  const level = sheetKeys.length <= 10 ? 'ok' : heavySheets.length >= 10 ? 'warn' : 'ok';
  return {
    mode,
    sheetCount: sheetKeys.length,
    heavySheetCount: heavySheets.length,
    level: level as 'ok' | 'warn',
    message: '2.5D 고해상도 스프라이트 아틀라스',
    hint: `${sheetKeys.length} sheets · 2.5D ${heavySheets.length}`
  };
}
