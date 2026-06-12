import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture, type Texture as PixiTexture } from 'pixi.js';
import {
  MAP_H,
  MAP_W,
  MAX_ENHANCE_LEVEL,
  SKILL_MAX_LEVEL,
  cardSets,
  cards,
  classes,
  enhancementCost,
  expToNext,
  items,
  monsters,
  pledgeExpToNext,
  skillMasteryCost,
  skills,
  souls,
  spawnTable,
  zones,
  villageProps,
  worldMap
} from '../data/gameData';
import { textureUrls } from '../data/assetManifest';
import type {
  AutoHuntSettings,
  CardDefinition,
  CardInstance,
  CombatResult,
  DropEntry,
  EliteAffixId,
  EquipmentSlot,
  InventoryItem,
  ItemDefinition,
  MonsterDefinition,
  MobPatternKind,
  MonsterId,
  PlayerSave,
  Snapshot,
  Stats,
  TileId,
  WorldMob
} from '../types';
import { isoToScreen, screenToIso } from './iso';
import { clamp, distance, formatGold, formatNumber, normalize, roll, uid } from './math';
import type { SaveService } from './SaveService';
import { audioService } from './AudioService';
import { CombatSystem } from './CombatSystem';
import { applyEquipmentResonance, equipmentResonanceEffects } from './equipmentResonance';
import { HUMANOID_SHEET_META, MONSTER_SHEET_META, SpriteSheetAnimator, directionFromIsoVector, type SpriteDirection } from './SpriteSheetAnimator';
import { detectFieldEngineTier105, getFieldEngineProfile105 } from './fieldEngineProfile105';
import { getTexturePriority106, inspectFieldSpriteAtlas106 } from './fieldSpriteBudget106';
import { getLockedViewport117 } from '../ui/viewportLock117';

type MobView = {
  root: Container;
  body: Sprite;
  animator?: SpriteSheetAnimator;
  hpFill: Graphics;
  name: Text;
  baseScale: number;
  aggroRing: Graphics;
};

type TextureKey = keyof typeof textureUrls;
type LoadedTexture = PixiTexture;

type SolGameOptions = {
  zoneId?: string;
  zoneName?: string;
  onLoadProgress?: (loaded: number, total: number, key: string) => void;
};

type EliteAffixDefinition = {
  id: EliteAffixId;
  label: string;
  color: number;
  statScale: number;
  rewardScale: number;
  moveScale?: number;
  aspdScale?: number;
};

const CHAIN_MAX_TIMER = 9.5;
const CHAIN_BONUS_STEP = 0.02;
const CHAIN_BONUS_CAP = 0.28;
const LAWFUL_MAX = 32767;
const LAWFUL_MIN = -32768;

const BOSS_PATTERN_MOBS = new Set<MonsterId>(['fireDrake', 'stormHarpy', 'graveKnight', 'fieldBoss', 'dragon', 'wraith', 'crystalBear']);

const patternNames: Record<MobPatternKind, string> = {
  flameLine: '화염 숨결',
  shockwave: '대지 충격파',
  shadowBurst: '그림자 폭발'
};

const patternColors: Record<MobPatternKind, number> = {
  flameLine: 0xff6b36,
  shockwave: 0xe2b95f,
  shadowBurst: 0x9c80ff
};

const eliteAffixes: EliteAffixDefinition[] = [
  { id: 'fierce', label: '분노한', color: 0xff5d5d, statScale: 1.22, rewardScale: 1.42, aspdScale: 1.08 },
  { id: 'ancient', label: '고대의', color: 0xe2b95f, statScale: 1.32, rewardScale: 1.62 },
  { id: 'swift', label: '신속한', color: 0x72e7ff, statScale: 1.16, rewardScale: 1.34, moveScale: 1.18, aspdScale: 1.18 },
  { id: 'cursed', label: '저주받은', color: 0x9c80ff, statScale: 1.26, rewardScale: 1.55, moveScale: 1.06 }
];

const zoneMonsterIds: Record<string, MonsterId[]> = {
  'slime-forest': ['slime', 'slime', 'slime', 'slime', 'wolf', 'wolf', 'shadowImp', 'shadowImp', 'slime', 'wolf', 'shadowImp', 'slime'],
  'crystal-moss': ['wolf', 'wolf', 'wolf', 'shadowImp', 'shadowImp', 'mossGolem', 'mossGolem', 'slime', 'wolf', 'shadowImp', 'mossGolem', 'wolf'],
  'sunpetal-meadow': ['slime', 'slime', 'wolf', 'wolf', 'shadowImp', 'shadowImp', 'slime', 'wolf', 'shadowImp', 'wolf'],
  'misty-riverbank': ['wolf', 'shadowImp', 'goblin', 'goblin', 'wraith', 'wolf', 'shadowImp', 'wraith', 'goblin'],
  'old-watchyard': ['goblin', 'goblin', 'mossGolem', 'mossGolem', 'wraith', 'goblin', 'mossGolem', 'wraith'],
  'echo-lantern-woods': ['stormHarpy', 'wraith', 'wolf', 'shadowImp', 'stormHarpy', 'wraith', 'wolf', 'stormHarpy'],
  'fallen-aqueduct': ['crystalBear', 'graveKnight', 'mossGolem', 'wraith', 'crystalBear', 'graveKnight', 'mossGolem'],
  'goblin-road': ['goblin', 'goblin', 'goblin', 'wraith', 'wraith', 'wolf', 'shadowImp', 'goblin', 'wraith', 'goblin', 'graveKnight', 'goblin'],
  'black-cave': ['crystalBear', 'crystalBear', 'mossGolem', 'mossGolem', 'graveKnight', 'graveKnight', 'wraith', 'crystalBear', 'mossGolem', 'graveKnight'],
  'ember-ridge': ['fireDrake', 'fireDrake', 'wraith', 'graveKnight', 'fireDrake', 'stormHarpy', 'fireDrake', 'wraith', 'graveKnight'],
  'moonlit-grove': ['stormHarpy', 'stormHarpy', 'wolf', 'wolf', 'goblin', 'goblin', 'mossGolem', 'stormHarpy', 'wolf', 'goblin', 'mossGolem'],
  'soul-ruins': ['wraith', 'wraith', 'graveKnight', 'graveKnight', 'crystalBear', 'goblin', 'wraith', 'graveKnight', 'crystalBear', 'wraith'],
  'storm-citadel': ['stormHarpy', 'stormHarpy', 'stormHarpy', 'fireDrake', 'fireDrake', 'graveKnight', 'stormHarpy', 'fireDrake', 'graveKnight'],
  'dragon-nest': ['fireDrake', 'fireDrake', 'crystalBear', 'crystalBear', 'graveKnight', 'dragon', 'fireDrake', 'dragon'],
  'crystal-raid': ['fieldBoss', 'graveKnight', 'fireDrake', 'dragon', 'fieldBoss', 'graveKnight', 'fireDrake'],
  'bloodstone-mine': ['crystalBear', 'crystalBear', 'graveKnight', 'graveKnight', 'graveKnight', 'fieldBoss', 'crystalBear', 'graveKnight'],
  'sky-citadel': ['stormHarpy', 'stormHarpy', 'stormHarpy', 'fireDrake', 'fireDrake', 'dragon', 'stormHarpy', 'fireDrake'],
  'demon-rift': ['fieldBoss', 'fieldBoss', 'dragon', 'dragon', 'graveKnight', 'graveKnight', 'fireDrake', 'fireDrake'],
  'orc-battlefield': ['orcBerserker', 'orcBerserker', 'orcBerserker', 'graveKnight', 'fieldBoss', 'nightmareBat', 'orcBerserker', 'fieldBoss'],
  'nightmare-roost': ['nightmareBat', 'nightmareBat', 'nightmareBat', 'wraith', 'stormHarpy', 'iceWitch', 'nightmareBat', 'iceWitch'],
  'molten-core-works': ['lavaGolem', 'lavaGolem', 'fireDrake', 'crystalBear', 'fieldBoss', 'lavaGolem', 'fireDrake'],
  'frost-oracle-court': ['iceWitch', 'iceWitch', 'royalGuard', 'wraith', 'dragon', 'iceWitch', 'royalGuard'],
  'royal-blood-keep': ['royalGuard', 'royalGuard', 'orcBerserker', 'fieldBoss', 'dragon', 'royalGuard', 'orcBerserker'],
  'behemoth-rift': ['riftBeast', 'royalGuard', 'lavaGolem', 'dragon', 'riftBeast', 'royalGuard']
};

const mobHomeRadius: Partial<Record<MonsterId, number>> = {
  slime: 2.2,
  wolf: 2.55,
  goblin: 2.7,
  shadowImp: 2.8,
  mossGolem: 2.35,
  wraith: 2.8,
  crystalBear: 3.0,
  fireDrake: 3.15,
  stormHarpy: 3.2,
  graveKnight: 2.9,
  fieldBoss: 4.2,
  dragon: 3.8,
  orcBerserker: 2.9,
  nightmareBat: 3.35,
  lavaGolem: 3.3,
  iceWitch: 3.0,
  royalGuard: 3.5,
  riftBeast: 4.5
};

const tileTextureKey: Record<TileId, TextureKey> = {
  grass: 'tileGrass',
  dirt: 'tileDirt',
  moss: 'tileMoss',
  stone: 'tileStone',
  crystal: 'tileCrystal',
  water: 'tileWater',
  cliff: 'tileCliff',
  portal: 'tilePortal'
};

const infernusZoneIds = new Set([
  'ember-ridge',
  'dragon-nest',
  'crystal-raid',
  'bloodstone-mine',
  'demon-rift',
  'ruby-canyon',
  'ash-rain-shrine',
  'dragonbone-desert',
  'red-moon-keep',
  'abyssal-throne',
  'genesis-rift'
]);


const FIELD_ZOOM = 0.78;
const PLAYER_VISUAL_SCALE = 0.355;
const PLAYER_SHADOW_SCALE = 0.72;
const MOB_VISUAL_SCALE: Record<MonsterId, number> = {
  slime: 0.295,
  wolf: 0.2925,
  goblin: 0.27,
  shadowImp: 0.285,
  mossGolem: 0.3,
  wraith: 0.27,
  crystalBear: 0.31,
  fireDrake: 0.33,
  stormHarpy: 0.28,
  graveKnight: 0.29,
  fieldBoss: 0.38,
  dragon: 0.4,
  orcBerserker: 0.32,
  nightmareBat: 0.29,
  lavaGolem: 0.36,
  iceWitch: 0.31,
  royalGuard: 0.37,
  riftBeast: 0.46
};


export class SolGame {
  private app: Application | null = null;
  private world = new Container();
  private mapLayer = new Container();
  private ambientLayer = new Container();
  private propLayer = new Container();
  private entityLayer = new Container();
  private fxLayer = new Container();
  private playerRoot = new Container();
  private playerBody: Sprite | null = null;
  private playerAnimator: SpriteSheetAnimator | null = null;
  private playerFacing: SpriteDirection = 's';
  private playerShadow: Graphics | null = null;
  private playerCompanion: Container | null = null;
  private combatFx: CombatSystem | null = null;
  private textures = new Map<string, LoadedTexture>();
  private currentMap: TileId[][] = worldMap.map((row) => [...row]);
  private mobs: WorldMob[] = [];
  private mobViews = new Map<string, MobView>();
  private target: WorldMob | null = null;
  private moveTarget: { x: number; y: number } | null = null;
  private joystick = { x: 0, y: 0 };
  private attackCooldown = 0;
  private skillCooldowns: Record<string, number> = {};
  private regenTick = 0;
  private dirtyTimer = 0;
  private cloudTimer = 0;
  private manualMoveLock = 0;
  private time = 0;
  private lastMoving = false;
  private footstepTimer = 0;
  private attackSequence = 0;
  private autoStuckTimer = 0;
  private autoLastX = 0;
  private autoLastY = 0;
  private autoRecoveryCooldown = 0;
  private autoSkillThinkTimer = 0;
  private autoPotionThinkTimer = 0;
  private potionUseCooldown = 0;
  private hitStopTimer = 0;
  private chainCount = 0;
  private chainTimer = 0;
  private chainBest = 0;
  private lastMinorImpactAt = -999;
  private listeners = new Set<(snapshot: Snapshot) => void>();
  private log: string[] = ['마을에서 사냥터로 이동했습니다.'];
  private sortTimer101 = 0;
  private emitTimer101 = 0;
  private fxBudgetWindow101 = 0;
  private fxBudgetCount101 = 0;
  private hiddenMobFrame101 = 0;
  private spriteAtlasMode106: 'standard' = 'standard';
  private autoRouteIndex110 = 0;
  private autoRouteCooldown110 = 0;
  private cleanupHandlers113: Array<() => void> = [];
  private frameGovernorTimer113 = 0;

  constructor(
    private save: PlayerSave,
    private saveService: SaveService,
    private options: SolGameOptions = {}
  ) {}

  async mount(root: HTMLElement) {
    this.app = new Application();
    const renderProfile099 = this.renderProfile099();
    const lockedViewport117 = getLockedViewport117();
    await this.app.init({
      width: lockedViewport117.width,
      height: lockedViewport117.height,
      backgroundAlpha: 0,
      antialias: renderProfile099.antialias,
      autoDensity: true,
      resolution: renderProfile099.resolution
    });
    this.app.ticker.maxFPS = renderProfile099.maxFPS;
    this.installFrameGovernor113();

    root.replaceChildren(this.app.canvas);
    this.world.scale.set(FIELD_ZOOM);
    this.world.addChild(this.mapLayer, this.ambientLayer, this.propLayer, this.entityLayer, this.fxLayer);
    this.app.stage.addChild(this.world);
    this.combatFx = new CombatSystem({
      ticker: this.app.ticker,
      world: this.world,
      fxLayer: this.fxLayer,
      isLite: () => this.isFieldLite101()
    });

    this.spriteAtlasMode106 = 'standard';
    await this.loadTextures();
    this.buildMap();
    this.spawnMobs();
    this.ensurePlayerSafePosition();
    this.autoLastX = this.save.x;
    this.autoLastY = this.save.y;
    this.buildPlayer();
    this.bindCanvasInput();

    this.app.ticker.add((ticker) => {
      const dt = Math.min(ticker.deltaMS / 1000, 0.05);
      this.update(dt);
    });

    this.pushLog(`${classes[this.save.classId].name} ${this.save.name} · ${this.options.zoneName || '필드'} 입장`);
    this.emit();
  }

  onSnapshot(listener: (snapshot: Snapshot) => void) {
    this.listeners.add(listener);
    listener(this.createSnapshot());
    return () => this.listeners.delete(listener);
  }

  setJoystick(x: number, y: number) {
    this.joystick = { x, y };
    if (Math.abs(x) + Math.abs(y) > 0.05) {
      this.moveTarget = null;
      this.manualMoveLock = 0.5;
    }
  }

  setAutoHunt(enabled: boolean) {
    this.save.autoHunt = enabled;
    audioService.play(enabled ? 'confirm' : 'ui');
    this.pushLog(enabled ? '자동사냥 시작' : '자동사냥 정지');
    this.markDirty();
  }

  setAutoSettings(partial: Partial<AutoHuntSettings>) {
    const prev = this.save.autoSettings || this.defaultAutoSettings();
    this.save.autoSettings = this.normalizeAutoSettings({ ...prev, ...partial });
    audioService.play('ui');
    this.pushLog('자동사냥 세부 설정 변경');
    this.markDirty();
  }

  manualAttack() {
    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (this.target) this.tryPlayerAttack(this.target, true);
  }


  private defaultAutoSettings(): AutoHuntSettings {
    return { useSkills: true, useHpPotion: true, useMpPotion: true, hpPotionRatio: 0.42, mpPotionRatio: 0.28, bossPriority: false };
  }

  private normalizeAutoSettings(raw: Partial<AutoHuntSettings> | undefined): AutoHuntSettings {
    const base = this.defaultAutoSettings();
    const source = raw || {};
    return {
      useSkills: typeof source.useSkills === 'boolean' ? source.useSkills : base.useSkills,
      useHpPotion: typeof source.useHpPotion === 'boolean' ? source.useHpPotion : base.useHpPotion,
      useMpPotion: typeof source.useMpPotion === 'boolean' ? source.useMpPotion : base.useMpPotion,
      hpPotionRatio: this.clampAutoRatio(source.hpPotionRatio, base.hpPotionRatio, 0.18, 0.72),
      mpPotionRatio: this.clampAutoRatio(source.mpPotionRatio, base.mpPotionRatio, 0.12, 0.62),
      bossPriority: typeof source.bossPriority === 'boolean' ? source.bossPriority : base.bossPriority
    };
  }

  private clampAutoRatio(value: unknown, fallback: number, min: number, max: number) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  private autoSettings() {
    this.save.autoSettings = this.normalizeAutoSettings(this.save.autoSettings);
    return this.save.autoSettings;
  }

  usePotion(itemId: string, silent = false) {
    const entry = this.save.inventory.find((item) => item.itemId === itemId && item.count > 0);
    const def = items.find((item) => item.id === itemId && item.type === 'consumable');
    if (entry && def && !def.consume) return this.openRewardBox(entry, silent);
    return this.consumePotionEntry(entry, def, silent);
  }


  private openRewardBox(entry: InventoryItem, silent = false) {
    const def = items.find((item) => item.id === entry.itemId);
    if (!def) return false;
    const table: Record<string, Array<{ itemId?: string; count?: number; gold?: number; gems?: number; chance?: number }>> = {
      'boss-supply-box': [
        { gold: 1800 }, { gems: 10 }, { itemId: 'enhance-stone', count: 3 }, { itemId: 'soul-shard', count: 8 }, { itemId: 'hp-potion-high', count: 10 }, { itemId: 'mp-potion-high', count: 8 }
      ],
      'elite-boss-box': [
        { gold: 5200 }, { gems: 32 }, { itemId: 'enhance-stone', count: 8 }, { itemId: 'blood-crystal', count: 1 }, { itemId: 'guardian-aegis', chance: 0.18 }, { itemId: 'lawful-blade', chance: 0.14 }, { itemId: 'nightmare-robe', chance: 0.14 }
      ],
      'ancient-boss-cache': [
        { gold: 16000 }, { gems: 90 }, { itemId: 'blood-crystal', count: 3 }, { itemId: 'radiant-ore', count: 3 }, { itemId: 'celestial-sigil', chance: 0.28 }, { itemId: 'chaos-reaver', chance: 0.22 }, { itemId: 'omega-blade', chance: 0.18 }
      ],
      'lawful-supply-crate': [
        { gold: 7200 }, { gems: 42 }, { itemId: 'purity-mark', count: 2 }, { itemId: 'enhance-stone', count: 8 }, { itemId: 'lawful-blade', chance: 0.12 }, { itemId: 'guardian-aegis', chance: 0.12 }
      ],
      'village-contract-box': [
        { gold: 4200 }, { gems: 18 }, { itemId: 'npc-favor', count: 3 }, { itemId: 'pledge-coin', count: 2 }, { itemId: 'enhance-stone', count: 4 }
      ],
      'pledge-war-cache': [
        { gold: 18000 }, { gems: 95 }, { itemId: 'pledge-coin', count: 12 }, { itemId: 'royal-seal', count: 1 }, { itemId: 'royal-commander-sword', chance: 0.16 }, { itemId: 'sentinel-plate', chance: 0.16 }, { itemId: 'pledge-banner', chance: 0.25 }
      ]
    };
    const rewards = table[entry.itemId];
    if (!rewards) return false;
    const gained: string[] = [];
    for (const reward of rewards) {
      if (reward.chance && !roll(reward.chance)) continue;
      if (reward.gold) { this.save.gold += reward.gold; gained.push(formatGold(reward.gold)); }
      if (reward.gems) { this.save.gems += reward.gems; gained.push(`소울젬 ${reward.gems}`); }
      if (reward.itemId) {
        const item = this.addItem(reward.itemId, reward.count || 1);
        if (item) gained.push(`${item.name} x${reward.count || 1}`);
      }
    }
    entry.count -= 1;
    if (entry.count <= 0) this.save.inventory = this.save.inventory.filter((item) => item.uid !== entry.uid);
    audioService.play('reward');
    this.emitLoot({ type: 'item', title: def.name, subtitle: gained.slice(0, 4).join(' · ') || '보상 획득', rarity: def.rarity });
    this.pushLog(`${def.name} 개봉 · ${gained.slice(0, 3).join(' · ')}`);
    this.markDirty();
    if (!silent) this.emit();
    return true;
  }

  useBestPotion(kind: 'hp' | 'mp', silent = false) {
    const choice = this.selectBestPotion(kind);
    if (!choice) {
      if (!silent) {
        this.pushLog(kind === 'hp' ? '사용할 생명 물약이 없습니다.' : '사용할 마나 물약이 없습니다.');
        this.emit();
      }
      return false;
    }
    return this.consumePotionEntry(choice.entry, choice.def, silent);
  }

  private consumePotionEntry(entry: InventoryItem | undefined, def: ItemDefinition | undefined, silent = false) {
    if (!entry || !def || def.type !== 'consumable' || !def.consume) {
      if (!silent) {
        this.pushLog('사용할 물약이 없습니다.');
        this.emit();
      }
      return false;
    }
    if (this.potionUseCooldown > 0) {
      if (!silent) {
        this.pushLog('물약 재사용 대기 중입니다.');
        this.emit();
      }
      return false;
    }
    const stats = this.calculateStats();
    const hpGain = Math.ceil((def.consume.hpPercent || 0) * stats.hp + (def.consume.hpFlat || 0));
    const mpGain = Math.ceil((def.consume.mpPercent || 0) * stats.mp + (def.consume.mpFlat || 0));
    const needHp = hpGain > 0 && this.save.hp < stats.hp;
    const needMp = mpGain > 0 && this.save.mp < stats.mp;
    if (!needHp && !needMp) {
      if (!silent) {
        this.pushLog('이미 회복된 상태입니다.');
        this.emit();
      }
      return false;
    }

    this.save.hp = Math.min(stats.hp, this.save.hp + hpGain);
    this.save.mp = Math.min(stats.mp, this.save.mp + mpGain);
    entry.count -= 1;
    if (entry.count <= 0) this.save.inventory = this.save.inventory.filter((item) => item.uid !== entry.uid);
    this.potionUseCooldown = 0.62;
    audioService.play('confirm');
    this.healPulse(this.save.x, this.save.y);
    this.floatText(def.consume.hpPercent ? 'HP POTION' : 'MP POTION', this.save.x, this.save.y - 0.38, def.consume.hpPercent ? 0x66f08a : 0x72b7ff);
    this.pushLog(`${def.name} 사용 · ${hpGain ? `HP +${hpGain}` : ''}${hpGain && mpGain ? ' · ' : ''}${mpGain ? `MP +${mpGain}` : ''}`);
    this.markDirty();
    this.emit();
    return true;
  }

  private selectBestPotion(kind: 'hp' | 'mp') {
    const stats = this.calculateStats();
    const ratio = kind === 'hp' ? this.save.hp / Math.max(1, stats.hp) : this.save.mp / Math.max(1, stats.mp);
    const priority = kind === 'hp'
      ? (ratio <= 0.22 ? ['hp-potion-high', 'hp-potion-mid', 'hp-potion-small'] : ratio <= 0.48 ? ['hp-potion-mid', 'hp-potion-small', 'hp-potion-high'] : ['hp-potion-small', 'hp-potion-mid', 'hp-potion-high'])
      : (ratio <= 0.16 ? ['mp-potion-high', 'mp-potion-mid', 'mp-potion-small'] : ratio <= 0.40 ? ['mp-potion-mid', 'mp-potion-small', 'mp-potion-high'] : ['mp-potion-small', 'mp-potion-mid', 'mp-potion-high']);

    for (const itemId of priority) {
      const entry = this.save.inventory.find((item) => item.itemId === itemId && item.count > 0);
      const def = items.find((item) => item.id === itemId && item.type === 'consumable' && item.consume);
      if (entry && def) return { entry, def };
    }
    return null;
  }

  private potionSnapshot() {
    const hpSmall = this.materialCount('hp-potion-small');
    const hpMid = this.materialCount('hp-potion-mid');
    const hpHigh = this.materialCount('hp-potion-high');
    const mpSmall = this.materialCount('mp-potion-small');
    const mpMid = this.materialCount('mp-potion-mid');
    const mpHigh = this.materialCount('mp-potion-high');
    const hpBest = this.selectBestPotion('hp')?.def;
    const mpBest = this.selectBestPotion('mp')?.def;
    return {
      hpSmall,
      hpMid,
      hpHigh,
      hpTotal: hpSmall + hpMid + hpHigh,
      hpBestId: hpBest?.id,
      hpBestName: hpBest?.name,
      mpSmall,
      mpMid,
      mpHigh,
      mpTotal: mpSmall + mpMid + mpHigh,
      mpBestId: mpBest?.id,
      mpBestName: mpBest?.name
    };
  }


  private hasLearnedSkill(skillId: string) {
    return Array.isArray(this.save.learnedSkillIds) && this.save.learnedSkillIds.includes(skillId);
  }

  private skillMasteryLevel(skillId: string) {
    if (!this.hasLearnedSkill(skillId)) return 0;
    const raw = Number(this.save.skillLevels?.[skillId]);
    return Math.max(1, Math.min(SKILL_MAX_LEVEL, Math.floor(Number.isFinite(raw) ? raw : 1)));
  }

  private skillDamageScale(skillId: string) {
    return 1 + Math.max(0, this.skillMasteryLevel(skillId) - 1) * 0.14;
  }

  private effectiveSkillMpCost(skillId: string, baseCost: number) {
    return Math.max(1, Math.round(baseCost * (1 - Math.max(0, this.skillMasteryLevel(skillId) - 1) * 0.045)));
  }

  private effectiveSkillCooldown(skillId: string, baseCooldown: number) {
    return Number(Math.max(1.2, baseCooldown * (1 - Math.max(0, this.skillMasteryLevel(skillId) - 1) * 0.035)).toFixed(1));
  }

  upgradeSkill(skillId: string) {
    const skill = skills.find((entry) => entry.id === skillId && entry.classId === this.save.classId);
    if (!skill) return;
    if (!this.hasLearnedSkill(skill.id)) {
      this.pushLog('먼저 스킬을 습득해야 합니다.');
      this.emit();
      return;
    }
    const level = this.skillMasteryLevel(skill.id);
    if (level >= SKILL_MAX_LEVEL) {
      this.pushLog(`${skill.name} 최대 숙련입니다.`);
      this.emit();
      return;
    }
    const cost = skillMasteryCost(level);
    const requiredLevel = Math.max(skill.unlockLevel, cost.levelReq);
    if (this.save.level < requiredLevel) {
      this.pushLog(`Lv.${requiredLevel}부터 ${skill.name} 숙련 강화 가능`);
      this.emit();
      return;
    }
    if (this.save.gold < cost.gold) {
      this.pushLog(`골드 부족 · 필요 ${formatGold(cost.gold)}`);
      this.emit();
      return;
    }
    if (this.materialCount('soul-shard') < cost.shard) {
      this.pushLog(`소울 파편 부족 · 필요 ${cost.shard}개`);
      this.emit();
      return;
    }
    if (this.materialCount('enhance-stone') < cost.stone) {
      this.pushLog(`강화석 부족 · 필요 ${cost.stone}개`);
      this.emit();
      return;
    }

    this.save.gold -= cost.gold;
    this.consumeMaterial('soul-shard', cost.shard);
    if (cost.stone) this.consumeMaterial('enhance-stone', cost.stone);
    this.save.skillLevels ||= {};
    this.save.skillLevels[skill.id] = level + 1;
    audioService.play('enhance');
    this.floatText(`SKILL Lv.${level + 1}`, this.save.x, this.save.y - 0.42, level + 1 >= SKILL_MAX_LEVEL ? 0xffd15f : classes[this.save.classId].accent);
    this.healPulse(this.save.x, this.save.y);
    this.pushLog(`${skill.name} 숙련 Lv.${level + 1} 달성`);
    window.dispatchEvent(new CustomEvent('soul:loot', { detail: { type: 'skill', title: skill.name, subtitle: `숙련 Lv.${level + 1} 달성`, rarity: level + 1 >= SKILL_MAX_LEVEL ? 'UR' : 'SR' } }));
    this.markDirty();
  }

  useSkill(slotIndex: number) {
    const skill = skills.filter((entry) => entry.classId === this.save.classId)[slotIndex];
    if (!skill) return;
    if (!this.hasLearnedSkill(skill.id)) {
      this.pushLog(`${skill.name} 미습득 · 스킬서 또는 퀘스트로 배워야 합니다.`);
      this.emit();
      return;
    }
    if (this.save.level < skill.unlockLevel) {
      this.pushLog(`Lv.${skill.unlockLevel}에 사용 가능한 스킬입니다.`);
      this.emit();
      return;
    }
    if ((this.skillCooldowns[skill.id] || 0) > 0) {
      this.pushLog(`${skill.name} 재사용 대기 중`);
      this.emit();
      return;
    }
    const mpCost = this.effectiveSkillMpCost(skill.id, skill.mpCost);
    const cooldownSec = this.effectiveSkillCooldown(skill.id, skill.cooldownSec);
    const masteryScale = this.skillDamageScale(skill.id);
    if (this.save.mp < mpCost) {
      this.pushLog(`MP 부족 · ${skill.name}`);
      this.emit();
      return;
    }

    const stats = this.calculateStats();
    if (skill.kind === 'heal') {
      this.save.mp -= mpCost;
      this.skillCooldowns[skill.id] = cooldownSec;
      this.castPose();
      const heal = Math.max(18, Math.round((stats.hp * 0.22 + stats.atk * 0.65) * masteryScale));
      this.save.hp = Math.min(stats.hp, this.save.hp + heal);
      this.healPulse(this.save.x, this.save.y);
      this.floatText(`+${heal}`, this.save.x, this.save.y, 0x8dffb3);
      audioService.play('heal');
      this.pushLog(`${skill.name} 사용 · HP 회복`);
      this.markDirty();
      return;
    }

    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (!this.target) {
      this.pushLog('스킬 대상이 없습니다.');
      this.emit();
      return;
    }

    const dist = distance(this.save.x, this.save.y, this.target.x, this.target.y);
    if (dist > skill.range) {
      const dir = normalize(this.target.x - this.save.x, this.target.y - this.save.y);
      this.moveTarget = {
        x: clamp(this.target.x - dir.x * Math.max(0.5, skill.range * 0.68), 1, MAP_W - 2),
        y: clamp(this.target.y - dir.y * Math.max(0.5, skill.range * 0.68), 1, MAP_H - 2)
      };
      this.pushLog(`${skill.name} 사거리 밖 · 접근 중`);
      this.emit();
      return;
    }

    this.facePlayerTo(this.target.x, this.target.y);
    this.save.mp -= mpCost;
    this.skillCooldowns[skill.id] = cooldownSec;
    audioService.play('skill');
    this.castPose();
    const affected = this.mobs.filter((mob) => mob.alive && distance(this.target!.x, this.target!.y, mob.x, mob.y) <= Math.max(0.05, skill.radius));
    const targets = affected.length ? affected : [this.target];
    let killed = 0;
    let totalDamage = 0;
    for (const mob of targets) {
      mob.aggroUntil = Math.max(mob.aggroUntil, this.time + 3.8);
      if (mob.state === 'idle' || mob.state === 'return') {
        mob.state = 'alert';
        mob.stateTimer = Math.min(mob.alertDelay, 0.14);
      }
      this.callNearbyMobs(mob, skill.radius > 1.2 ? 3.0 : 2.35);
      const skillStats = { ...stats, atk: Math.round(stats.atk * skill.damageMultiplier * masteryScale) };
      const result = this.resolveDamage(skillStats, this.mobCombatStats(mob), this.save.level - mob.def.level);
      if (!result.hit) {
        this.floatText('MISS', mob.x, mob.y, 0xd6d1c2);
        continue;
      }
      mob.hp = Math.max(0, mob.hp - result.damage);
      totalDamage += result.damage;
      audioService.play('hit');
      this.floatText(`${result.crit ? 'CRIT ' : ''}${result.damage}`, mob.x, mob.y, result.crit ? 0xffd15f : 0xf5f1e8);
      this.animateMobHit(mob);
      this.impactBurst(mob.x, mob.y, result.crit ? 0xffd15f : classes[this.save.classId].accent, result.crit);
      this.skillBurstEffect(mob.x, mob.y, classes[this.save.classId].accent, skill.radius, result.crit, skill.id);
      if (mob.hp <= 0) {
        killed += 1;
        this.killMob(mob);
      }
    }

    if (skill.kind === 'damageHeal') {
      const heal = Math.max(5, Math.round(Math.max(totalDamage, stats.atk) * 0.16 * masteryScale));
      this.save.hp = Math.min(stats.hp, this.save.hp + heal);
      this.floatText(`+${heal}`, this.save.x, this.save.y, 0x8dffb3);
      this.healPulse(this.save.x, this.save.y);
      audioService.play('heal');
    }
    this.hitStop(skill.radius > 1.4 ? 0.075 : 0.05);
    if (skill.radius > 1.1) this.screenShake();
    this.pushLog(`${skill.name} 사용 · ${targets.length}명 타격${killed ? ` · ${killed} 정화` : ''}`);
    this.markDirty();
  }

  upgradeItem(itemUid: string) {
    const entry = this.save.inventory.find((item) => item.uid === itemUid);
    if (!entry) return;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || def.type === 'material' || def.type === 'skillbook' || def.type === 'consumable') {
      this.pushLog('해당 아이템은 강화할 수 없습니다.');
      this.emit();
      return;
    }
    this.save.enhancements ||= {};
    const current = this.save.enhancements[itemUid] || 0;
    if (current >= MAX_ENHANCE_LEVEL) {
      this.pushLog('이미 최대 강화입니다.');
      this.emit();
      return;
    }
    const cost = enhancementCost(current);
    if (this.save.gold < cost.gold) {
      this.pushLog(`골드 부족 · 필요 ${formatGold(cost.gold)}`);
      this.emit();
      return;
    }
    if (cost.shard && this.materialCount('soul-shard') < cost.shard) {
      this.pushLog(`소울 파편 부족 · 필요 ${cost.shard}개`);
      this.emit();
      return;
    }
    if (cost.stone && this.materialCount('enhance-stone') < cost.stone) {
      this.pushLog(`강화석 부족 · 필요 ${cost.stone}개`);
      this.emit();
      return;
    }
    this.save.gold -= cost.gold;
    if (cost.shard) this.consumeMaterial('soul-shard', cost.shard);
    if (cost.stone) this.consumeMaterial('enhance-stone', cost.stone);
    const success = roll(cost.successRate);
    if (success) {
      this.save.enhancements[itemUid] = current + 1;
      this.repairVitals();
      audioService.play('enhance');
      this.pushLog(`${def.name} +${current + 1} 강화 성공 · 확률 ${Math.round(cost.successRate * 100)}%`);
    } else {
      audioService.play('error');
      this.pushLog(`${def.name} 강화 실패 · 확률 ${Math.round(cost.successRate * 100)}% · 단계 유지`);
    }
    this.markDirty();
  }

  equipCard(cardUid: string) {
    const card = this.save.cards.find((item) => item.uid === cardUid);
    if (!card) return;
    const equippedCount = this.save.cards.filter((item) => item.equipped).length;
    if (card.equipped) {
      if (equippedCount <= 1) {
        this.pushLog('카드는 최소 1장 장착해야 합니다.');
        return;
      }
      card.equipped = false;
    } else {
      if (equippedCount >= 4) {
        this.pushLog('장착 카드는 최대 4장입니다.');
        return;
      }
      card.equipped = true;
    }
    this.repairVitals();
    this.markDirty();
    this.emit();
  }


  private classSkillId(token: string) {
    const classSkills = skills.filter((skill) => skill.classId === this.save.classId);
    if (token === 'class-basic') return classSkills[0]?.id || '';
    if (token === 'class-second') return classSkills[1]?.id || '';
    if (token === 'class-third') return classSkills[2]?.id || '';
    return token;
  }

  private learnSkillBook(token: string) {
    const id = this.classSkillId(token);
    const skill = skills.find((entry) => entry.id === id && entry.classId === this.save.classId);
    if (!skill) return false;
    this.save.learnedSkillIds ||= [];
    this.save.skillLevels ||= {};
    if (this.save.learnedSkillIds.includes(id)) {
      this.save.skillLevels[id] ||= 1;
      return false;
    }
    this.save.learnedSkillIds.push(id);
    this.save.skillLevels[id] = Math.max(1, this.save.skillLevels[id] || 1);
    return true;
  }

  equipItem(itemUid: string) {
    const entry = this.save.inventory.find((item) => item.uid === itemUid);
    if (!entry) return;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def) return;
    if (def.type === 'skillbook') {
      if (this.learnSkillBook(def.skillId || '')) {
        entry.count -= 1;
        if (entry.count <= 0) this.save.inventory = this.save.inventory.filter((item) => item.uid !== entry.uid);
        audioService.play('reward');
        this.pushLog(`${def.name} 사용 · 스킬 습득`);
        this.markDirty();
      } else {
        this.pushLog('이미 배웠거나 현재 직업에 맞지 않는 스킬서입니다.');
        this.emit();
      }
      return;
    }
    if (def.type === 'consumable') {
      if (!def.consume && this.openRewardBox(entry)) return;
      this.usePotion(def.id);
      return;
    }
    if (def.type === 'material') {
      this.pushLog('재료 아이템은 장착할 수 없습니다.');
      this.emit();
      return;
    }
    const slot = def.type as EquipmentSlot;
    this.save.equipment ||= {};
    if (this.save.equipment[slot] === entry.uid) {
      delete this.save.equipment[slot];
      audioService.play('ui');
      this.pushLog(`${def.name} 장착 해제`);
    } else {
      this.save.equipment[slot] = entry.uid;
      audioService.play('confirm');
      this.pushLog(`${def.name} 장착`);
    }
    this.repairVitals();
    this.markDirty();
    this.emit();
  }

  async saveNow() {
    this.saveService.saveLocal(this.save);
    let cloudDeferred = false;
    if (this.saveService.isOnline()) {
      try {
        cloudDeferred = !(await this.saveService.saveCloud(this.save, this.power()));
      } catch (error) {
        cloudDeferred = true;
        console.warn('[Save] cloud save deferred', error);
      }
    }
    this.pushLog(cloudDeferred ? '로컬 저장 완료 · 클라우드 동기화 보류' : '진행 상황 저장 완료');
    this.emit();
  }

  getSave() {
    return this.save;
  }
  destroy() {
    if (this.cloudTimer) window.clearTimeout(this.cloudTimer);
    if (this.hitStopTimer) window.clearTimeout(this.hitStopTimer);
    if (this.frameGovernorTimer113) window.clearTimeout(this.frameGovernorTimer113);
    this.cleanupHandlers113.splice(0).forEach((cleanup) => cleanup());
    if (this.app) this.app.ticker.speed = 1;
    this.listeners.clear();
    const canvas = this.app?.canvas;
    this.app?.ticker.stop();
    this.app?.destroy();
    canvas?.remove();
    this.app = null;
    this.combatFx = null;
    this.mobs = [];
    this.mobViews.clear();
    this.target = null;
    this.moveTarget = null;
  }


  replaceSave(save: PlayerSave) {
    this.save = this.saveService.validateSave(save);
    this.repairVitals();
    this.buildPlayer();
    this.target = null;
    this.moveTarget = null;
    this.pushLog('클라우드 저장 데이터를 불러왔습니다.');
    this.markDirty();
  }

  getStats() {
    return this.calculateStats();
  }

  getPower() {
    return this.power();
  }

  private async loadTextures() {
    const required = this.requiredTextureKeys().sort((a, b) => getTexturePriority106(a, this.options.zoneId || 'slime-forest', this.save.classId) - getTexturePriority106(b, this.options.zoneId || 'slime-forest', this.save.classId));
    let loaded = 0;
    let cursor = 0;
    const concurrency = this.textureLoadConcurrency099(required.length);
    const loadNext = async () => {
      while (cursor < required.length) {
        const key = required[cursor];
        cursor += 1;
        const fallbackUrl = textureUrls[key];
        const texture = await this.loadTextureWithFallback(key, fallbackUrl);
        this.textures.set(key, texture);
        loaded += 1;
        this.options.onLoadProgress?.(loaded, required.length, String(key));
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, required.length) }, loadNext));
  }

  private renderProfile099() {
    const profile105 = getFieldEngineProfile105();
    return {
      // Alpha 1.05: mobile-first Pixi budget. Keep the canvas sharp enough for art,
      // but do not let DPR 3 devices allocate huge render targets.
      resolution: profile105.resolution,
      antialias: profile105.antialias,
      maxFPS: profile105.maxFPS
    };
  }


  /**
   * Alpha 1.13: 화면 상태에 따라 Pixi ticker 상한을 다시 조정합니다.
   * 1.05 프로필을 기본값으로 유지하되, 숨김 탭/초소형 화면/런타임 lite 등급에서는 배터리와 발열을 우선합니다.
   */
  private installFrameGovernor113() {
    if (!this.app) return;
    const apply = () => {
      if (!this.app) return;
      const profile = getFieldEngineProfile105();
      const fpsCap = document.hidden ? 12 : profile.maxFPS;
      this.app.ticker.maxFPS = fpsCap;
      document.body.dataset.fieldFpsCap113 = String(fpsCap);
    };
    const schedule = () => {
      window.clearTimeout(this.frameGovernorTimer113);
      this.frameGovernorTimer113 = window.setTimeout(apply, 120);
    };
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    document.addEventListener('visibilitychange', apply);
    this.cleanupHandlers113.push(
      () => window.removeEventListener('resize', schedule),
      () => window.removeEventListener('orientationchange', schedule),
      () => document.removeEventListener('visibilitychange', apply)
    );
    apply();
  }

  private performanceTier101(): 'lite' | 'balanced' | 'quality' {
    return detectFieldEngineTier105();
  }

  private isFieldLite101() {
    return this.performanceTier101() === 'lite';
  }

  private isFieldBalanced101() {
    return this.performanceTier101() !== 'quality';
  }

  private localStorageFlag099(key: string) {
    if (/lite|quality|atlas/i.test(key)) return false;
    try { return window.localStorage.getItem(key) === '1'; } catch { return false; }
  }

  /** Alpha 1.17: 런타임 풀팩/라이트팩 분기를 제거하고 textureUrls의 단일 표준 경로만 사용합니다. */
  private shouldTryRuntimeTexture115(_runtimeUrl: string | undefined, _fallbackUrl: string) {
    return false;
  }


  private textureLoadConcurrency099(requiredCount: number) {
    const profile105 = getFieldEngineProfile105();
    if (requiredCount >= 80) return Math.min(profile105.textureConcurrency, 2);
    return profile105.textureConcurrency;
  }

  private requiredTextureKeys(): TextureKey[] {
    const keys = new Set<TextureKey>([
      'tileGrass', 'tileDirt', 'tileMoss', 'tileStone', 'tileCrystal', 'tileWater', 'tileCliff', 'tilePortal', 'tileInfernus',
      'propTree', 'propCrystal', 'propRock', 'propRuin', 'propBush', 'propMushroom', 'propBanner', 'propBones', 'propOre', 'propRuneStone', 'propStump', 'propGrassClump', 'propBrokenCart', 'propAncientGate', 'propBloodBanner', 'propFlowerPatch', 'propRoadSign', 'propCrystalBrazier', 'propRiftAltar', 'propCampLantern', 'propStoneSteps', 'propPetalTree', 'propMarketCrate', 'propSoulFlowers', 'propHeroStatue', 'propBossTotem', 'propWaterReflection', 'propPathTorch', 'propSilkBanner', 'propMoonPuddle', 'propRuneFloor', 'propAncientRoot', 'propBattleScar', 'propHoloBanner', 'propBossGate', 'propLanternArch', 'propTreasureGlow', 'propManaFog', 'propStoneLamp', 'propRoyalArch', 'propGoldWarBanner', 'propCandleCircle', 'propMarbleCrack', 'propSoulFountain', 'propHuntMarker',
      'infernusRock', 'infernusAltar', 'infernusBrasero', 'infernusHellRocks', 'infernusSkull', 'infernusBurnerColumn', 'infernusColumn', 'infernusPillar',
      'buildingHall', 'buildingForge', 'buildingStorage', 'buildingShop',
      'propChest01', 'propChest02', 'propChest03', 'propChest04', 'propChest05',
      'propTorch01', 'propTorch02', 'propTorch03', 'propTorch04', 'propTorch05',
      'effectSoulSlash', 'effectFireball', 'effectHolyNova', 'effectLightning', 'effectDarkRift'
    ]);

    for (let i = 1; i <= 10; i += 1) {
      const num = String(i).padStart(2, '0');
      keys.add(`propTree${num}` as TextureKey);
      keys.add(`propRock${num}` as TextureKey);
    }

    keys.add(this.classSheetTextureKey());
    keys.add('monsterSlimeSheet');
    const zoneId = this.options.zoneId || 'slime-forest';
    const monsterIds = zoneMonsterIds[zoneId] || zones.find((zone) => zone.id === zoneId)?.monsterIds || zoneMonsterIds['slime-forest'];
    for (const monsterId of monsterIds) keys.add(this.monsterSheetTextureKey(monsterId));
    return [...keys].filter((key) => !this.shouldSkipTextureKey107(key));
  }

  private shouldSkipTextureKey107(key: TextureKey) {
    const tier = this.performanceTier101();
    if (tier === 'quality') return false;
    const name = String(key);
    const keep = new Set<string>([
      'tileGrass', 'tileDirt', 'tileMoss', 'tileStone', 'tileCrystal', 'tileWater', 'tileCliff', 'tilePortal', 'tileInfernus',
      'propTree', 'propCrystal', 'propRock', 'propRuin', 'buildingHall', 'buildingForge', 'buildingStorage', 'buildingShop',
      'effectSoulSlash', 'effectFireball', 'effectHolyNova', 'effectLightning', 'effectDarkRift',
      this.classSheetTextureKey(), 'monsterSlimeSheet'
    ]);
    const zoneId = this.options.zoneId || 'slime-forest';
    const monsterIds = zoneMonsterIds[zoneId] || zones.find((zone) => zone.id === zoneId)?.monsterIds || zoneMonsterIds['slime-forest'];
    for (const monsterId of monsterIds) keep.add(this.monsterSheetTextureKey(monsterId));
    if (keep.has(name)) return false;
    if (tier === 'lite' && (/^prop(Tree|Rock)\d+/.test(name) || /^prop(Chest|Torch)\d+/.test(name) || /^infernus/.test(name))) return true;
    if (tier === 'lite' && /^prop/.test(name)) return true;
    if (tier === 'balanced' && (/^prop(Tree|Rock)(0[6-9]|10)$/.test(name) || /^prop(Chest|Torch)(0[3-5])$/.test(name))) return true;
    if (tier === 'balanced' && /^prop(Ancient|Blood|CrystalBrazier|Rift|Boss|Treasure|SoulFountain|GoldWar|Candle|Marble)/.test(name)) return true;
    return false;
  }

  private fallbackTextureKey107(key: TextureKey): TextureKey | undefined {
    const name = String(key);
    if (/^tile/.test(name)) return 'tileGrass';
    if (/^propTree/.test(name) || /^propPetal/.test(name) || /^propAncientRoot/.test(name)) return 'propTree';
    if (/^propRock/.test(name) || /^propStone/.test(name) || /^infernus/.test(name)) return 'propRock';
    if (/^propCrystal|propMana|propSoul|propRune/.test(name)) return 'propCrystal';
    if (/^prop/.test(name) || /^building/.test(name)) return 'propRuin';
    if (/^effect/.test(name)) return 'effectSoulSlash';
    return undefined;
  }

  private async loadTextureWithFallback(_key: TextureKey, fallbackUrl: string) {
    // Alpha 1.17: 저화질/고화질/풀팩 fallback 경쟁을 제거합니다.
    // 한 텍스처 키는 한 URL만 시도하므로, 로딩 중 서로 다른 이미지가 겹쳐 보이는 일을 줄입니다.
    return Assets.load<LoadedTexture>(fallbackUrl);
  }

  private buildMap() {
    this.mapLayer.removeChildren();
    this.ambientLayer.removeChildren();
    this.propLayer.removeChildren();
    this.currentMap = this.createZoneMap();

    this.addTerrainBackdrop();
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const tile = this.tileAt(x, y);
        const sprite = new Sprite(this.mustTexture(this.textureKeyForTile(tile)));
        const pos = isoToScreen(x, y);
        sprite.anchor.set(0.5, 0.5);
        sprite.position.set(pos.x, pos.y);
        sprite.alpha = tile === 'water' ? 0.95 : tile === 'cliff' ? 0.96 : 1;
        this.mapLayer.addChild(sprite);
        this.addGroundDecal(tile, x, y);
      }
    }

    this.addTerrainTransitions();
    this.addFieldDepthPass();
    this.addFieldReadabilityWash116();
    this.addZoneGroundMood();
    this.addVillageDecor();
    this.addZoneLandmarks();

    const fieldTier101 = this.performanceTier101();
    // Alpha 1.01: field decoration is now budgeted. The base terrain and landmarks stay,
    // but older layered ambience passes are skipped on mobile-lite profiles to reduce
    // hundreds of Graphics/Sprite nodes and first-frame jank.
    if (fieldTier101 !== 'lite') {
      this.addCuratedFieldDecor();
      this.addBiomeDecorPass();
      this.addInfernusDecorPass();
      this.addPledgeCitadelDecorPass();
      this.addAlpha055SetDressingPass();
      this.addAlpha058ImmersiveSetDressingPass();
      this.addAlpha062ReferenceFieldPass();
      this.addAlpha063AssetUpgradeFieldPass();
      this.addAlpha076ObjectBlendFieldPass();
    }
    if (fieldTier101 === 'quality') {
      this.addMegaFieldObjectPass();
      this.addAlpha056ImmersionFieldPass();
      this.addAlpha057VisualSetDressingPass();
      this.addAlpha059DeepPolishFieldPass();
      this.addAlpha066AssetRefinementFieldPass();
      this.addAlpha069PremiumVisualFieldPass();
      this.addAlpha077RasterObjectPolishPass();
    }
  }


  private addAlpha076ObjectBlendFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const accent = order >= 70 ? 0xc7b0ff : order >= 35 ? 0x8fe8ff : 0xb9ffd6;
    const wash = new Graphics();
    for (let i = 0; i < 9; i += 1) {
      const x = 9 + ((i * 3.9 + order * 0.13) % 27);
      const y = 18 + ((i * 2.7 + order * 0.09) % 10);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      wash.ellipse(pos.x, pos.y + 13, 30 + (i % 3) * 8, 7 + (i % 2) * 2).fill({ color: accent, alpha: 0.018 });
    }
    this.ambientLayer.addChild(wash);
  }


  private addAlpha077RasterObjectPolishPass() {
    // Raster-only visual pass: softens asset edges and anchors props to the isometric ground.
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const accent = order >= 70 ? 0xbda6ff : order >= 35 ? 0x8fe8ff : 0xa6f3c4;
    const veil = new Graphics();
    for (let i = 0; i < 14; i += 1) {
      const x = 7 + ((i * 3.2 + order * 0.19) % 31);
      const y = 16 + ((i * 2.15 + order * 0.11) % 12);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      veil.ellipse(pos.x, pos.y + 15, 34 + (i % 4) * 7, 7 + (i % 3) * 2).fill({ color: accent, alpha: 0.014 });
      if (i % 3 === 0) veil.ellipse(pos.x - 4, pos.y + 9, 18, 5).fill({ color: 0xffffff, alpha: 0.012 });
    }
    this.ambientLayer.addChild(veil);
  }



  /**
   * Alpha 1.16: 일부 모바일 화면에서 필드가 과하게 어둡게 보이던 문제를 완화합니다.
   * 타일과 오브젝트 위에 얇은 하늘빛 워시를 얹어 원화풍 밝기는 살리고,
   * 몬스터/캐릭터 가독성은 유지합니다.
   */
  private addFieldReadabilityWash116() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const isDarkZone = zoneId === 'black-cave' || zoneId === 'soul-ruins' || zoneId === 'demon-rift' || this.isInfernusZone();
    const bounds = [isoToScreen(0, 0), isoToScreen(MAP_W - 1, 0), isoToScreen(MAP_W - 1, MAP_H - 1), isoToScreen(0, MAP_H - 1)];
    const minX = Math.min(...bounds.map((p) => p.x)) - 220;
    const maxX = Math.max(...bounds.map((p) => p.x)) + 220;
    const minY = Math.min(...bounds.map((p) => p.y)) - 180;
    const maxY = Math.max(...bounds.map((p) => p.y)) + 220;
    const wash = new Graphics()
      .rect(minX, minY, maxX - minX, maxY - minY)
      .fill({ color: isDarkZone ? 0xb8e8ff : 0xffffff, alpha: isDarkZone ? 0.085 : 0.052 })
      .rect(minX, minY, maxX - minX, maxY - minY)
      .fill({ color: 0x8eeaff, alpha: isDarkZone ? 0.046 : 0.026 });
    this.ambientLayer.addChild(wash);
  }

  private addBiomeDecorPass() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const common: Array<[TextureKey, number, number, number]> = [
      ['propBanner' as TextureKey, 8.0, 20.6, 0.23],
      ['propStump' as TextureKey, 13.6, 23.4, 0.28],
      ['propBush' as TextureKey, 19.0, 19.2, 0.24],
      ['propBones' as TextureKey, 27.8, 22.9, 0.24]
    ];
    const byZone: Record<string, Array<[TextureKey, number, number, number]>> = {
      'slime-forest': [
        ['propBush' as TextureKey, 10.2, 24.9, 0.31], ['propBush' as TextureKey, 16.2, 22.9, 0.28],
        ['propMushroom' as TextureKey, 20.7, 21.4, 0.22], ['propStump' as TextureKey, 28.8, 17.3, 0.24]
      ],
      'crystal-moss': [
        ['propOre' as TextureKey, 19.8, 14.8, 0.25], ['propRuneStone' as TextureKey, 23.6, 18.2, 0.24],
        ['propMushroom' as TextureKey, 26.0, 20.2, 0.22], ['propBush' as TextureKey, 31.1, 18.4, 0.25]
      ],
      'goblin-road': [
        ['propBanner' as TextureKey, 18.4, 22.4, 0.28], ['propBones' as TextureKey, 22.6, 23.1, 0.28],
        ['propStump' as TextureKey, 30.4, 20.7, 0.23], ['propRuneStone' as TextureKey, 25.2, 18.1, 0.21]
      ],
      'black-cave': [
        ['propOre' as TextureKey, 21.5, 25.0, 0.3], ['propOre' as TextureKey, 28.6, 24.2, 0.28],
        ['propRuneStone' as TextureKey, 26.1, 22.6, 0.26], ['propBones' as TextureKey, 31.5, 25.8, 0.25]
      ],
      'ember-ridge': [
        ['propBones' as TextureKey, 24.0, 21.8, 0.3], ['propBanner' as TextureKey, 29.8, 19.8, 0.28],
        ['propRuneStone' as TextureKey, 33.4, 20.9, 0.24]
      ],
      'moonlit-grove': [
        ['propMushroom' as TextureKey, 22.0, 18.2, 0.28], ['propBush' as TextureKey, 25.4, 17.8, 0.32],
        ['propStump' as TextureKey, 31.0, 19.0, 0.25], ['propRuneStone' as TextureKey, 28.6, 21.5, 0.22]
      ],
      'soul-ruins': [
        ['propRuneStone' as TextureKey, 24.4, 22.0, 0.28], ['propBones' as TextureKey, 28.2, 23.6, 0.27],
        ['propBanner' as TextureKey, 31.6, 22.0, 0.26]
      ],
      'storm-citadel': [
        ['propBanner' as TextureKey, 26.8, 18.2, 0.31], ['propRuneStone' as TextureKey, 31.8, 17.4, 0.25],
        ['propOre' as TextureKey, 34.0, 20.0, 0.24]
      ],
      'dragon-nest': [
        ['propBones' as TextureKey, 31.4, 18.6, 0.33], ['propBanner' as TextureKey, 35.6, 18.3, 0.31],
        ['propRuneStone' as TextureKey, 29.4, 20.4, 0.27]
      ],
      'crystal-raid': [
        ['propRuneStone' as TextureKey, 25.2, 18.7, 0.31], ['propOre' as TextureKey, 28.8, 18.8, 0.28],
        ['propBanner' as TextureKey, 23.4, 20.4, 0.26]
      ],
      'bloodstone-mine': [
        ['propOre' as TextureKey, 25.0, 26.2, 0.33], ['propOre' as TextureKey, 31.8, 27.4, 0.29],
        ['propBones' as TextureKey, 35.0, 28.5, 0.25]
      ],
      'sky-citadel': [
        ['propBanner' as TextureKey, 29.8, 16.4, 0.32], ['propRuneStone' as TextureKey, 33.4, 17.4, 0.26],
        ['propOre' as TextureKey, 35.8, 18.6, 0.24]
      ],
      'demon-rift': [
        ['propBones' as TextureKey, 22.4, 22.3, 0.34], ['propBanner' as TextureKey, 31.4, 20.3, 0.33],
        ['propRuneStone' as TextureKey, 34.8, 21.2, 0.29]
      ]
    };
    const placed = [...common, ...(byZone[zoneId] || [])];
    placed.forEach(([key, x, y, scale], index) => {
      if (this.isWalkable(x, y)) this.addProp(key, x, y, scale + (index % 3) * 0.01);
    });
    this.addBiomeGlowAccents(zoneId);
  }


  private addMegaFieldObjectPass() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const zone = zones.find((entry) => entry.id === zoneId);
    const level = zone?.recommendedLevel || 1;
    const high = level >= 70;
    const palette: TextureKey[] = high
      ? ['propRuneStone' as TextureKey, 'propOre' as TextureKey, 'propBanner' as TextureKey, 'propBones' as TextureKey, 'propChest03' as TextureKey, 'propTorch04' as TextureKey]
      : ['propBush' as TextureKey, 'propMushroom' as TextureKey, 'propStump' as TextureKey, 'propOre' as TextureKey, 'propRuneStone' as TextureKey];
    const count = high ? 18 : 10;
    for (let i = 0; i < count; i += 1) {
      const x = 7 + ((i * 5.73 + level * 0.31) % 29);
      const y = 13 + ((i * 4.21 + level * 0.17) % 18);
      if (!this.isWalkable(x, y)) continue;
      const key = palette[(i + level) % palette.length];
      const scale = (high ? 0.22 : 0.18) + (i % 5) * 0.028;
      this.addProp(key, x, y, scale);
    }
    if (high) this.addHighZoneAtmosphere(level);
  }

  private addPledgeCitadelDecorPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || ''));
    if (!zone || zone.order < 73) return;
    const palette: TextureKey[] = ['propBanner' as TextureKey, 'propTorch05' as TextureKey, 'propChest05' as TextureKey, 'propRuneStone' as TextureKey, 'propOre' as TextureKey, 'propBones' as TextureKey];
    const anchors: Array<[number, number]> = [[9, 24], [13, 21], [17, 25], [22, 20], [26, 23], [31, 21], [35, 26], [28, 29]];
    anchors.forEach(([x, y], index) => {
      if (!this.isWalkable(x, y)) return;
      this.addProp(palette[(index + zone.order) % palette.length], x + (index % 2) * 0.35, y, 0.25 + (index % 3) * 0.035);
      const pos = isoToScreen(x, y);
      const aura = new Graphics().ellipse(pos.x, pos.y + 6, 36, 12).fill({ color: index % 2 ? 0xffd15f : 0x72e7ff, alpha: 0.045 });
      this.ambientLayer.addChild(aura);
    });
    const gate = new Graphics()
      .moveTo(-70, 0).lineTo(-38, -42).lineTo(-18, -18).lineTo(0, -58).lineTo(18, -18).lineTo(38, -42).lineTo(70, 0)
      .stroke({ color: 0xffd15f, alpha: 0.28, width: 5 })
      .moveTo(-55, 8).lineTo(55, 8).stroke({ color: 0x72e7ff, alpha: 0.22, width: 3 });
    const center = isoToScreen(zone.entry.x + 2.2, zone.entry.y - 1.6);
    gate.position.set(center.x, center.y - 18);
    this.ambientLayer.addChild(gate);
  }


  private addHighZoneAtmosphere(level: number) {
    const color = level >= 100 ? 0xff6ab7 : level >= 90 ? 0x9c80ff : 0x72e7ff;
    const lines = new Graphics();
    for (let i = 0; i < 16; i += 1) {
      const x = 8 + ((i * 6.11) % 28);
      const y = 14 + ((i * 4.97) % 17);
      const pos = isoToScreen(x, y);
      lines.moveTo(pos.x - 34, pos.y - 26).quadraticCurveTo(pos.x, pos.y - 52 - (i % 3) * 7, pos.x + 40, pos.y - 28)
        .stroke({ color, alpha: 0.07 + (i % 3) * 0.012, width: 2 + (i % 2) });
      if (i % 4 === 0) lines.circle(pos.x + 6, pos.y - 48, 7 + (i % 5)).fill({ color, alpha: 0.045 });
    }
    this.ambientLayer.addChild(lines);
  }

  private addBiomeGlowAccents(zoneId: string) {
    const color = this.isInfernusZone() ? 0xff6b35 : zoneId.includes('crystal') || zoneId === 'black-cave' ? 0x72e7ff : zoneId.includes('soul') || zoneId.includes('demon') ? 0x9c80ff : 0xe2b95f;
    const motes = new Graphics();
    for (let i = 0; i < 28; i += 1) {
      const x = 9 + ((i * 3.77) % 27);
      const y = 14 + ((i * 5.31) % 16);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      const r = 1.6 + (i % 4) * 0.7;
      motes.circle(pos.x, pos.y - 18 - (i % 5) * 7, r).fill({ color, alpha: 0.08 + (i % 3) * 0.018 });
      if (i % 6 === 0) motes.circle(pos.x + 12, pos.y - 31, r * 3.3).fill({ color, alpha: 0.018 });
    }
    this.ambientLayer.addChild(motes);
  }



  private addInfernusDecorPass() {
    if (!this.isInfernusZone()) return;
    const zoneId = this.options.zoneId || 'ember-ridge';
    const common: Array<[TextureKey, number, number, number]> = [
      ['infernusBrasero' as TextureKey, 17.2, 22.4, 0.72],
      ['infernusBrasero' as TextureKey, 29.0, 19.1, 0.72],
      ['infernusHellRocks' as TextureKey, 20.4, 24.2, 0.55],
      ['infernusRock' as TextureKey, 33.0, 20.4, 0.48],
      ['infernusSkull' as TextureKey, 25.4, 21.4, 1.0]
    ];
    const byZone: Record<string, Array<[TextureKey, number, number, number]>> = {
      'ember-ridge': [
        ['infernusBurnerColumn' as TextureKey, 23.2, 20.0, 0.62],
        ['infernusPillar' as TextureKey, 31.6, 18.2, 0.64]
      ],
      'dragon-nest': [
        ['infernusAltar' as TextureKey, 33.8, 18.5, 0.86],
        ['infernusColumn' as TextureKey, 29.5, 19.8, 0.66],
        ['infernusBurnerColumn' as TextureKey, 35.4, 19.5, 0.58]
      ],
      'crystal-raid': [
        ['infernusAltar' as TextureKey, 26.4, 18.7, 0.98],
        ['infernusBurnerColumn' as TextureKey, 24.0, 20.2, 0.66],
        ['infernusBurnerColumn' as TextureKey, 29.0, 20.1, 0.66],
        ['infernusPillar' as TextureKey, 31.8, 18.5, 0.58]
      ],
      'bloodstone-mine': [
        ['infernusColumn' as TextureKey, 22.8, 26.2, 0.65],
        ['infernusPillar' as TextureKey, 30.8, 28.4, 0.62],
        ['infernusHellRocks' as TextureKey, 34.0, 29.2, 0.6]
      ],
      'demon-rift': [
        ['infernusAltar' as TextureKey, 24.0, 21.0, 1.02],
        ['infernusBurnerColumn' as TextureKey, 21.7, 22.1, 0.7],
        ['infernusBurnerColumn' as TextureKey, 30.8, 20.1, 0.7],
        ['infernusColumn' as TextureKey, 35.4, 20.5, 0.72]
      ]
    };
    const placed = [...common, ...(byZone[zoneId] || [])];
    for (const [key, x, y, scale] of placed) this.addProp(key, x, y, scale);
    this.addInfernusHeatHaze();
  }

  private addInfernusHeatHaze() {
    const haze = new Graphics();
    for (let i = 0; i < 22; i += 1) {
      const x = 13 + ((i * 5.1) % 23);
      const y = 16 + ((i * 3.7) % 15);
      const pos = isoToScreen(x, y);
      haze
        .ellipse(pos.x, pos.y + 10, 62 + (i % 5) * 11, 16 + (i % 3) * 5)
        .fill({ color: i % 2 ? 0xff7a35 : 0x8b42ff, alpha: i % 2 ? 0.038 : 0.026 });
      if (i % 4 === 0) {
        haze
          .moveTo(pos.x - 18, pos.y - 4)
          .quadraticCurveTo(pos.x, pos.y - 18, pos.x + 20, pos.y - 3)
          .stroke({ color: 0xffb86b, alpha: 0.09, width: 2 });
      }
    }
    this.ambientLayer.addChild(haze);
  }

  private addCuratedFieldDecor() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const trees: Array<[number, number, number]> = [
      [4.6, 16.4, 0.34], [6.2, 25.2, 0.32], [12.8, 15.6, 0.34],
      [18.6, 12.8, 0.35], [25.8, 22.7, 0.33], [31.6, 26.2, 0.34]
    ];
    const rocks: Array<[number, number, number]> = [
      [5.6, 20.8, 0.25], [14.2, 23.8, 0.24], [20.8, 15.4, 0.26],
      [25.7, 26.2, 0.27], [32.8, 20.6, 0.25]
    ];
    const crystals: Array<[number, number, number]> = [
      [16.2, 17.4, 0.28], [23.5, 18.2, 0.3], [27.4, 20.4, 0.28]
    ];

    const zoneExtra: Record<string, { trees?: Array<[number, number, number]>; rocks?: Array<[number, number, number]>; crystals?: Array<[number, number, number]>; ruins?: Array<[number, number, number]>; torches?: Array<[number, number, number]>; chests?: Array<[number, number, number]> }> = {
      'slime-forest': { trees: [[10.8, 26.2, 0.32], [28.8, 16.4, 0.32]], rocks: [[17.8, 21.2, 0.22]] },
      'crystal-moss': { crystals: [[20.0, 14.0, 0.33], [24.6, 13.4, 0.31], [31.2, 15.6, 0.28]], rocks: [[18.5, 16.8, 0.22]] },
      'goblin-road': { ruins: [[18.4, 22.8, 0.25], [25.6, 26.8, 0.26]], torches: [[15.2, 22.4, 0.24], [31.4, 28.0, 0.24]] },
      'black-cave': { crystals: [[22.8, 28.2, 0.32], [30.8, 30.2, 0.3]], rocks: [[18.6, 26.2, 0.26], [34.2, 29.2, 0.25]] },
      'ember-ridge': { rocks: [[18.8, 22.0, 0.26], [27.6, 19.4, 0.25]], torches: [[21.8, 20.8, 0.24], [32.6, 18.6, 0.23]] },
      'moonlit-grove': { trees: [[15.0, 23.4, 0.34], [22.6, 18.6, 0.33], [34.2, 25.2, 0.32]], crystals: [[29.6, 21.8, 0.25]] },
      'soul-ruins': { ruins: [[16.8, 25.0, 0.26], [23.4, 27.0, 0.27], [31.0, 29.2, 0.25]], torches: [[13.8, 24.2, 0.22], [28.8, 28.8, 0.22]] },
      'storm-citadel': { ruins: [[20.6, 18.0, 0.25], [30.2, 17.8, 0.25]], crystals: [[25.6, 18.0, 0.24]] },
      'dragon-nest': { rocks: [[18.0, 23.2, 0.26], [27.8, 20.2, 0.26]], crystals: [[33.2, 18.8, 0.3]], chests: [[24.6, 21.4, 0.24]] },
      'crystal-raid': { crystals: [[22.0, 22.2, 0.34], [30.2, 19.4, 0.32]], torches: [[18.4, 22.0, 0.24], [33.8, 19.0, 0.24]], chests: [[26.8, 20.2, 0.25]] },
      'bloodstone-mine': { rocks: [[18.2, 25.6, 0.27], [31.4, 28.2, 0.26]], crystals: [[28.2, 27.0, 0.28]] },
      'sky-citadel': { ruins: [[21.0, 18.5, 0.25], [29.0, 18.2, 0.25]], crystals: [[25.4, 18.2, 0.24]] },
      'demon-rift': { crystals: [[23.0, 21.5, 0.32], [31.4, 20.0, 0.31]], ruins: [[27.0, 20.8, 0.26], [35.0, 20.0, 0.25]], torches: [[19.6, 22.4, 0.23]] }
    };

    const extra = zoneExtra[zoneId] || {};
    const addTrees = [...trees, ...(extra.trees || [])];
    const addRocks = [...rocks, ...(extra.rocks || [])];
    const addCrystals = [...crystals, ...(extra.crystals || [])];
    const addRuins = extra.ruins || [];
    const addTorches = extra.torches || [];
    const addChests = extra.chests || [];

    for (let i = 0; i < addTrees.length; i += 1) { const [x, y, scale] = addTrees[i]; this.addProp(this.propVariant('tree', i), x, y, scale); }
    for (let i = 0; i < addRocks.length; i += 1) { const [x, y, scale] = addRocks[i]; this.addProp(this.propVariant('rock', i), x, y, scale); }
    for (const [x, y, scale] of addCrystals) this.addProp('propCrystal', x, y, scale);
    for (const [x, y, scale] of addRuins) this.addProp('propRuin', x, y, scale);
    for (let i = 0; i < addTorches.length; i += 1) { const [x, y, scale] = addTorches[i]; this.addProp(this.propVariant('torch', i), x, y, scale); }
    for (let i = 0; i < addChests.length; i += 1) { const [x, y, scale] = addChests[i]; this.addProp(this.propVariant('chest', i), x, y, scale); }
    this.addAlpha054PremiumFieldDecor(zoneId);
  }


  private addAlpha055SetDressingPass() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const zone = zones.find((entry) => entry.id === zoneId);
    const order = zone?.order || 1;
    const low: Array<[TextureKey, number, number, number]> = [
      ['propFlowerPatch' as TextureKey, 11.4, 23.8, 0.34],
      ['propRoadSign' as TextureKey, 15.6, 21.6, 0.28],
      ['propCampLantern' as TextureKey, 23.2, 22.5, 0.24],
      ['propStoneSteps' as TextureKey, 27.8, 19.6, 0.30]
    ];
    const high: Array<[TextureKey, number, number, number]> = [
      ['propCrystalBrazier' as TextureKey, 18.4, 21.0, 0.28],
      ['propRiftAltar' as TextureKey, 25.8, 20.7, 0.30],
      ['propCampLantern' as TextureKey, 31.2, 22.4, 0.25],
      ['propStoneSteps' as TextureKey, 34.2, 25.0, 0.32]
    ];
    const pledge: Array<[TextureKey, number, number, number]> = [
      ['propRoadSign' as TextureKey, 10.8, 25.0, 0.30],
      ['propCampLantern' as TextureKey, 16.7, 23.1, 0.28],
      ['propCrystalBrazier' as TextureKey, 22.4, 22.0, 0.30],
      ['propRiftAltar' as TextureKey, 30.0, 21.8, 0.32]
    ];
    const table = order >= 73 ? pledge : order >= 55 ? high : low;
    table.forEach(([key, x, y, scale], index) => {
      if (!this.isWalkable(x, y)) return;
      this.addProp(key, x + ((order + index) % 3) * 0.18, y + (index % 2) * 0.16, scale);
    });
    if (order >= 55) this.addQualityLightPath(order);
  }

  private addQualityLightPath(order: number) {
    const color = order >= 73 ? 0xffd15f : order >= 60 ? 0x9c80ff : 0x72e7ff;
    const path = new Graphics();
    for (let i = 0; i < 9; i += 1) {
      const x = 10 + i * 2.9;
      const y = 24 - Math.sin((i + order) * 0.75) * 1.2;
      const pos = isoToScreen(x, y);
      path.ellipse(pos.x, pos.y + 10, 28, 7).fill({ color, alpha: 0.035 + (i % 3) * 0.006 });
      if (i > 0) {
        const prev = isoToScreen(10 + (i - 1) * 2.9, 24 - Math.sin((i - 1 + order) * 0.75) * 1.2);
        path.moveTo(prev.x, prev.y + 10).lineTo(pos.x, pos.y + 10).stroke({ color, alpha: 0.055, width: 2 });
      }
    }
    this.ambientLayer.addChild(path);
  }


  private addAlpha056ImmersionFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const bossLike = Boolean(zone?.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast'));
    const scenic: Array<[TextureKey, number, number, number]> = order < 20
      ? [
          ['propPetalTree' as TextureKey, 8.9, 21.8, 0.42],
          ['propSoulFlowers' as TextureKey, 14.8, 24.6, 0.34],
          ['propMarketCrate' as TextureKey, 20.4, 22.4, 0.28],
          ['propWaterReflection' as TextureKey, 28.8, 24.8, 0.34]
        ]
      : order < 65
        ? [
            ['propHeroStatue' as TextureKey, 13.6, 23.6, 0.34],
            ['propSoulFlowers' as TextureKey, 19.2, 21.0, 0.28],
            ['propMarketCrate' as TextureKey, 25.7, 22.7, 0.25],
            ['propWaterReflection' as TextureKey, 33.0, 24.4, 0.31]
          ]
        : [
            ['propHeroStatue' as TextureKey, 11.2, 24.1, 0.38],
            ['propBossTotem' as TextureKey, 21.8, 20.4, 0.36],
            ['propCrystalBrazier' as TextureKey, 28.6, 21.7, 0.32],
            ['propRiftAltar' as TextureKey, 34.2, 23.2, 0.36]
          ];
    const bossSet: Array<[TextureKey, number, number, number]> = bossLike
      ? [['propBossTotem' as TextureKey, 30.8, 18.6, 0.40], ['propHeroStatue' as TextureKey, 24.8, 20.1, 0.34]]
      : [];
    for (const [key, x, y, scale] of [...scenic, ...bossSet]) {
      if (this.isWalkable(x, y)) this.addProp(key, x, y, scale);
    }
    this.addAlpha056CinematicGround(order, bossLike);
  }


  private addAlpha057VisualSetDressingPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const bossLike = Boolean(zone?.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast'));
    const base: Array<[TextureKey, number, number, number]> = order < 18
      ? [
          ['propPathTorch' as TextureKey, 9.8, 22.4, 0.30],
          ['propMoonPuddle' as TextureKey, 16.8, 24.2, 0.36],
          ['propAncientRoot' as TextureKey, 23.4, 20.8, 0.34],
          ['propSilkBanner' as TextureKey, 31.6, 18.9, 0.31]
        ]
      : order < 60
        ? [
            ['propRuneFloor' as TextureKey, 12.6, 23.2, 0.34],
            ['propPathTorch' as TextureKey, 19.8, 21.4, 0.30],
            ['propBattleScar' as TextureKey, 28.4, 22.6, 0.38],
            ['propSilkBanner' as TextureKey, 34.2, 19.8, 0.33]
          ]
        : [
            ['propRuneFloor' as TextureKey, 11.8, 24.1, 0.40],
            ['propBattleScar' as TextureKey, 20.4, 21.8, 0.45],
            ['propPathTorch' as TextureKey, 29.6, 22.1, 0.34],
            ['propMoonPuddle' as TextureKey, 35.2, 24.9, 0.38]
          ];
    const bossProps: Array<[TextureKey, number, number, number]> = bossLike
      ? [['propRuneFloor' as TextureKey, 25.2, 19.8, 0.48], ['propBattleScar' as TextureKey, 31.4, 21.2, 0.46]]
      : [];
    for (const [key, x, y, scale] of [...base, ...bossProps]) {
      if (this.isWalkable(x, y)) this.addProp(key, x, y, scale);
    }
    this.addAlpha057DepthWash(order, bossLike);
  }

  private addAlpha057DepthWash(order: number, bossLike: boolean) {
    const accent = bossLike ? 0xff8a3d : order >= 60 ? 0x9c80ff : order >= 18 ? 0x72e7ff : 0xe2b95f;
    const layer = new Graphics();
    for (let i = 0; i < 11; i += 1) {
      const x = 8 + i * 2.7;
      const y = 24 - Math.sin(i * 0.72 + order * 0.08) * 1.3;
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      layer.ellipse(pos.x, pos.y + 12, 22 + (i % 3) * 10, 5 + (i % 2) * 3).fill({ color: accent, alpha: bossLike ? 0.034 : 0.024 });
      if (i % 3 === 1) layer.circle(pos.x + 9, pos.y - 12, 2.2).fill({ color: 0xffffff, alpha: 0.08 });
    }
    this.ambientLayer.addChild(layer);
  }



  private addAlpha058ImmersiveSetDressingPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const bossLike = Boolean(zone?.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast'));
    const marketLike = (zone?.id || '').includes('market') || order < 25;
    const table: Array<[TextureKey, number, number, number]> = bossLike
      ? [
          ['propBossGate' as TextureKey, 18.4, 21.0, 0.42],
          ['propTreasureGlow' as TextureKey, 25.8, 21.4, 0.38],
          ['propHoloBanner' as TextureKey, 31.4, 19.8, 0.34],
          ['propStoneLamp' as TextureKey, 34.8, 23.0, 0.30]
        ]
      : marketLike
        ? [
            ['propLanternArch' as TextureKey, 10.8, 23.4, 0.34],
            ['propTreasureGlow' as TextureKey, 17.2, 24.2, 0.30],
            ['propManaFog' as TextureKey, 24.6, 22.6, 0.38],
            ['propStoneLamp' as TextureKey, 30.8, 19.6, 0.30]
          ]
        : [
            ['propManaFog' as TextureKey, 12.0, 23.8, 0.42],
            ['propHoloBanner' as TextureKey, 20.6, 20.8, 0.32],
            ['propLanternArch' as TextureKey, 28.4, 22.8, 0.34],
            ['propTreasureGlow' as TextureKey, 34.2, 24.2, 0.36]
          ];
    for (const [key, x, y, scale] of table) {
      if (this.isWalkable(x, y)) this.addProp(key, x, y, scale);
    }
    this.addAlpha058CinematicLightWash(order, bossLike);
  }

  private addAlpha058CinematicLightWash(order: number, bossLike: boolean) {
    const accent = bossLike ? 0xffb34a : order >= 80 ? 0xb794ff : order >= 45 ? 0x73e7ff : 0xe2b95f;
    const layer = new Graphics();
    for (let i = 0; i < 14; i += 1) {
      const x = 7.5 + ((i * 2.6 + order * 0.19) % 30);
      const y = 17 + ((i * 3.1 + order * 0.11) % 11);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      layer.ellipse(pos.x, pos.y + 12, 28 + (i % 4) * 13, 7 + (i % 3) * 2).fill({ color: accent, alpha: bossLike ? 0.038 : 0.026 });
      if (i % 4 === 0) {
        layer.circle(pos.x + 18, pos.y - 28, 2.8).fill({ color: 0xffffff, alpha: 0.11 });
        layer.moveTo(pos.x + 18, pos.y - 22).lineTo(pos.x + 10, pos.y + 6).stroke({ color: 0xffffff, alpha: 0.035, width: 1.5 });
      }
    }
    this.ambientLayer.addChild(layer);
  }



  private addAlpha059DeepPolishFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest'));
    const order = zone?.order || 1;
    const bossLike = Boolean(zone?.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast'));
    const townLike = (zone?.id || '').includes('market') || (zone?.id || '').includes('yard') || order < 28;
    const table: Array<[TextureKey, number, number, number]> = bossLike
      ? [
          ['propRoyalArch' as TextureKey, 14.2, 22.6, 0.38],
          ['propGoldWarBanner' as TextureKey, 20.2, 20.6, 0.35],
          ['propCandleCircle' as TextureKey, 26.6, 21.2, 0.42],
          ['propMarbleCrack' as TextureKey, 33.0, 23.6, 0.48]
        ]
      : townLike
        ? [
            ['propSoulFountain' as TextureKey, 11.2, 23.6, 0.34],
            ['propHuntMarker' as TextureKey, 18.4, 22.8, 0.30],
            ['propCandleCircle' as TextureKey, 25.2, 24.0, 0.36],
            ['propGoldWarBanner' as TextureKey, 32.4, 19.6, 0.30]
          ]
        : [
            ['propHuntMarker' as TextureKey, 12.0, 23.4, 0.32],
            ['propMarbleCrack' as TextureKey, 19.4, 21.8, 0.44],
            ['propSoulFountain' as TextureKey, 27.0, 23.0, 0.34],
            ['propRoyalArch' as TextureKey, 35.0, 20.4, 0.36]
          ];
    for (const [key, x, y, scale] of table) {
      if (this.isWalkable(x, y)) this.addProp(key, x, y, scale);
    }
    this.addAlpha059PremiumGroundWash(order, bossLike);
  }

  private addAlpha059PremiumGroundWash(order: number, bossLike: boolean) {
    const color = bossLike ? 0xffd15f : order >= 80 ? 0xb794ff : order >= 45 ? 0x72e7ff : 0x8fffd2;
    const layer = new Graphics();
    for (let i = 0; i < 16; i += 1) {
      const x = 7.8 + ((i * 2.35 + order * 0.17) % 30);
      const y = 17.2 + ((i * 3.45 + order * 0.13) % 11.5);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      layer.ellipse(pos.x, pos.y + 11, 24 + (i % 4) * 10, 5 + (i % 3) * 2).fill({ color, alpha: bossLike ? 0.04 : 0.026 });
      if (i % 5 === 2) {
        layer.circle(pos.x + 14, pos.y - 24, 2.2).fill({ color: 0xffffff, alpha: 0.1 });
        layer.moveTo(pos.x + 14, pos.y - 20).lineTo(pos.x + 2, pos.y + 6).stroke({ color: 0xffffff, alpha: 0.032, width: 1.2 });
      }
    }
    this.ambientLayer.addChild(layer);
  }


  private addAlpha062ReferenceFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const order = zone.order || 1;
    const bossLike = zone.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast');
    const isEarlyAdventure = order < 30;
    const primary = bossLike ? 0xffd15f : order >= 80 ? 0xb794ff : order >= 45 ? 0x72e7ff : 0x79d9ff;
    const secondary = isEarlyAdventure ? 0x8fffd2 : bossLike ? 0xff8d5d : 0xffffff;
    const layer = new Graphics();

    // Reference-grade anime field mood: soft sky reflection, royal path trims, and reward-like sparkles.
    for (let i = 0; i < 22; i += 1) {
      const x = 6.5 + ((i * 2.73 + order * 0.31) % 32);
      const y = 15.0 + ((i * 4.17 + order * 0.19) % 16);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      const wide = 34 + (i % 5) * 11;
      const tall = 7 + (i % 4) * 2;
      layer.ellipse(pos.x, pos.y + 12, wide, tall).fill({ color: primary, alpha: bossLike ? 0.046 : 0.032 });
      if (i % 4 === 0) {
        layer.circle(pos.x + 16, pos.y - 24, 2.4 + (i % 3) * 0.7).fill({ color: 0xffffff, alpha: 0.14 });
        layer.moveTo(pos.x + 16, pos.y - 18).lineTo(pos.x - 2, pos.y + 6).stroke({ color: 0xffffff, alpha: 0.038, width: 1.25 });
      }
      if (i % 6 === 3) {
        layer.moveTo(pos.x - 10, pos.y + 2).lineTo(pos.x, pos.y - 7).lineTo(pos.x + 10, pos.y + 2).lineTo(pos.x, pos.y + 10).closePath()
          .stroke({ color: secondary, alpha: 0.12, width: 1.4 });
      }
    }

    const entry = zone.entry || zones[0].entry;
    const entryPos = isoToScreen(entry.x, entry.y);
    layer
      .ellipse(entryPos.x, entryPos.y + 10, 116, 32).fill({ color: 0xffffff, alpha: 0.036 })
      .ellipse(entryPos.x, entryPos.y + 10, 88, 22).stroke({ color: 0xffe5a2, alpha: 0.16, width: 2.4 })
      .ellipse(entryPos.x, entryPos.y + 10, 58, 15).stroke({ color: primary, alpha: 0.18, width: 1.8 });

    const targetPocket = this.spawnCandidatesForZone(zone.id).slice(-1)[0];
    if (targetPocket) {
      const bossPos = isoToScreen(targetPocket.x, targetPocket.y);
      layer
        .ellipse(bossPos.x, bossPos.y + 12, bossLike ? 150 : 108, bossLike ? 44 : 30).fill({ color: primary, alpha: bossLike ? 0.058 : 0.035 })
        .ellipse(bossPos.x, bossPos.y + 10, bossLike ? 116 : 78, bossLike ? 32 : 22).stroke({ color: 0xffffff, alpha: bossLike ? 0.14 : 0.08, width: 2 });
    }

    this.ambientLayer.addChild(layer);
    this.addAlpha062PathRibbon(zone.id, primary);
  }

  private addAlpha062PathRibbon(zoneId: string, color: number) {
    const seeds = this.spawnCandidatesForZone(zoneId).slice(0, 8);
    if (seeds.length < 2) return;
    const ribbon = new Graphics();
    for (let i = 0; i < seeds.length - 1; i += 1) {
      const start = isoToScreen(seeds[i].x, seeds[i].y);
      const end = isoToScreen(seeds[i + 1].x, seeds[i + 1].y);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 10;
      ribbon
        .moveTo(start.x, start.y + 10)
        .quadraticCurveTo(midX, midY, end.x, end.y + 10)
        .stroke({ color: 0xffffff, alpha: 0.035, width: 5 })
        .moveTo(start.x, start.y + 10)
        .quadraticCurveTo(midX, midY, end.x, end.y + 10)
        .stroke({ color, alpha: 0.045, width: 2 });
    }
    this.ambientLayer.addChild(ribbon);
  }

  private addAlpha063AssetUpgradeFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const bossLike = Boolean(zone.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast'));
    const order = zone.order || 1;
    const primary = bossLike ? 0xffb15f : order >= 40 ? 0xa98dff : order >= 15 ? 0x72e7ff : 0x92eac4;
    const secondary = bossLike ? 0xff6f5f : 0xffe5a2;
    const layer = new Graphics();

    for (let i = 0; i < 18; i += 1) {
      const x = 6.5 + ((i * 4.87 + order * 0.37) % 30);
      const y = 13.5 + ((i * 3.91 + order * 0.23) % 18);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      const wide = 56 + (i % 5) * 16;
      const tall = 12 + (i % 4) * 3;
      layer
        .ellipse(pos.x, pos.y + 11, wide, tall).fill({ color: 0xffffff, alpha: 0.028 })
        .ellipse(pos.x, pos.y + 10, wide * 0.72, tall * 0.68).stroke({ color: primary, alpha: 0.055, width: 1.7 });
      if (i % 3 === 0) {
        layer
          .moveTo(pos.x - 6, pos.y - 18).lineTo(pos.x, pos.y - 34).lineTo(pos.x + 6, pos.y - 18).lineTo(pos.x, pos.y - 8).closePath()
          .fill({ color: secondary, alpha: 0.11 })
          .stroke({ color: 0xffffff, alpha: 0.11, width: 1.1 });
      }
      if (i % 4 === 1) {
        layer
          .moveTo(pos.x - 22, pos.y - 6)
          .quadraticCurveTo(pos.x, pos.y - 24, pos.x + 22, pos.y - 6)
          .stroke({ color: 0xffffff, alpha: 0.048, width: 3 })
          .moveTo(pos.x - 16, pos.y - 2)
          .quadraticCurveTo(pos.x, pos.y - 16, pos.x + 16, pos.y - 2)
          .stroke({ color: primary, alpha: 0.064, width: 1.4 });
      }
    }

    const entry = zone.entry || zones[0].entry;
    const entryPos = isoToScreen(entry.x, entry.y);
    layer
      .ellipse(entryPos.x, entryPos.y + 9, 132, 38).fill({ color: 0xffffff, alpha: 0.04 })
      .ellipse(entryPos.x, entryPos.y + 9, 98, 28).stroke({ color: secondary, alpha: 0.20, width: 2.2 })
      .ellipse(entryPos.x, entryPos.y + 9, 62, 18).stroke({ color: primary, alpha: 0.22, width: 1.7 });

    const bossPocket = this.spawnCandidatesForZone(zone.id).slice(-2)[0];
    if (bossPocket) {
      const pos = isoToScreen(bossPocket.x, bossPocket.y);
      layer
        .ellipse(pos.x, pos.y + 12, bossLike ? 172 : 118, bossLike ? 52 : 34).fill({ color: primary, alpha: bossLike ? 0.072 : 0.042 })
        .ellipse(pos.x, pos.y + 11, bossLike ? 128 : 86, bossLike ? 38 : 25).stroke({ color: 0xffffff, alpha: bossLike ? 0.18 : 0.10, width: 2.2 })
        .moveTo(pos.x, pos.y - 62).lineTo(pos.x, pos.y + 8).stroke({ color: secondary, alpha: bossLike ? 0.13 : 0.08, width: 2 });
    }

    this.ambientLayer.addChild(layer);
  }


  private addAlpha066AssetRefinementFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const order = zone.order || 1;
    const bossLike = zone.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast');
    const crystalMood = zone.id.includes('crystal') || zone.id.includes('frost') || zone.id.includes('storm');
    const infernusMood = this.isInfernusZone() || zone.id.includes('molten') || zone.id.includes('dragon');
    const primary = bossLike ? 0xffc25f : infernusMood ? 0xff7a3d : crystalMood ? 0x85dcff : order >= 55 ? 0xb99dff : 0x83eac5;
    const trim = bossLike || infernusMood ? 0xffe19a : 0xffffff;
    const layer = new Graphics();

    // Soft landing shadows and readable path accents. This keeps the WebP tiles premium without making the field noisy.
    const pockets = this.spawnCandidatesForZone(zone.id).slice(0, 11);
    pockets.forEach((point, index) => {
      const pos = isoToScreen(point.x, point.y);
      const wide = 52 + (index % 4) * 12 + (bossLike ? 16 : 0);
      const tall = 12 + (index % 3) * 3;
      layer
        .ellipse(pos.x, pos.y + 12, wide, tall).fill({ color: 0xffffff, alpha: 0.030 })
        .ellipse(pos.x, pos.y + 11, wide * 0.72, tall * 0.66).stroke({ color: primary, alpha: 0.070, width: 1.8 });
      if (index % 3 === 0) {
        layer
          .moveTo(pos.x - 8, pos.y - 26).lineTo(pos.x, pos.y - 44).lineTo(pos.x + 8, pos.y - 26).lineTo(pos.x, pos.y - 16).closePath()
          .fill({ color: primary, alpha: 0.115 })
          .stroke({ color: trim, alpha: 0.130, width: 1.25 });
      }
    });

    for (let i = 0; i < pockets.length - 1; i += 1) {
      const a = isoToScreen(pockets[i].x, pockets[i].y);
      const b = isoToScreen(pockets[i + 1].x, pockets[i + 1].y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2 - 12 - (i % 2) * 6;
      layer
        .moveTo(a.x, a.y + 10)
        .quadraticCurveTo(midX, midY, b.x, b.y + 10)
        .stroke({ color: 0xffffff, alpha: 0.040, width: 5.5 })
        .moveTo(a.x, a.y + 10)
        .quadraticCurveTo(midX, midY, b.x, b.y + 10)
        .stroke({ color: primary, alpha: 0.060, width: 2 });
    }

    const entry = zone.entry || zones[0].entry;
    const entryPos = isoToScreen(entry.x, entry.y);
    layer
      .ellipse(entryPos.x, entryPos.y + 10, 142, 40).fill({ color: 0xffffff, alpha: 0.044 })
      .ellipse(entryPos.x, entryPos.y + 10, 105, 29).stroke({ color: trim, alpha: 0.24, width: 2.4 })
      .ellipse(entryPos.x, entryPos.y + 10, 68, 19).stroke({ color: primary, alpha: 0.26, width: 1.8 });

    const markerSeeds = pockets.slice(1, 6);
    markerSeeds.forEach((point, index) => {
      const pos = isoToScreen(point.x, point.y);
      const height = 34 + (index % 2) * 8;
      layer
        .moveTo(pos.x - 1, pos.y + 6).lineTo(pos.x - 1, pos.y - height).stroke({ color: 0x123967, alpha: 0.16, width: 2 })
        .moveTo(pos.x - 8, pos.y - height + 7).lineTo(pos.x + 18, pos.y - height + 1).lineTo(pos.x + 18, pos.y - height + 14).lineTo(pos.x - 8, pos.y - height + 20).closePath()
        .fill({ color: index % 2 ? 0x2fa0f0 : 0xe2b95f, alpha: 0.135 })
        .stroke({ color: 0xffffff, alpha: 0.14, width: 1 });
    });

    this.ambientLayer.addChild(layer);
  }


  private addAlpha069PremiumVisualFieldPass() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const order = zone.order || 1;
    const bossLike = zone.monsterIds.some((id) => id === 'fieldBoss' || id === 'dragon' || id === 'riftBeast');
    const waterMood = zone.id.includes('shore') || zone.id.includes('river') || zone.id.includes('crystal') || zone.id.includes('frost');
    const infernusMood = this.isInfernusZone() || zone.id.includes('molten') || zone.id.includes('dragon');
    const primary = bossLike ? 0xffd77a : infernusMood ? 0xff8755 : waterMood ? 0x78dbff : order >= 70 ? 0xbba2ff : 0x8df2c9;
    const secondary = bossLike || infernusMood ? 0xfff0b4 : 0xffffff;
    const layer = new Graphics();

    // 0.69: low-noise premium readability pass. Keep the actual WebP terrain visible while giving it anime-grade depth.
    const pockets = this.spawnCandidatesForZone(zone.id).slice(0, 13);
    pockets.forEach((point, index) => {
      const pos = isoToScreen(point.x, point.y);
      const pulse = 1 + (index % 4) * 0.08;
      layer
        .ellipse(pos.x, pos.y + 13, (58 + (index % 4) * 12) * pulse, 13 + (index % 3) * 3)
        .fill({ color: 0x001f4d, alpha: bossLike ? 0.040 : 0.026 })
        .ellipse(pos.x, pos.y + 10, (42 + (index % 4) * 10) * pulse, 9 + (index % 3) * 2)
        .fill({ color: 0xffffff, alpha: 0.026 })
        .ellipse(pos.x, pos.y + 10, (50 + (index % 4) * 11) * pulse, 12 + (index % 3) * 2)
        .stroke({ color: primary, alpha: bossLike ? 0.100 : 0.070, width: 1.45 });

      if (index % 4 === 0) {
        layer
          .circle(pos.x + 18, pos.y - 31, 2.8).fill({ color: secondary, alpha: 0.20 })
          .moveTo(pos.x + 18, pos.y - 26).lineTo(pos.x + 2, pos.y + 3).stroke({ color: secondary, alpha: 0.050, width: 1.2 });
      }
      if (index % 5 === 2) {
        layer
          .moveTo(pos.x - 11, pos.y - 25).lineTo(pos.x, pos.y - 46).lineTo(pos.x + 11, pos.y - 25).lineTo(pos.x, pos.y - 12).closePath()
          .fill({ color: primary, alpha: 0.12 })
          .stroke({ color: 0xffffff, alpha: 0.16, width: 1.1 });
      }
    });

    for (let i = 0; i < pockets.length - 1; i += 1) {
      const start = isoToScreen(pockets[i].x, pockets[i].y);
      const end = isoToScreen(pockets[i + 1].x, pockets[i + 1].y);
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2 - 15 - (i % 2) * 5;
      layer
        .moveTo(start.x, start.y + 11)
        .quadraticCurveTo(midX, midY, end.x, end.y + 11)
        .stroke({ color: 0xffffff, alpha: 0.052, width: 6 })
        .moveTo(start.x, start.y + 11)
        .quadraticCurveTo(midX, midY, end.x, end.y + 11)
        .stroke({ color: primary, alpha: 0.078, width: 2.2 });
    }

    const entry = zone.entry || zones[0].entry;
    const entryPos = isoToScreen(entry.x, entry.y);
    layer
      .ellipse(entryPos.x, entryPos.y + 10, 156, 44).fill({ color: 0xffffff, alpha: 0.046 })
      .ellipse(entryPos.x, entryPos.y + 10, 116, 31).stroke({ color: secondary, alpha: 0.26, width: 2.5 })
      .ellipse(entryPos.x, entryPos.y + 10, 72, 20).stroke({ color: primary, alpha: 0.30, width: 1.8 });

    if (bossLike) {
      const bossPocket = pockets[pockets.length - 1];
      if (bossPocket) {
        const pos = isoToScreen(bossPocket.x, bossPocket.y);
        layer
          .ellipse(pos.x, pos.y + 13, 188, 56).fill({ color: primary, alpha: 0.085 })
          .ellipse(pos.x, pos.y + 13, 138, 40).stroke({ color: 0xffffff, alpha: 0.18, width: 2.3 })
          .circle(pos.x, pos.y - 64, 4).fill({ color: secondary, alpha: 0.18 })
          .moveTo(pos.x, pos.y - 58).lineTo(pos.x, pos.y + 10).stroke({ color: secondary, alpha: 0.12, width: 2 });
      }
    }

    this.ambientLayer.addChild(layer);
  }

  private addAlpha056CinematicGround(order: number, bossLike: boolean) {
    const primary = bossLike ? 0xff6b36 : order >= 65 ? 0x9c80ff : order >= 20 ? 0x72e7ff : 0xe2b95f;
    const wash = new Graphics();
    for (let i = 0; i < 16; i += 1) {
      const x = 8 + ((i * 4.31 + order * 0.23) % 28);
      const y = 15 + ((i * 3.73 + order * 0.17) % 15);
      if (!this.isWalkable(x, y)) continue;
      const pos = isoToScreen(x, y);
      wash.ellipse(pos.x, pos.y + 8, 46 + (i % 4) * 12, 10 + (i % 3) * 4).fill({ color: primary, alpha: bossLike ? 0.042 : 0.03 });
      if (i % 5 === 0) {
        wash.circle(pos.x + 8, pos.y - 20, 3 + (i % 3)).fill({ color: primary, alpha: 0.14 });
      }
    }
    const entry = zones.find((zone) => zone.id === (this.options.zoneId || 'slime-forest'))?.entry || zones[0].entry;
    const start = isoToScreen(entry.x, entry.y);
    wash.ellipse(start.x, start.y + 10, 92, 18).fill({ color: 0xe2b95f, alpha: 0.045 });
    wash.moveTo(start.x - 90, start.y + 4).lineTo(start.x + 88, start.y + 4).stroke({ color: 0xffffff, alpha: 0.07, width: 3 });
    this.ambientLayer.addChild(wash);
  }

  private addAlpha054PremiumFieldDecor(zoneId: string) {
    const level = zones.find((zone) => zone.id === zoneId)?.recommendedLevel || 1;
    const scenic: Array<[TextureKey, number, number, number]> = [
      ['propGrassClump' as TextureKey, 7.4, 22.6, 0.34], ['propGrassClump' as TextureKey, 12.8, 24.1, 0.28],
      ['propGrassClump' as TextureKey, 22.4, 18.8, 0.30], ['propBrokenCart' as TextureKey, 18.4, 23.8, 0.28]
    ];
    const high: Array<[TextureKey, number, number, number]> = level >= 70 ? [
      ['propAncientGate' as TextureKey, 25.6, 20.2, 0.34], ['propBloodBanner' as TextureKey, 29.8, 21.1, 0.32],
      ['propBrokenCart' as TextureKey, 33.2, 23.6, 0.30]
    ] : [];
    const newFront: Record<string, Array<[TextureKey, number, number, number]>> = {
      'orc-battlefield': [['propBloodBanner' as TextureKey, 16.0, 23.0, 0.38], ['propBrokenCart' as TextureKey, 23.6, 25.2, 0.36], ['propAncientGate' as TextureKey, 31.2, 25.8, 0.34]],
      'nightmare-roost': [['propAncientGate' as TextureKey, 18.2, 20.4, 0.34], ['propBloodBanner' as TextureKey, 27.4, 20.0, 0.30]],
      'molten-core-works': [['propAncientGate' as TextureKey, 21.5, 23.7, 0.36], ['propBrokenCart' as TextureKey, 30.6, 24.8, 0.32]],
      'frost-oracle-court': [['propAncientGate' as TextureKey, 22.4, 18.8, 0.40], ['propGrassClump' as TextureKey, 28.8, 19.6, 0.24]],
      'royal-blood-keep': [['propBloodBanner' as TextureKey, 20.4, 24.0, 0.42], ['propAncientGate' as TextureKey, 28.6, 23.4, 0.42]],
      'behemoth-rift': [['propAncientGate' as TextureKey, 27.0, 20.8, 0.46], ['propBloodBanner' as TextureKey, 33.6, 22.4, 0.40]]
    };
    for (const [key, x, y, scale] of [...scenic, ...high, ...(newFront[zoneId] || [])]) this.addProp(key, x, y, scale);
  }

  private createZoneMap() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const map = worldMap.map((row) => [...row]);

    const paint = (x: number, y: number, tile: TileId) => {
      if (x <= 0 || y <= 0 || x >= MAP_W - 1 || y >= MAP_H - 1) return;
      if (map[y][x] === 'water' || map[y][x] === 'cliff') return;
      map[y][x] = tile;
    };

    const brush = (cx: number, cy: number, radius: number, tile: TileId) => {
      for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
        for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
          if (distance(cx, cy, x, y) <= radius) paint(x, y, tile);
        }
      }
    };

    const road = (points: Array<[number, number]>, tile: TileId, width = 1) => {
      for (let i = 0; i < points.length - 1; i += 1) {
        const [sx, sy] = points[i];
        const [ex, ey] = points[i + 1];
        const steps = Math.max(Math.abs(ex - sx), Math.abs(ey - sy), 1) * 3;
        for (let step = 0; step <= steps; step += 1) {
          const t = step / steps;
          brush(sx + (ex - sx) * t, sy + (ey - sy) * t, width, tile);
        }
      }
    };

    // 0.16: large field layout with long approach lanes, monster pockets, and depth bands.
    const entry = zones.find((zone) => zone.id === zoneId)?.entry || zones[0].entry;
    brush(entry.x, entry.y, 2.25, zoneId === 'black-cave' || zoneId === 'crystal-raid' ? 'stone' : 'dirt');
    road([[entry.x, entry.y], [11, 23], [15, 21], [20, 19], [25, 20], [31, 24], [35, 28]], 'dirt', 0.9);

    if (zoneId === 'crystal-moss') {
      road([[entry.x, entry.y], [12, 22], [16, 19], [20, 15], [25, 13], [31, 14], [34, 18]], 'moss', 1.26);
      brush(18, 16, 3.6, 'moss');
      brush(25, 13, 3.0, 'crystal');
      brush(31, 16, 2.6, 'crystal');
      brush(34, 20, 2.2, 'moss');
    } else if (zoneId === 'goblin-road') {
      road([[entry.x, entry.y], [12, 22], [17, 23], [22, 24], [28, 27], [34, 30]], 'stone', 1.16);
      brush(18, 23, 3.5, 'stone');
      brush(25, 26, 3.0, 'dirt');
      brush(31, 30, 2.8, 'stone');
      for (const [x, y] of [[20, 22], [22, 25], [29, 28], [33, 29]]) brush(x, y, 0.9, 'crystal');
    } else if (zoneId === 'black-cave') {
      road([[entry.x, entry.y], [13, 24], [18, 26], [24, 29], [30, 30], [35, 31]], 'stone', 1.2);
      brush(23, 28, 4.0, 'crystal');
      brush(31, 31, 3.0, 'crystal');
      brush(34, 28, 2.0, 'stone');
      for (const [x, y] of [[6, 14], [7, 15], [12, 11], [17, 9], [24, 12], [31, 21], [22, 34], [35, 24]]) paint(x, y, 'cliff');
    } else if (zoneId === 'crystal-raid') {
      brush(13, 24, 2.4, 'stone');
      brush(22, 22, 4.2, 'crystal');
      brush(31, 19, 3.6, 'crystal');
      brush(35, 18, 2.0, 'stone');
      road([[entry.x, entry.y], [14, 24], [19, 22], [25, 20], [31, 19], [35, 18]], 'stone', 1.16);
    } else if ((zones.find((zone) => zone.id === zoneId)?.recommendedLevel || 0) >= 70) {
      const recommendedLevel = zones.find((zone) => zone.id === zoneId)?.recommendedLevel || 70;
      const coreTile: TileId = recommendedLevel >= 100 ? 'crystal' : recommendedLevel >= 90 ? 'stone' : recommendedLevel >= 80 ? 'moss' : 'dirt';
      road([[entry.x, entry.y], [12, 24], [17, 21], [23, 20], [29, 22], [35, 25]], coreTile, 1.25);
      brush(14, 24, 3.3, coreTile);
      brush(22, 20, 3.8, recommendedLevel >= 90 ? 'crystal' : 'moss');
      brush(30, 22, 3.4, recommendedLevel >= 100 ? 'crystal' : 'stone');
      brush(35, 25, 2.8, recommendedLevel >= 96 ? 'crystal' : 'dirt');
      for (const [x, y] of [[9, 18], [13, 13], [20, 15], [28, 15], [35, 18], [24, 29], [31, 31]]) brush(x, y, 1.0, recommendedLevel >= 90 ? 'crystal' : 'moss');
    } else {
      road([[entry.x, entry.y], [10, 23], [14, 24], [18, 22], [22, 19], [28, 17], [34, 18]], 'dirt', 0.98);
      brush(11, 24, 3.0, 'grass');
      brush(18, 22, 3.0, 'grass');
      brush(27, 18, 2.8, 'moss');
      brush(34, 18, 2.4, 'grass');
    }

    return map;
  }

  private isInfernusZone() {
    return infernusZoneIds.has(this.options.zoneId || '');
  }

  private textureKeyForTile(tile: TileId): TextureKey {
    if (this.isInfernusZone() && (tile === 'dirt' || tile === 'stone' || tile === 'moss')) return 'tileInfernus' as TextureKey;
    return tileTextureKey[tile];
  }

  private tileAt(x: number, y: number) {
    if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 'cliff' as TileId;
    return this.currentMap[y]?.[x] || 'cliff';
  }

  private addTerrainBackdrop() {
    const bounds = [isoToScreen(0, 0), isoToScreen(MAP_W - 1, 0), isoToScreen(MAP_W - 1, MAP_H - 1), isoToScreen(0, MAP_H - 1)];
    const shadow = new Graphics()
      .moveTo(bounds[0].x, bounds[0].y + 18)
      .lineTo(bounds[1].x, bounds[1].y + 18)
      .lineTo(bounds[2].x, bounds[2].y + 26)
      .lineTo(bounds[3].x, bounds[3].y + 26)
      .closePath()
      .fill({ color: 0x244b62, alpha: 0.16 });
    this.mapLayer.addChild(shadow);
  }

  private addGroundDecal(tile: TileId, x: number, y: number) {
    if (tile === 'water' || tile === 'cliff') return;
    const seed = (x * 92821 + y * 68917) % 1000;
    const pos = isoToScreen(x, y);
    const decal = new Graphics();

    if (tile === 'grass' && seed % 3 === 0) {
      decal
        .moveTo(pos.x - 20, pos.y + 2)
        .quadraticCurveTo(pos.x - 2, pos.y - 7, pos.x + 18, pos.y + 2)
        .stroke({ color: 0xd1e98e, alpha: 0.18, width: 1.5 });
      for (let i = 0; i < 3; i += 1) {
        const ox = ((seed + i * 17) % 34) - 17;
        const oy = ((seed + i * 23) % 15) - 6;
        decal.moveTo(pos.x + ox, pos.y + oy + 3).lineTo(pos.x + ox + 3, pos.y + oy - 3).stroke({ color: 0xc5f18f, alpha: 0.18, width: 1.2 });
      }
    }

    if (tile === 'dirt') {
      decal
        .moveTo(pos.x - 32, pos.y + 1)
        .quadraticCurveTo(pos.x - 10, pos.y + 9, pos.x + 30, pos.y + 3)
        .stroke({ color: 0xf1c577, alpha: 0.18, width: 3 });
      if (seed % 2 === 0) {
        decal.circle(pos.x - 16, pos.y - 2, 1.6).fill({ color: 0xf3d09a, alpha: 0.22 });
        decal.circle(pos.x + 19, pos.y + 8, 1.4).fill({ color: 0x281812, alpha: 0.18 });
      }
    }

    if (tile === 'moss') {
      decal
        .ellipse(pos.x + 8, pos.y - 1, 24, 8)
        .fill({ color: 0x78ffdc, alpha: 0.035 })
        .moveTo(pos.x - 24, pos.y + 2)
        .quadraticCurveTo(pos.x - 3, pos.y - 9, pos.x + 26, pos.y)
        .stroke({ color: 0xc8ffef, alpha: 0.17, width: 1.8 });
    }

    if (tile === 'stone' && seed % 2 === 1) {
      decal
        .moveTo(pos.x - 22, pos.y - 2)
        .lineTo(pos.x - 5, pos.y - 10)
        .lineTo(pos.x + 16, pos.y - 2)
        .stroke({ color: 0xe5d4ac, alpha: 0.18, width: 1.4 })
        .moveTo(pos.x + 2, pos.y + 10)
        .lineTo(pos.x + 22, pos.y + 2)
        .stroke({ color: 0x1d251f, alpha: 0.16, width: 1.6 });
    }

    if (tile === 'crystal') {
      decal
        .circle(pos.x + 8, pos.y - 4, 13)
        .fill({ color: 0x72e7ff, alpha: 0.035 })
        .moveTo(pos.x - 20, pos.y + 3)
        .lineTo(pos.x + 14, pos.y - 10)
        .stroke({ color: 0xbdf9ff, alpha: 0.24, width: 1.5 })
        .moveTo(pos.x + 2, pos.y + 12)
        .lineTo(pos.x + 28, pos.y + 1)
        .stroke({ color: 0x9c80ff, alpha: 0.18, width: 2 });
    }

    if (tile === 'portal') {
      decal.circle(pos.x, pos.y + 2, 52).fill({ color: 0x72e7ff, alpha: 0.035 });
    }

    if (decal.width || decal.height) this.ambientLayer.addChild(decal);
  }

  private addTerrainTransitions() {
    const edge = new Graphics();
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const tile = this.tileAt(x, y);
        if (tile === 'water' || tile === 'cliff') continue;
        const pos = isoToScreen(x, y);
        const nearWater = this.neighborHas(x, y, 'water');
        const nearCliff = this.neighborHas(x, y, 'cliff');
        if (nearWater) {
          edge
            .moveTo(pos.x - 50, pos.y + 19)
            .quadraticCurveTo(pos.x, pos.y + 32, pos.x + 50, pos.y + 19)
            .stroke({ color: 0xbffff8, alpha: 0.16, width: 3 });
        }
        if (nearCliff) {
          edge
            .moveTo(pos.x - 56, pos.y + 25)
            .quadraticCurveTo(pos.x, pos.y + 42, pos.x + 56, pos.y + 25)
            .stroke({ color: 0x000000, alpha: 0.18, width: 6 });
        }
        if ((tile === 'grass' || tile === 'moss') && this.neighborHas(x, y, 'dirt')) {
          edge
            .moveTo(pos.x - 26, pos.y + 10)
            .lineTo(pos.x + 26, pos.y - 3)
            .stroke({ color: 0xe8c681, alpha: 0.08, width: 2 });
        }
      }
    }
    this.ambientLayer.addChild(edge);
  }

  private addFieldDepthPass() {
    const depth = new Graphics();
    const roadRim = new Graphics();
    const waterFx = new Graphics();
    const cliffShade = new Graphics();

    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const tile = this.tileAt(x, y);
        const pos = isoToScreen(x, y);
        if (tile === 'cliff') {
          cliffShade
            .moveTo(pos.x - 58, pos.y + 18)
            .lineTo(pos.x, pos.y + 48)
            .lineTo(pos.x + 58, pos.y + 18)
            .lineTo(pos.x, pos.y + 34)
            .closePath()
            .fill({ color: 0x020405, alpha: 0.22 });
          continue;
        }
        if (tile === 'water') {
          waterFx
            .moveTo(pos.x - 44, pos.y + 2)
            .quadraticCurveTo(pos.x - 8, pos.y - 7, pos.x + 42, pos.y + 4)
            .stroke({ color: 0xbffff8, alpha: 0.13, width: 1.4 })
            .moveTo(pos.x - 28, pos.y + 13)
            .quadraticCurveTo(pos.x + 4, pos.y + 7, pos.x + 29, pos.y + 12)
            .stroke({ color: 0x72e7ff, alpha: 0.1, width: 1.1 });
          continue;
        }
        if (tile === 'dirt' || tile === 'stone') {
          roadRim
            .moveTo(pos.x - 45, pos.y + 14)
            .quadraticCurveTo(pos.x - 12, pos.y + 24, pos.x + 44, pos.y + 15)
            .stroke({ color: tile === 'dirt' ? 0xf2d18b : 0xd9c08c, alpha: 0.07, width: 5 })
            .moveTo(pos.x - 38, pos.y - 9)
            .quadraticCurveTo(pos.x, pos.y + 4, pos.x + 38, pos.y - 9)
            .stroke({ color: 0x000000, alpha: 0.08, width: 4 });
        }
        if (tile === 'moss' || tile === 'crystal') {
          depth
            .ellipse(pos.x + 1, pos.y + 10, tile === 'crystal' ? 38 : 30, 11)
            .fill({ color: tile === 'crystal' ? 0x72e7ff : 0x6fffd2, alpha: tile === 'crystal' ? 0.035 : 0.025 });
        }
      }
    }

    this.ambientLayer.addChild(cliffShade, depth, roadRim, waterFx);
    this.addHuntingPocketMarkers();
    this.addTreeCanopyShadows();
  }

  private addHuntingPocketMarkers() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const markerColor = zoneId === 'crystal-raid' ? 0xff8dd6 : zoneId === 'black-cave' ? 0x9c80ff : zoneId === 'crystal-moss' ? 0x72e7ff : 0xe2b95f;
    const pockets = new Graphics();
    for (const spawn of this.spawnCandidatesForZone(zoneId)) {
      const pos = isoToScreen(spawn.x, spawn.y);
      pockets
        .ellipse(pos.x, pos.y + 12, 82, 28)
        .fill({ color: 0x000000, alpha: 0.075 })
        .ellipse(pos.x, pos.y + 10, 58, 20)
        .stroke({ color: markerColor, alpha: 0.075, width: 2 });
    }
    this.ambientLayer.addChild(pockets);
  }

  private addTreeCanopyShadows() {
    const shadows = new Graphics();
    const patches = [
      [5, 16, 96, 34], [11, 15, 88, 30], [18, 12, 116, 38], [27, 16, 126, 42], [33, 23, 112, 36], [20, 29, 104, 32]
    ];
    for (const [x, y, w, h] of patches) {
      const pos = isoToScreen(x, y);
      shadows.ellipse(pos.x, pos.y + 18, w, h).fill({ color: 0x030706, alpha: 0.07 });
    }
    this.ambientLayer.addChild(shadows);
  }

  private neighborHas(x: number, y: number, tile: TileId) {
    const checks = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1]
    ];
    return checks.some(([nx, ny]) => nx >= 0 && ny >= 0 && nx < MAP_W && ny < MAP_H && this.tileAt(nx, ny) === tile);
  }

  private addZoneLandmarks() {
    const ruins = [
      [13.4, 21.6, 0.34],
      [17.4, 22.7, 0.38],
      [24.5, 23.2, 0.36],
      [27.2, 18.8, 0.34]
    ];
    for (const [x, y, scale] of ruins) this.addProp('propRuin', x, y, scale);

    if (this.options.zoneId === 'crystal-raid') {
      const pos = isoToScreen(26.4, 18.6);
      const altar = new Graphics()
        .ellipse(0, 0, 96, 38)
        .fill({ color: 0x17132f, alpha: 0.46 })
        .ellipse(0, 0, 70, 27)
        .stroke({ color: 0x72e7ff, alpha: 0.28, width: 3 })
        .ellipse(0, 0, 44, 17)
        .stroke({ color: 0xf2d66c, alpha: 0.22, width: 2 });
      altar.position.set(pos.x, pos.y + 8);
      this.ambientLayer.addChild(altar);
    }

    if (this.options.zoneId === 'black-cave') {
      const caveGlow = new Graphics();
      for (const [x, y] of [[23.8, 24.2], [26.6, 23.5], [20.2, 26.2]]) {
        const pos = isoToScreen(x, y);
        caveGlow.circle(pos.x, pos.y - 10, 28).fill({ color: 0x806dff, alpha: 0.055 });
      }
      this.ambientLayer.addChild(caveGlow);
    }
  }


  private addZoneGroundMood() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const tint = this.isInfernusZone() ? 0xff6b35 : zoneId === 'crystal-raid' ? 0x5b4cff : zoneId === 'black-cave' ? 0x4b5f86 : zoneId === 'goblin-road' ? 0x8f6a3c : zoneId === 'crystal-moss' ? 0x72e7ff : 0xa8d06f;
    const mist = new Graphics();
    for (let i = 0; i < 18; i += 1) {
      const x = 2 + ((i * 5.7) % 16);
      const y = 3 + ((i * 4.1) % 15);
      const pos = isoToScreen(x, y);
      mist.ellipse(pos.x, pos.y + 8, 52 + (i % 4) * 12, 16 + (i % 3) * 6).fill({ color: tint, alpha: zoneId === 'black-cave' ? 0.055 : 0.038 });
    }
    this.ambientLayer.addChild(mist);

    const veins = new Graphics();
    for (let i = 0; i < 16; i += 1) {
      const x = 2 + ((i * 3.3) % 16);
      const y = 3 + ((i * 6.1) % 14);
      const pos = isoToScreen(x, y);
      veins
        .moveTo(pos.x - 20, pos.y - 2)
        .quadraticCurveTo(pos.x, pos.y - 12 - (i % 3) * 5, pos.x + 24, pos.y + 2)
        .stroke({ color: tint, alpha: 0.08, width: 2 });
    }
    this.ambientLayer.addChild(veins);
  }

  private addVillageDecor() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const entryPos = isoToScreen(zone.entry.x, zone.entry.y);
    const ring = new Graphics()
      .ellipse(0, 0, 184, 78)
      .fill({ color: 0x1f2c2c, alpha: 0.22 })
      .ellipse(0, 0, 132, 54)
      .stroke({ color: 0x8dffb3, alpha: 0.24, width: 4 })
      .ellipse(0, 0, 98, 40)
      .stroke({ color: 0xe2b95f, alpha: 0.18, width: 2 });
    ring.position.set(entryPos.x, entryPos.y + 8);
    this.mapLayer.addChild(ring);

    const safeGlow = new Graphics()
      .ellipse(entryPos.x, entryPos.y + 8, 210, 84)
      .fill({ color: 0x72e7ff, alpha: 0.035 })
      .ellipse(entryPos.x, entryPos.y + 8, 164, 62)
      .fill({ color: 0xe2b95f, alpha: 0.025 });
    this.ambientLayer.addChild(safeGlow);
    this.addProp('buildingHall', 6.0, 16.7, 0.32);
    this.addProp('buildingForge', 11.6, 17.4, 0.29);
    this.addProp('buildingStorage', 5.6, 23.2, 0.28);
    this.addProp('buildingShop', 12.8, 22.8, 0.28);

    for (const prop of villageProps) {
      const key = prop.type === 'tree' ? 'propTree' : prop.type === 'rock' ? 'propRock' : prop.type === 'ruin' ? 'propRuin' : 'propCrystal';
      this.addProp(key, prop.x, prop.y, prop.scale);
    }

    const labels = [
      { text: '안전 진입로', x: zone.entry.x, y: zone.entry.y - 0.55, color: 0xe2b95f },
      { text: zone.title, x: Math.min(MAP_W - 4, zone.entry.x + 5.2), y: Math.max(5, zone.entry.y - 2.8), color: zone.id === 'crystal-raid' ? 0xff8dd6 : zone.id === 'black-cave' ? 0x9c80ff : zone.id === 'crystal-moss' ? 0x72e7ff : 0xf5d18a }
    ];
    for (const label of labels) {
      const text = new Text({
        text: label.text,
        style: {
          fill: label.color,
          fontFamily: 'Arial',
          fontSize: 13,
          fontWeight: '900',
          stroke: { color: 0x111111, width: 4 }
        }
      });
      const pos = isoToScreen(label.x, label.y);
      text.anchor.set(0.5);
      text.position.set(pos.x, pos.y - 18);
      this.propLayer.addChild(text);
    }
  }

  private propVariant(kind: 'tree' | 'rock' | 'chest' | 'torch', index: number): TextureKey {
    const limits = { tree: 10, rock: 10, chest: 5, torch: 5 } as const;
    const num = ((index % limits[kind]) + 1).toString().padStart(2, '0');
    const prefix = kind === 'tree' ? 'propTree' : kind === 'rock' ? 'propRock' : kind === 'chest' ? 'propChest' : 'propTorch';
    return `${prefix}${num}` as TextureKey;
  }

  private addProp(textureKey: TextureKey, x: number, y: number, scale: number) {
    const sprite = new Sprite(this.mustTexture(textureKey));
    const pos = isoToScreen(x, y);
    const keyName = String(textureKey);
    const flatDecal = new Set([
      'propManaFog', 'propMoonPuddle', 'propRuneFloor', 'propMarbleCrack',
      'propBattleScar', 'propWaterReflection', 'propCandleCircle', 'propTreasureGlow', 'propHuntMarker'
    ]);
    const softBackdropProp = new Set(['propHoloBanner', 'propBossGate', 'propRiftAltar', 'propSoulFountain']);
    if (flatDecal.has(keyName)) {
      // Alpha 0.78: keep suspicious background-like objects as floor decals, not upright props.
      sprite.anchor.set(0.5, 0.58);
      const decalScale = keyName === 'propHuntMarker' ? 0.58 : keyName === 'propTreasureGlow' ? 0.62 : 0.72;
      sprite.scale.set(scale * decalScale);
      sprite.position.set(pos.x, pos.y + 13);
      sprite.alpha = keyName === 'propManaFog' ? 0.34 : keyName === 'propHuntMarker' ? 0.54 : 0.50;
      sprite.rotation = (keyName === 'propRuneFloor' || keyName === 'propCandleCircle') ? -0.08 : 0;
      this.ambientLayer.addChild(sprite);
      return;
    }
    const isOrganic = keyName.includes('Tree') || keyName.includes('Bush') || keyName.includes('Mushroom') || keyName.includes('Stump') || keyName.includes('Flower');
    const isTreasure = keyName.includes('Chest') || keyName.includes('Rune') || keyName.includes('Ore') || keyName.includes('Crystal') || keyName.includes('Brazier') || keyName.includes('Altar') || keyName.includes('Lantern');
    const softBackdrop = softBackdropProp.has(keyName);
    sprite.anchor.set(0.5, softBackdrop ? 0.86 : 0.92);
    sprite.scale.set(scale * (isOrganic ? 1.02 : softBackdrop ? 0.84 : 0.96));
    sprite.position.set(pos.x, pos.y + (softBackdrop ? 13 : 15));
    sprite.alpha = isOrganic ? 0.95 : softBackdrop ? 0.86 : 0.96;
    if (isTreasure) sprite.tint = 0xfff4c6;

    const shadow = new Graphics()
      .ellipse(pos.x + 4, pos.y + 18, (isOrganic ? 42 : softBackdrop ? 30 : 34) * scale, (isOrganic ? 12 : softBackdrop ? 8 : 10) * scale)
      .fill({ color: 0x17365f, alpha: isOrganic ? 0.10 : softBackdrop ? 0.045 : 0.078 });
    this.ambientLayer.addChild(shadow);

    if (isTreasure) {
      const glow = new Graphics()
        .ellipse(pos.x, pos.y + 5, 28 * scale, 14 * scale)
        .fill({ color: 0xe2b95f, alpha: 0.045 });
      this.ambientLayer.addChild(glow);
    }

    this.propLayer.addChild(sprite);
  }

  private spawnCandidatesForZone(zoneId: string) {
    const tables: Record<string, Array<{ monsterId: MonsterId; x: number; y: number }>> = {
      'slime-forest': [
        { monsterId: 'slime', x: 9.8, y: 24.0 },
        { monsterId: 'slime', x: 12.2, y: 25.0 },
        { monsterId: 'slime', x: 15.4, y: 23.4 },
        { monsterId: 'slime', x: 18.2, y: 22.1 },
        { monsterId: 'slime', x: 21.8, y: 19.6 },
        { monsterId: 'slime', x: 25.0, y: 20.1 },
        { monsterId: 'wolf', x: 27.4, y: 18.0 },
        { monsterId: 'wolf', x: 30.4, y: 17.8 },
        { monsterId: 'wolf', x: 34.0, y: 18.4 },
        { monsterId: 'wolf', x: 36.0, y: 21.0 }
      ],
      'crystal-moss': [
        { monsterId: 'slime', x: 12.8, y: 22.0 },
        { monsterId: 'slime', x: 15.8, y: 20.0 },
        { monsterId: 'slime', x: 18.0, y: 17.4 },
        { monsterId: 'wolf', x: 20.0, y: 15.4 },
        { monsterId: 'wolf', x: 23.4, y: 13.7 },
        { monsterId: 'wolf', x: 26.8, y: 13.0 },
        { monsterId: 'wolf', x: 30.8, y: 14.8 },
        { monsterId: 'wolf', x: 34.2, y: 18.0 },
        { monsterId: 'wolf', x: 36.4, y: 21.2 },
        { monsterId: 'wolf', x: 31.2, y: 23.5 }
      ],
      'goblin-road': [
        { monsterId: 'wolf', x: 12.8, y: 22.0 },
        { monsterId: 'wolf', x: 15.6, y: 23.2 },
        { monsterId: 'wolf', x: 18.4, y: 24.0 },
        { monsterId: 'goblin', x: 20.6, y: 24.2 },
        { monsterId: 'goblin', x: 23.6, y: 25.8 },
        { monsterId: 'goblin', x: 26.4, y: 26.7 },
        { monsterId: 'goblin', x: 29.4, y: 28.1 },
        { monsterId: 'goblin', x: 32.6, y: 29.3 },
        { monsterId: 'goblin', x: 35.2, y: 28.4 },
        { monsterId: 'crystalBear', x: 36.0, y: 30.0 }
      ],
      'black-cave': [
        { monsterId: 'goblin', x: 13.8, y: 24.4 },
        { monsterId: 'goblin', x: 16.8, y: 25.0 },
        { monsterId: 'goblin', x: 19.4, y: 26.2 },
        { monsterId: 'goblin', x: 22.6, y: 27.4 },
        { monsterId: 'goblin', x: 25.2, y: 28.0 },
        { monsterId: 'crystalBear', x: 27.8, y: 30.0 },
        { monsterId: 'crystalBear', x: 30.8, y: 30.6 },
        { monsterId: 'crystalBear', x: 33.6, y: 31.0 },
        { monsterId: 'crystalBear', x: 36.0, y: 29.8 }
      ],
      'crystal-raid': [
        { monsterId: 'goblin', x: 14.8, y: 24.0 },
        { monsterId: 'goblin', x: 18.6, y: 22.6 },
        { monsterId: 'goblin', x: 22.0, y: 21.7 },
        { monsterId: 'crystalBear', x: 25.6, y: 20.2 },
        { monsterId: 'crystalBear', x: 29.2, y: 19.0 },
        { monsterId: 'crystalBear', x: 32.0, y: 19.6 },
        { monsterId: 'dragon', x: 35.2, y: 18.2 }
      ],
      'moonlit-grove': [
        { monsterId: 'wolf', x: 13.2, y: 22.8 },
        { monsterId: 'wolf', x: 16.0, y: 21.0 },
        { monsterId: 'wolf', x: 19.2, y: 19.4 },
        { monsterId: 'wolf', x: 22.2, y: 18.4 },
        { monsterId: 'goblin', x: 24.8, y: 20.6 },
        { monsterId: 'goblin', x: 27.8, y: 21.2 },
        { monsterId: 'goblin', x: 30.4, y: 22.0 },
        { monsterId: 'goblin', x: 33.0, y: 24.0 },
        { monsterId: 'crystalBear', x: 35.4, y: 25.8 },
        { monsterId: 'crystalBear', x: 36.8, y: 28.2 }
      ],
      'soul-ruins': [
        { monsterId: 'goblin', x: 12.8, y: 24.8 },
        { monsterId: 'goblin', x: 15.8, y: 25.2 },
        { monsterId: 'goblin', x: 18.8, y: 25.8 },
        { monsterId: 'goblin', x: 22.0, y: 26.6 },
        { monsterId: 'goblin', x: 25.2, y: 27.6 },
        { monsterId: 'goblin', x: 28.4, y: 28.6 },
        { monsterId: 'crystalBear', x: 31.2, y: 29.4 },
        { monsterId: 'crystalBear', x: 33.8, y: 30.2 },
        { monsterId: 'crystalBear', x: 36.0, y: 31.0 },
        { monsterId: 'crystalBear', x: 37.2, y: 28.2 }
      ],
      'bloodstone-mine': [
        { monsterId: 'crystalBear', x: 15.0, y: 25.6 },
        { monsterId: 'crystalBear', x: 18.0, y: 25.2 },
        { monsterId: 'graveKnight', x: 21.4, y: 25.8 },
        { monsterId: 'graveKnight', x: 24.4, y: 26.8 },
        { monsterId: 'crystalBear', x: 28.0, y: 27.8 },
        { monsterId: 'graveKnight', x: 31.2, y: 28.6 },
        { monsterId: 'fieldBoss', x: 35.2, y: 29.2 }
      ],
      'sky-citadel': [
        { monsterId: 'stormHarpy', x: 14.0, y: 20.0 },
        { monsterId: 'stormHarpy', x: 17.6, y: 19.0 },
        { monsterId: 'fireDrake', x: 21.4, y: 18.4 },
        { monsterId: 'stormHarpy', x: 25.0, y: 18.2 },
        { monsterId: 'fireDrake', x: 29.4, y: 17.8 },
        { monsterId: 'dragon', x: 34.2, y: 18.8 }
      ],
      'demon-rift': [
        { monsterId: 'graveKnight', x: 15.2, y: 24.0 },
        { monsterId: 'fireDrake', x: 19.0, y: 22.5 },
        { monsterId: 'fieldBoss', x: 23.0, y: 21.5 },
        { monsterId: 'graveKnight', x: 27.0, y: 20.7 },
        { monsterId: 'dragon', x: 31.0, y: 20.0 },
        { monsterId: 'fieldBoss', x: 35.2, y: 19.2 },
        { monsterId: 'dragon', x: 37.0, y: 21.4 }
      ],
      'dragon-nest': [
        { monsterId: 'crystalBear', x: 15.0, y: 24.0 },
        { monsterId: 'crystalBear', x: 18.8, y: 22.8 },
        { monsterId: 'crystalBear', x: 22.4, y: 21.4 },
        { monsterId: 'crystalBear', x: 26.2, y: 20.2 },
        { monsterId: 'crystalBear', x: 30.0, y: 19.0 },
        { monsterId: 'dragon', x: 33.4, y: 18.4 },
        { monsterId: 'dragon', x: 36.4, y: 19.4 }
      ]
    };
    return tables[zoneId] || [...spawnTable];
  }

  private mobDensityBoost(zoneId: string) {
    // 1.10: the field felt empty and too easy. Keep lite devices protected,
    // but raise the baseline density so auto-hunt travels between real pockets.
    const liteScale = this.localStorageFlag099('soul-online-field-lite-100') ? 0.86 : 1;
    if (zoneId === 'slime-forest') return 2.1 * liteScale;
    if (zoneId === 'crystal-moss' || zoneId === 'goblin-road') return 2.35 * liteScale;
    if (zoneId === 'black-cave' || zoneId === 'moonlit-grove' || zoneId === 'soul-ruins') return 2.55 * liteScale;
    const zoneLevel = zones.find((zone) => zone.id === zoneId)?.recommendedLevel || 1;
    if (zoneLevel >= 70) return 3.05 * liteScale;
    return 2.72 * liteScale;
  }

  private expandSpawnCandidates(zoneId: string, seeds: Array<{ monsterId: MonsterId; x: number; y: number }>) {
    const allowed = zoneMonsterIds[zoneId] || zones.find((entry) => entry.id === zoneId)?.monsterIds || [];
    if (!allowed.length) return seeds;
    const entry = zones.find((zone) => zone.id === zoneId)?.entry || zones[0].entry;
    const next = [...seeds];
    // 1.10: generate multi-pocket routes. Old tables often contained many of the
    // same monster type, which made the field look empty after per-type caps.
    const targetTotal = Math.ceil(Math.max(seeds.length + allowed.length * 2, allowed.length * 5.2) * this.mobDensityBoost(zoneId));
    let cursor = 0;
    while (next.length < targetTotal) {
      const base = seeds[cursor % Math.max(1, seeds.length)] || { monsterId: allowed[cursor % allowed.length], x: entry.x + 3, y: entry.y + 2 };
      const monsterId = allowed[cursor % allowed.length];
      const lane = Math.floor(cursor / allowed.length);
      const angle = cursor * 2.399963 + lane * 0.37;
      const ring = 1.05 + (cursor % 6) * 0.62 + lane * 0.22;
      const routePush = 0.45 + lane * 0.18;
      const x = clamp(base.x + Math.cos(angle) * ring + Math.cos(lane * 0.91) * routePush, 2, MAP_W - 3);
      const y = clamp(base.y + Math.sin(angle) * ring + Math.sin(lane * 0.83) * routePush, 2, MAP_H - 3);
      next.push({ monsterId, x, y });
      cursor += 1;
      if (cursor > 140) break;
    }
    return next;
  }

  private spawnMobs() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const allowed = zoneMonsterIds[zone.id] || zone.monsterIds;
    const candidates = this.expandSpawnCandidates(zone.id, this.spawnCandidatesForZone(zone.id));
    const counters = new Map<MonsterId, number>();
    this.mobs = candidates
      .filter((spawn) => {
        const id = spawn.monsterId as MonsterId;
        const desiredPerType = Math.max(3, Math.ceil(candidates.length / Math.max(1, allowed.length)));
        const tableWeight = Math.max(1, allowed.filter((item) => item === id).length);
        const maxCount = Math.ceil((desiredPerType + tableWeight) * Math.min(1.45, this.mobDensityBoost(zone.id) * 0.48));
        if (!maxCount) return false;
        const count = counters.get(id) || 0;
        if (count >= maxCount) return false;
        counters.set(id, count + 1);
        return true;
      })
      .map((spawn, index) => {
        const baseDef = monsters.find((monster) => monster.id === spawn.monsterId);
        if (!baseDef) throw new Error(`Missing monster ${spawn.monsterId}`);
        const elite = this.pickEliteAffix(zone.id, baseDef, index);
        const def = elite ? this.createEliteMonsterDef(baseDef, elite) : baseDef;
        const safe = this.findSafeMobPosition(spawn.x, spawn.y, 1.7);
        return {
          uid: `${def.id}-${index}`,
          def,
          eliteAffix: elite?.id,
          eliteLabel: elite?.label,
          eliteColor: elite?.color,
          x: safe.x,
          y: safe.y,
          spawnX: safe.x,
          spawnY: safe.y,
          hp: def.stats.hp,
          alive: true,
          respawnAt: 0,
          deathVisibleUntil: 0,
          attackCooldown: Math.random() * 1.2,
          aggroUntil: 0,
          wanderCooldown: Math.random() * 2.5,
          state: 'idle' as const,
          stateTimer: 0,
          alertDelay: 0.32 + Math.random() * 0.42,
          stuckTimer: 0,
          lastX: safe.x,
          lastY: safe.y,
          patternCooldown: 2.2 + Math.random() * 3.2,
          patternWindup: 0
        };
      });

    for (const mob of this.mobs) this.buildMobView(mob);
  }

  private buildAlpha063Companion(accent: number) {
    const root = new Container();
    root.position.set(34, -12);
    const sheet = this.mustTexture('monsterSlimeSheet');
    const petTexture = new Texture({
      source: sheet.source,
      frame: new Rectangle(0, 0, MONSTER_SHEET_META.frameWidth, MONSTER_SHEET_META.frameHeight),
      orig: new Rectangle(0, 0, MONSTER_SHEET_META.frameWidth, MONSTER_SHEET_META.frameHeight),
      defaultAnchor: { x: 0.5, y: 0.92 }
    });
    const shadow = new Graphics().ellipse(0, 2, 12, 4).fill({ color: 0x000000, alpha: 0.20 });
    const aura = new Graphics()
      .circle(0, -18, 20).fill({ color: accent, alpha: 0.060 })
      .circle(0, -18, 15).stroke({ color: 0xffffff, alpha: 0.22, width: 1.2 })
      .circle(0, -18, 9).stroke({ color: accent, alpha: 0.26, width: 1.3 })
      .moveTo(-14, -18).lineTo(-7, -18).moveTo(7, -18).lineTo(14, -18).stroke({ color: 0xffe5a2, alpha: 0.22, width: 1.1 });
    const sprite = new Sprite(petTexture);
    sprite.anchor.set(0.5, 0.92);
    const slimeScale106 = this.textureResolutionScale106(this.mustTexture('monsterSlimeSheet'), MONSTER_SHEET_META);
    sprite.scale.set(0.19 * slimeScale106);
    sprite.position.y = 1;
    const gem = new Graphics()
      .moveTo(0, -45).lineTo(7, -33).lineTo(0, -23).lineTo(-7, -33).closePath()
      .fill({ color: 0x9eefff, alpha: 0.86 })
      .stroke({ color: 0xffffff, alpha: 0.76, width: 1.15 });
    root.addChild(shadow, aura, sprite, gem);
    return root;
  }

  private buildPlayer() {
    const klass = classes[this.save.classId];
    this.playerRoot.removeChildren();
    this.playerCompanion = null;

    const pedestal = new Graphics()
      .ellipse(0, 1, 28, 9).fill({ color: 0x79d9ff, alpha: 0.075 })
      .ellipse(0, 1, 31, 10).stroke({ color: 0xffe5a2, alpha: 0.22, width: 1.8 })
      .ellipse(0, 1, 21, 6).stroke({ color: klass.accent, alpha: 0.22, width: 1.2 });
    this.playerShadow = new Graphics().ellipse(0, 2, 19 * PLAYER_SHADOW_SCALE, 6.5 * PLAYER_SHADOW_SCALE).fill({ color: 0x000000, alpha: 0.24 });
    this.playerAnimator = new SpriteSheetAnimator(this.mustTexture(this.classSheetTextureKey()), HUMANOID_SHEET_META, 0.98);
    this.playerBody = this.playerAnimator.sprite;
    this.playerBody.scale.set(PLAYER_VISUAL_SCALE * this.playerAnimator.resolutionScale);
    this.playerBody.position.y = -2;

    const aura = new Graphics()
      .circle(0, -20, 18)
      .stroke({ color: klass.accent, alpha: 0.28, width: 1.7 })
      .circle(0, -20, 11)
      .stroke({ color: 0xffffff, alpha: 0.12, width: 1 })
      .moveTo(-20, -20).lineTo(-12, -20).stroke({ color: 0xffe5a2, alpha: 0.26, width: 1.4 })
      .moveTo(12, -20).lineTo(20, -20).stroke({ color: 0xffe5a2, alpha: 0.26, width: 1.4 });

    const name = new Text({
      text: this.save.name,
      style: {
        fill: 0xffffff,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, Arial',
        fontSize: 11,
        fontWeight: '900',
        stroke: { color: 0x0b315f, width: 4 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -47;

    const badge = new Text({
      text: `${klass.name}`,
      style: {
        fill: klass.accent,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, Arial',
        fontSize: 8,
        fontWeight: '900',
        stroke: { color: 0x0b315f, width: 3 }
      }
    });
    badge.anchor.set(0.5, 1);
    badge.position.y = -60;

    const namePlate = new Graphics()
      .roundRect(-37, -60, 74, 20, 7).fill({ color: 0x08264d, alpha: 0.42 })
      .roundRect(-35, -58, 70, 16, 6).fill({ color: 0xffffff, alpha: 0.055 })
      .roundRect(-37, -60, 74, 20, 7).stroke({ color: 0x8fe4ff, alpha: 0.26, width: 1.1 });
    // Alpha 1.16: 아직 펫 시스템이 정식 기능이 아니므로 필드 동행 펫 스프라이트를 제거합니다.
    this.playerCompanion = null;
    this.playerRoot.addChild(pedestal, this.playerShadow, aura, this.playerBody, namePlate, name, badge);
    if (!this.entityLayer.children.includes(this.playerRoot)) this.entityLayer.addChild(this.playerRoot);
    this.placeEntity(this.playerRoot, this.save.x, this.save.y);
  }

  private buildMobView(mob: WorldMob) {
    const root = new Container();
    const isDragon = mob.def.id === 'dragon' || mob.def.id === 'riftBeast';
    const isLarge = mob.def.id === 'crystalBear' || mob.def.id === 'lavaGolem' || mob.def.id === 'royalGuard' || isDragon;
    const eliteColor = mob.eliteColor || 0xff5d5d;
    const basePlate = new Graphics()
      .ellipse(0, 1, isDragon ? 36 : isLarge ? 27 : 19, isDragon ? 11 : isLarge ? 8 : 6)
      .fill({ color: mob.eliteAffix ? eliteColor : isDragon ? 0xffd15f : 0x79d9ff, alpha: mob.eliteAffix || isDragon ? 0.065 : 0.035 })
      .ellipse(0, 1, isDragon ? 39 : isLarge ? 30 : 22, isDragon ? 12 : isLarge ? 9 : 7)
      .stroke({ color: mob.eliteAffix ? eliteColor : isDragon ? 0xffd15f : 0xffffff, alpha: mob.eliteAffix || isDragon ? 0.20 : 0.075, width: 1.4 });
    const shadow = new Graphics().ellipse(0, 2, isDragon ? 26 : isLarge ? 20 : 13, isDragon ? 6.5 : 4.5).fill({ color: 0x000000, alpha: 0.26 });
    const aggroRing = new Graphics().ellipse(0, 0, isDragon ? 30 : isLarge ? 22 : 16, isDragon ? 10 : 6).stroke({ color: mob.eliteAffix ? eliteColor : 0xff5d5d, alpha: mob.eliteAffix ? 0.46 : 0, width: mob.eliteAffix ? 2.6 : 1.5 });
    const eliteHalo = mob.eliteAffix ? new Graphics()
      .ellipse(0, -6, isDragon ? 33 : isLarge ? 25 : 20, isDragon ? 12 : 8)
      .stroke({ color: eliteColor, alpha: 0.32, width: 2 })
      .ellipse(0, -6, isDragon ? 24 : isLarge ? 18 : 14, isDragon ? 8 : 5)
      .fill({ color: eliteColor, alpha: 0.035 }) : null;
    const animator = new SpriteSheetAnimator(this.mustTexture(this.monsterSheetTextureKey(mob.def.id)), MONSTER_SHEET_META, 0.96);
    const body = animator.sprite;
    const baseScale = MOB_VISUAL_SCALE[mob.def.id] * (mob.eliteAffix ? 1.1 : isDragon ? 1.03 : 1);
    body.scale.set(baseScale * animator.resolutionScale);
    body.position.y = isDragon ? -3 : -1;

    const hpBack = new Graphics().roundRect(-22, -43, 44, 5, 2.5).fill({ color: 0x0b315f, alpha: 0.64 }).roundRect(-22, -43, 44, 5, 2.5).stroke({ color: 0xffffff, alpha: 0.16, width: 0.8 });
    const hpFill = new Graphics().roundRect(-22, -43, 44, 5, 2.5).fill({ color: 0xff6b6b, alpha: 0.96 });
    const mobNamePlate = new Graphics()
      .roundRect(isDragon ? -42 : -33, isDragon ? -61 : -59, isDragon ? 84 : 66, 16, 6)
      .fill({ color: 0x08264d, alpha: mob.eliteAffix ? 0.52 : 0.38 })
      .roundRect(isDragon ? -42 : -33, isDragon ? -61 : -59, isDragon ? 84 : 66, 16, 6)
      .stroke({ color: mob.eliteAffix ? eliteColor : 0x85dcff, alpha: mob.eliteAffix ? 0.32 : 0.18, width: 1 });

    const name = new Text({
      text: mob.def.name,
      style: {
        fill: mob.eliteAffix ? eliteColor : isDragon ? 0xffd15f : 0xf5f1e8,
        fontFamily: 'Pretendard, Apple SD Gothic Neo, Arial',
        fontSize: isDragon ? 9 : 8,
        fontWeight: '800',
        stroke: { color: 0x0b315f, width: 3 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -46;

    root.addChild(basePlate, shadow);
    if (eliteHalo) root.addChild(eliteHalo);
    root.addChild(aggroRing, body, hpBack, hpFill, mobNamePlate, name);
    this.entityLayer.addChild(root);
    this.mobViews.set(mob.uid, { root, body, animator, hpFill, name, baseScale, aggroRing });
    this.placeEntity(root, mob.x, mob.y);
  }

  private bindCanvasInput() {
    if (!this.app) return;
    this.app.canvas.addEventListener('pointerdown', (event) => {
      const target = event.target as HTMLElement;
      if (!target || target.closest('.hud-top, .action-dock, .sheet, .joystick, .login-screen')) return;
      const rect = this.app?.canvas.getBoundingClientRect();
      if (!rect) return;
      const zoom = this.world.scale.x || 1;
      const sx = (event.clientX - rect.left - this.world.x) / zoom;
      const sy = (event.clientY - rect.top - this.world.y) / zoom;
      const iso = screenToIso(sx, sy);
      if (!this.isWalkable(iso.x, iso.y)) return;
      this.moveTarget = {
        x: clamp(iso.x, 1, MAP_W - 2),
        y: clamp(iso.y, 1, MAP_H - 2)
      };
      this.manualMoveLock = 2.8;
      this.pushLog(this.save.autoHunt ? '자동사냥 유지 · 이동 지점 지정' : '이동 지점 지정');
      this.markDirty();
    });
  }

  private update(dt: number) {
    this.time += dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.potionUseCooldown = Math.max(0, this.potionUseCooldown - dt);
    this.autoPotionThinkTimer = Math.max(0, this.autoPotionThinkTimer - dt);
    this.updateCombatChainTimer(dt);
    this.updateSkillCooldowns(dt);
    this.autoSkillThinkTimer = Math.max(0, this.autoSkillThinkTimer - dt);
    this.autoRouteCooldown110 = Math.max(0, this.autoRouteCooldown110 - dt);
    if (this.save.autoHunt) this.tryAutoPotionUse();
    if (this.save.autoHunt && this.autoSkillThinkTimer <= 0) this.tryAutoSkillUse();
    this.manualMoveLock = Math.max(0, this.manualMoveLock - dt);
    this.regenTick += dt;
    if (this.regenTick >= 1.2) {
      this.regenTick = 0;
      this.regenerate();
    }

    this.updateRespawns();
    this.updatePlayer(dt);
    this.updateMobs(dt);
    this.updateCamera();
    this.sortTimer101 += dt;
    const sortInterval101 = getFieldEngineProfile105().sortInterval;
    if (this.sortTimer101 >= sortInterval101) {
      this.sortTimer101 = 0;
      this.sortEntities();
    }

    this.dirtyTimer += dt;
    if (this.dirtyTimer >= 1.4) {
      this.dirtyTimer = 0;
      this.saveService.saveLocal(this.save);
    }

    this.emitTimer101 += dt;
    const emitInterval101 = getFieldEngineProfile105().emitInterval;
    if (this.emitTimer101 >= emitInterval101) {
      this.emitTimer101 = 0;
      this.emit();
    }
  }

  private tryAutoPotionUse() {
    if (this.save.hp <= 0) return;
    if (this.autoPotionThinkTimer > 0 || this.potionUseCooldown > 0) return;
    this.autoPotionThinkTimer = 0.95;
    const settings = this.autoSettings();
    const stats = this.calculateStats();
    const hpRatio = this.save.hp / Math.max(1, stats.hp);
    const mpRatio = this.save.mp / Math.max(1, stats.mp);
    if (settings.useHpPotion && hpRatio < settings.hpPotionRatio) {
      this.useBestPotion('hp', true);
      return;
    }
    if (settings.useMpPotion && mpRatio < settings.mpPotionRatio) this.useBestPotion('mp', true);
  }

  private tryAutoSkillUse() {
    this.autoSkillThinkTimer = 0.38;
    if (this.save.hp <= 0) return;
    if (!this.autoSettings().useSkills) return;
    const stats = this.calculateStats();
    const classSkills = skills.filter((entry) => entry.classId === this.save.classId);
    const hpRatio = this.save.hp / Math.max(1, stats.hp);
    const healingSlot = classSkills.findIndex((skill) => skill.kind === 'heal' && this.hasLearnedSkill(skill.id) && this.save.level >= skill.unlockLevel && (this.skillCooldowns[skill.id] || 0) <= 0 && this.save.mp >= this.effectiveSkillMpCost(skill.id, skill.mpCost));
    if (hpRatio < 0.62 && healingSlot >= 0) {
      this.useSkill(healingSlot);
      this.autoSkillThinkTimer = 0.75;
      return;
    }

    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (!this.target) return;
    const sorted = classSkills
      .map((skill, slot) => ({ skill, slot }))
      .filter(({ skill }) => skill.kind !== 'heal' && this.hasLearnedSkill(skill.id) && this.save.level >= skill.unlockLevel && (this.skillCooldowns[skill.id] || 0) <= 0 && this.save.mp >= this.effectiveSkillMpCost(skill.id, skill.mpCost))
      .sort((a, b) => b.skill.radius - a.skill.radius || b.skill.damageMultiplier - a.skill.damageMultiplier);

    for (const { skill, slot } of sorted) {
      const dist = distance(this.save.x, this.save.y, this.target.x, this.target.y);
      if (dist <= skill.range + 0.12) {
        this.useSkill(slot);
        this.autoSkillThinkTimer = 0.72;
        return;
      }
    }
  }

  private updatePlayer(dt: number) {
    const stats = this.calculateStats();
    const inputStrength = Math.sqrt(this.joystick.x * this.joystick.x + this.joystick.y * this.joystick.y);
    let vx = 0;
    let vy = 0;

    if (inputStrength > 0.05) {
      vx = this.joystick.x;
      vy = this.joystick.y;
      this.manualMoveLock = 0.45;
    } else {
      if (!this.moveTarget && this.save.autoHunt && this.manualMoveLock <= 0) this.autoHuntMove();

      if (this.moveTarget) {
        const dx = this.moveTarget.x - this.save.x;
        const dy = this.moveTarget.y - this.save.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 0.07) {
          this.moveTarget = null;
          this.manualMoveLock = 0;
        } else {
          vx = dx / len;
          vy = dy / len;
        }
      }
    }

    const moving = Boolean(vx || vy);
    const beforeX = this.save.x;
    const beforeY = this.save.y;
    if (moving) {
      const dir = normalize(vx, vy);
      const nextX = this.save.x + dir.x * stats.move * dt;
      const nextY = this.save.y + dir.y * stats.move * dt;
      let movedAxis = false;
      if (this.isWalkable(nextX, this.save.y)) {
        this.save.x = clamp(nextX, 1, MAP_W - 2);
        movedAxis = true;
      }
      if (this.isWalkable(this.save.x, nextY)) {
        this.save.y = clamp(nextY, 1, MAP_H - 2);
        movedAxis = true;
      }
      if (!movedAxis && this.save.autoHunt && this.moveTarget) this.recoverAutoHuntStuck('blocked-axis');
      this.setPlayerFacing(dir.x, dir.y);
    }

    this.resolvePlayerMobOverlap();
    this.updateAutoHuntRecovery(dt, beforeX, beforeY, moving);
    this.lastMoving = moving;
    this.updatePlayerAnimation(moving, dt);
    this.placeEntity(this.playerRoot, this.save.x, this.save.y);
  }

  private updatePlayerAnimation(moving: boolean, dt: number) {
    if (!this.playerBody || !this.playerAnimator) return;
    const autoRunning = this.save.autoHunt && moving;
    this.playerAnimator.setMotion(moving ? (autoRunning ? 'run' : 'walk') : 'idle');
    this.playerAnimator.setDirection(this.playerFacing);
    this.playerAnimator.update(dt);
    this.playerBody.y = moving ? Math.sin(this.time * 12) * 1.2 : 0;
    if (moving) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = autoRunning ? 0.13 : 0.19;
        this.spawnRunDust(autoRunning);
      }
    } else {
      this.footstepTimer = 0;
    }
    if (this.playerShadow) {
      const shadowScale = moving ? 1 + Math.sin(this.time * 14) * 0.05 : 1;
      this.playerShadow.scale.set(shadowScale, 1);
    }
    if (this.playerCompanion) {
      const float = Math.sin(this.time * 3.2);
      this.playerCompanion.position.set(34 + Math.cos(this.time * 2.1) * 2.2, -12 + float * 4.2);
      this.playerCompanion.rotation = Math.sin(this.time * 2.4) * 0.055;
      const petScale = moving ? 0.98 + Math.sin(this.time * 6.8) * 0.018 : 1 + Math.sin(this.time * 3.0) * 0.014;
      this.playerCompanion.scale.set(petScale);
      this.playerCompanion.alpha = moving ? 0.96 : 1;
    }
  }

  private setPlayerFacing(dx: number, dy: number) {
    this.playerFacing = directionFromIsoVector(dx, dy);
    this.playerAnimator?.setDirection(this.playerFacing);
  }

  private facePlayerTo(x: number, y: number) {
    this.setPlayerFacing(x - this.save.x, y - this.save.y);
  }

  private huntRoutePoints110() {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const points = this.expandSpawnCandidates(zone.id, this.spawnCandidatesForZone(zone.id))
      .filter((point) => this.isWalkable(point.x, point.y))
      .map((point) => ({ x: point.x, y: point.y }));
    const entry = zone.entry || zones[0].entry;
    const route = [{ x: entry.x, y: entry.y }, ...points];
    return route.filter((point, index, arr) => index === 0 || distance(point.x, point.y, arr[index - 1].x, arr[index - 1].y) > 1.15).slice(0, 22);
  }

  private nextHuntRoutePoint110() {
    const route = this.huntRoutePoints110();
    if (!route.length) return null;
    const point = route[this.autoRouteIndex110 % route.length];
    if (distance(this.save.x, this.save.y, point.x, point.y) < 0.85) this.autoRouteIndex110 += 1;
    return route[this.autoRouteIndex110 % route.length];
  }

  private routeBiasedTarget110() {
    const point = this.nextHuntRoutePoint110();
    if (!point) return this.findNearestMob();
    let best: WorldMob | null = null;
    let score = Number.POSITIVE_INFINITY;
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const playerDist = distance(this.save.x, this.save.y, mob.x, mob.y);
      const routeDist = distance(point.x, point.y, mob.x, mob.y);
      const value = playerDist * 0.62 + routeDist * 0.38 - (mob.eliteAffix ? 0.5 : 0);
      if (value < score) {
        score = value;
        best = mob;
      }
    }
    return best || this.findNearestMob();
  }

  private autoHuntMove() {
    if (!this.target || !this.target.alive || this.autoRouteCooldown110 <= 0) {
      this.target = this.routeBiasedTarget110();
      this.autoRouteCooldown110 = 1.05;
    }
    if (!this.target) {
      const routePoint = this.nextHuntRoutePoint110();
      if (routePoint) this.moveTarget = routePoint;
      return;
    }

    const routePoint110 = this.nextHuntRoutePoint110();
    const dist = distance(this.save.x, this.save.y, this.target.x, this.target.y);
    if (routePoint110 && dist > 6.2 && distance(this.save.x, this.save.y, routePoint110.x, routePoint110.y) > 0.9) {
      this.moveTarget = routePoint110;
      return;
    }
    const klass = classes[this.save.classId];
    if (dist <= klass.attackRange) {
      this.moveTarget = null;
      this.tryPlayerAttack(this.target, false);
      return;
    }

    const dir = normalize(this.target.x - this.save.x, this.target.y - this.save.y);
    const step = Math.min(0.82, Math.max(0.24, dist - Math.max(0.35, klass.attackRange * 0.76)));
    const direct = {
      x: clamp(this.save.x + dir.x * step, 1, MAP_W - 2),
      y: clamp(this.save.y + dir.y * step, 1, MAP_H - 2)
    };
    if (this.isWalkable(direct.x, direct.y)) {
      this.moveTarget = direct;
      return;
    }

    const sideA = { x: clamp(this.save.x + -dir.y * 0.72 + dir.x * 0.2, 1, MAP_W - 2), y: clamp(this.save.y + dir.x * 0.72 + dir.y * 0.2, 1, MAP_H - 2) };
    const sideB = { x: clamp(this.save.x + dir.y * 0.72 + dir.x * 0.2, 1, MAP_W - 2), y: clamp(this.save.y + -dir.x * 0.72 + dir.y * 0.2, 1, MAP_H - 2) };
    this.moveTarget = this.isWalkable(sideA.x, sideA.y) ? sideA : this.isWalkable(sideB.x, sideB.y) ? sideB : null;
  }

  private updateAutoHuntRecovery(dt: number, beforeX: number, beforeY: number, moving: boolean) {
    this.autoRecoveryCooldown = Math.max(0, this.autoRecoveryCooldown - dt);
    if (!this.save.autoHunt || this.manualMoveLock > 0) {
      this.autoStuckTimer = 0;
      this.autoLastX = this.save.x;
      this.autoLastY = this.save.y;
      return;
    }

    const moved = distance(beforeX, beforeY, this.save.x, this.save.y);
    const targetDist = this.moveTarget ? distance(this.save.x, this.save.y, this.moveTarget.x, this.moveTarget.y) : 0;
    const wantsMove = moving || Boolean(this.moveTarget && targetDist > 0.12);
    if (wantsMove && moved < 0.006) this.autoStuckTimer += dt;
    else this.autoStuckTimer = Math.max(0, this.autoStuckTimer - dt * 1.8);

    if (this.autoStuckTimer > 0.62 && this.autoRecoveryCooldown <= 0) this.recoverAutoHuntStuck('stuck-watchdog');
    this.autoLastX = this.save.x;
    this.autoLastY = this.save.y;
  }

  private recoverAutoHuntStuck(reason: string) {
    this.autoStuckTimer = 0;
    this.autoRecoveryCooldown = 0.55;
    const source = this.target?.alive ? this.target : this.findNearestMob();
    if (!source) {
      this.moveTarget = null;
      return;
    }
    const dir = normalize(source.x - this.save.x || 0.1, source.y - this.save.y || 0.1);
    const candidates = [
      { x: this.save.x - dir.y * 0.9, y: this.save.y + dir.x * 0.9 },
      { x: this.save.x + dir.y * 0.9, y: this.save.y - dir.x * 0.9 },
      { x: this.save.x - dir.x * 0.62, y: this.save.y - dir.y * 0.62 },
      { x: source.x - dir.x * 0.82, y: source.y - dir.y * 0.82 }
    ].map((point) => ({ x: clamp(point.x, 1, MAP_W - 2), y: clamp(point.y, 1, MAP_H - 2) }));

    this.moveTarget = candidates.find((point) => this.isWalkable(point.x, point.y)) || null;
    if (reason === 'stuck-watchdog') this.pushLog('자동사냥 경로 재탐색');
  }

  private updateMobs(dt: number) {
    const stats = this.calculateStats();
    for (const mob of this.mobs) {
      const view = this.mobViews.get(mob.uid);
      if (!view) continue;

      if (!mob.alive) {
        view.root.visible = performance.now() < (mob.deathVisibleUntil || 0) && this.isEntityNearViewport101(mob.x, mob.y, 140);
        if (view.root.visible) view.animator?.update(dt);
        continue;
      }

      const nearViewport101 = this.isEntityNearViewport101(mob.x, mob.y, this.isFieldLite101() ? 90 : 220);
      view.root.visible = nearViewport101;
      if (!nearViewport101 && this.isFieldBalanced101()) {
        this.hiddenMobFrame101 += 1;
        if (this.hiddenMobFrame101 % getFieldEngineProfile105().hiddenMobFrameModulo !== 0) {
          mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);
          mob.wanderCooldown = Math.max(0, mob.wanderCooldown - dt);
          mob.stateTimer = Math.max(0, mob.stateTimer - dt);
          mob.patternCooldown = Math.max(0, (mob.patternCooldown || 0) - dt);
          continue;
        }
      }

      mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);
      mob.wanderCooldown = Math.max(0, mob.wanderCooldown - dt);
      mob.stateTimer = Math.max(0, mob.stateTimer - dt);
      mob.patternCooldown = Math.max(0, (mob.patternCooldown || 0) - dt);

      if (this.updateMobPattern(mob, view, stats, dt)) {
        this.updateMobAnimation(view, mob, dt);
        this.updateMobHp(view, mob);
        this.placeEntity(view.root, mob.x, mob.y);
        mob.lastX = mob.x;
        mob.lastY = mob.y;
        continue;
      }

      this.updateMobAi(mob, view, stats, dt);
      this.resolveMobOverlap(mob);
      this.updateMobAnimation(view, mob, dt);
      this.updateMobHp(view, mob);
      this.placeEntity(view.root, mob.x, mob.y);
      mob.lastX = mob.x;
      mob.lastY = mob.y;
    }
  }

  private updateMobPattern(mob: WorldMob, view: MobView, playerStats: Stats, dt: number) {
    if (!BOSS_PATTERN_MOBS.has(mob.def.id)) return false;

    if ((mob.patternWindup || 0) > 0) {
      mob.patternWindup = Math.max(0, mob.patternWindup - dt);
      this.faceMobToPlayer(view, mob);
      view.body.tint = mob.patternKind ? patternColors[mob.patternKind] : 0xffd15f;
      if (mob.patternWindup <= 0) {
        this.performMobPattern(mob, view, playerStats);
        mob.patternKind = undefined;
        mob.patternTargetX = undefined;
        mob.patternTargetY = undefined;
        view.body.tint = 0xffffff;
        mob.state = distance(this.save.x, this.save.y, mob.x, mob.y) <= this.mobPatternFollowRange(mob) ? 'chase' : 'return';
        mob.stateTimer = 0.18;
      }
      return true;
    }

    return false;
  }

  private maybeStartMobPattern(mob: WorldMob, view: MobView, dist: number) {
    if (!BOSS_PATTERN_MOBS.has(mob.def.id)) return false;
    if ((mob.patternCooldown || 0) > 0 || (mob.patternWindup || 0) > 0 || this.save.hp <= 0) return false;
    if (mob.state === 'idle' || mob.state === 'return') return false;
    if (dist > this.mobPatternFollowRange(mob)) return false;

    const kind = this.patternKindForMob(mob, dist);
    if (!kind) return false;

    mob.patternKind = kind;
    mob.patternTargetX = this.save.x;
    mob.patternTargetY = this.save.y;
    mob.patternWindup = kind === 'flameLine' ? (mob.def.id === 'dragon' ? 0.86 : 0.68) : kind === 'shockwave' ? 0.62 : 0.72;
    const baseCooldown = mob.def.id === 'dragon' || mob.def.id === 'fieldBoss' ? 4.9 : 5.8;
    const eliteTax = mob.eliteAffix ? -0.55 : 0;
    const lowHpTax = mob.hp / Math.max(1, this.mobCombatStats(mob).hp) < 0.38 ? -0.75 : 0;
    mob.patternCooldown = Math.max(3.2, baseCooldown + eliteTax + lowHpTax + Math.random() * 1.8);
    mob.state = 'attackWindup';
    mob.stateTimer = mob.patternWindup;
    this.attackTell(view, mob, kind);
    this.drawPatternTelegraph(mob, kind);
    return true;
  }

  private patternKindForMob(mob: WorldMob, dist: number): MobPatternKind | null {
    if ((mob.def.id === 'dragon' || mob.def.id === 'fireDrake') && dist <= 4.35 && dist >= 0.85) return 'flameLine';
    if ((mob.def.id === 'fieldBoss' || mob.def.id === 'crystalBear' || mob.def.id === 'graveKnight') && dist <= 2.65) return 'shockwave';
    if ((mob.def.id === 'wraith' || mob.def.id === 'stormHarpy') && dist <= 4.05) return 'shadowBurst';
    if (mob.eliteAffix && dist <= 2.25) return 'shockwave';
    return null;
  }

  private mobPatternFollowRange(mob: WorldMob) {
    if (mob.def.id === 'dragon' || mob.def.id === 'fieldBoss') return 4.55;
    if (mob.def.id === 'fireDrake' || mob.def.id === 'stormHarpy' || mob.def.id === 'wraith') return 4.1;
    return 3.05;
  }

  private performMobPattern(mob: WorldMob, view: MobView, playerStats: Stats) {
    const kind = mob.patternKind;
    if (!kind || this.save.hp <= 0 || this.isPlayerInSafeZone()) return;
    const hit = this.isPlayerInsidePattern(mob, kind);
    this.animateMobAttack(view);
    if (!hit) {
      const tx = mob.patternTargetX ?? mob.x;
      const ty = mob.patternTargetY ?? mob.y;
      this.floatText('회피', tx, ty, 0x8dffb3);
      this.impactBurst(tx, ty, patternColors[kind], false);
      return;
    }

    const mobStats = this.mobCombatStats(mob);
    const patternScale = kind === 'flameLine' ? 1.22 : kind === 'shockwave' ? 1.12 : 1.04;
    const result = this.resolveDamage({ ...mobStats, atk: Math.round(mobStats.atk * patternScale) }, playerStats, mob.def.level - this.save.level);
    if (result.hit) {
      this.save.hp = Math.max(0, this.save.hp - result.damage);
      audioService.play('hit');
      this.playerAnimator?.playOnce(this.save.hp <= 0 ? 'death' : 'hit', 'idle');
      this.floatText(`-${result.damage}`, this.save.x, this.save.y, kind === 'shadowBurst' ? 0x9c80ff : 0xff7878);
      this.impactBurst(this.save.x, this.save.y, patternColors[kind], true);
      if (kind !== 'shadowBurst') this.screenShake();
      if (this.save.hp <= 0) this.playerKnockout();
      this.pushLog(`${mob.def.name} ${patternNames[kind]} 적중`);
    } else {
      this.floatText('MISS', this.save.x, this.save.y, 0xd6d1c2);
    }
  }

  private isPlayerInsidePattern(mob: WorldMob, kind: MobPatternKind) {
    const px = this.save.x;
    const py = this.save.y;
    const tx = mob.patternTargetX ?? px;
    const ty = mob.patternTargetY ?? py;
    if (kind === 'flameLine') {
      const reach = mob.def.id === 'dragon' ? 4.35 : 3.55;
      const endDir = normalize(tx - mob.x, ty - mob.y);
      const ex = mob.x + endDir.x * reach;
      const ey = mob.y + endDir.y * reach;
      return this.distancePointToSegment(px, py, mob.x, mob.y, ex, ey) <= (mob.def.id === 'dragon' ? 0.54 : 0.44);
    }
    if (kind === 'shockwave') return distance(px, py, mob.x, mob.y) <= (mob.def.id === 'fieldBoss' ? 2.35 : 1.95);
    return distance(px, py, tx, ty) <= 1.35;
  }

  private distancePointToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const lenSq = abx * abx + aby * aby || 1;
    const t = clamp((apx * abx + apy * aby) / lenSq, 0, 1);
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    return distance(px, py, cx, cy);
  }

  private drawPatternTelegraph(mob: WorldMob, kind: MobPatternKind) {
    const color = patternColors[kind];
    if (kind === 'flameLine') {
      const start = isoToScreen(mob.x, mob.y);
      const tx = mob.patternTargetX ?? this.save.x;
      const ty = mob.patternTargetY ?? this.save.y;
      const dir = normalize(tx - mob.x, ty - mob.y);
      const reach = mob.def.id === 'dragon' ? 4.35 : 3.55;
      const end = isoToScreen(mob.x + dir.x * reach, mob.y + dir.y * reach);
      const line = new Graphics()
        .moveTo(start.x, start.y - 24)
        .lineTo(end.x, end.y - 24)
        .stroke({ color, alpha: 0.62, width: mob.def.id === 'dragon' ? 20 : 15 })
        .moveTo(start.x, start.y - 24)
        .lineTo(end.x, end.y - 24)
        .stroke({ color: 0xffffff, alpha: 0.5, width: 3 });
      this.fxLayer.addChild(line);
      this.animate(0.72, (t) => {
        line.alpha = 0.85 - t * 0.5;
        line.scale.set(1 + Math.sin(t * Math.PI * 6) * 0.018);
      }, () => line.destroy());
      return;
    }

    const center = kind === 'shadowBurst'
      ? isoToScreen(mob.patternTargetX ?? this.save.x, mob.patternTargetY ?? this.save.y)
      : isoToScreen(mob.x, mob.y);
    const radius = kind === 'shockwave' ? (mob.def.id === 'fieldBoss' ? 76 : 62) : 52;
    const ring = new Graphics()
      .circle(0, 0, radius)
      .stroke({ color, alpha: 0.72, width: 4 })
      .circle(0, 0, radius * 0.62)
      .stroke({ color: 0xffffff, alpha: 0.38, width: 2 });
    ring.position.set(center.x, center.y - 18);
    this.fxLayer.addChild(ring);
    this.animate(kind === 'shockwave' ? 0.62 : 0.72, (t) => {
      ring.alpha = 0.9 - t * 0.55;
      ring.scale.set(0.78 + t * 0.24);
      ring.rotation = t * Math.PI * 0.5;
    }, () => ring.destroy());
  }


  private currentZoneEntry() {
    return zones.find((zone) => zone.id === (this.options.zoneId || 'slime-forest'))?.entry || zones[0].entry;
  }

  private isPlayerInSafeZone() {
    const entry = this.currentZoneEntry();
    return distance(this.save.x, this.save.y, entry.x, entry.y) <= 2.35;
  }

  private updateMobAi(mob: WorldMob, view: MobView, playerStats: Stats, dt: number) {
    const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
    const homeDist = distance(mob.spawnX, mob.spawnY, mob.x, mob.y);
    const homeLimit = mobHomeRadius[mob.def.id] || 2.4;
    const attackDist = mob.def.id === 'dragon' ? 1.58 : 1.12;
    const canJoinAggro = this.activeAggroCount(mob.uid) < this.maxAggroCount();
    const playerPulled = this.target?.uid === mob.uid;
    if (this.isPlayerInSafeZone()) {
      if (playerPulled) this.target = null;
      mob.aggroUntil = 0;
      if (mob.state !== 'idle' && mob.state !== 'return') {
        mob.state = 'return';
        mob.stateTimer = 0;
        view.body.tint = 0x8dffb3;
      }
      if (mob.state === 'idle') this.updateMobIdleMovement(mob, dt);
      return;
    }

    if ((playerPulled || dist < this.mobAggroRange(mob)) && canJoinAggro && mob.state === 'idle') {
      mob.state = 'alert';
      mob.stateTimer = mob.alertDelay;
      mob.aggroUntil = this.time + 3.2;
    }

    if (playerPulled && mob.state !== 'return') {
      mob.aggroUntil = this.time + 3.8;
      if (mob.state === 'idle') {
        mob.state = 'alert';
        mob.stateTimer = Math.min(mob.alertDelay, 0.22);
      }
    }

    if (homeDist > homeLimit * 1.12 && mob.state !== 'return') {
      mob.state = 'return';
      mob.stateTimer = 0;
      mob.aggroUntil = 0;
    }

    if (mob.state === 'idle') {
      this.updateMobIdleMovement(mob, dt);
      return;
    }

    if (mob.state === 'alert') {
      this.faceMobToPlayer(view, mob);
      view.body.tint = 0xfff2c0;
      if (mob.stateTimer <= 0) {
        view.body.tint = 0xffffff;
        mob.state = 'chase';
        mob.aggroUntil = this.time + 3.4;
      }
      return;
    }

    if (mob.state === 'return') {
      view.body.tint = 0xd7f2ff;
      this.moveMobToward(mob, view, mob.spawnX, mob.spawnY, dt, 0.52);
      if (distance(mob.spawnX, mob.spawnY, mob.x, mob.y) < 0.12) {
        mob.x = mob.spawnX;
        mob.y = mob.spawnY;
        mob.state = 'idle';
        mob.stateTimer = 0;
        mob.aggroUntil = 0;
        view.body.tint = 0xffffff;
      }
      return;
    }

    if (this.save.hp <= 0) {
      mob.state = 'return';
      mob.aggroUntil = 0;
      return;
    }

    if (this.maybeStartMobPattern(mob, view, dist)) return;

    if (mob.state === 'chase') {
      mob.aggroUntil = Math.max(mob.aggroUntil, this.time + 1.2);
      if (dist <= attackDist) {
        mob.state = 'attackWindup';
        mob.stateTimer = mob.def.id === 'dragon' ? 0.42 : 0.26;
        this.attackTell(view, mob);
        return;
      }
      const speedFactor = mob.def.id === 'dragon' ? 0.26 : 0.56;
      const moved = this.moveMobToward(mob, view, this.save.x, this.save.y, dt, speedFactor);
      const stepMoved = distance(mob.lastX, mob.lastY, mob.x, mob.y);
      mob.stuckTimer = moved || stepMoved > 0.004 ? 0 : mob.stuckTimer + dt;
      if (mob.stuckTimer > 0.8) {
        mob.stuckTimer = 0;
        mob.state = 'return';
      }
      return;
    }

    if (mob.state === 'attackWindup') {
      this.faceMobToPlayer(view, mob);
      if (dist > attackDist * 1.45) {
        mob.state = 'chase';
        view.body.tint = 0xffffff;
        return;
      }
      if (mob.stateTimer <= 0) {
        this.performMobAttack(mob, view, playerStats);
        mob.state = 'attack';
        mob.stateTimer = 0.22;
      }
      return;
    }

    if (mob.state === 'attack') {
      if (mob.stateTimer <= 0) {
        view.body.tint = 0xffffff;
        mob.state = distance(this.save.x, this.save.y, mob.x, mob.y) <= attackDist * 1.05 ? 'attackWindup' : 'chase';
        if (mob.state === 'attackWindup') mob.stateTimer = mob.def.id === 'dragon' ? 0.505 : 0.34;
      }
    }
  }

  private moveMobToward(mob: WorldMob, view: MobView, x: number, y: number, dt: number, speedFactor: number) {
    const dir = normalize(x - mob.x, y - mob.y);
    const step = this.mobCombatStats(mob).move * dt * speedFactor;
    const nextX = clamp(mob.x + dir.x * step, 1, MAP_W - 2);
    const nextY = clamp(mob.y + dir.y * step, 1, MAP_H - 2);
    let moved = false;
    if (this.isWalkable(nextX, mob.y)) {
      mob.x = nextX;
      moved = true;
    }
    if (this.isWalkable(mob.x, nextY)) {
      mob.y = nextY;
      moved = true;
    }
    if (!moved) {
      const sideA = { x: clamp(mob.x + -dir.y * step, 1, MAP_W - 2), y: clamp(mob.y + dir.x * step, 1, MAP_H - 2) };
      const sideB = { x: clamp(mob.x + dir.y * step, 1, MAP_W - 2), y: clamp(mob.y + -dir.x * step, 1, MAP_H - 2) };
      if (this.isWalkable(sideA.x, sideA.y)) {
        mob.x = sideA.x;
        mob.y = sideA.y;
        moved = true;
      } else if (this.isWalkable(sideB.x, sideB.y)) {
        mob.x = sideB.x;
        mob.y = sideB.y;
        moved = true;
      }
    }
    view.animator?.setDirection(directionFromIsoVector(dir.x, dir.y));
    return moved;
  }

  private faceMobToPlayer(view: MobView, mob: WorldMob) {
    const dir = normalize(this.save.x - mob.x, this.save.y - mob.y);
    view.animator?.setDirection(directionFromIsoVector(dir.x, dir.y));
  }

  private attackTell(view: MobView, mob: WorldMob, patternKind?: MobPatternKind) {
    const color = patternKind ? patternColors[patternKind] : mob.def.id === 'dragon' ? 0xffd15f : 0xffb7b7;
    view.body.tint = color;
    this.impactBurst(mob.x, mob.y, color, Boolean(patternKind));
    if (patternKind) this.floatText(patternNames[patternKind], mob.x, mob.y - 0.42, color);
  }

  private performMobAttack(mob: WorldMob, view: MobView, playerStats: Stats) {
    if (mob.attackCooldown > 0 || this.save.hp <= 0 || this.isPlayerInSafeZone()) return;
    const mobStats = this.mobCombatStats(mob);
    mob.attackCooldown = 1 / mobStats.aspd + 0.65;
    const result = this.resolveDamage(mobStats, playerStats, mob.def.level - this.save.level);
    this.animateMobAttack(view);
    if (result.hit) {
      audioService.play('hit');
      this.save.hp = Math.max(0, this.save.hp - result.damage);
      this.playerAnimator?.playOnce(this.save.hp <= 0 ? 'death' : 'hit', 'idle');
      this.floatText(`-${result.damage}`, this.save.x, this.save.y, 0xff7878);
      this.impactBurst(this.save.x, this.save.y, 0xff5d5d, false);
      if (mob.def.id === 'dragon') this.screenShake();
      if (this.save.hp <= 0) this.playerKnockout();
    } else {
      this.floatText('MISS', this.save.x, this.save.y, 0xd6d1c2);
    }
  }

  private updateMobIdleMovement(mob: WorldMob, dt: number) {
    if (mob.wanderCooldown > 0) return;
    mob.wanderCooldown = 1.2 + Math.random() * 2.2;
    if (distance(mob.spawnX, mob.spawnY, mob.x, mob.y) > 0.35) {
      const dir = normalize(mob.spawnX - mob.x, mob.spawnY - mob.y);
      const mobStats = this.mobCombatStats(mob);
      mob.x = clamp(mob.x + dir.x * mobStats.move * dt * 0.25, 1, MAP_W - 2);
      mob.y = clamp(mob.y + dir.y * mobStats.move * dt * 0.25, 1, MAP_H - 2);
      return;
    }
    if (Math.random() < 0.45) {
      const angle = Math.random() * Math.PI * 2;
      const nextX = mob.x + Math.cos(angle) * 0.18;
      const nextY = mob.y + Math.sin(angle) * 0.18;
      if (this.isWalkable(nextX, nextY) && distance(nextX, nextY, mob.spawnX, mob.spawnY) < (mobHomeRadius[mob.def.id] || 2.4)) {
        mob.x = clamp(nextX, 1, MAP_W - 2);
        mob.y = clamp(nextY, 1, MAP_H - 2);
      }
    }
  }

  private activeAggroCount(exceptUid = '') {
    return this.mobs.filter((mob) => {
      if (!mob.alive || mob.uid === exceptUid) return false;
      if (this.target?.uid === mob.uid) return true;
      return mob.state === 'alert' || mob.state === 'chase' || mob.state === 'attackWindup' || mob.state === 'attack';
    }).length;
  }

  private maxAggroCount() {
    const zoneId = this.options.zoneId || 'slime-forest';
    const zoneLevel = zones.find((zone) => zone.id === zoneId)?.recommendedLevel || 1;
    if (zoneLevel >= 114) return 10;
    if (zoneLevel >= 70) return 9;
    if (zoneId === 'crystal-raid' || zoneId === 'dragon-nest' || zoneId === 'storm-citadel' || zoneId === 'demon-rift' || zoneId === 'sky-citadel') return 7;
    if (zoneId === 'black-cave' || zoneId === 'moonlit-grove' || zoneId === 'soul-ruins' || zoneId === 'ember-ridge' || zoneId === 'bloodstone-mine') return 6;
    if (zoneId === 'goblin-road' || zoneId === 'crystal-moss') return 5;
    return 4;
  }

  private mobAggroRange(mob: WorldMob) {
    if (mob.def.id === 'dragon' || mob.def.id === 'fieldBoss') return 3.65;
    if (mob.def.id === 'crystalBear' || mob.def.id === 'graveKnight' || mob.def.id === 'fireDrake') return 3.2;
    if (mob.def.id === 'goblin' || mob.def.id === 'wraith' || mob.def.id === 'stormHarpy') return 3.15;
    if (mob.def.id === 'wolf' || mob.def.id === 'shadowImp') return 2.95;
    if (mob.def.id === 'mossGolem') return 2.65;
    return 2.35;
  }

  private callNearbyMobs(source: WorldMob, radius = 3.05) {
    let slots = Math.max(0, this.maxAggroCount() - this.activeAggroCount(source.uid));
    if (slots <= 0) return;
    for (const mob of this.mobs) {
      if (slots <= 0) break;
      if (!mob.alive || mob.uid === source.uid) continue;
      if (mob.state !== 'idle' && mob.state !== 'return') continue;
      if (distance(mob.x, mob.y, source.x, source.y) > radius) continue;
      mob.state = 'alert';
      mob.stateTimer = 0.12 + Math.random() * 0.22;
      slots -= 1;
    }
  }

  private updateMobAnimation(view: MobView, mob: WorldMob, dt: number) {
    const engaged = mob.state === 'alert' || mob.state === 'chase' || mob.state === 'attackWindup' || mob.state === 'attack';
    const returning = mob.state === 'return';
    const moving = mob.state === 'chase' || mob.state === 'return';
    if (view.animator) {
      if (mob.state === 'attack' || mob.state === 'attackWindup') view.animator.setMotion('attack');
      else view.animator.setMotion(moving ? (mob.state === 'chase' ? 'run' : 'walk') : 'idle');
      view.animator.update(dt);
    }
    const phase = this.time * (mob.def.id === 'dragon' ? 2.2 : engaged ? 5.4 : 3.2) + mob.spawnX;
    view.body.y = Math.sin(phase) * (mob.def.id === 'dragon' ? 0.8 : engaged ? 1.3 : 0.9);
    view.body.scale.x += (view.baseScale - view.body.scale.x) * 0.08;
    view.body.scale.y += (view.baseScale - view.body.scale.y) * 0.08;
    view.name.alpha = engaged || mob.eliteAffix ? 1 : 0.88;
    view.name.y = -46 + Math.sin(this.time * 2.2 + mob.spawnY) * 0.35;
    view.aggroRing.clear().ellipse(0, 0, mob.def.id === 'dragon' ? 29 : mob.def.id === 'crystalBear' ? 20 : 16, mob.def.id === 'dragon' ? 10 : 5.5).stroke({ color: engaged ? 0xff5d5d : returning ? 0x72e7ff : 0x72e7ff, alpha: engaged ? 0.42 : returning ? 0.16 : 0.065, width: engaged ? 2.2 : 1.1 });
  }

  private updateRespawns() {
    const now = performance.now();
    for (const mob of this.mobs) {
      if (!mob.alive && now >= mob.respawnAt) {
        mob.alive = true;
        mob.hp = this.mobCombatStats(mob).hp;
        mob.deathVisibleUntil = 0;
        mob.aggroUntil = 0;
        mob.state = 'idle';
        mob.stateTimer = 0;
        mob.stuckTimer = 0;
        mob.wanderCooldown = 0.8 + Math.random() * 1.4;
        mob.patternCooldown = 2.4 + Math.random() * 4.2;
        mob.patternWindup = 0;
        mob.patternKind = undefined;
        mob.patternTargetX = undefined;
        mob.patternTargetY = undefined;
        const safe = this.findSafeMobPosition(mob.spawnX, mob.spawnY, 1.7);
        mob.x = safe.x;
        mob.y = safe.y;
        mob.lastX = safe.x;
        mob.lastY = safe.y;
        this.impactBurst(mob.x, mob.y, 0x72e7ff, false);
      }
    }
  }

  private tryPlayerAttack(mob: WorldMob, force: boolean) {
    if (!mob.alive || this.save.hp <= 0) return;
    const klass = classes[this.save.classId];
    const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
    if (dist > klass.attackRange + 0.18) {
      if (force) this.pushLog('거리가 멀어 공격할 수 없습니다.');
      return;
    }
    if (this.attackCooldown > 0) return;

    this.facePlayerTo(mob.x, mob.y);
    const stats = this.calculateStats();
    this.attackCooldown = Math.max(0.28, 1 / stats.aspd);
    mob.aggroUntil = Math.max(mob.aggroUntil, this.time + 3.8);
    if (mob.state === 'idle' || mob.state === 'return') {
      mob.state = 'alert';
      mob.stateTimer = Math.min(mob.alertDelay, 0.18);
    }
    this.callNearbyMobs(mob, mob.def.id === 'slime' ? 2.35 : 3.25);
    const result = this.resolveDamage(stats, this.mobCombatStats(mob), this.save.level - mob.def.level);
    audioService.play('attack');
    this.animatePlayerAttack(mob, result);

    if (!result.hit) {
      this.floatText('MISS', mob.x, mob.y, 0xd6d1c2);
      return;
    }

    mob.hp = Math.max(0, mob.hp - result.damage);
    this.animateMobHit(mob);
    this.impactBurst(mob.x, mob.y, result.crit ? 0xffd15f : classes[this.save.classId].accent, result.crit);
    audioService.play('hit');
    this.hitStop(result.crit ? 0.07 : 0.04);
    this.floatText(`${result.crit ? 'CRIT ' : ''}${result.damage}`, mob.x, mob.y, result.crit ? 0xffd15f : 0xf5f1e8);

    if (this.save.classId === 'warrior') this.applyWarriorCleave(mob, result.damage);
    if (this.save.classId === 'cleric') this.applyClericHeal(result.damage);

    if (mob.hp <= 0) this.killMob(mob);
  }

  private resolveDamage(attacker: Stats, defender: Stats, levelDelta: number): CombatResult {
    const hitChance = clamp(0.82 + levelDelta * 0.025, 0.42, 0.96);
    const hit = roll(hitChance);
    const crit = hit && roll(clamp(attacker.crit, 0, 0.65));
    const variance = 0.86 + Math.random() * 0.24;
    const raw = Math.max(1, attacker.atk * variance - defender.def * 0.52);
    const damage = hit ? Math.max(1, Math.round(raw * (crit ? 1.72 : 1))) : 0;
    return { hit, crit, damage, killed: false };
  }

  private animatePlayerAttack(mob: WorldMob, result: CombatResult) {
    const klass = classes[this.save.classId];
    if (klass.attackStyle === 'melee') {
      this.slashEffect(mob, result.crit);
      this.lungePlayer(mob);
      this.combatMotionAccent(mob, result.crit ? 0xffd15f : klass.accent, result.crit);
      if (result.crit) this.screenShake();
      return;
    }
    if (klass.attackStyle === 'projectile') {
      this.projectileEffect(mob, klass.accent, result.hit);
      this.combatMotionAccent(mob, klass.accent, result.crit);
      this.castPose();
      return;
    }
    this.holyEffect(mob, result.hit);
    this.combatMotionAccent(mob, 0xf2d66c, result.crit);
    this.castPose();
  }

  private applyWarriorCleave(primary: WorldMob, damage: number) {
    for (const mob of this.mobs) {
      if (!mob.alive || mob.uid === primary.uid) continue;
      if (distance(primary.x, primary.y, mob.x, mob.y) > 0.92) continue;
      if (distance(this.save.x, this.save.y, mob.x, mob.y) > 1.45) continue;
      const cleave = Math.max(1, Math.round(damage * 0.38));
      mob.hp = Math.max(0, mob.hp - cleave);
      this.floatText(`+${cleave}`, mob.x, mob.y, 0xe2b95f);
      this.animateMobHit(mob);
      if (mob.hp <= 0) this.killMob(mob);
    }
  }

  private applyClericHeal(damage: number) {
    const stats = this.calculateStats();
    const heal = Math.max(3, Math.round(damage * 0.2));
    this.save.hp = Math.min(stats.hp, this.save.hp + heal);
    this.floatText(`+${heal}`, this.save.x, this.save.y, 0x8dffb3);
    this.healPulse(this.save.x, this.save.y);
  }

  private killMob(mob: WorldMob) {
    mob.alive = false;
    mob.state = 'idle';
    mob.stateTimer = 0;
    mob.aggroUntil = 0;
    mob.deathVisibleUntil = performance.now() + 680;
    mob.respawnAt = performance.now() + mob.def.respawnMs;
    if (this.target?.uid === mob.uid) this.target = null;
    this.autoRouteIndex110 += 1;
    this.autoRouteCooldown110 = 0;

    const chain = this.registerChainKill();
    const bonusGold = Math.round(mob.def.gold * chain.bonusRate);
    const bonusExp = Math.round(mob.def.exp * chain.bonusRate);
    this.save.gold += mob.def.gold + bonusGold;
    this.save.exp += mob.def.exp + bonusExp;
    this.save.kills[mob.def.id] = (this.save.kills[mob.def.id] || 0) + 1;
    this.applyLawfulHuntReward(mob);
    this.applyPledgeHuntReward(mob);
    this.addDailyKill(mob.def.id);
    this.maybeGrantOmegaMilestone(mob.def.id);
    this.updateSoulProgress(mob.def.id);
    this.checkLevelUp();
    this.rollDrops(mob.def);
    audioService.play(mob.def.id === 'dragon' ? 'boss' : 'reward');
    this.mobViews.get(mob.uid)?.animator?.playOnce('death', 'death');
    this.impactBurst(mob.x, mob.y, 0xe2b95f, true);
    this.soulReleaseEffect(mob.x, mob.y, mob.eliteAffix ? (mob.eliteColor || 0xffd15f) : 0xe2b95f);
    const chainText = chain.count > 1 ? ` · CHAIN BONUS ${chain.count} +${Math.round(chain.bonusRate * 100)}%` : '';
    this.floatText(chain.count > 1 ? `${chain.count} CHAIN` : 'SOUL +', mob.x, mob.y - 0.35, chain.count > 4 ? 0xffd15f : 0xe2b95f);
    if (mob.eliteAffix) this.emitLoot({ type: 'elite', title: `${mob.def.name} 정화`, subtitle: `정예 보너스 +${formatGold(bonusGold)} / +${bonusExp}EXP`, rarity: 'SSR' });
    this.pushLog(`${mob.def.name} 정화 +${mob.def.exp + bonusExp}EXP +${formatGold(mob.def.gold + bonusGold)}${chainText}`);
    this.markDirty();
  }


  private applyLawfulHuntReward(mob: WorldMob) {
    const boss = mob.def.id === 'dragon' || mob.def.id === 'fieldBoss';
    const gain = boss ? 25 : mob.eliteAffix ? 12 : 4;
    const before = Math.round(Number(this.save.lawful ?? 0));
    const after = clamp(before + gain, LAWFUL_MIN, LAWFUL_MAX);
    this.save.lawful = Math.round(after);
    if (before < 8000 && after >= 8000) this.floatText('LAWFUL', this.save.x, this.save.y - 0.55, 0x72e7ff);
    if (before < 20000 && after >= 20000) this.floatText('ROYAL LAWFUL', this.save.x, this.save.y - 0.65, 0xffd15f);
  }


  private updateCombatChainTimer(dt: number) {
    if (this.chainTimer <= 0) {
      this.chainTimer = 0;
      this.chainCount = 0;
      return;
    }
    this.chainTimer = Math.max(0, this.chainTimer - dt);
    if (this.chainTimer <= 0) this.chainCount = 0;
  }

  private registerChainKill() {
    this.chainCount = this.chainTimer > 0 ? this.chainCount + 1 : 1;
    this.chainTimer = CHAIN_MAX_TIMER;
    this.chainBest = Math.max(this.chainBest, this.chainCount);
    const bonusRate = Math.min(CHAIN_BONUS_CAP, Math.max(0, this.chainCount - 1) * CHAIN_BONUS_STEP);
    return { count: this.chainCount, bonusRate };
  }

  private combatChainSnapshot() {
    return {
      count: this.chainCount,
      timer: Number(this.chainTimer.toFixed(1)),
      maxTimer: CHAIN_MAX_TIMER,
      bonusPercent: Math.round(Math.min(CHAIN_BONUS_CAP, Math.max(0, this.chainCount - 1) * CHAIN_BONUS_STEP) * 100)
    };
  }

  private pickEliteAffix(zoneId: string, def: MonsterDefinition, index: number) {
    if (def.id === 'slime' && zoneId === 'slime-forest' && index < 3) return null;
    if (def.id === 'dragon' || def.id === 'fieldBoss') return eliteAffixes[(index + zoneId.length) % eliteAffixes.length];
    const zoneOrder = zones.find((zone) => zone.id === zoneId)?.order || 1;
    const chance = Math.min(0.22, 0.055 + zoneOrder * 0.008);
    if (!roll(chance)) return null;
    return eliteAffixes[(index + def.id.length + zoneOrder) % eliteAffixes.length];
  }

  private createEliteMonsterDef(def: MonsterDefinition, elite: EliteAffixDefinition): MonsterDefinition {
    const statScale = elite.statScale;
    return {
      ...def,
      name: `${elite.label} ${def.name}`,
      stats: {
        hp: Math.round(def.stats.hp * statScale),
        mp: def.stats.mp,
        atk: Math.round(def.stats.atk * (statScale + 0.03)),
        def: Math.round(def.stats.def * (statScale + 0.01)),
        aspd: Number((def.stats.aspd * (elite.aspdScale || 1)).toFixed(2)),
        crit: Number(Math.min(0.55, def.stats.crit + 0.03).toFixed(3)),
        move: Number((def.stats.move * (elite.moveScale || 1)).toFixed(2))
      },
      exp: Math.round(def.exp * elite.rewardScale),
      gold: Math.round(def.gold * elite.rewardScale),
      drops: def.drops.map((drop) => ({ ...drop, chance: Math.min(0.95, drop.chance * 1.18) }))
    };
  }

  private mobCombatStats(mob: WorldMob) {
    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
    const orderPressure = Math.min(0.58, Math.max(0, zone.order - 1) * 0.014);
    const levelPressure = Math.max(0, zone.recommendedLevel - this.save.level) * 0.055;
    const elitePressure = mob.eliteAffix ? 0.18 : 0;
    const earlyFieldPressure = zone.order <= 2 ? 0.10 : zone.order <= 6 ? 0.16 : 0.22;
    const pressure = 1 + orderPressure + levelPressure + elitePressure + earlyFieldPressure;
    return {
      hp: Math.round(mob.def.stats.hp * (pressure + 0.30)),
      mp: mob.def.stats.mp,
      atk: Math.round(mob.def.stats.atk * (pressure + 0.22)),
      def: Math.round(mob.def.stats.def * (pressure + 0.14)),
      aspd: Number(Math.min(2.35, mob.def.stats.aspd * (1 + Math.min(0.20, orderPressure * 0.44 + earlyFieldPressure * 0.12))).toFixed(2)),
      crit: Number(Math.min(0.58, mob.def.stats.crit + Math.min(0.08, orderPressure * 0.14 + levelPressure * 0.05 + earlyFieldPressure * 0.035)).toFixed(3)),
      move: Number(Math.min(3.25, mob.def.stats.move * (1 + Math.min(0.16, orderPressure * 0.28 + earlyFieldPressure * 0.08))).toFixed(2))
    };
  }

  private addDailyKill(monsterId: MonsterId) {
    const today = this.todayKey();
    if (!this.save.daily || this.save.daily.dateKey !== today) {
      this.save.daily = {
        dateKey: today,
        kills: this.emptyKillRecord(),
        claimedQuestIds: []
      };
    }
    this.save.daily.kills[monsterId] = (this.save.daily.kills[monsterId] || 0) + 1;
  }

  private emptyKillRecord(): Record<MonsterId, number> {
    return { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0, shadowImp: 0, mossGolem: 0, wraith: 0, fireDrake: 0, stormHarpy: 0, graveKnight: 0, fieldBoss: 0, orcBerserker: 0, nightmareBat: 0, lavaGolem: 0, iceWitch: 0, royalGuard: 0, riftBeast: 0 };
  }

  private todayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private rollDrops(def: MonsterDefinition) {
    const multiplier = this.lawfulDropMultiplier() * this.pledgeDropMultiplier();
    for (const drop of def.drops) {
      const adjustedChance = drop.type === 'gold' ? drop.chance : Math.min(0.98, drop.chance * multiplier);
      if (!roll(adjustedChance)) continue;
      this.applyDrop(drop);
    }
  }

  private emitLoot(detail: { type: string; title: string; subtitle?: string; art?: string; rarity?: string; amount?: number }) {
    window.dispatchEvent(new CustomEvent('soul:loot', { detail }));
  }

  private applyDrop(drop: DropEntry) {
    if (drop.type === 'gold') {
      this.save.gold += drop.amount || 0;
      return;
    }
    if (drop.type === 'gem') {
      this.save.gems += drop.amount || 0;
      audioService.play('reward');
      this.emitLoot({ type: 'gem', title: '소울젬', amount: drop.amount || 0, rarity: 'SR' });
      this.pushLog(`소울젬 +${drop.amount || 0}`);
      return;
    }
    if (drop.type === 'item' && drop.id) {
      const item = this.addItem(drop.id);
      if (item) {
        audioService.play('reward');
        const typeLabel = item.type === 'weapon' || item.type === 'armor' || item.type === 'relic' ? '장비 드랍' : item.type === 'consumable' ? '소모품 드랍' : item.type === 'material' ? '재료 드랍' : '아이템 드랍';
        const gradeTitle = item.rarity === 'UR' ? `전설 장비 · ${item.name}` : item.rarity === 'SSR' ? `희귀 전리품 · ${item.name}` : item.name;
        this.emitLoot({ type: item.type, title: gradeTitle, subtitle: `${item.rarity} · ${typeLabel}`, art: `./assets/soulpack/items/${item.id}.webp?v=055`, rarity: item.rarity });
        if (item.rarity === 'SSR' || item.rarity === 'UR') this.rareDropFlare(this.save.x, this.save.y, item.rarity);
        this.pushLog(`${item.name} 획득`);
      }
      return;
    }
    if (drop.type === 'card' && drop.id) {
      const card = this.addCard(drop.id);
      if (card) {
        audioService.play('reward');
        this.emitLoot({ type: 'card', title: card.name, subtitle: '몬스터 카드 드랍', art: card.art, rarity: card.rarity });
        this.pushLog(`${card.name} 드랍`);
      }
    }
  }

  private addItem(itemId: string, count = 1) {
    const def = items.find((item) => item.id === itemId);
    if (!def) return null;
    const amount = Math.max(1, Math.floor(count || 1));
    const found = this.save.inventory.find((item) => item.itemId === itemId);
    if (found) found.count += amount;
    else this.save.inventory.push({ uid: uid('item'), itemId, count: amount });
    return def;
  }

  private addCard(cardId: string) {
    const def = cards.find((card) => card.id === cardId);
    if (!def) return null;
    const found = this.save.cards.find((card) => card.cardId === cardId);
    if (found) {
      found.copies += 1;
      const needed = found.level + 2;
      if (found.copies >= needed) {
        found.copies -= needed;
        found.level += 1;
        this.pushLog(`${def.name} 합성 Lv.${found.level}`);
      }
    } else {
      this.save.cards.push({ uid: uid('card'), cardId, level: 1, copies: 1, equipped: false });
    }
    return def;
  }

  private updateSoulProgress(monsterId: MonsterId) {
    for (const soul of souls.filter((item) => item.monsterId === monsterId)) {
      const instance = this.save.souls.find((entry) => entry.soulId === soul.id);
      if (!instance || instance.unlocked) continue;
      instance.progress = this.save.kills[monsterId] || 0;
      if (instance.progress >= soul.requiredKills) {
        instance.unlocked = true;
        this.pushLog(`${soul.name} 해방`);
      }
    }
  }

  private checkLevelUp() {
    let leveled = false;
    while (this.save.exp >= expToNext(this.save.level)) {
      this.save.exp -= expToNext(this.save.level);
      this.save.level += 1;
      leveled = true;
    }
    if (leveled) {
      const stats = this.calculateStats();
      this.save.hp = stats.hp;
      this.save.mp = stats.mp;
      this.save.gems += 5;
      audioService.play('level');
      this.pushLog(`레벨 ${this.save.level} 달성`);
      this.healPulse(this.save.x, this.save.y);
    }
  }

  private regenerate() {
    const stats = this.calculateStats();
    if (this.save.hp <= 0) return;
    this.save.hp = Math.min(stats.hp, this.save.hp + Math.ceil(stats.hp * 0.012));
    this.save.mp = Math.min(stats.mp, this.save.mp + Math.ceil(stats.mp * 0.02));
  }

  private playerKnockout() {
    this.playerAnimator?.playOnce('death', 'idle');
    audioService.play('error');
    const chaotic = Math.round(Number(this.save.lawful ?? 0)) <= -4000;
    if (chaotic) this.save.gold = Math.max(0, this.save.gold - Math.max(120, Math.floor(this.save.gold * 0.015)));
    this.pushLog(chaotic ? '카오틱 성향으로 기절 패널티가 적용되었습니다.' : '기절했습니다. 마을 포탈에서 재정비합니다.');
    this.save.x = 8.0;
    this.save.y = 8.2;
    this.save.autoHunt = false;
    window.setTimeout(() => {
      const stats = this.calculateStats();
      this.save.hp = Math.ceil(stats.hp * 0.72);
      this.save.mp = Math.ceil(stats.mp * 0.72);
      this.markDirty();
    }, 1200);
  }


  private expeditionSupportTier() {
    const clearedStory = this.save.story?.claimedQuestIds?.length || 0;
    const bossKills = (this.save.kills?.fieldBoss || 0) + (this.save.kills?.dragon || 0);
    const soulCount = this.save.souls?.filter((soul) => soul.unlocked).length || 0;
    return Math.max(0, Math.min(8, Math.floor(clearedStory / 35) + Math.floor(bossKills / 45) + Math.floor(soulCount / 4)));
  }

  private applyExpeditionSupport(stats: Stats) {
    const tier = this.expeditionSupportTier();
    if (tier <= 0) return;
    this.applyBonus(stats, { hp: tier * 95, mp: tier * 28, atk: tier * 9, def: tier * 6, crit: tier * 0.004 }, 1);
  }

  private maybeGrantOmegaMilestone(monsterId: MonsterId) {
    const totalKills = Object.values(this.save.kills || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
    if (totalKills <= 0 || totalKills % 50 !== 0) return;
    const itemId = totalKills % 250 === 0 ? 'void-memory' : totalKills % 100 === 0 ? 'omega-token' : 'starlight-thread';
    const def = this.addItem(itemId);
    if (!def) return;
    this.save.gems += totalKills % 250 === 0 ? 15 : 5;
    this.emitLoot({ type: 'omega', title: '원정 마일스톤', subtitle: `${totalKills}회 토벌 · ${def.name} 획득`, rarity: totalKills % 250 === 0 ? 'UR' : 'SSR' });
    this.pushLog(`원정 마일스톤 ${totalKills}회 · ${def.name} 획득`);
    if (monsterId === 'dragon' || monsterId === 'fieldBoss') this.screenShake();
  }


  private applyPledgeHuntReward(mob: WorldMob) {
    const pledge = this.save.pledge ||= { name: '루미나 혈맹', level: 1, exp: 0, contribution: 0, crest: 'lion', donatedGold: 0, claimedTaskIds: [] };
    const boss = mob.def.id === 'dragon' || mob.def.id === 'fieldBoss';
    const gain = boss ? 28 : mob.eliteAffix ? 12 : 5;
    pledge.contribution = Math.max(0, Math.floor((pledge.contribution || 0) + gain));
    pledge.exp = Math.max(0, Math.floor((pledge.exp || 0) + gain));
    while (pledge.level < 20 && pledge.exp >= pledgeExpToNext(pledge.level)) {
      pledge.exp -= pledgeExpToNext(pledge.level);
      pledge.level += 1;
      this.emitLoot({ type: 'pledge', title: '혈맹 레벨 상승', subtitle: `${pledge.name} Lv.${pledge.level}`, rarity: pledge.level >= 15 ? 'UR' : 'SSR' });
      this.floatText(`PLEDGE Lv.${pledge.level}`, this.save.x, this.save.y - 0.75, 0xffd15f);
    }
  }

  private pledgeStatBonus(): Partial<Stats> {
    const level = Math.max(1, Math.min(20, Math.floor(Number(this.save.pledge?.level || 1))));
    return {
      hp: level * 18,
      mp: level * 5,
      atk: Math.floor(level * 1.7),
      def: Math.floor(level * 1.25),
      crit: level >= 10 ? 0.006 : 0
    };
  }

  private pledgeDropMultiplier() {
    const level = Math.max(1, Math.min(20, Math.floor(Number(this.save.pledge?.level || 1))));
    return 1 + Math.min(0.10, Math.max(0, level - 1) * 0.006);
  }


  private lawfulStatBonus(): Partial<Stats> {
    const value = Math.round(Number(this.save.lawful ?? 0));
    if (value >= 24000) return { hp: 160, mp: 50, def: 22, atk: 10, crit: 0.012 };
    if (value >= 14000) return { hp: 95, mp: 28, def: 14, atk: 6, crit: 0.006 };
    if (value >= 6000) return { hp: 45, def: 7 };
    if (value <= -18000) return { hp: -90, def: -18, atk: -8, crit: -0.018 };
    if (value <= -4000) return { hp: -35, def: -8, atk: -3 };
    return {};
  }

  private lawfulDropMultiplier() {
    const value = Math.round(Number(this.save.lawful ?? 0));
    if (value >= 24000) return 1.12;
    if (value >= 14000) return 1.08;
    if (value >= 6000) return 1.03;
    if (value <= -18000) return 0.78;
    if (value <= -4000) return 0.9;
    return 1;
  }

  private calculateStats(): Stats {
    const base = classes[this.save.classId].baseStats;
    const stats: Stats = {
      hp: base.hp + (this.save.level - 1) * 22,
      mp: base.mp + (this.save.level - 1) * 7,
      atk: base.atk + (this.save.level - 1) * 4,
      def: base.def + (this.save.level - 1) * 2,
      aspd: base.aspd,
      crit: base.crit,
      move: base.move
    };

    for (const instance of this.save.cards.filter((card) => card.equipped)) {
      const def = cards.find((card) => card.id === instance.cardId);
      if (!def) continue;
      const scalar = 1 + (instance.level - 1) * 0.34;
      this.applyBonus(stats, def.bonus, scalar);
    }

    for (const set of this.activeCardSetEffects()) this.applyBonus(stats, set.bonus, 1);
    applyEquipmentResonance(stats, equipmentResonanceEffects(this.save, items));

    const equippedItemIds = new Set(Object.values(this.save.equipment || {}));
    for (const entry of this.save.inventory) {
      if (!equippedItemIds.has(entry.uid)) continue;
      const def = items.find((item) => item.id === entry.itemId);
      if (!def || def.type === 'material' || def.type === 'skillbook' || def.type === 'consumable') continue;
      const enhanceLevel = this.save.enhancements?.[entry.uid] || 0;
      this.applyBonus(stats, def.bonus, 1 + enhanceLevel * 0.10);
      if (enhanceLevel > 0) this.applyBonus(stats, { atk: enhanceLevel * 1.4, def: enhanceLevel * 0.95, hp: enhanceLevel * 7 }, 1);
    }

    for (const entry of this.save.souls.filter((soul) => soul.unlocked)) {
      const def = souls.find((soul) => soul.id === entry.soulId);
      if (!def) continue;
      this.applyBonus(stats, def.bonus, 1);
    }

    this.applyExpeditionSupport(stats);
    this.applyBonus(stats, this.lawfulStatBonus(), 1);
    this.applyBonus(stats, this.pledgeStatBonus(), 1);

    stats.hp = Math.max(1, Math.round(stats.hp));
    stats.mp = Math.max(0, Math.round(stats.mp));
    stats.atk = Math.round(stats.atk);
    stats.def = Math.round(stats.def);
    stats.aspd = Number(stats.aspd.toFixed(2));
    stats.crit = Number(stats.crit.toFixed(3));
    stats.move = Number(stats.move.toFixed(2));
    return stats;
  }

  private applyBonus(stats: Stats, bonus: Partial<Stats>, scalar: number) {
    for (const [key, value] of Object.entries(bonus) as [keyof Stats, number][]) {
      stats[key] += value * scalar;
    }
  }

  private activeCardSetEffects() {
    const equippedIds = new Set(this.save.cards.filter((card) => card.equipped).map((card) => card.cardId));
    return cardSets.filter((set) => set.requiredCardIds.every((id) => equippedIds.has(id)));
  }

  private materialCount(itemId: string) {
    return this.save.inventory.filter((entry) => entry.itemId === itemId).reduce((sum, entry) => sum + entry.count, 0);
  }

  private consumeMaterial(itemId: string, count: number) {
    let rest = count;
    for (const entry of [...this.save.inventory]) {
      if (entry.itemId !== itemId || rest <= 0) continue;
      const used = Math.min(entry.count, rest);
      entry.count -= used;
      rest -= used;
      if (entry.count <= 0) this.save.inventory = this.save.inventory.filter((item) => item.uid !== entry.uid);
    }
  }

  private updateSkillCooldowns(dt: number) {
    for (const key of Object.keys(this.skillCooldowns)) this.skillCooldowns[key] = Math.max(0, this.skillCooldowns[key] - dt);
  }

  private createSkillSnapshots() {
    return skills
      .filter((skill) => skill.classId === this.save.classId)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        hotkey: skill.hotkey,
        unlocked: this.save.level >= skill.unlockLevel && this.hasLearnedSkill(skill.id),
        cooldownSec: this.effectiveSkillCooldown(skill.id, skill.cooldownSec),
        cooldownRemaining: Number((this.skillCooldowns[skill.id] || 0).toFixed(1)),
        mpCost: this.effectiveSkillMpCost(skill.id, skill.mpCost),
        level: this.skillMasteryLevel(skill.id),
        maxLevel: SKILL_MAX_LEVEL,
        nextCost: this.skillMasteryLevel(skill.id) > 0 && this.skillMasteryLevel(skill.id) < SKILL_MAX_LEVEL ? skillMasteryCost(this.skillMasteryLevel(skill.id)) : undefined
      }));
  }

  private repairVitals() {
    const stats = this.calculateStats();
    this.save.hp = Math.min(stats.hp, Math.max(1, this.save.hp));
    this.save.mp = Math.min(stats.mp, Math.max(0, this.save.mp));
  }

  private power() {
    const stats = this.calculateStats();
    return Math.round(stats.hp * 0.42 + stats.mp * 0.12 + stats.atk * 9.5 + stats.def * 6.2 + stats.aspd * 70 + stats.crit * 520);
  }

  private findNearestMob() {
    let nearest: WorldMob | null = null;
    let best = Number.POSITIVE_INFINITY;
    const settings = this.autoSettings();
    const bossIds = new Set<MonsterId>(['fieldBoss', 'dragon', 'fireDrake']);
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
      const priorityBonus = settings.bossPriority && bossIds.has(mob.def.id) ? -2.75 : 0;
      const eliteBonus = mob.eliteAffix ? -0.42 : 0;
      const score = dist + priorityBonus + eliteBonus;
      if (score < best) {
        nearest = mob;
        best = score;
      }
    }
    return nearest;
  }

  private ensurePlayerSafePosition() {
    if (!this.isWalkable(this.save.x, this.save.y)) {
      const entry = zones.find((zone) => zone.id === (this.options.zoneId || 'slime-forest'))?.entry || zones[0].entry;
      this.save.x = entry.x;
      this.save.y = entry.y;
    }
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      if (distance(this.save.x, this.save.y, mob.x, mob.y) >= 0.92) continue;
      const safe = this.findSafeMobPosition(mob.x, mob.y, 1.35);
      mob.x = safe.x;
      mob.y = safe.y;
      mob.spawnX = safe.x;
      mob.spawnY = safe.y;
    }
  }

  private findSafeMobPosition(x: number, y: number, minPlayerDistance = 1.1) {
    if (this.isWalkable(x, y) && distance(this.save.x, this.save.y, x, y) >= minPlayerDistance) return { x, y };
    for (let radius = minPlayerDistance; radius <= 4.5; radius += 0.45) {
      for (let i = 0; i < 16; i += 1) {
        const angle = (Math.PI * 2 * i) / 16;
        const nx = clamp(x + Math.cos(angle) * radius, 1, MAP_W - 2);
        const ny = clamp(y + Math.sin(angle) * radius, 1, MAP_H - 2);
        if (!this.isWalkable(nx, ny)) continue;
        if (distance(this.save.x, this.save.y, nx, ny) < minPlayerDistance) continue;
        return { x: nx, y: ny };
      }
    }
    const fallback = zones.find((zone) => zone.id === (this.options.zoneId || 'slime-forest'))?.entry || zones[0].entry;
    return { x: fallback.x, y: fallback.y };
  }

  private resolvePlayerMobOverlap() {
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const minDistance = mob.def.id === 'dragon' ? 1.05 : 0.72;
      const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
      if (dist <= 0 || dist >= minDistance) continue;
      const dir = normalize(this.save.x - mob.x || 0.01, this.save.y - mob.y || 0.01);
      const push = minDistance - dist;
      const nextX = this.save.x + dir.x * push;
      const nextY = this.save.y + dir.y * push;
      if (this.isWalkable(nextX, nextY)) {
        this.save.x = clamp(nextX, 1, MAP_W - 2);
        this.save.y = clamp(nextY, 1, MAP_H - 2);
      }
    }
  }

  private resolveMobOverlap(mob: WorldMob) {
    const minDistance = mob.def.id === 'dragon' ? 1.05 : 0.72;
    const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
    if (dist <= 0 || dist >= minDistance) return;
    const dir = normalize(mob.x - this.save.x || 0.01, mob.y - this.save.y || 0.01);
    const push = minDistance - dist;
    const nextX = mob.x + dir.x * push;
    const nextY = mob.y + dir.y * push;
    if (this.isWalkable(nextX, nextY)) {
      mob.x = clamp(nextX, 1, MAP_W - 2);
      mob.y = clamp(nextY, 1, MAP_H - 2);
    }
  }

  private isWalkable(x: number, y: number) {
    const tx = Math.floor(x);
    const ty = Math.floor(y);
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    const tile = this.tileAt(tx, ty);
    return tile !== 'water' && tile !== 'cliff';
  }

  private isEntityNearViewport101(x: number, y: number, pad = 180) {
    if (!this.app) return true;
    const pos = isoToScreen(x, y);
    const sx = pos.x * FIELD_ZOOM + this.world.x;
    const sy = (pos.y + 6) * FIELD_ZOOM + this.world.y;
    return sx > -pad && sx < this.app.screen.width + pad && sy > -pad && sy < this.app.screen.height + pad;
  }

  private shouldSpawnFx101(weight = 1, important = false) {
    if (!this.app) return false;
    const profile105 = getFieldEngineProfile105();
    const maxChildren = profile105.fxChildren;
    if (!important && this.fxLayer.children.length >= maxChildren) return false;
    const now = performance.now();
    if (now - this.fxBudgetWindow101 > 520) {
      this.fxBudgetWindow101 = now;
      this.fxBudgetCount101 = 0;
    }
    const maxBurst = profile105.fxBurst;
    if (!important && this.fxBudgetCount101 + weight > maxBurst) return false;
    this.fxBudgetCount101 += weight;
    return true;
  }

  private placeEntity(entity: Container, x: number, y: number) {
    const pos = isoToScreen(x, y);
    entity.position.set(pos.x, pos.y + 6);
  }

  private updateCamera() {
    if (!this.app) return;
    const pos = isoToScreen(this.save.x, this.save.y);
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height * 0.48;
    this.world.x += (centerX - pos.x * FIELD_ZOOM - this.world.x) * 0.12;
    this.world.y += (centerY - pos.y * FIELD_ZOOM - this.world.y) * 0.12;
  }

  private sortEntities() {
    this.entityLayer.children.sort((a, b) => a.y - b.y);
    this.propLayer.children.sort((a, b) => a.y - b.y);
  }

  private updateMobHp(view: MobView, mob: WorldMob) {
    const ratio = clamp(mob.hp / this.mobCombatStats(mob).hp, 0, 1);
    view.hpFill.clear().roundRect(-18, -39, 36 * ratio, 4, 2).fill({ color: ratio < 0.35 ? 0xff7b58 : 0xd95757, alpha: 0.95 });
  }

  private animateMobHit(mob: WorldMob) {
    const view = this.mobViews.get(mob.uid);
    if (!view) return;
    view.animator?.playOnce('hit', mob.state === 'chase' ? 'run' : 'idle');
    // 1.11: 몬스터 피격은 0.1초 백색 플래시 + 짧은 반동으로 타격감을 명확히 합니다.
    if (this.combatFx) {
      this.combatFx.hitFlash(view.body, { duration: 0.1, shakeX: mob.eliteAffix ? 6 : 4.5, squash: 0.1 });
      return;
    }
    view.body.tint = 0xffffff;
    const originalX = view.body.x;
    this.animate(0.1, (t) => {
      view.body.x = originalX + Math.sin(t * Math.PI * 4) * 5 * (1 - t);
      view.body.scale.y = view.baseScale * (1 - 0.1 * Math.sin(t * Math.PI));
    }, () => {
      view.body.x = originalX;
      view.body.scale.y = view.baseScale;
      view.body.tint = 0xffffff;
    });
  }

  private animateMobAttack(view: MobView) {
    view.animator?.playOnce('attack', 'idle');
    const baseY = view.body.y;
    this.animate(0.22, (t) => {
      view.body.y = baseY - Math.sin(t * Math.PI) * 8;
    }, () => {
      view.body.y = baseY;
    });
  }

  private lungePlayer(mob: WorldMob) {
    if (!this.playerBody) return;
    this.facePlayerTo(mob.x, mob.y);
    this.attackSequence += 1;
    this.playerAnimator?.playOnce('attack', 'idle');
    this.playerAfterImage(classes[this.save.classId].accent, 0.34);
    const dir = normalize(mob.x - this.save.x, mob.y - this.save.y);
    const sx = (dir.x - dir.y) * 18;
    const sy = (dir.x + dir.y) * 8;
    const rotate = 0.13 * (this.playerBody.scale.x < 0 ? -1 : 1);
    // 1.11: player_soul.png 계열 SD 히어로가 적에게 순간 접근했다가 원위치로 복귀하는 트윈 대시입니다.
    if (this.combatFx) {
      this.combatFx.dashAndReturn(this.playerBody, sx, -sy, { duration: 0.22, lift: 5, rotate });
      return;
    }
    this.animate(0.2, (t) => {
      const pulse = Math.sin(t * Math.PI);
      if (this.playerBody) {
        this.playerBody.x = sx * pulse;
        this.playerBody.y = -sy * pulse - pulse * 4;
        this.playerBody.rotation = pulse * rotate;
      }
    }, () => {
      if (this.playerBody) {
        this.playerBody.x = 0;
        this.playerBody.y = 0;
        this.playerBody.rotation = 0;
      }
    });
  }

  private castPose() {
    if (!this.playerBody) return;
    this.playerAnimator?.playOnce('skill', 'idle');
    this.playerAfterImage(classes[this.save.classId].accent, 0.3);
    this.animate(0.22, (t) => {
      const pulse = Math.sin(t * Math.PI);
      if (this.playerBody) {
        this.playerBody.y = -pulse * 7;
        this.playerBody.rotation = pulse * 0.08 * (this.playerBody.scale.x < 0 ? -1 : 1);
      }
    }, () => {
      if (this.playerBody) {
        this.playerBody.y = 0;
        this.playerBody.rotation = 0;
      }
    });
  }


  private spawnRunDust(fast: boolean) {
    if (!this.shouldSpawnFx101(1, false)) return;
    const pos = isoToScreen(this.save.x, this.save.y);
    const dust = new Graphics();
    const count = fast ? 4 : 3;
    for (let i = 0; i < count; i += 1) {
      const ox = -14 + i * 9 + (Math.random() - 0.5) * 7;
      const oy = 5 + Math.random() * 7;
      dust.ellipse(ox, oy, fast ? 7 : 5, fast ? 3.2 : 2.4).fill({ color: 0xd8c292, alpha: fast ? 0.18 : 0.13 });
    }
    dust.position.set(pos.x, pos.y + 9);
    this.fxLayer.addChild(dust);
    this.animate(0.38, (t) => {
      dust.alpha = 1 - t;
      dust.scale.set(0.8 + t * 0.55, 0.72 + t * 0.35);
      dust.y += 0.55;
    }, () => dust.destroy());
  }

  private playerAfterImage(color: number, alpha = 0.28) {
    if (!this.playerBody) return;
    const ghost = new Sprite(this.playerBody.texture);
    ghost.anchor.copyFrom(this.playerBody.anchor);
    ghost.position.copyFrom(this.playerRoot.position);
    ghost.scale.set(this.playerBody.scale.x * 1.02, this.playerBody.scale.y * 1.02);
    ghost.rotation = this.playerBody.rotation;
    ghost.tint = color;
    ghost.alpha = alpha;
    this.fxLayer.addChild(ghost);
    this.animate(0.26, (t) => {
      ghost.alpha = alpha * (1 - t);
      ghost.scale.set(this.playerBody ? Math.abs(this.playerBody.scale.x) * (1.02 + t * 0.1) * Math.sign(ghost.scale.x || 1) : ghost.scale.x, this.playerBody ? this.playerBody.scale.y * (1.02 + t * 0.1) : ghost.scale.y);
      ghost.y -= 8 * t;
    }, () => ghost.destroy());
  }

  private addFxSprite(key: TextureKey, x: number, y: number, options: { scale?: number; alpha?: number; rotation?: number; anchorY?: number; tint?: number; duration?: number; rise?: number } = {}) {
    const pos = isoToScreen(x, y);
    const sprite = new Sprite(this.mustTexture(key));
    sprite.anchor.set(0.5, options.anchorY ?? 0.5);
    sprite.position.set(pos.x, pos.y - 28);
    sprite.scale.set(options.scale ?? 0.34);
    sprite.alpha = options.alpha ?? 0.9;
    sprite.rotation = options.rotation ?? 0;
    if (options.tint !== undefined) sprite.tint = options.tint;
    this.fxLayer.addChild(sprite);
    const startAlpha = sprite.alpha;
    const duration = options.duration ?? 0.34;
    const rise = options.rise ?? 8;
    this.animate(duration, (t) => {
      sprite.alpha = startAlpha * (1 - t);
      sprite.scale.set((options.scale ?? 0.34) * (1 + t * 0.35));
      sprite.y -= rise * t;
      sprite.rotation += 0.012;
    }, () => sprite.destroy());
    return sprite;
  }

  private slashEffect(mob: WorldMob, crit: boolean) {
    const pos = isoToScreen(mob.x, mob.y);
    const color = crit ? 0xffd15f : classes.warrior.accent;
    const slash = new Graphics()
      .moveTo(-46, -18)
      .quadraticCurveTo(4, -58, 52, -12)
      .stroke({ color, alpha: 0.98, width: crit ? 10 : 7 })
      .moveTo(-32, -6)
      .quadraticCurveTo(8, -38, 39, -3)
      .stroke({ color: 0xffffff, alpha: 0.72, width: 3 })
      .circle(28, -18, crit ? 8 : 5)
      .fill({ color: 0xffffff, alpha: crit ? 0.42 : 0.24 });
    slash.position.set(pos.x, pos.y - 22);
    slash.rotation = -0.18 + (this.attackSequence % 2 ? 0.28 : -0.12);
    const slashSprite = this.addFxSprite('effectSoulSlash' as TextureKey, mob.x, mob.y, { scale: crit ? 0.56 : 0.46, alpha: crit ? 0.86 : 0.66, rotation: slash.rotation, tint: crit ? 0xffd15f : color, duration: 0.24, rise: 4 });
    slashSprite.blendMode = 'add';
    this.fxLayer.addChild(slash);
    this.animate(0.18, (t) => {
      slash.alpha = 1 - t;
      slash.scale.set(0.62 + t * 0.72);
      slash.rotation = -0.52 + t * 1.05;
    }, () => slash.destroy());
    this.impactBurst(mob.x, mob.y, color, crit);
  }

  private projectileEffect(mob: WorldMob, color: number, hit: boolean) {
    const start = isoToScreen(this.save.x, this.save.y);
    const end = isoToScreen(mob.x, mob.y);
    const bolt = new Container();
    const glow = new Graphics().circle(0, 0, 12).fill({ color, alpha: 0.28 });
    const core = new Graphics().circle(0, 0, 6).fill({ color: 0xffffff, alpha: 0.94 });
    const sprite = new Sprite(this.mustTexture(this.save.classId === 'taoist' ? 'effectFireball' as TextureKey : 'effectLightning' as TextureKey));
    sprite.anchor.set(0.5);
    sprite.scale.set(this.save.classId === 'taoist' ? 0.22 : 0.18);
    sprite.alpha = 0.78;
    sprite.blendMode = 'add';
    bolt.addChild(glow, sprite, core);
    bolt.position.set(start.x, start.y - 38);
    this.fxLayer.addChild(bolt);
    this.animate(0.24, (t) => {
      const arc = Math.sin(t * Math.PI) * 34;
      bolt.position.set(start.x + (end.x - start.x) * t, start.y - 38 + (end.y - start.y) * t - arc);
      bolt.scale.set(1 + t * 0.3);
    }, () => {
      bolt.destroy();
      if (hit) this.impactBurst(mob.x, mob.y, color, true);
    });
  }

  private holyEffect(mob: WorldMob, hit: boolean) {
    const start = isoToScreen(this.save.x, this.save.y);
    const end = isoToScreen(mob.x, mob.y);
    const beam = new Graphics()
      .moveTo(start.x, start.y - 52)
      .lineTo(end.x, end.y - 34)
      .stroke({ color: 0xf2d66c, alpha: 0.78, width: 5 })
      .moveTo(start.x, start.y - 52)
      .lineTo(end.x, end.y - 34)
      .stroke({ color: 0xffffff, alpha: 0.72, width: 2 });
    this.fxLayer.addChild(beam);
    const nova = this.addFxSprite('effectHolyNova' as TextureKey, mob.x, mob.y, { scale: 0.32, alpha: hit ? 0.72 : 0.36, duration: 0.36, rise: 5 });
    nova.blendMode = 'add';
    this.animate(0.24, (t) => {
      beam.alpha = 1 - t;
      beam.scale.set(1 + t * 0.08);
    }, () => {
      beam.destroy();
      if (hit) this.impactBurst(mob.x, mob.y, 0xf2d66c, false);
    });
  }

  private healPulse(x: number, y: number) {
    if (!this.shouldSpawnFx101(2, true)) return;
    const pos = isoToScreen(x, y);
    const pulse = new Graphics().circle(0, 0, 20).stroke({ color: 0x8dffb3, alpha: 0.8, width: 3 });
    pulse.position.set(pos.x, pos.y - 34);
    this.fxLayer.addChild(pulse);
    this.animate(0.55, (t) => {
      pulse.alpha = 1 - t;
      pulse.scale.set(0.6 + t * 1.6);
    }, () => pulse.destroy());
  }

  private skillBurstEffect(x: number, y: number, color: number, radius: number, crit: boolean, skillId = '') {
    if (!this.shouldSpawnFx101(crit ? 5 : 4, crit)) return;
    const pos = isoToScreen(x, y);
    const burst = new Container();
    burst.position.set(pos.x, pos.y - 22);
    const fxKey = skillId.includes('cleric') ? 'effectHolyNova' : skillId.includes('taoist') ? (skillId.includes('rain') ? 'effectLightning' : 'effectFireball') : skillId.includes('warrior') ? 'effectSoulSlash' : 'effectDarkRift';
    const fxSprite = new Sprite(this.mustTexture(fxKey as TextureKey));
    fxSprite.anchor.set(0.5);
    fxSprite.scale.set(skillId.includes('rain') ? 0.32 : radius > 1.1 ? 0.38 : 0.28);
    fxSprite.alpha = crit ? 0.72 : 0.52;
    fxSprite.rotation = skillId.includes('warrior') ? -0.45 : 0;
    fxSprite.blendMode = 'add';
    burst.addChild(fxSprite);

    const ring = new Graphics()
      .circle(0, 0, 13 + radius * 13)
      .stroke({ color, alpha: crit ? 0.9 : 0.64, width: crit ? 5 : 3 })
      .circle(0, 0, 5 + radius * 6)
      .fill({ color, alpha: 0.07 });
    burst.addChild(ring);

    if (skillId.includes('warrior')) {
      if (skillId.includes('guard')) {
        for (let i = 0; i < 4; i += 1) {
          const bolt = new Graphics()
            .moveTo(-22 + i * 14, -86).lineTo(-30 + i * 18, -46).lineTo(-18 + i * 12, -48).lineTo(-28 + i * 18, -8)
            .stroke({ color: i % 2 ? 0xffffff : 0x8fdfff, alpha: 0.82, width: 4 });
          burst.addChild(bolt);
        }
      }
      for (let i = 0; i < 3; i += 1) {
        const arc = new Graphics()
          .moveTo(-38, -8 + i * 8)
          .quadraticCurveTo(0, -38 - i * 5, 46, -4 - i * 8)
          .stroke({ color: i === 1 ? 0xffffff : color, alpha: i === 1 ? 0.54 : 0.72, width: i === 1 ? 2 : 4 });
        arc.rotation = -0.55 + i * 0.38;
        burst.addChild(arc);
      }
    } else if (skillId.includes('taoist')) {
      for (let i = 0; i < 8; i += 1) {
        const shard = new Graphics()
          .moveTo(0, -9).lineTo(5, 0).lineTo(0, 9).lineTo(-5, 0).closePath()
          .fill({ color: i % 2 ? 0xffffff : color, alpha: 0.78 });
        shard.rotation = (Math.PI * 2 * i) / 8;
        shard.position.set(Math.cos(shard.rotation) * (22 + radius * 12), Math.sin(shard.rotation) * (10 + radius * 5));
        burst.addChild(shard);
      }
      if (skillId.includes('orb')) {
        const fire = new Graphics()
          .circle(0, -82, 14).fill({ color: 0xff7a2d, alpha: 0.85 })
          .circle(0, -82, 7).fill({ color: 0xfff0a8, alpha: 0.9 })
          .moveTo(0, -72).lineTo(-16, -24).lineTo(8, -18).closePath().fill({ color: 0xffb347, alpha: 0.45 });
        burst.addChild(fire);
      }
      if (skillId.includes('rain')) {
        for (let i = 0; i < 7; i += 1) {
          const xoff = -36 + i * 12;
          const beam = new Graphics()
            .moveTo(xoff, -90).lineTo(xoff - 12 + (i % 3) * 8, -16)
            .stroke({ color: i % 2 ? 0xffffff : 0x8fdfff, alpha: 0.74, width: 4 })
            .moveTo(xoff - 6, -48).lineTo(xoff + 10, -58).lineTo(xoff + 2, -38)
            .stroke({ color: 0xffffff, alpha: 0.52, width: 2 });
          burst.addChild(beam);
        }
      }
    } else {
      const halo = new Graphics()
        .circle(0, 0, 22 + radius * 15).stroke({ color: 0xf2d66c, alpha: 0.48, width: 3 })
        .moveTo(0, -40 - radius * 12).lineTo(0, 10).stroke({ color: 0xffffff, alpha: 0.5, width: 4 })
        .moveTo(-18, -18).lineTo(18, -18).stroke({ color: 0xf2d66c, alpha: 0.42, width: 3 });
      burst.addChild(halo);
    }

    this.fxLayer.addChild(burst);
    this.animate(skillId.includes('rain') ? 0.54 : 0.4, (t) => {
      burst.alpha = 1 - t;
      burst.scale.set(0.42 + t * (skillId.includes('rain') ? 1.55 : 1.18));
      burst.rotation = t * (skillId.includes('warrior') ? 1.15 : 0.65);
    }, () => burst.destroy());
  }



  private combatMotionAccent(mob: WorldMob, color: number, strong: boolean) {
    if (!this.shouldSpawnFx101(strong ? 3 : 2, strong)) return;
    const start = isoToScreen(this.save.x, this.save.y);
    const end = isoToScreen(mob.x, mob.y);
    const streak = new Graphics()
      .moveTo(start.x, start.y - 38)
      .lineTo(end.x, end.y - 34)
      .stroke({ color, alpha: strong ? 0.55 : 0.32, width: strong ? 6 : 4 })
      .moveTo(start.x, start.y - 44)
      .lineTo(end.x, end.y - 42)
      .stroke({ color: 0xffffff, alpha: strong ? 0.36 : 0.18, width: strong ? 2.5 : 1.5 });
    streak.blendMode = 'add';
    this.fxLayer.addChild(streak);
    this.animate(0.18, (t) => {
      streak.alpha = 1 - t;
      streak.scale.set(1 + t * 0.04);
    }, () => streak.destroy());
    if (strong) this.hitStop(0.09);
  }

  private rareDropFlare(x: number, y: number, rarity: string) {
    if (!this.shouldSpawnFx101(4, true)) return;
    const color = rarity === 'UR' ? 0xffd15f : 0x9c80ff;
    const pos = isoToScreen(x, y);
    const flare = new Container();
    flare.position.set(pos.x, pos.y - 70);
    const ring = new Graphics()
      .circle(0, 0, rarity === 'UR' ? 30 : 24)
      .stroke({ color, alpha: 0.82, width: 4 })
      .circle(0, 0, rarity === 'UR' ? 13 : 10)
      .fill({ color, alpha: 0.12 });
    const text = new Text({
      text: rarity === 'UR' ? 'SOVEREIGN DROP' : 'RARE DROP',
      style: { fill: rarity === 'UR' ? 0xfff2a8 : 0xd8c7ff, fontFamily: 'Arial', fontSize: 13, fontWeight: '900', stroke: { color: 0x111111, width: 4 } }
    });
    text.anchor.set(0.5, 1);
    text.position.y = -28;
    flare.addChild(ring, text);
    flare.blendMode = 'add';
    this.fxLayer.addChild(flare);
    this.animate(0.9, (t) => {
      flare.alpha = 1 - t;
      flare.y = pos.y - 70 - t * 28;
      flare.scale.set(0.65 + Math.sin(t * Math.PI) * 0.6);
      ring.rotation = t * Math.PI * 2;
    }, () => flare.destroy());
  }

  private soulReleaseEffect(x: number, y: number, color: number) {
    if (!this.shouldSpawnFx101(3, false)) return;
    const pos = isoToScreen(x, y);
    const container = new Container();
    container.position.set(pos.x, pos.y - 42);
    for (let i = 0; i < 7; i += 1) {
      const orb = new Graphics().circle(0, 0, 3 + (i % 3)).fill({ color: i % 2 ? 0xffffff : color, alpha: 0.74 });
      orb.position.set((i - 3) * 6, 0);
      container.addChild(orb);
    }
    this.fxLayer.addChild(container);
    this.animate(0.62, (t) => {
      container.alpha = 1 - t;
      container.y = pos.y - 42 - t * 58;
      container.scale.set(0.8 + Math.sin(t * Math.PI) * 0.36);
      container.children.forEach((child, index) => {
        child.x += Math.sin(t * Math.PI * 2 + index) * 0.55;
      });
    }, () => container.destroy());
  }

  private impactBurst(x: number, y: number, color: number, strong: boolean) {
    if (!strong && this.time - this.lastMinorImpactAt < 0.10) return;
    if (!this.shouldSpawnFx101(strong ? 4 : 2, strong)) return;
    if (!strong) this.lastMinorImpactAt = this.time;
    const pos = isoToScreen(x, y);
    const container = new Container();
    container.position.set(pos.x, pos.y - 32);
    container.blendMode = 'add';
    const ring = new Graphics()
      .circle(0, 0, strong ? 22 : 13)
      .stroke({ color, alpha: strong ? 0.86 : 0.52, width: strong ? 4 : 2.5 });
    const core = new Graphics()
      .ellipse(0, 0, strong ? 18 : 11, strong ? 6 : 4)
      .fill({ color: 0xffffff, alpha: strong ? 0.26 : 0.13 });
    container.addChild(core, ring);
    const count = strong ? 12 : 5;
    const sparks: Graphics[] = [];
    for (let i = 0; i < count; i += 1) {
      const spark = new Graphics()
        .roundRect(-1.5, -1.5, strong ? 8 : 5, strong ? 3 : 2, 2)
        .fill({ color: i % 2 ? 0xffffff : color, alpha: strong ? 0.9 : 0.62 });
      spark.rotation = (Math.PI * 2 * i) / count;
      sparks.push(spark);
      container.addChild(spark);
    }
    if (strong) {
      const slash = new Graphics()
        .moveTo(-38, -4).quadraticCurveTo(0, -22, 42, -2)
        .stroke({ color: 0xffffff, alpha: 0.38, width: 3 })
        .moveTo(-34, 4).quadraticCurveTo(0, 18, 36, 6)
        .stroke({ color, alpha: 0.42, width: 4 });
      container.addChild(slash);
    }
    this.fxLayer.addChild(container);
    this.animate(strong ? 0.42 : 0.26, (t) => {
      const ease = Math.sin(t * Math.PI);
      ring.alpha = (strong ? 0.86 : 0.52) * (1 - t);
      ring.scale.set(0.62 + t * (strong ? 1.55 : 1.05));
      core.alpha = (strong ? 0.28 : 0.13) * (1 - t);
      core.scale.set(0.75 + ease * 0.44, 0.65 + ease * 0.22);
      sparks.forEach((spark, index) => {
        const angle = (Math.PI * 2 * index) / count;
        const dist = (strong ? 46 : 22) * t;
        spark.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist * 0.72);
        spark.alpha = (strong ? 0.9 : 0.62) * (1 - t);
      });
      container.scale.set(1 + ease * (strong ? 0.12 : 0.06));
    }, () => container.destroy());
  }

  private floatText(text: string, x: number, y: number, color: number) {
    if (!this.app) return;
    const important101 = text.includes('CRIT') || text.includes('MISS') || text.includes('회피');
    if (this.localStorageFlag099('soul-online-field-lite-100') && this.fxLayer.children.length > 34 && !important101) return;
    if (!this.shouldSpawnFx101(1, important101)) return;
    const pos = isoToScreen(x, y);
    if (this.combatFx) {
      this.combatFx.floatingDamageText({
        text,
        x: pos.x,
        y: pos.y,
        color,
        critical: text.includes('CRIT'),
        important: important101
      });
      return;
    }
    const label = new Text({
      text,
      style: {
        fill: color,
        fontFamily: 'Arial',
        fontSize: Math.round((text.includes('CRIT') ? 20 : 17) * getFieldEngineProfile105().floatTextScale),
        fontWeight: '900',
        stroke: { color: 0x111111, width: 5 }
      }
    });
    label.anchor.set(0.5);
    label.position.set(pos.x, pos.y - 58);
    this.fxLayer.addChild(label);
    this.animate(0.72, (t) => {
      label.y = pos.y - 58 - 40 * t;
      label.alpha = 1 - t;
      label.scale.set(1 + Math.sin(t * Math.PI) * 0.16);
    }, () => label.destroy());
  }

  private screenShake() {
    if (this.isFieldLite101()) return;
    this.combatFx?.cameraShake({ strength: 11, duration: 0.22 });
    document.body.classList.remove('screen-shake');
    void document.body.offsetWidth;
    document.body.classList.add('screen-shake');
    window.setTimeout(() => document.body.classList.remove('screen-shake'), 220);
  }

  private hitStop(duration: number) {
    if (!this.app || this.isFieldLite101()) return;
    window.clearTimeout(this.hitStopTimer);
    this.app.ticker.speed = 0.18;
    this.hitStopTimer = window.setTimeout(() => {
      if (this.app) this.app.ticker.speed = 1;
    }, duration * 1000);
  }

  private animate(duration: number, onUpdate: (t: number) => void, onDone?: () => void) {
    if (!this.app) return;
    if (this.isFieldLite101()) duration = Math.max(0.07, duration * 0.72);
    let elapsed = 0;
    const tick = (ticker: { deltaMS: number }) => {
      elapsed += ticker.deltaMS / 1000;
      const t = clamp(elapsed / duration, 0, 1);
      onUpdate(t);
      if (t >= 1) {
        this.app?.ticker.remove(tick);
        onDone?.();
      }
    };
    this.app.ticker.add(tick);
  }

  private pushLog(message: string) {
    this.log = [message, ...this.log].slice(0, 5);
  }

  private markDirty() {
    this.save.updatedAt = Date.now();
    this.saveService.saveLocal(this.save);
    if (this.cloudTimer) window.clearTimeout(this.cloudTimer);
    if (this.saveService.isOnline()) {
      this.cloudTimer = window.setTimeout(() => {
        this.saveService.saveCloud(this.save, this.power()).catch((error) => {
          console.warn('[Save] cloud save deferred', error);
        });
      }, 900);
    }
    this.emit();
  }

  private emit() {
    const snapshot = this.createSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private createSnapshot(): Snapshot {
    const stats = this.calculateStats();
    const target = this.target?.alive ? this.target : undefined;
    return {
      save: this.save,
      stats,
      power: this.power(),
      target,
      targetHpPercent: target ? clamp(target.hp / this.mobCombatStats(target).hp, 0, 1) : 0,
      log: this.log,
      online: this.saveService.isOnline(),
      userLabel: this.saveService.userLabel(),
      skills: this.createSkillSnapshots(),
      cardSetEffects: this.activeCardSetEffects(),
      combatChain: this.combatChainSnapshot(),
      potionCounts: this.potionSnapshot()
    };
  }

  private textureResolutionScale106(texture: LoadedTexture, meta: { frameWidth: number; frameHeight: number; rows: unknown[]; actions: Record<string, { start: number; frames: number }> }) {
    const sourceSize = texture.source as { width?: number; height?: number };
    const maxFrameColumn = Math.max(...Object.values(meta.actions).map((action) => action.start + action.frames));
    const actualFrameWidth = Math.max(1, Math.round((sourceSize.width || meta.frameWidth * maxFrameColumn) / maxFrameColumn));
    return Math.max(1, meta.frameWidth / actualFrameWidth);
  }

  getFieldSpriteAtlasReport106() {
    return inspectFieldSpriteAtlas106(this.spriteAtlasMode106, this.textures);
  }

  private mustTexture(key: TextureKey) {
    const texture = this.textures.get(key);
    if (texture) return texture;
    const fallback = this.fallbackTextureKey107(key);
    if (fallback) {
      const fallbackTexture = this.textures.get(fallback);
      if (fallbackTexture) return fallbackTexture;
    }
    throw new Error(`Missing texture ${key}`);
  }


  private classSheetTextureKey(): TextureKey {
    const gender = this.save.gender === 'female' ? 'Female' : 'Male';
    if (this.save.classId === 'taoist') return `heroTaoist${gender}Sheet` as TextureKey;
    if (this.save.classId === 'cleric') return `heroCleric${gender}Sheet` as TextureKey;
    return `heroWarrior${gender}Sheet` as TextureKey;
  }

  private monsterSheetTextureKey(monsterId: MonsterId): TextureKey {
    if (monsterId === 'wolf') return 'monsterWolfSheet';
    if (monsterId === 'goblin') return 'monsterGoblinSheet';
    if (monsterId === 'shadowImp') return 'monsterImpSheet';
    if (monsterId === 'mossGolem') return 'monsterGolemSheet';
    if (monsterId === 'wraith') return 'monsterWraithSheet';
    if (monsterId === 'fireDrake') return 'monsterFireDrakeSheet';
    if (monsterId === 'stormHarpy') return 'monsterHarpySheet';
    if (monsterId === 'graveKnight') return 'monsterGraveKnightSheet';
    if (monsterId === 'fieldBoss') return 'monsterFieldBossSheet';
    if (monsterId === 'crystalBear') return 'monsterBearSheet';
    if (monsterId === 'dragon') return 'bossDragonSheet';
    if (monsterId === 'orcBerserker') return 'monsterOrcSheet';
    if (monsterId === 'nightmareBat') return 'monsterBatSheet';
    if (monsterId === 'lavaGolem') return 'monsterLavaGolemSheet';
    if (monsterId === 'iceWitch') return 'monsterIceWitchSheet';
    if (monsterId === 'royalGuard') return 'monsterRoyalGuardSheet';
    if (monsterId === 'riftBeast') return 'monsterRiftBeastSheet';
    return 'monsterSlimeSheet';
  }

  private classTextureKey(): TextureKey {
    if (this.save.classId === 'taoist') return 'heroTaoist';
    if (this.save.classId === 'cleric') return 'heroCleric';
    return 'heroWarrior';
  }

  private monsterTextureKey(monsterId: MonsterId): TextureKey {
    if (monsterId === 'wolf') return 'monsterWolf';
    if (monsterId === 'goblin') return 'monsterGoblin';
    if (monsterId === 'crystalBear') return 'monsterBear';
    if (monsterId === 'dragon') return 'bossDragon';
    return 'monsterSlime';
  }

  describeCard(instance: CardInstance): { def: CardDefinition; instance: CardInstance } | null {
    const def = cards.find((card) => card.id === instance.cardId);
    return def ? { def, instance } : null;
  }

  describeItem(instance: InventoryItem) {
    const def = items.find((item) => item.id === instance.itemId);
    return def ? { def, instance } : null;
  }

  formatNumber(value: number) {
    return formatNumber(value);
  }
}
