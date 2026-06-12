import { zones } from '../data/gameData';
import type { CharacterClassId } from '../types';

export type SpriteAtlasMode106 = 'lite' | 'high';

type NavigatorBudget106 = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function flag106(key: string) {
  try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
}

export function shouldUseLiteSpriteAtlas106() {
  if (typeof window === 'undefined') return false;
  const nav = navigator as NavigatorBudget106;
  const memory = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  const network = nav.connection?.effectiveType || '';
  const saveData = Boolean(nav.connection?.saveData);
  const narrow = Math.min(window.innerWidth, window.innerHeight) <= 430 || window.innerHeight <= 760;
  if (flag106('soul-online-force-hq-atlas-106') || flag106('soul-online-engine-quality-105')) return false;
  return flag106('soul-online-lite-atlas-106')
    || flag106('soul-online-engine-lite-105')
    || flag106('soul-online-lite-render-091')
    || saveData
    || memory <= 4
    || cores <= 4
    || /2g|3g|slow-2g/.test(network)
    || narrow;
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
  const level = mode === 'lite' || sheetKeys.length <= 5 ? 'ok' : heavySheets.length >= 6 ? 'warn' : 'ok';
  return {
    mode,
    sheetCount: sheetKeys.length,
    heavySheetCount: heavySheets.length,
    level: level as 'ok' | 'warn',
    message: mode === 'lite' ? '저용량 스프라이트 아틀라스' : '고품질 스프라이트 아틀라스',
    hint: `${sheetKeys.length} sheets · heavy ${heavySheets.length}`
  };
}
