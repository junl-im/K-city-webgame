import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  type Auth,
  type User
} from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';
import { SAVE_VERSION, cards, classes, expToNext, souls } from '../data/gameData';
import type { CharacterClassId, MonsterId, PlayerSave } from '../types';
import { uid } from './math';

const SAVE_KEY = 'sol-online-alpha-save-v1';

export class SaveService {
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private user: User | null = null;
  private ready = false;

  async init() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      isAnalyticsSupported()
        .then((supported) => {
          if (supported && this.app) getAnalytics(this.app);
        })
        .catch(() => undefined);

      await new Promise<void>((resolve) => {
        if (!this.auth) return resolve();
        const off = onAuthStateChanged(this.auth, (user) => {
          this.user = user;
          this.ready = true;
          off();
          resolve();
        });
      });
    } catch (error) {
      console.warn('[Firebase] init failed, local save only', error);
      this.ready = true;
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
    if (!this.auth) throw new Error('Firebase Auth 초기화 실패');
    const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
    this.user = result.user;
    return result.user;
  }

  async loginGuest() {
    if (!this.auth) throw new Error('Firebase Auth 초기화 실패');
    const result = await signInAnonymously(this.auth);
    this.user = result.user;
    return result.user;
  }

  async logout() {
    if (!this.auth) return;
    await signOut(this.auth);
    this.user = null;
  }

  loadLocal(): PlayerSave | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return this.migrate(JSON.parse(raw));
    } catch (error) {
      console.warn('[Save] local load failed', error);
      return null;
    }
  }

  saveLocal(save: PlayerSave) {
    const next = { ...save, updatedAt: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
  }

  async loadCloud(): Promise<PlayerSave | null> {
    if (!this.db || !this.user) return null;
    const ref = doc(this.db, 'users', this.user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const cloud = snap.data()?.save;
    return cloud ? this.migrate(cloud) : null;
  }

  async saveCloud(save: PlayerSave, power: number) {
    if (!this.db || !this.user) return;
    const normalized = { ...save, updatedAt: Date.now() };
    await setDoc(
      doc(this.db, 'users', this.user.uid),
      {
        uid: this.user.uid,
        name: normalized.name,
        classId: normalized.classId,
        level: normalized.level,
        save: normalized,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    await setDoc(
      doc(this.db, 'rankings', this.user.uid),
      {
        uid: this.user.uid,
        name: normalized.name,
        level: normalized.level,
        classId: normalized.classId,
        power,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  }

  createSave(name: string, classId: CharacterClassId): PlayerSave {
    const base = classes[classId] ?? classes.warrior;
    return {
      version: SAVE_VERSION,
      name: name.trim().slice(0, 12) || '솔마스터',
      classId: base.id,
      level: 1,
      exp: 0,
      gold: 120,
      gems: 20,
      hp: base.baseStats.hp,
      mp: base.baseStats.mp,
      x: 7.8,
      y: 7.4,
      kills: {
        slime: 0,
        wolf: 0,
        goblin: 0,
        crystalBear: 0,
        dragon: 0
      },
      cards: [
        { uid: uid('card'), cardId: 'card-soul-knight', level: 1, copies: 1, equipped: true },
        { uid: uid('card'), cardId: 'card-slime', level: 1, copies: 1, equipped: true }
      ],
      inventory: [
        { uid: uid('item'), itemId: classId === 'taoist' ? 'rune-staff' : 'iron-sword', count: 1 }
      ],
      souls: souls.map((soul) => ({ soulId: soul.id, unlocked: false, progress: 0 })),
      autoHunt: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  validateSave(save: PlayerSave) {
    const maxHp = classes[save.classId]?.baseStats.hp ?? 200;
    save.hp = Math.max(1, Math.min(save.hp || maxHp, 999999));
    save.level = Math.max(1, Math.min(save.level || 1, 99));
    while (save.exp >= expToNext(save.level)) {
      save.exp -= expToNext(save.level);
      save.level += 1;
    }
    return save;
  }

  private migrate(raw: Partial<PlayerSave>): PlayerSave {
    const classId = raw.classId && classes[raw.classId] ? raw.classId : 'warrior';
    const fresh = this.createSave(raw.name || '솔마스터', classId);
    const migrated: PlayerSave = {
      ...fresh,
      ...raw,
      version: SAVE_VERSION,
      classId,
      kills: { ...fresh.kills, ...(raw.kills || {}) },
      cards: Array.isArray(raw.cards) && raw.cards.length ? raw.cards : fresh.cards,
      inventory: Array.isArray(raw.inventory) ? raw.inventory : fresh.inventory,
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

    return this.validateSave(migrated);
  }
}
