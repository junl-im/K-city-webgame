import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import {
  MAP_H,
  MAP_W,
  cards,
  classes,
  expToNext,
  items,
  monsters,
  souls,
  spawnTable,
  villageProps,
  worldMap
} from '../data/gameData';
import { textureUrls } from '../data/assetManifest';
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
import { clamp, distance, formatNumber, normalize, roll, uid } from './math';
import { SaveService } from './SaveService';

type MobView = {
  root: Container;
  body: Sprite;
  hpFill: Graphics;
  name: Text;
  baseScale: number;
};

type TextureKey = keyof typeof textureUrls;

type SolGameOptions = {
  zoneName?: string;
};

const tileTextureKey: Record<TileId, TextureKey> = {
  grass: 'tileGrass',
  stone: 'tileStone',
  water: 'tileWater',
  portal: 'tilePortal'
};

export class SolGame {
  private app: Application | null = null;
  private world = new Container();
  private mapLayer = new Container();
  private propLayer = new Container();
  private entityLayer = new Container();
  private fxLayer = new Container();
  private playerRoot = new Container();
  private playerBody: Sprite | null = null;
  private playerShadow: Graphics | null = null;
  private textures = new Map<string, Texture>();
  private mobs: WorldMob[] = [];
  private mobViews = new Map<string, MobView>();
  private target: WorldMob | null = null;
  private moveTarget: { x: number; y: number } | null = null;
  private joystick = { x: 0, y: 0 };
  private attackCooldown = 0;
  private regenTick = 0;
  private dirtyTimer = 0;
  private cloudTimer = 0;
  private manualMoveLock = 0;
  private time = 0;
  private lastMoving = false;
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
    this.world.addChild(this.mapLayer, this.propLayer, this.entityLayer, this.fxLayer);
    this.app.stage.addChild(this.world);

    await this.loadTextures();
    this.buildMap();
    this.spawnMobs();
    this.ensurePlayerSafePosition();
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
    this.pushLog(enabled ? '자동사냥 시작' : '자동사냥 정지');
    this.markDirty();
  }

  manualAttack() {
    if (!this.target || !this.target.alive) this.target = this.findNearestMob();
    if (this.target) this.tryPlayerAttack(this.target, true);
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

  equipItem(itemUid: string) {
    const entry = this.save.inventory.find((item) => item.uid === itemUid);
    if (!entry) return;
    const def = items.find((item) => item.id === entry.itemId);
    if (!def || def.type === 'material') {
      this.pushLog('재료 아이템은 장착할 수 없습니다.');
      this.emit();
      return;
    }
    const slot = def.type as EquipmentSlot;
    this.save.equipment ||= {};
    if (this.save.equipment[slot] === entry.uid) {
      delete this.save.equipment[slot];
      this.pushLog(`${def.name} 장착 해제`);
    } else {
      this.save.equipment[slot] = entry.uid;
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
    const entries = Object.entries(textureUrls);
    await Promise.all(
      entries.map(async ([key, url]) => {
        const texture = await Assets.load<Texture>(url);
        this.textures.set(key, texture);
      })
    );
  }

  private buildMap() {
    this.mapLayer.removeChildren();
    this.propLayer.removeChildren();

    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const tile = worldMap[y][x];
        const sprite = new Sprite(this.mustTexture(tileTextureKey[tile]));
        const pos = isoToScreen(x, y);
        sprite.anchor.set(0.5, 0.5);
        sprite.position.set(pos.x, pos.y);
        this.mapLayer.addChild(sprite);
      }
    }

    this.addVillageDecor();

    const trees = [
      [3, 7],
      [4, 14],
      [14, 6],
      [7, 16],
      [17, 14]
    ];
    for (const [x, y] of trees) this.addProp('propTree', x, y, 0.72);

    const crystals = [
      [12, 12],
      [16, 16],
      [11, 5],
      [18, 10]
    ];
    for (const [x, y] of crystals) this.addProp('propCrystal', x, y, 0.66);
  }

  private addVillageDecor() {
    const ring = new Graphics()
      .ellipse(0, 0, 168, 70)
      .fill({ color: 0x1f2c2c, alpha: 0.26 })
      .ellipse(0, 0, 118, 48)
      .stroke({ color: 0xe2b95f, alpha: 0.22, width: 3 });
    const center = isoToScreen(8, 8);
    ring.position.set(center.x, center.y + 8);
    this.mapLayer.addChild(ring);

    for (const prop of villageProps) {
      this.addProp(prop.type === 'tree' ? 'propTree' : 'propCrystal', prop.x, prop.y, prop.scale);
    }

    const labels = [
      { text: '마을', x: 8.1, y: 7.15, color: 0xe2b95f },
      { text: '수정숲', x: 12.6, y: 8.0, color: 0x72e7ff },
      { text: '고블린 길목', x: 12.0, y: 13.2, color: 0xf5d18a }
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

  private addProp(textureKey: TextureKey, x: number, y: number, scale: number) {
    const sprite = new Sprite(this.mustTexture(textureKey));
    const pos = isoToScreen(x, y);
    sprite.anchor.set(0.5, 0.92);
    sprite.scale.set(scale);
    sprite.position.set(pos.x, pos.y + 14);
    this.propLayer.addChild(sprite);
  }

  private spawnMobs() {
    this.mobs = spawnTable.map((spawn, index) => {
      const def = monsters.find((monster) => monster.id === spawn.monsterId);
      if (!def) throw new Error(`Missing monster ${spawn.monsterId}`);
      const safe = this.findSafeMobPosition(spawn.x, spawn.y, 1.35);
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
        attackCooldown: Math.random() * 1.2
      };
    });

    for (const mob of this.mobs) this.buildMobView(mob);
  }

  private buildPlayer() {
    const klass = classes[this.save.classId];
    this.playerRoot.removeChildren();

    this.playerShadow = new Graphics().ellipse(0, 0, 24, 9).fill({ color: 0x000000, alpha: 0.3 });
    this.playerBody = new Sprite(this.mustTexture(this.classTextureKey()));
    this.playerBody.anchor.set(0.5, 0.94);
    this.playerBody.scale.set(0.62);

    const aura = new Graphics().circle(0, -26, 26).stroke({ color: klass.accent, alpha: 0.22, width: 2 });

    const name = new Text({
      text: this.save.name,
      style: {
        fill: 0xf5f1e8,
        fontFamily: 'Arial',
        fontSize: 13,
        fontWeight: '800',
        stroke: { color: 0x111111, width: 4 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -74;

    const badge = new Text({
      text: `${klass.name} · ${klass.skillName}`,
      style: {
        fill: klass.accent,
        fontFamily: 'Arial',
        fontSize: 10,
        fontWeight: '900',
        stroke: { color: 0x111111, width: 3 }
      }
    });
    badge.anchor.set(0.5, 1);
    badge.position.y = -90;

    this.playerRoot.addChild(this.playerShadow, aura, this.playerBody, name, badge);
    if (!this.entityLayer.children.includes(this.playerRoot)) this.entityLayer.addChild(this.playerRoot);
    this.placeEntity(this.playerRoot, this.save.x, this.save.y);
  }

  private buildMobView(mob: WorldMob) {
    const root = new Container();
    const shadow = new Graphics().ellipse(0, 0, 24, 9).fill({ color: 0x000000, alpha: 0.28 });
    const body = new Sprite(this.mustTexture(this.monsterTextureKey(mob.def.id)));
    const baseScale = mob.def.id === 'dragon' ? 0.76 : 0.58;
    body.anchor.set(0.5, 0.92);
    body.scale.set(baseScale);

    const hpBack = new Graphics().roundRect(-30, -70, 60, 6, 2).fill({ color: 0x151515, alpha: 0.72 });
    const hpFill = new Graphics().roundRect(-30, -70, 60, 6, 2).fill({ color: 0xd95757, alpha: 0.95 });

    const name = new Text({
      text: mob.def.name,
      style: {
        fill: mob.def.id === 'dragon' ? 0xffd15f : 0xf5f1e8,
        fontFamily: 'Arial',
        fontSize: mob.def.id === 'dragon' ? 13 : 11,
        fontWeight: '800',
        stroke: { color: 0x111111, width: 4 }
      }
    });
    name.anchor.set(0.5, 1);
    name.position.y = -74;

    root.addChild(shadow, body, hpBack, hpFill, name);
    this.entityLayer.addChild(root);
    this.mobViews.set(mob.uid, { root, body, hpFill, name, baseScale });
    this.placeEntity(root, mob.x, mob.y);
  }

  private bindCanvasInput() {
    if (!this.app) return;
    this.app.canvas.addEventListener('pointerdown', (event) => {
      const target = event.target as HTMLElement;
      if (!target || target.closest('.hud-top, .action-dock, .sheet, .joystick, .login-screen')) return;
      const rect = this.app?.canvas.getBoundingClientRect();
      if (!rect) return;
      const sx = event.clientX - rect.left - this.world.x;
      const sy = event.clientY - rect.top - this.world.y;
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
    if (moving) {
      const dir = normalize(vx, vy);
      const nextX = this.save.x + dir.x * stats.move * dt;
      const nextY = this.save.y + dir.y * stats.move * dt;
      if (this.isWalkable(nextX, this.save.y)) this.save.x = clamp(nextX, 1, MAP_W - 2);
      if (this.isWalkable(this.save.x, nextY)) this.save.y = clamp(nextY, 1, MAP_H - 2);
      if (this.playerBody) this.playerBody.scale.x = dir.x < -0.05 ? -Math.abs(this.playerBody.scale.x) : Math.abs(this.playerBody.scale.x);
    }

    this.resolvePlayerMobOverlap();
    this.lastMoving = moving;
    this.updatePlayerAnimation(moving);
    this.placeEntity(this.playerRoot, this.save.x, this.save.y);
  }

  private updatePlayerAnimation(moving: boolean) {
    if (!this.playerBody) return;
    const bob = moving ? Math.sin(this.time * 14) * 4 : Math.sin(this.time * 3) * 1.4;
    this.playerBody.y = bob;
    const abs = Math.abs(this.playerBody.scale.x);
    const stretch = moving ? 1 + Math.sin(this.time * 14) * 0.025 : 1;
    this.playerBody.scale.y = abs * stretch;
    if (this.playerShadow) {
      const shadowScale = moving ? 1 + Math.sin(this.time * 14) * 0.05 : 1;
      this.playerShadow.scale.set(shadowScale, 1);
    }
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
    this.moveTarget = {
      x: this.save.x + dir.x * Math.min(0.75, dist),
      y: this.save.y + dir.y * Math.min(0.75, dist)
    };
  }

  private updateMobs(dt: number) {
    const stats = this.calculateStats();
    for (const mob of this.mobs) {
      const view = this.mobViews.get(mob.uid);
      if (!view) continue;

      if (!mob.alive) {
        view.root.visible = false;
        continue;
      }

      view.root.visible = true;
      mob.attackCooldown = Math.max(0, mob.attackCooldown - dt);

      const dist = distance(this.save.x, this.save.y, mob.x, mob.y);
      if (dist < 4.8 && mob.def.id !== 'dragon') {
        const dir = normalize(this.save.x - mob.x, this.save.y - mob.y);
        const nextX = mob.x + dir.x * mob.def.stats.move * dt * 0.48;
        const nextY = mob.y + dir.y * mob.def.stats.move * dt * 0.48;
        if (this.isWalkable(nextX, nextY)) {
          mob.x = clamp(nextX, 1, MAP_W - 2);
          mob.y = clamp(nextY, 1, MAP_H - 2);
        }
        view.body.scale.x = dir.x < -0.05 ? -Math.abs(view.body.scale.x) : Math.abs(view.body.scale.x);
      }

      this.resolveMobOverlap(mob);
      const attackDist = distance(this.save.x, this.save.y, mob.x, mob.y);
      if (attackDist < 1.16 && mob.attackCooldown <= 0 && this.save.hp > 0) {
        mob.attackCooldown = 1 / mob.def.stats.aspd + 0.45;
        const result = this.resolveDamage(mob.def.stats, stats, mob.def.level - this.save.level);
        this.animateMobAttack(view);
        if (result.hit) {
          this.save.hp = Math.max(0, this.save.hp - result.damage);
          this.floatText(`-${result.damage}`, this.save.x, this.save.y, 0xff7878);
          this.impactBurst(this.save.x, this.save.y, 0xff5d5d, false);
          if (this.save.hp <= 0) this.playerKnockout();
        } else {
          this.floatText('MISS', this.save.x, this.save.y, 0xd6d1c2);
        }
      }

      this.updateMobAnimation(view, mob);
      this.updateMobHp(view, mob);
      this.placeEntity(view.root, mob.x, mob.y);
    }
  }

  private updateMobAnimation(view: MobView, mob: WorldMob) {
    const phase = this.time * (mob.def.id === 'dragon' ? 2.2 : 3.5) + mob.spawnX;
    view.body.y = Math.sin(phase) * (mob.def.id === 'dragon' ? 1.6 : 2.4);
    const sx = Math.sign(view.body.scale.x || 1) * view.baseScale;
    view.body.scale.x += (sx - view.body.scale.x) * 0.08;
    view.body.scale.y += (view.baseScale - view.body.scale.y) * 0.08;
  }

  private updateRespawns() {
    const now = performance.now();
    for (const mob of this.mobs) {
      if (!mob.alive && now >= mob.respawnAt) {
        mob.alive = true;
        mob.hp = mob.def.stats.hp;
        const safe = this.findSafeMobPosition(mob.spawnX, mob.spawnY, 1.35);
        mob.x = safe.x;
        mob.y = safe.y;
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

    const stats = this.calculateStats();
    this.attackCooldown = Math.max(0.28, 1 / stats.aspd);
    const result = this.resolveDamage(stats, mob.def.stats, this.save.level - mob.def.level);
    this.animatePlayerAttack(mob, result);

    if (!result.hit) {
      this.floatText('MISS', mob.x, mob.y, 0xd6d1c2);
      return;
    }

    mob.hp = Math.max(0, mob.hp - result.damage);
    this.animateMobHit(mob);
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
    mob.respawnAt = performance.now() + mob.def.respawnMs;
    if (this.target?.uid === mob.uid) this.target = null;

    this.save.gold += mob.def.gold;
    this.save.exp += mob.def.exp;
    this.save.kills[mob.def.id] = (this.save.kills[mob.def.id] || 0) + 1;
    this.addDailyKill(mob.def.id);
    this.updateSoulProgress(mob.def.id);
    this.checkLevelUp();
    this.rollDrops(mob.def);
    this.impactBurst(mob.x, mob.y, 0xe2b95f, true);
    this.pushLog(`${mob.def.name} 정화 +${mob.def.exp}EXP +${mob.def.gold}G`);
    this.markDirty();
  }


  private addDailyKill(monsterId: MonsterId) {
    const today = this.todayKey();
    if (!this.save.daily || this.save.daily.dateKey !== today) {
      this.save.daily = {
        dateKey: today,
        kills: { slime: 0, wolf: 0, goblin: 0, crystalBear: 0, dragon: 0 },
        claimedQuestIds: []
      };
    }
    this.save.daily.kills[monsterId] = (this.save.daily.kills[monsterId] || 0) + 1;
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
      this.pushLog(`소울젬 +${drop.amount || 0}`);
      return;
    }
    if (drop.type === 'item' && drop.id) {
      const item = this.addItem(drop.id);
      if (item) this.pushLog(`${item.name} 획득`);
      return;
    }
    if (drop.type === 'card' && drop.id) {
      const card = this.addCard(drop.id);
      if (card) this.pushLog(`${card.name} 드랍`);
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

    const equippedItemIds = new Set(Object.values(this.save.equipment || {}));
    for (const entry of this.save.inventory) {
      if (!equippedItemIds.has(entry.uid)) continue;
      const def = items.find((item) => item.id === entry.itemId);
      if (!def || def.type === 'material') continue;
      this.applyBonus(stats, def.bonus, 1);
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
      this.save.x = 8.0;
      this.save.y = 8.2;
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
    return { x: 5.2, y: 12.4 };
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
    return worldMap[ty][tx] !== 'water';
  }

  private placeEntity(entity: Container, x: number, y: number) {
    const pos = isoToScreen(x, y);
    entity.position.set(pos.x, pos.y + 8);
  }

  private updateCamera() {
    if (!this.app) return;
    const pos = isoToScreen(this.save.x, this.save.y);
    const centerX = this.app.screen.width / 2;
    const centerY = this.app.screen.height * 0.48;
    this.world.x += (centerX - pos.x - this.world.x) * 0.12;
    this.world.y += (centerY - pos.y - this.world.y) * 0.12;
  }

  private sortEntities() {
    this.entityLayer.children.sort((a, b) => a.y - b.y);
    this.propLayer.children.sort((a, b) => a.y - b.y);
  }

  private updateMobHp(view: MobView, mob: WorldMob) {
    const ratio = clamp(mob.hp / mob.def.stats.hp, 0, 1);
    view.hpFill.clear().roundRect(-30, -70, 60 * ratio, 6, 2).fill({ color: 0xd95757, alpha: 0.95 });
  }

  private animateMobHit(mob: WorldMob) {
    const view = this.mobViews.get(mob.uid);
    if (!view) return;
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
    const baseY = view.body.y;
    this.animate(0.22, (t) => {
      view.body.y = baseY - Math.sin(t * Math.PI) * 8;
    }, () => {
      view.body.y = baseY;
    });
  }

  private lungePlayer(mob: WorldMob) {
    if (!this.playerBody) return;
    const dir = normalize(mob.x - this.save.x, mob.y - this.save.y);
    const sx = (dir.x - dir.y) * 14;
    const sy = (dir.x + dir.y) * 7;
    this.animate(0.16, (t) => {
      const pulse = Math.sin(t * Math.PI);
      if (this.playerBody) {
        this.playerBody.x = sx * pulse;
        this.playerBody.y = -sy * pulse;
      }
    }, () => {
      if (this.playerBody) {
        this.playerBody.x = 0;
        this.playerBody.y = 0;
      }
    });
  }

  private castPose() {
    if (!this.playerBody) return;
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
      .moveTo(-34, -16)
      .quadraticCurveTo(4, -46, 38, -12)
      .stroke({ color, alpha: 0.95, width: crit ? 8 : 6 })
      .moveTo(-24, -6)
      .quadraticCurveTo(6, -28, 28, -4)
      .stroke({ color: 0xffffff, alpha: 0.62, width: 2 });
    slash.position.set(pos.x, pos.y - 22);
    slash.rotation = -0.18;
    this.fxLayer.addChild(slash);
    this.animate(0.18, (t) => {
      slash.alpha = 1 - t;
      slash.scale.set(0.72 + t * 0.55);
      slash.rotation = -0.4 + t * 0.8;
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
    this.animate(0.28, (t) => {
      const arc = Math.sin(t * Math.PI) * 26;
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
    this.animate(0.18, (t) => {
      beam.alpha = 1 - t;
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
      userLabel: this.saveService.userLabel()
    };
  }

  private mustTexture(key: TextureKey) {
    const texture = this.textures.get(key);
    if (!texture) throw new Error(`Missing texture ${key}`);
    return texture;
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
