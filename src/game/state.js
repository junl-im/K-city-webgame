import { getStarterCards } from "../data/cards.js";
import { readJSON, writeJSON } from "../lib/storage.js";

export const STATE_VERSION = 1;

export function createInitialState() {
  const ownedCards = getStarterCards();
  return {
    version: STATE_VERSION,
    account: {
      uid: null,
      isCloud: false,
      displayName: "임시 센터장"
    },
    profile: {
      level: 1,
      exp: 0,
      nextExp: 100,
      gold: 1200,
      gems: 360,
      stamina: 18,
      maxStamina: 18,
      arenaScore: 1000,
      pity: 0,
      chapter: "alley",
      clearedStages: [],
      loginGateSeen: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    buildings: {
      center: 1,
      station: 1,
      generator: 1,
      agency: 1,
      archive: 1,
      academy: 1,
      lab: 1
    },
    ownedCards,
    team: ownedCards.map((card) => card.instanceId),
    inventory: [],
    missions: {
      clear3: 0,
      draw1: 0,
      arena1: 0,
      claimed: []
    },
    battleLog: [],
    pvp: {
      roomId: null,
      lastResult: null
    },
    flags: {
      entered: false,
      tutorialDone: false
    }
  };
}

export function normalizeState(input) {
  const base = createInitialState();
  const state = {
    ...base,
    ...input,
    account: { ...base.account, ...(input?.account || {}) },
    profile: { ...base.profile, ...(input?.profile || {}) },
    buildings: { ...base.buildings, ...(input?.buildings || {}) },
    missions: { ...base.missions, ...(input?.missions || {}) },
    pvp: { ...base.pvp, ...(input?.pvp || {}) },
    flags: { ...base.flags, ...(input?.flags || {}) },
    ownedCards: Array.isArray(input?.ownedCards) && input.ownedCards.length ? input.ownedCards : base.ownedCards,
    team: Array.isArray(input?.team) && input.team.length ? input.team : base.team,
    inventory: Array.isArray(input?.inventory) ? input.inventory : base.inventory,
    battleLog: Array.isArray(input?.battleLog) ? input.battleLog : base.battleLog
  };
  state.version = STATE_VERSION;
  state.profile.nextExp = expToNext(state.profile.level);
  state.team = state.team.filter((id) => state.ownedCards.some((card) => card.instanceId === id)).slice(0, 5);
  if (!state.team.length) state.team = state.ownedCards.slice(0, 3).map((card) => card.instanceId);
  return state;
}

export function loadLocalState() {
  return normalizeState(readJSON("state", createInitialState()));
}

export function saveLocalState(state) {
  const copy = normalizeState({ ...state, profile: { ...state.profile, updatedAt: Date.now() } });
  writeJSON("state", copy);
  return copy;
}

export function expToNext(level) {
  return Math.round(90 + level * level * 35 + level * 45);
}

export function addExp(state, exp) {
  const next = structuredClone(state);
  next.profile.exp += exp;
  let leveled = 0;
  while (next.profile.exp >= expToNext(next.profile.level)) {
    next.profile.exp -= expToNext(next.profile.level);
    next.profile.level += 1;
    next.profile.maxStamina += 2;
    next.profile.stamina = next.profile.maxStamina;
    leveled += 1;
  }
  next.profile.nextExp = expToNext(next.profile.level);
  return { state: next, leveled };
}

export function isLoginGateActive(state, user) {
  return state.profile.level >= 2 && !user;
}

export function publicProfile(state, user) {
  return {
    uid: user?.uid || state.account.uid || null,
    displayName: user?.displayName || state.account.displayName || "센터장",
    level: state.profile.level,
    arenaScore: state.profile.arenaScore,
    updatedAt: Date.now()
  };
}
