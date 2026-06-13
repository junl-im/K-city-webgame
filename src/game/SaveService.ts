import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';
import { SAVE_VERSION, cards, classes, expToNext, items, pledgeExpToNext, skills, souls, storyQuests } from '../data/gameData';
import type { AutoHuntSettings, CharacterClassId, CharacterGender, DailyProgress, EquipmentSlot, MonsterId, PlayerSave, PledgeState, SaveRoster, StoryProgress } from '../types';
import { uid } from './math';


type FirebaseSdk119 = {
  initializeApp: typeof import('firebase/app').initializeApp;
  getAnalytics: typeof import('firebase/analytics').getAnalytics;
  isAnalyticsSupported: typeof import('firebase/analytics').isSupported;
  getAuth: typeof import('firebase/auth').getAuth;
  GoogleAuthProvider: typeof import('firebase/auth').GoogleAuthProvider;
  onAuthStateChanged: typeof import('firebase/auth').onAuthStateChanged;
  signInAnonymously: typeof import('firebase/auth').signInAnonymously;
  signInWithPopup: typeof import('firebase/auth').signInWithPopup;
  signOut: typeof import('firebase/auth').signOut;
  doc: typeof import('firebase/firestore').doc;
  getDoc: typeof import('firebase/firestore').getDoc;
  getFirestore: typeof import('firebase/firestore').getFirestore;
  serverTimestamp: typeof import('firebase/firestore').serverTimestamp;
  setDoc: typeof import('firebase/firestore').setDoc;
};

let firebaseSdkPromise119: Promise<FirebaseSdk119> | null = null;

function timeout119<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(label)), ms);
    promise.then((value) => {
      window.clearTimeout(timer);
      resolve(value);
    }).catch((error) => {
      window.clearTimeout(timer);
      reject(error);
    });
  });
}

function loadFirebaseSdk119(): Promise<FirebaseSdk119> {
  if (!firebaseSdkPromise119) {
    firebaseSdkPromise119 = Promise.all([
      import('firebase/app'),
      import('firebase/analytics'),
      import('firebase/auth'),
      import('firebase/firestore')
    ]).then(([app, analytics, auth, firestore]) => ({
      initializeApp: app.initializeApp,
      getAnalytics: analytics.getAnalytics,
      isAnalyticsSupported: analytics.isSupported,
      getAuth: auth.getAuth,
      GoogleAuthProvider: auth.GoogleAuthProvider,
      onAuthStateChanged: auth.onAuthStateChanged,
      signInAnonymously: auth.signInAnonymously,
      signInWithPopup: auth.signInWithPopup,
      signOut: auth.signOut,
      doc: firestore.doc,
      getDoc: firestore.getDoc,
      getFirestore: firestore.getFirestore,
      serverTimestamp: firestore.serverTimestamp,
      setDoc: firestore.setDoc
    }));
  }
  return firebaseSdkPromise119;
}

const LEGACY_SAVE_KEY = 'sol-online-alpha-save-v1';
const ROSTER_KEY = 'sol-online-alpha-roster-v1';
export const MAX_CHARACTER_SLOTS = 4;

const equipmentSlots: EquipmentSlot[] = ['weapon', 'armor', 'relic'];

export class SaveService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private user: User | null = null;
  private cloudWritePausedUntil = 0;
  private lastCloudWriteError = '';

  async init() {
    try {
      const sdk = await timeout119(loadFirebaseSdk119(), 2200, 'Firebase SDK 로딩 지연');
      this.app = sdk.initializeApp(firebaseConfig);
      this.auth = sdk.getAuth(this.app);
      this.db = sdk.getFirestore(this.app);

      sdk.isAnalyticsSupported()
        .then((supported) => {
          if (supported && this.app) sdk.getAnalytics(this.app);
        })
        .catch(() => undefined);

      await timeout119(new Promise<void>((resolve) => {
        if (!this.auth) return resolve();
        const off = sdk.onAuthStateChanged(this.auth, (user) => {
          this.user = user;
          off();
          resolve();
        });
      }), 1200, 'Firebase Auth 상태 확인 지연');
    } catch (error) {
      this.app = null;
      this.auth = null;
      this.db = null;
      this.user = null;
      console.warn('[Firebase] init skipped, local save only', error);
    }
  }

  isOnline() {
    return Boolean(this.user && this.db);
  }

  userLabel() {
    if (!this.user) return '로컬';
    return this.user.displayName || this.user.email || '게스트 클라우드';
  }

  getUser() {
    return this.user;
  }

  async loginGoogle() {
    if (!this.auth) await this.init();
    if (!this.auth) throw new Error('Firebase 연결이 지연되어 로컬 저장으로 먼저 진행하세요.');
    const sdk = await loadFirebaseSdk119();
    try {
      const result = await timeout119(sdk.signInWithPopup(this.auth, new sdk.GoogleAuthProvider()), 9000, 'Google 로그인 응답 지연');
      this.user = result.user;
      return result.user;
    } catch (error) {
      this.user = null;
      throw error instanceof Error ? error : new Error('Google 로그인 실패');
    }
  }

  async loginGuest() {
    if (!this.auth) await this.init();
    if (!this.auth) {
      this.user = null;
      return null;
    }
    const sdk = await loadFirebaseSdk119();
    try {
      const result = await timeout119(sdk.signInAnonymously(this.auth), 4200, '게스트 클라우드 응답 지연');
      this.user = result.user;
      return result.user;
    } catch (error) {
      // 1.30: 게스트 접속은 네트워크 실패 때문에 막히면 안 된다.
      // Firebase가 지연되면 로컬 게스트로 먼저 진행하고, 이후 저장은 로컬 모드로 유지한다.
      this.user = null;
      this.cloudWritePausedUntil = Date.now() + 45000;
      this.lastCloudWriteError = error instanceof Error ? error.message : 'Guest cloud login deferred';
      console.warn('[Firebase] guest login deferred, local guest mode enabled', error);
      return null;
    }
  }

  async logout() {
    if (!this.auth) return;
    const sdk = await loadFirebaseSdk119();
    await sdk.signOut(this.auth);
    this.user = null;
  }

  loadLocalRoster(): PlayerSave[] {
    return this.readRoster().saves;
  }

  loadLocal(): PlayerSave | null {
    const roster = this.readRoster();
    if (!roster.saves.length) return null;
    const active = roster.saves.find((save) => save.saveId === roster.activeSaveId);
    return active || roster.saves[0];
  }

  setActiveSave(saveId: string) {
    const roster = this.readRoster();
    if (!roster.saves.some((save) => save.saveId === saveId)) return;
    this.writeRoster({ ...roster, activeSaveId: saveId, updatedAt: Date.now() });
  }

  saveLocal(save: PlayerSave) {
    const normalized = this.validateSave({ ...save, updatedAt: Date.now() });
    const roster = this.readRoster();
    const existingIndex = roster.saves.findIndex((entry) => entry.saveId === normalized.saveId);
    const nextSaves = [...roster.saves];
    if (existingIndex >= 0) nextSaves[existingIndex] = normalized;
    else nextSaves.push(normalized);
    this.writeRoster({ version: SAVE_VERSION, activeSaveId: normalized.saveId, saves: nextSaves.slice(0, MAX_CHARACTER_SLOTS), updatedAt: Date.now() });
    localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(normalized));
  }

  deleteLocalSave(saveId: string) {
    const roster = this.readRoster();
    const nextSaves = roster.saves.filter((save) => save.saveId !== saveId);
    const activeSaveId = roster.activeSaveId === saveId ? nextSaves[0]?.saveId || null : roster.activeSaveId;
    this.writeRoster({ version: SAVE_VERSION, activeSaveId, saves: nextSaves, updatedAt: Date.now() });
    if (activeSaveId) {
      const active = nextSaves.find((save) => save.saveId === activeSaveId);
      if (active) localStorage.setItem(LEGACY_SAVE_KEY, JSON.stringify(active));
    } else {
      localStorage.removeItem(LEGACY_SAVE_KEY);
    }
  }

  async loadCloud(): Promise<PlayerSave | null> {
    const roster = await this.loadCloudRoster();
    if (!roster.length) return null;
    const ref = await this.readCloudDoc();
    const activeId = ref?.activeSaveId || ref?.save?.saveId;
    return roster.find((save) => save.saveId === activeId) || roster.sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }

  async loadCloudRoster(): Promise<PlayerSave[]> {
    const cloud = await this.readCloudDoc();
    if (!cloud) return [];
    if (Array.isArray(cloud.saves)) return cloud.saves.map((save) => this.migrate(save)).slice(0, MAX_CHARACTER_SLOTS);
    if (cloud.save) return [this.migrate(cloud.save)];
    return [];
  }

  async saveCloud(save: PlayerSave, power: number): Promise<boolean> {
    if (!this.db || !this.user) return false;
    if (Date.now() < this.cloudWritePausedUntil) return false;

    try {
      const normalized = this.validateSave({ ...save, updatedAt: Date.now() });
      const roster = this.readRoster();
      const saves = roster.saves.some((entry) => entry.saveId === normalized.saveId)
        ? roster.saves.map((entry) => (entry.saveId === normalized.saveId ? normalized : entry))
        : [...roster.saves, normalized];

      const sdk = await loadFirebaseSdk119();
      await timeout119(sdk.setDoc(
        sdk.doc(this.db, 'users', this.user.uid),
        {
          uid: this.user.uid,
          name: normalized.name,
          classId: normalized.classId,
          level: normalized.level,
          save: normalized,
          saves: saves.slice(0, MAX_CHARACTER_SLOTS),
          activeSaveId: normalized.saveId,
          updatedAt: sdk.serverTimestamp()
        },
        { merge: true }
      ), 3200, 'Cloud save write timeout');

      await timeout119(sdk.setDoc(
        sdk.doc(this.db, 'rankings', this.user.uid),
        {
          uid: this.user.uid,
          name: normalized.name,
          level: normalized.level,
          classId: normalized.classId,
          power,
          updatedAt: sdk.serverTimestamp()
        },
        { merge: true }
      ), 3200, 'Ranking write timeout');

      this.lastCloudWriteError = '';
      return true;
    } catch (error) {
      this.cloudWritePausedUntil = Date.now() + 30000;
      this.lastCloudWriteError = error instanceof Error ? error.message : 'Cloud save failed';
      console.warn('[Firebase] cloud save paused for 30s', error);
      return false;
    }
  }

  getCloudWriteStatus() {
    return {
      paused: Date.now() < this.cloudWritePausedUntil,
      lastError: this.lastCloudWriteError
    };
  }

  createSave(name: string, classId: CharacterClassId, gender: CharacterGender = 'male'): PlayerSave {
    const base = classes[classId] ?? classes.warrior;
    const starterWeaponUid = uid('item');
    const starterArmorUid = uid('item');
    return {
      version: SAVE_VERSION,
      saveId: uid('save'),
      name: name.trim().slice(0, 12) || '솔마스터',
      classId: base.id,
      gender,
      level: 1,
      exp: 0,
      gold: 120,
      gems: 20,
      hp: base.baseStats.hp,
      mp: base.baseStats.mp,
      x: 8.0,
      y: 8.2,
      kills: this.emptyKillRecord(),
      cards: [
        { uid: uid('card'), cardId: classId === 'taoist' ? 'card-rune-taoist' : 'card-soul-knight', level: 1, copies: 1, equipped: true },
        { uid: uid('card'), cardId: 'card-slime', level: 1, copies: 1, equipped: true }
      ],
      inventory: [
        { uid: starterWeaponUid, itemId: classId === 'taoist' ? 'rune-staff' : 'iron-sword', count: 1 },
        { uid: starterArmorUid, itemId: 'leather-armor', count: 1 },
        { uid: uid('item'), itemId: 'hp-potion-small', count: 30 },
        { uid: uid('item'), itemId: 'mp-potion-small', count: 18 }
      ],
      equipment: {
        weapon: starterWeaponUid,
        armor: starterArmorUid
      },
      enhancements: {},
      souls: souls.map((soul) => ({ soulId: soul.id, unlocked: false, progress: 0 })),
      daily: this.createDailyProgress(),
      story: this.createStoryProgress(),
      autoHunt: false,
      autoSettings: this.defaultAutoSettings(),
      learnedSkillIds: [],
      skillLevels: {},
      sleepMode: false,
      lawful: 0,
      pledge: this.defaultPledgeState(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  validateSave(save: PlayerSave) {
    const classId = save.classId && classes[save.classId] ? save.classId : 'warrior';
    save.version = SAVE_VERSION;
    save.saveId ||= uid('save');
    save.classId = classId;
    save.gender = save.gender === 'female' ? 'female' : 'male';
    save.name = (save.name || '솔마스터').trim().slice(0, 12) || '솔마스터';
    save.hp = Math.max(1, Math.min(save.hp || classes[classId].baseStats.hp, 999999));
    save.mp = Math.max(0, Math.min(save.mp || classes[classId].baseStats.mp, 999999));
    save.level = Math.max(1, Math.min(save.level || 1, 160));
    save.gold = Math.max(0, save.gold || 0);
    save.gems = Math.max(0, save.gems || 0);
    save.x = Number.isFinite(save.x) ? save.x : 8.0;
    save.y = Number.isFinite(save.y) ? save.y : 8.2;
    save.createdAt ||= Date.now();
    save.updatedAt ||= Date.now();
    const kills = save.kills || {};
    save.kills = {
      slime: kills.slime || 0,
      wolf: kills.wolf || 0,
      goblin: kills.goblin || 0,
      crystalBear: kills.crystalBear || 0,
      dragon: kills.dragon || 0,
      shadowImp: kills.shadowImp || 0,
      mossGolem: kills.mossGolem || 0,
      wraith: kills.wraith || 0,
      fireDrake: kills.fireDrake || 0,
      stormHarpy: kills.stormHarpy || 0,
      graveKnight: kills.graveKnight || 0,
      fieldBoss: kills.fieldBoss || 0,
      orcBerserker: kills.orcBerserker || 0,
      nightmareBat: kills.nightmareBat || 0,
      lavaGolem: kills.lavaGolem || 0,
      iceWitch: kills.iceWitch || 0,
      royalGuard: kills.royalGuard || 0,
      riftBeast: kills.riftBeast || 0
    };
    save.cards = Array.isArray(save.cards) ? save.cards : [];
    save.inventory = Array.isArray(save.inventory) ? save.inventory : [];
    save.equipment = this.normalizeEquipment(save);
    save.enhancements = this.normalizeEnhancements(save);
    save.souls = souls.map((soul) => {
      const old = save.souls?.find((entry) => entry.soulId === soul.id);
      return old || { soulId: soul.id, unlocked: false, progress: save.kills?.[soul.monsterId as MonsterId] || 0 };
    });
    save.daily = this.normalizeDailyProgress(save.daily);
    save.story = this.normalizeStoryProgress(save.story);
    save.autoSettings = this.normalizeAutoSettings(save.autoSettings);
    save.learnedSkillIds = this.normalizeLearnedSkills(save.learnedSkillIds, save.classId);
    save.skillLevels = this.normalizeSkillLevels(save.skillLevels, save.learnedSkillIds, save.classId);
    save.sleepMode = Boolean(save.sleepMode);
    save.lawful = Math.max(-32768, Math.min(32767, Math.round(Number(save.lawful ?? 0))));
    save.pledge = this.normalizePledgeState(save.pledge);
    while (save.exp >= expToNext(save.level)) {
      save.exp -= expToNext(save.level);
      save.level += 1;
    }
    return save;
  }

  private async readCloudDoc(): Promise<Record<string, any> | null> {
    if (!this.db || !this.user) return null;
    const sdk = await loadFirebaseSdk119();
    const ref = sdk.doc(this.db, 'users', this.user.uid);
    const snap = await timeout119(sdk.getDoc(ref), 2600, 'Cloud save read timeout');
    return snap.exists() ? snap.data() : null;
  }

  private readRoster(): SaveRoster {
    try {
      const raw = localStorage.getItem(ROSTER_KEY);
      if (raw) return this.migrateRoster(JSON.parse(raw));
    } catch (error) {
      console.warn('[Save] roster load failed', error);
    }

    const legacy = this.readLegacySave();
    const roster = this.migrateRoster({ version: SAVE_VERSION, activeSaveId: legacy?.saveId || null, saves: legacy ? [legacy] : [], updatedAt: Date.now() });
    this.writeRoster(roster);
    return roster;
  }

  private writeRoster(roster: SaveRoster) {
    const migrated = this.migrateRoster(roster);
    localStorage.setItem(ROSTER_KEY, JSON.stringify(migrated));
  }

  private migrateRoster(raw: Partial<SaveRoster>): SaveRoster {
    const saves = Array.isArray(raw.saves) ? raw.saves.map((save) => this.migrate(save)).slice(0, MAX_CHARACTER_SLOTS) : [];
    const deduped = Array.from(new Map(saves.map((save) => [save.saveId, save])).values()).sort((a, b) => b.updatedAt - a.updatedAt);
    const activeSaveId = raw.activeSaveId && deduped.some((save) => save.saveId === raw.activeSaveId)
      ? raw.activeSaveId
      : deduped[0]?.saveId || null;
    return {
      version: SAVE_VERSION,
      activeSaveId,
      saves: deduped,
      updatedAt: raw.updatedAt || Date.now()
    };
  }

  private readLegacySave(): PlayerSave | null {
    try {
      const raw = localStorage.getItem(LEGACY_SAVE_KEY);
      if (!raw) return null;
      return this.migrate(JSON.parse(raw));
    } catch (error) {
      console.warn('[Save] legacy load failed', error);
      return null;
    }
  }

  private migrate(raw: Partial<PlayerSave>): PlayerSave {
    const classId = raw.classId && classes[raw.classId] ? raw.classId : 'warrior';
    const gender = raw.gender === 'female' ? 'female' : 'male';
    const fresh = this.createSave(raw.name || '솔마스터', classId, gender);
    const migrated: PlayerSave = {
      ...fresh,
      ...raw,
      version: SAVE_VERSION,
      saveId: raw.saveId || fresh.saveId,
      classId,
      gender,
      kills: { ...fresh.kills, ...(raw.kills || {}) },
      cards: Array.isArray(raw.cards) && raw.cards.length ? raw.cards : fresh.cards,
      inventory: Array.isArray(raw.inventory) && raw.inventory.length ? raw.inventory : fresh.inventory,
      equipment: raw.equipment || fresh.equipment,
      enhancements: this.normalizeEnhancements(raw),
      daily: this.normalizeDailyProgress(raw.daily),
      story: this.normalizeStoryProgress(raw.story),
      autoSettings: this.normalizeAutoSettings(raw.autoSettings),
      learnedSkillIds: this.normalizeLearnedSkills(raw.learnedSkillIds, classId),
      skillLevels: this.normalizeSkillLevels(raw.skillLevels, this.normalizeLearnedSkills(raw.learnedSkillIds, classId), classId),
      sleepMode: Boolean(raw.sleepMode),
      pledge: this.normalizePledgeState(raw.pledge),
      souls: souls.map((soul) => {
        const old = raw.souls?.find((entry) => entry.soulId === soul.id);
        return old || { soulId: soul.id, unlocked: false, progress: raw.kills?.[soul.monsterId as MonsterId] || 0 };
      })
    };

    for (const card of migrated.cards) {
      if (!cards.some((def) => def.id === card.cardId)) card.cardId = 'card-slime';
      card.level = Math.max(1, card.level || 1);
      card.copies = Math.max(1, card.copies || 1);
      card.uid ||= uid('card');
    }

    for (const item of migrated.inventory) {
      if (!items.some((def) => def.id === item.itemId)) item.itemId = 'soul-shard';
      item.count = Math.max(1, item.count || 1);
      item.uid ||= uid('item');
    }

    if (!raw.version || raw.version < 2) {
      migrated.x = fresh.x;
      migrated.y = fresh.y;
      migrated.autoHunt = false;
    }

    return this.validateSave(migrated);
  }


  private createDailyProgress(): DailyProgress {
    return {
      dateKey: this.todayKey(),
      kills: this.emptyKillRecord(),
      claimedQuestIds: []
    };
  }

  private createStoryProgress(raw?: Partial<StoryProgress>): StoryProgress {
    const first = storyQuests[0]?.id || '';
    return this.normalizeStoryProgress(raw || { activeQuestId: first, completedQuestIds: [], claimedQuestIds: [] });
  }

  private normalizeStoryProgress(raw?: Partial<StoryProgress>): StoryProgress {
    const validIds = new Set(storyQuests.map((quest) => quest.id));
    const claimedQuestIds = Array.isArray(raw?.claimedQuestIds)
      ? Array.from(new Set(raw.claimedQuestIds.filter((id) => validIds.has(id))))
      : [];
    const completedQuestIds = Array.isArray(raw?.completedQuestIds)
      ? Array.from(new Set(raw.completedQuestIds.filter((id) => validIds.has(id))))
      : [];
    const firstUnclaimed = storyQuests.find((quest) => !claimedQuestIds.includes(quest.id));
    const activeQuestId = raw?.activeQuestId && validIds.has(raw.activeQuestId) && !claimedQuestIds.includes(raw.activeQuestId)
      ? raw.activeQuestId
      : firstUnclaimed?.id || storyQuests.at(-1)?.id || '';
    return { activeQuestId, completedQuestIds, claimedQuestIds };
  }

  private normalizeDailyProgress(raw?: Partial<DailyProgress>): DailyProgress {
    const today = this.todayKey();
    if (!raw || raw.dateKey !== today) return this.createDailyProgress();
    return {
      dateKey: today,
      kills: { ...this.emptyKillRecord(), ...(raw.kills || {}) },
      claimedQuestIds: Array.isArray(raw.claimedQuestIds) ? Array.from(new Set(raw.claimedQuestIds)) : []
    };
  }

  private emptyKillRecord(): Record<MonsterId, number> {
    return {
      slime: 0,
      wolf: 0,
      goblin: 0,
      crystalBear: 0,
      dragon: 0,
      shadowImp: 0,
      mossGolem: 0,
      wraith: 0,
      fireDrake: 0,
      stormHarpy: 0,
      graveKnight: 0,
      fieldBoss: 0,
      orcBerserker: 0,
      nightmareBat: 0,
      lavaGolem: 0,
      iceWitch: 0,
      royalGuard: 0,
      riftBeast: 0
    };
  }


  private defaultPledgeState(): PledgeState {
    return {
      name: '루미나 혈맹',
      level: 1,
      exp: 0,
      contribution: 0,
      crest: 'lion',
      donatedGold: 0,
      claimedTaskIds: []
    };
  }

  private normalizePledgeState(raw?: Partial<PledgeState>): PledgeState {
    const base = this.defaultPledgeState();
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const crest = source.crest === 'dragon' || source.crest === 'moon' || source.crest === 'lion' ? source.crest : base.crest;
    const next: PledgeState = {
      name: String(source.name || base.name).trim().slice(0, 14) || base.name,
      level: Math.max(1, Math.min(20, Math.floor(Number(source.level || base.level)))),
      exp: Math.max(0, Math.floor(Number(source.exp || 0))),
      contribution: Math.max(0, Math.floor(Number(source.contribution || 0))),
      crest,
      donatedGold: Math.max(0, Math.floor(Number(source.donatedGold || 0))),
      claimedTaskIds: Array.isArray(source.claimedTaskIds) ? Array.from(new Set(source.claimedTaskIds.filter((id): id is string => typeof id === 'string'))) : []
    };
    while (next.level < 20 && next.exp >= pledgeExpToNext(next.level)) {
      next.exp -= pledgeExpToNext(next.level);
      next.level += 1;
    }
    return next;
  }


  private defaultAutoSettings(): AutoHuntSettings {
    return {
      useSkills: true,
      useHpPotion: true,
      useMpPotion: true,
      hpPotionRatio: 0.42,
      mpPotionRatio: 0.28,
      bossPriority: false
    };
  }

  private normalizeAutoSettings(raw: unknown): AutoHuntSettings {
    const base = this.defaultAutoSettings();
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Partial<AutoHuntSettings> : {};
    return {
      useSkills: typeof source.useSkills === 'boolean' ? source.useSkills : base.useSkills,
      useHpPotion: typeof source.useHpPotion === 'boolean' ? source.useHpPotion : base.useHpPotion,
      useMpPotion: typeof source.useMpPotion === 'boolean' ? source.useMpPotion : base.useMpPotion,
      hpPotionRatio: this.clampRatio(Number(source.hpPotionRatio), base.hpPotionRatio, 0.18, 0.72),
      mpPotionRatio: this.clampRatio(Number(source.mpPotionRatio), base.mpPotionRatio, 0.12, 0.62),
      bossPriority: typeof source.bossPriority === 'boolean' ? source.bossPriority : base.bossPriority
    };
  }

  private clampRatio(value: number, fallback: number, min: number, max: number) {
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
  }

  private normalizeLearnedSkills(raw: unknown, classId: CharacterClassId): string[] {
    const valid = new Set(['warrior-basic', 'warrior-guard', 'warrior-cleave', 'taoist-basic', 'taoist-orb', 'taoist-rain', 'cleric-basic', 'cleric-shield', 'cleric-nova']);
    const classPrefix = classId === 'warrior' ? 'warrior' : classId === 'taoist' ? 'taoist' : 'cleric';
    const list = Array.isArray(raw) ? raw : [];
    return Array.from(new Set(list.filter((id): id is string => typeof id === 'string' && valid.has(id) && id.startsWith(classPrefix))));
  }

  private normalizeSkillLevels(raw: unknown, learnedSkillIds: string[], classId: CharacterClassId): Record<string, number> {
    const validIds = new Set(skills.filter((skill) => skill.classId === classId).map((skill) => skill.id));
    const learned = new Set(learnedSkillIds.filter((id) => validIds.has(id)));
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
    const next: Record<string, number> = {};
    for (const id of learned) {
      const rawLevel = Number(source[id]);
      next[id] = Math.max(1, Math.min(5, Math.floor(Number.isFinite(rawLevel) ? rawLevel : 1)));
    }
    return next;
  }

  private todayKey() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeEnhancements(save: Partial<PlayerSave>): Record<string, number> {
    const raw = save.enhancements || {};
    const validUids = new Set((save.inventory || []).map((item) => item.uid).filter(Boolean));
    const next: Record<string, number> = {};
    for (const [uidValue, level] of Object.entries(raw)) {
      if (!validUids.has(uidValue)) continue;
      next[uidValue] = Math.max(0, Math.min(20, Math.floor(Number(level) || 0)));
    }
    return next;
  }

  private normalizeEquipment(save: PlayerSave) {
    const next = { ...(save.equipment || {}) };
    for (const slot of equipmentSlots) {
      const uidForSlot = next[slot];
      const found = uidForSlot ? save.inventory.find((entry) => entry.uid === uidForSlot) : null;
      const def = found ? items.find((item) => item.id === found.itemId) : null;
      if (!found || !def || def.type !== slot) delete next[slot];
    }

    for (const slot of equipmentSlots) {
      if (next[slot]) continue;
      const candidate = save.inventory.find((entry) => items.find((item) => item.id === entry.itemId)?.type === slot);
      if (candidate) next[slot] = candidate.uid;
    }
    return next;
  }
}
