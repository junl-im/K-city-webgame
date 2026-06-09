import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import {
  MAP_H,
  MAP_W,
  MAX_ENHANCE_LEVEL,
  cardSets,
  cards,
  classes,
  enhancementCost,
  expToNext,
  items,
  monsters,
  skills,
  souls,
  spawnTable,
  zones,
  villageProps,
  worldMap
} from '../data/gameData';
import { runtimeTextureUrls, textureUrls } from '../data/assetManifest';
import type {
  CardDefinition,
  CardInstance,
  CombatResult,
  DropEntry,
  EquipmentSlot,
  InventoryItem,
  MonsterDefinition,
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
import { HUMANOID_SHEET_META, MONSTER_SHEET_META, SpriteSheetAnimator, directionFromIsoVector, type SpriteDirection } from './SpriteSheetAnimator';

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

type SolGameOptions = {
  zoneId?: string;
  zoneName?: string;
  onLoadProgress?: (loaded: number, total: number, key: string) => void;
};

const zoneMonsterIds: Record<string, MonsterId[]> = {
  'slime-forest': ['slime', 'slime', 'slime', 'slime', 'wolf', 'wolf', 'shadowImp', 'shadowImp', 'slime', 'wolf', 'shadowImp', 'slime'],
  'crystal-moss': ['wolf', 'wolf', 'wolf', 'shadowImp', 'shadowImp', 'mossGolem', 'mossGolem', 'slime', 'wolf', 'shadowImp', 'mossGolem', 'wolf'],
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
  'demon-rift': ['fieldBoss', 'fieldBoss', 'dragon', 'dragon', 'graveKnight', 'graveKnight', 'fireDrake', 'fireDrake']
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
  dragon: 3.8
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

const FIELD_ZOOM = 0.78;
const PLAYER_VISUAL_SCALE = 0.335;
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
  dragon: 0.4
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
  private textures = new Map<string, Texture>();
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
  private autoStuckTimer = 0;
  private autoLastX = 0;
  private autoLastY = 0;
  private autoRecoveryCooldown = 0;
  private autoSkillThinkTimer = 0;
  private hitStopTimer = 0;
  private listeners = new Set<(snapshot: Snapshot) => void>();
  private log: string[] = ['마을에서 사냥터로 이동했습니다.'];

  constructor(
    private save: PlayerSave,
    private saveService: SaveService,
    private options: SolGameOptions = {}
  ) {}

  async mount(root: HTMLElement) {
    this.app = new Application();
    await this.app.init({
      resizeTo: window,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2)
    });

    root.replaceChildren(this.app.canvas);
    this.world.scale.set(FIELD_ZOOM);
    this.world.addChild(this.mapLayer, this.ambientLayer, this.propLayer, this.entityLayer, this.fxLayer);
    this.app.stage.addChild(this.world);

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

  manualAttack() {
    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (this.target) this.tryPlayerAttack(this.target, true);
  }


  private hasLearnedSkill(skillId: string) {
    return Array.isArray(this.save.learnedSkillIds) && this.save.learnedSkillIds.includes(skillId);
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
    if (this.save.mp < skill.mpCost) {
      this.pushLog(`MP 부족 · ${skill.name}`);
      this.emit();
      return;
    }

    const stats = this.calculateStats();
    if (skill.kind === 'heal') {
      this.save.mp -= skill.mpCost;
      this.skillCooldowns[skill.id] = skill.cooldownSec;
      this.castPose();
      const heal = Math.max(18, Math.round(stats.hp * 0.22 + stats.atk * 0.65));
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
    this.save.mp -= skill.mpCost;
    this.skillCooldowns[skill.id] = skill.cooldownSec;
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
      const skillStats = { ...stats, atk: Math.round(stats.atk * skill.damageMultiplier) };
      const result = this.resolveDamage(skillStats, mob.def.stats, this.save.level - mob.def.level);
      if (!result.hit) {
        this.floatText('MISS', mob.x, mob.y, 0xd6d1c2);
        continue;
      }
      mob.hp = Math.max(0, mob.hp - result.damage);
      totalDamage += result.damage;
      audioService.play('hit');
      this.floatText(`${result.crit ? 'CRIT ' : ''}${result.damage}`, mob.x, mob.y, result.crit ? 0xffd15f : 0xf5f1e8);
      this.animateMobHit(mob);
      this.skillBurstEffect(mob.x, mob.y, classes[this.save.classId].accent, skill.radius, result.crit, skill.id);
      if (mob.hp <= 0) {
        killed += 1;
        this.killMob(mob);
      }
    }

    if (skill.kind === 'damageHeal') {
      const heal = Math.max(5, Math.round(Math.max(totalDamage, stats.atk) * 0.16));
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
    if (!def || def.type === 'material' || def.type === 'skillbook') {
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
    if (this.save.learnedSkillIds.includes(id)) return false;
    this.save.learnedSkillIds.push(id);
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
    if (this.app) this.app.ticker.speed = 1;
    this.listeners.clear();
    const canvas = this.app?.canvas;
    this.app?.ticker.stop();
    this.app?.destroy();
    canvas?.remove();
    this.app = null;
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
    const required = this.requiredTextureKeys();
    let loaded = 0;
    await Promise.all(
      required.map(async (key) => {
        const fallbackUrl = textureUrls[key];
        const runtimeUrl = runtimeTextureUrls[key];
        const texture = await this.loadTextureWithFallback(runtimeUrl, fallbackUrl);
        this.textures.set(key, texture);
        loaded += 1;
        this.options.onLoadProgress?.(loaded, required.length, String(key));
      })
    );
  }

  private requiredTextureKeys(): TextureKey[] {
    const keys = new Set<TextureKey>([
      'tileGrass', 'tileDirt', 'tileMoss', 'tileStone', 'tileCrystal', 'tileWater', 'tileCliff', 'tilePortal',
      'propTree', 'propCrystal', 'propRock', 'propRuin',
      'buildingHall', 'buildingForge', 'buildingStorage', 'buildingShop',
      'propChest01', 'propChest02', 'propChest03', 'propChest04', 'propChest05',
      'propTorch01', 'propTorch02', 'propTorch03', 'propTorch04', 'propTorch05'
    ]);

    for (let i = 1; i <= 10; i += 1) {
      const num = String(i).padStart(2, '0');
      keys.add(`propTree${num}` as TextureKey);
      keys.add(`propRock${num}` as TextureKey);
    }

    keys.add(this.classSheetTextureKey());
    const zoneId = this.options.zoneId || 'slime-forest';
    const monsterIds = zoneMonsterIds[zoneId] || zoneMonsterIds['slime-forest'];
    for (const monsterId of monsterIds) keys.add(this.monsterSheetTextureKey(monsterId));
    return [...keys];
  }

  private async loadTextureWithFallback(runtimeUrl: string | undefined, fallbackUrl: string) {
    if (runtimeUrl) {
      try {
        return await Assets.load<Texture>(runtimeUrl);
      } catch {
        // Runtime asset packs are optional. If a file is missing or corrupt, keep the game playable.
      }
    }
    return Assets.load<Texture>(fallbackUrl);
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
        const sprite = new Sprite(this.mustTexture(tileTextureKey[tile]));
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
    this.addZoneGroundMood();
    this.addVillageDecor();
    this.addZoneLandmarks();

    const trees = [
      [4, 16], [6, 25], [11, 15], [14, 26], [18, 13], [21, 16], [24, 23], [27, 17]
    ];
    for (let i = 0; i < trees.length; i += 1) { const [x, y] = trees[i]; this.addProp(this.propVariant('tree', i), x, y, 0.42 + (i % 3) * 0.035); }

    const crystals = [
      [16, 17], [20, 14], [24, 18], [27.2, 20.4], [23.5, 25.8]
    ];
    for (const [x, y] of crystals) this.addProp('propCrystal', x, y, 0.42);

    const rocks = [
      [5.8, 20.8, 0.382],
      [13.5, 23.4, 0.34],
      [20.8, 15.4, 0.38],
      [25.5, 26.5, 0.42],
      [27.2, 14.6, 0.36]
    ];
    for (let i = 0; i < rocks.length; i += 1) { const [x, y, scale] = rocks[i]; this.addProp(this.propVariant('rock', i), x, y, scale); }

    const chests = [[14.6, 24.8, 0.34], [22.4, 20.6, 0.32], [31.6, 23.8, 0.34]] as Array<[number, number, number]>;
    for (let i = 0; i < chests.length; i += 1) { const [x, y, scale] = chests[i]; this.addProp(this.propVariant('chest', i), x, y, scale); }
    const torches = [[9.0, 21.2, 0.34], [18.8, 22.0, 0.32], [27.6, 19.4, 0.32], [34.2, 25.8, 0.34]] as Array<[number, number, number]>;
    for (let i = 0; i < torches.length; i += 1) { const [x, y, scale] = torches[i]; this.addProp(this.propVariant('torch', i), x, y, scale); }
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
    } else {
      road([[entry.x, entry.y], [10, 23], [14, 24], [18, 22], [22, 19], [28, 17], [34, 18]], 'dirt', 0.98);
      brush(11, 24, 3.0, 'grass');
      brush(18, 22, 3.0, 'grass');
      brush(27, 18, 2.8, 'moss');
      brush(34, 18, 2.4, 'grass');
    }

    return map;
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
      .fill({ color: 0x050809, alpha: 0.32 });
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
    const tint = zoneId === 'crystal-raid' ? 0x5b4cff : zoneId === 'black-cave' ? 0x4b5f86 : zoneId === 'goblin-road' ? 0x8f6a3c : zoneId === 'crystal-moss' ? 0x72e7ff : 0xa8d06f;
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
    const ring = new Graphics()
      .ellipse(0, 0, 168, 70)
      .fill({ color: 0x1f2c2c, alpha: 0.26 })
      .ellipse(0, 0, 118, 48)
      .stroke({ color: 0xe2b95f, alpha: 0.22, width: 3 });
    const center = isoToScreen(8, 19);
    ring.position.set(center.x, center.y + 8);
    this.mapLayer.addChild(ring);
    this.addProp('buildingHall', 6.0, 16.7, 0.32);
    this.addProp('buildingForge', 11.6, 17.4, 0.29);
    this.addProp('buildingStorage', 5.6, 23.2, 0.28);
    this.addProp('buildingShop', 12.8, 22.8, 0.28);

    for (const prop of villageProps) {
      const key = prop.type === 'tree' ? 'propTree' : prop.type === 'rock' ? 'propRock' : prop.type === 'ruin' ? 'propRuin' : 'propCrystal';
      this.addProp(key, prop.x, prop.y, prop.scale);
    }

    const zone = zones.find((entry) => entry.id === (this.options.zoneId || 'slime-forest')) || zones[0];
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
    sprite.anchor.set(0.5, 0.92);
    sprite.scale.set(scale);
    sprite.position.set(pos.x, pos.y + 14);
    const shadow = new Graphics().ellipse(pos.x + 4, pos.y + 18, 34 * scale, 10 * scale).fill({ color: 0x000000, alpha: 0.16 });
    this.ambientLayer.addChild(shadow);
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
    if (zoneId === 'slime-forest') return 1.35;
    if (zoneId === 'crystal-moss' || zoneId === 'goblin-road') return 1.55;
    if (zoneId === 'black-cave' || zoneId === 'moonlit-grove' || zoneId === 'soul-ruins') return 1.7;
    return 1.85;
  }

  private expandSpawnCandidates(zoneId: string, seeds: Array<{ monsterId: MonsterId; x: number; y: number }>) {
    const allowed = zoneMonsterIds[zoneId] || zones.find((entry) => entry.id === zoneId)?.monsterIds || [];
    const targetTotal = Math.max(seeds.length, Math.ceil(allowed.length * this.mobDensityBoost(zoneId)));
    if (!allowed.length || seeds.length >= targetTotal) return seeds;
    const next = [...seeds];
    let cursor = 0;
    while (next.length < targetTotal) {
      const base = seeds[cursor % seeds.length] || { monsterId: allowed[cursor % allowed.length], x: 12, y: 22 };
      const monsterId = allowed[cursor % allowed.length];
      const angle = cursor * 2.399963;
      const ring = 0.72 + (cursor % 4) * 0.42;
      const x = clamp(base.x + Math.cos(angle) * ring, 2, MAP_W - 3);
      const y = clamp(base.y + Math.sin(angle) * ring, 2, MAP_H - 3);
      next.push({ monsterId, x, y });
      cursor += 1;
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
        const maxCount = Math.ceil(allowed.filter((item) => item === id).length * this.mobDensityBoost(zone.id));
        if (!maxCount) return false;
        const count = counters.get(id) || 0;
        if (count >= maxCount) return false;
        counters.set(id, count + 1);
        return true;
      })
      .map((spawn, index) => {
        const def = monsters.find((monster) => monster.id === spawn.monsterId);
        if (!def) throw new Error(`Missing monster ${spawn.monsterId}`);
        const safe = this.findSafeMobPosition(spawn.x, spawn.y, 1.7);
        return {
          uid: `${def.id}-${index}`,
          def,
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
          lastY: safe.y
        };
      });

    for (const mob of this.mobs) this.buildMobView(mob);
  }

  private buildPlayer() {
    const klass = classes[this.save.classId];
    this.playerRoot.removeChildren();

    this.playerShadow = new Graphics().ellipse(0, 0, 18 * PLAYER_SHADOW_SCALE, 6 * PLAYER_SHADOW_SCALE).fill({ color: 0x000000, alpha: 0.28 });
    this.playerAnimator = new SpriteSheetAnimator(this.mustTexture(this.classSheetTextureKey()), HUMANOID_SHEET_META, 0.94);
    this.playerBody = this.playerAnimator.sprite;
    this.playerBody.scale.set(PLAYER_VISUAL_SCALE);

    const aura = new Graphics()
      .circle(0, -18, 15)
      .stroke({ color: klass.accent, alpha: 0.24, width: 1.5 })
      .circle(0, -18, 10)
      .stroke({ color: 0xffffff, alpha: 0.08, width: 1 });

    const name = new Text({
      text: this.save.name,
      style: {
        fill: 0xf5f1e8,
        fontFamily: 'Arial',
        fontSize: 11,
        fontWeight: '800',
        stroke: { color: 0x111111, width: 3 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -43;

    const badge = new Text({
      text: `${klass.name}`,
      style: {
        fill: klass.accent,
        fontFamily: 'Arial',
        fontSize: 8,
        fontWeight: '900',
        stroke: { color: 0x111111, width: 3 }
      }
    });
    badge.anchor.set(0.5, 1);
    badge.position.y = -55;

    this.playerRoot.addChild(this.playerShadow, aura, this.playerBody, name, badge);
    if (!this.entityLayer.children.includes(this.playerRoot)) this.entityLayer.addChild(this.playerRoot);
    this.placeEntity(this.playerRoot, this.save.x, this.save.y);
  }

  private buildMobView(mob: WorldMob) {
    const root = new Container();
    const isDragon = mob.def.id === 'dragon';
    const isLarge = mob.def.id === 'crystalBear' || isDragon;
    const shadow = new Graphics().ellipse(0, 0, isDragon ? 24 : isLarge ? 18 : 12, isDragon ? 6 : 4).fill({ color: 0x000000, alpha: 0.3 });
    const aggroRing = new Graphics().ellipse(0, 0, isDragon ? 27 : isLarge ? 19 : 15, isDragon ? 9 : 5).stroke({ color: 0xff5d5d, alpha: 0, width: 1.5 });
    const animator = new SpriteSheetAnimator(this.mustTexture(this.monsterSheetTextureKey(mob.def.id)), MONSTER_SHEET_META, 0.92);
    const body = animator.sprite;
    const baseScale = MOB_VISUAL_SCALE[mob.def.id];
    body.scale.set(baseScale);

    const hpBack = new Graphics().roundRect(-18, -39, 36, 4, 2).fill({ color: 0x151515, alpha: 0.72 });
    const hpFill = new Graphics().roundRect(-18, -39, 36, 4, 2).fill({ color: 0xd95757, alpha: 0.95 });

    const name = new Text({
      text: mob.def.name,
      style: {
        fill: isDragon ? 0xffd15f : 0xf5f1e8,
        fontFamily: 'Arial',
        fontSize: isDragon ? 9 : 8,
        fontWeight: '800',
        stroke: { color: 0x111111, width: 3 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -42;

    root.addChild(shadow, aggroRing, body, hpBack, hpFill, name);
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
    this.updateSkillCooldowns(dt);
    this.autoSkillThinkTimer = Math.max(0, this.autoSkillThinkTimer - dt);
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
    this.sortEntities();

    this.dirtyTimer += dt;
    if (this.dirtyTimer >= 1.4) {
      this.dirtyTimer = 0;
      this.saveService.saveLocal(this.save);
    }

    this.emit();
  }

  private tryAutoSkillUse() {
    this.autoSkillThinkTimer = 0.38;
    if (this.save.hp <= 0) return;
    const stats = this.calculateStats();
    const classSkills = skills.filter((entry) => entry.classId === this.save.classId);
    const hpRatio = this.save.hp / Math.max(1, stats.hp);
    const healingSlot = classSkills.findIndex((skill) => skill.kind === 'heal' && this.hasLearnedSkill(skill.id) && this.save.level >= skill.unlockLevel && (this.skillCooldowns[skill.id] || 0) <= 0 && this.save.mp >= skill.mpCost);
    if (hpRatio < 0.62 && healingSlot >= 0) {
      this.useSkill(healingSlot);
      this.autoSkillThinkTimer = 0.75;
      return;
    }

    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (!this.target) return;
    const sorted = classSkills
      .map((skill, slot) => ({ skill, slot }))
      .filter(({ skill }) => skill.kind !== 'heal' && this.hasLearnedSkill(skill.id) && this.save.level >= skill.unlockLevel && (this.skillCooldowns[skill.id] || 0) <= 0 && this.save.mp >= skill.mpCost)
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
    if (this.playerShadow) {
      const shadowScale = moving ? 1 + Math.sin(this.time * 14) * 0.05 : 1;
      this.playerShadow.scale.set(shadowScale, 1);
    }
  }

  private setPlayerFacing(dx: number, dy: number) {
    this.playerFacing = directionFromIsoVector(dx, dy);
    this.playerAnimator?.setDirection(this.playerFacing);
  }

  private facePlayerTo(x: number, y: number) {
    this.setPlayerFacing(x - this.save.x, y - this.save.y);
  }

  private autoHuntMove() {
    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (!this.target) return;

    const dist = distance(this.save.x, this.save.y, this.target.x, this.target.y);
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
        view.root.visible = performance.now() < (mob.deathVisibleUntil || 0);
        view.animator?.update(dt);
        continue;
      }

      view.root.visible = true;
      mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);
      mob.wanderCooldown = Math.max(0, mob.wanderCooldown - dt);
      mob.stateTimer = Math.max(0, mob.stateTimer - dt);

      this.updateMobAi(mob, view, stats, dt);
      this.resolveMobOverlap(mob);
      this.updateMobAnimation(view, mob, dt);
      this.updateMobHp(view, mob);
      this.placeEntity(view.root, mob.x, mob.y);
      mob.lastX = mob.x;
      mob.lastY = mob.y;
    }
  }

  private updateMobAi(mob: WorldMob, view: MobView, playerStats: Stats, dt: number) {
    const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
    const homeDist = distance(mob.spawnX, mob.spawnY, mob.x, mob.y);
    const homeLimit = mobHomeRadius[mob.def.id] || 2.4;
    const attackDist = mob.def.id === 'dragon' ? 1.58 : 1.12;
    const canJoinAggro = this.activeAggroCount(mob.uid) < this.maxAggroCount();
    const playerPulled = this.target?.uid === mob.uid;

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
    const step = mob.def.stats.move * dt * speedFactor;
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

  private attackTell(view: MobView, mob: WorldMob) {
    view.body.tint = mob.def.id === 'dragon' ? 0xffd15f : 0xffb7b7;
    this.impactBurst(mob.x, mob.y, 0xff7b58, false);
  }

  private performMobAttack(mob: WorldMob, view: MobView, playerStats: Stats) {
    if (mob.attackCooldown > 0 || this.save.hp <= 0) return;
    mob.attackCooldown = 1 / mob.def.stats.aspd + 0.65;
    const result = this.resolveDamage(mob.def.stats, playerStats, mob.def.level - this.save.level);
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
      mob.x = clamp(mob.x + dir.x * mob.def.stats.move * dt * 0.25, 1, MAP_W - 2);
      mob.y = clamp(mob.y + dir.y * mob.def.stats.move * dt * 0.25, 1, MAP_H - 2);
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
    if (zoneId === 'crystal-raid' || zoneId === 'dragon-nest' || zoneId === 'storm-citadel' || zoneId === 'demon-rift' || zoneId === 'sky-citadel') return 6;
    if (zoneId === 'black-cave' || zoneId === 'moonlit-grove' || zoneId === 'soul-ruins' || zoneId === 'ember-ridge' || zoneId === 'bloodstone-mine') return 5;
    if (zoneId === 'goblin-road' || zoneId === 'crystal-moss') return 4;
    return 3;
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
    view.aggroRing.clear().ellipse(0, 0, mob.def.id === 'dragon' ? 27 : mob.def.id === 'crystalBear' ? 19 : 15, mob.def.id === 'dragon' ? 9 : 5).stroke({ color: engaged ? 0xff5d5d : returning ? 0x72e7ff : 0x72e7ff, alpha: engaged ? 0.38 : returning ? 0.14 : 0.06, width: engaged ? 2 : 1 });
  }

  private updateRespawns() {
    const now = performance.now();
    for (const mob of this.mobs) {
      if (!mob.alive && now >= mob.respawnAt) {
        mob.alive = true;
        mob.hp = mob.def.stats.hp;
        mob.deathVisibleUntil = 0;
        mob.aggroUntil = 0;
        mob.state = 'idle';
        mob.stateTimer = 0;
        mob.stuckTimer = 0;
        mob.wanderCooldown = 0.8 + Math.random() * 1.4;
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
    const result = this.resolveDamage(stats, mob.def.stats, this.save.level - mob.def.level);
    audioService.play('attack');
    this.animatePlayerAttack(mob, result);

    if (!result.hit) {
      this.floatText('MISS', mob.x, mob.y, 0xd6d1c2);
      return;
    }

    mob.hp = Math.max(0, mob.hp - result.damage);
    this.animateMobHit(mob);
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
      if (result.hit) this.screenShake();
      return;
    }
    if (klass.attackStyle === 'projectile') {
      this.projectileEffect(mob, klass.accent, result.hit);
      this.castPose();
      return;
    }
    this.holyEffect(mob, result.hit);
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

    this.save.gold += mob.def.gold;
    this.save.exp += mob.def.exp;
    this.save.kills[mob.def.id] = (this.save.kills[mob.def.id] || 0) + 1;
    this.addDailyKill(mob.def.id);
    this.updateSoulProgress(mob.def.id);
    this.checkLevelUp();
    this.rollDrops(mob.def);
    audioService.play(mob.def.id === 'dragon' ? 'boss' : 'reward');
    this.mobViews.get(mob.uid)?.animator?.playOnce('death', 'death');
    this.impactBurst(mob.x, mob.y, 0xe2b95f, true);
    this.pushLog(`${mob.def.name} 정화 +${mob.def.exp}EXP +${formatGold(mob.def.gold)}`);
    this.markDirty();
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
    return { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0, shadowImp: 0, mossGolem: 0, wraith: 0, fireDrake: 0, stormHarpy: 0, graveKnight: 0, fieldBoss: 0 };
  }

  private todayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private rollDrops(def: MonsterDefinition) {
    for (const drop of def.drops) {
      if (!roll(drop.chance)) continue;
      this.applyDrop(drop);
    }
  }

  private applyDrop(drop: DropEntry) {
    if (drop.type === 'gold') {
      this.save.gold += drop.amount || 0;
      return;
    }
    if (drop.type === 'gem') {
      this.save.gems += drop.amount || 0;
      audioService.play('reward');
      this.pushLog(`소울젬 +${drop.amount || 0}`);
      return;
    }
    if (drop.type === 'item' && drop.id) {
      const item = this.addItem(drop.id);
      if (item) {
        audioService.play('reward');
        this.pushLog(`${item.name} 획득`);
      }
      return;
    }
    if (drop.type === 'card' && drop.id) {
      const card = this.addCard(drop.id);
      if (card) {
        audioService.play('reward');
        this.pushLog(`${card.name} 드랍`);
      }
    }
  }

  private addItem(itemId: string) {
    const def = items.find((item) => item.id === itemId);
    if (!def) return null;
    const found = this.save.inventory.find((item) => item.itemId === itemId);
    if (found) found.count += 1;
    else this.save.inventory.push({ uid: uid('item'), itemId, count: 1 });
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
    this.pushLog('기절했습니다. 마을 포탈에서 재정비합니다.');
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

    const equippedItemIds = new Set(Object.values(this.save.equipment || {}));
    for (const entry of this.save.inventory) {
      if (!equippedItemIds.has(entry.uid)) continue;
      const def = items.find((item) => item.id === entry.itemId);
      if (!def || def.type === 'material' || def.type === 'skillbook') continue;
      const enhanceLevel = this.save.enhancements?.[entry.uid] || 0;
      this.applyBonus(stats, def.bonus, 1 + enhanceLevel * 0.10);
      if (enhanceLevel > 0) this.applyBonus(stats, { atk: enhanceLevel * 1.4, def: enhanceLevel * 0.95, hp: enhanceLevel * 7 }, 1);
    }

    for (const entry of this.save.souls.filter((soul) => soul.unlocked)) {
      const def = souls.find((soul) => soul.id === entry.soulId);
      if (!def) continue;
      this.applyBonus(stats, def.bonus, 1);
    }

    stats.hp = Math.round(stats.hp);
    stats.mp = Math.round(stats.mp);
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
        cooldownSec: skill.cooldownSec,
        cooldownRemaining: Number((this.skillCooldowns[skill.id] || 0).toFixed(1)),
        mpCost: skill.mpCost
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
    for (const mob of this.mobs) {
      if (!mob.alive) continue;
      const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
      if (dist < best) {
        nearest = mob;
        best = dist;
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
    const ratio = clamp(mob.hp / mob.def.stats.hp, 0, 1);
    view.hpFill.clear().roundRect(-18, -39, 36 * ratio, 4, 2).fill({ color: ratio < 0.35 ? 0xff7b58 : 0xd95757, alpha: 0.95 });
  }

  private animateMobHit(mob: WorldMob) {
    const view = this.mobViews.get(mob.uid);
    if (!view) return;
    view.animator?.playOnce('hit', mob.state === 'chase' ? 'run' : 'idle');
    view.body.tint = 0xffd1d1;
    const originalX = view.body.x;
    this.animate(0.16, (t) => {
      view.body.x = originalX + Math.sin(t * Math.PI * 4) * 5 * (1 - t);
      view.body.scale.y = view.baseScale * (1 - 0.12 * (1 - t));
    }, () => {
      view.body.x = originalX;
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
    this.playerAnimator?.playOnce('attack', 'idle');
    const dir = normalize(mob.x - this.save.x, mob.y - this.save.y);
    const sx = (dir.x - dir.y) * 14;
    const sy = (dir.x + dir.y) * 7;
    this.animate(0.2, (t) => {
      const pulse = Math.sin(t * Math.PI);
      if (this.playerBody) {
        this.playerBody.x = sx * pulse;
        this.playerBody.y = -sy * pulse - pulse * 4;
        this.playerBody.rotation = pulse * 0.13 * (this.playerBody.scale.x < 0 ? -1 : 1);
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
    slash.rotation = -0.18;
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
    bolt.addChild(glow, core);
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
    this.animate(0.24, (t) => {
      beam.alpha = 1 - t;
      beam.scale.set(1 + t * 0.08);
    }, () => {
      beam.destroy();
      if (hit) this.impactBurst(mob.x, mob.y, 0xf2d66c, false);
    });
  }

  private healPulse(x: number, y: number) {
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
    const pos = isoToScreen(x, y);
    const burst = new Container();
    burst.position.set(pos.x, pos.y - 22);

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

  private impactBurst(x: number, y: number, color: number, strong: boolean) {
    const pos = isoToScreen(x, y);
    const container = new Container();
    container.position.set(pos.x, pos.y - 32);
    const ring = new Graphics().circle(0, 0, strong ? 20 : 14).stroke({ color, alpha: 0.78, width: strong ? 4 : 3 });
    container.addChild(ring);
    const count = strong ? 10 : 6;
    const sparks: Graphics[] = [];
    for (let i = 0; i < count; i += 1) {
      const spark = new Graphics().circle(0, 0, strong ? 3 : 2).fill({ color: i % 2 ? 0xffffff : color, alpha: 0.92 });
      spark.rotation = (Math.PI * 2 * i) / count;
      sparks.push(spark);
      container.addChild(spark);
    }
    this.fxLayer.addChild(container);
    this.animate(strong ? 0.46 : 0.32, (t) => {
      ring.alpha = 1 - t;
      ring.scale.set(0.55 + t * 1.4);
      sparks.forEach((spark, index) => {
        const angle = (Math.PI * 2 * index) / count;
        const dist = (strong ? 42 : 28) * t;
        spark.position.set(Math.cos(angle) * dist, Math.sin(angle) * dist);
        spark.alpha = 1 - t;
      });
    }, () => container.destroy());
  }

  private floatText(text: string, x: number, y: number, color: number) {
    if (!this.app) return;
    const pos = isoToScreen(x, y);
    const label = new Text({
      text,
      style: {
        fill: color,
        fontFamily: 'Arial',
        fontSize: text.includes('CRIT') ? 20 : 17,
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
    document.body.classList.remove('screen-shake');
    void document.body.offsetWidth;
    document.body.classList.add('screen-shake');
    window.setTimeout(() => document.body.classList.remove('screen-shake'), 220);
  }

  private hitStop(duration: number) {
    if (!this.app) return;
    window.clearTimeout(this.hitStopTimer);
    this.app.ticker.speed = 0.18;
    this.hitStopTimer = window.setTimeout(() => {
      if (this.app) this.app.ticker.speed = 1;
    }, duration * 1000);
  }

  private animate(duration: number, onUpdate: (t: number) => void, onDone?: () => void) {
    if (!this.app) return;
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
      targetHpPercent: target ? clamp(target.hp / target.def.stats.hp, 0, 1) : 0,
      log: this.log,
      online: this.saveService.isOnline(),
      userLabel: this.saveService.userLabel(),
      skills: this.createSkillSnapshots(),
      cardSetEffects: this.activeCardSetEffects()
    };
  }

  private mustTexture(key: TextureKey) {
    const texture = this.textures.get(key);
    if (!texture) throw new Error(`Missing texture ${key}`);
    return texture;
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
