export type CharacterClassId = 'warrior' | 'taoist' | 'cleric';
export type CharacterGender = 'male' | 'female';
export type MonsterId = 'slime' | 'wolf' | 'goblin' | 'crystalBear' | 'dragon';
export type TileId = 'grass' | 'dirt' | 'moss' | 'stone' | 'crystal' | 'water' | 'cliff' | 'portal';
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR';
export type SheetTab = 'cards' | 'inventory' | 'skills' | 'souls' | 'account';
export type DailyQuestGoalType = 'kill' | 'level';
export type StoryQuestGoalType = 'talk' | 'kill' | 'level';
export type EquipmentSlot = 'weapon' | 'armor' | 'relic';
export type MobAiState = 'idle' | 'alert' | 'chase' | 'attackWindup' | 'attack' | 'return';

export interface Stats {
  hp: number;
  mp: number;
  atk: number;
  def: number;
  aspd: number;
  crit: number;
  move: number;
}

export interface CharacterClass {
  id: CharacterClassId;
  name: string;
  glyph: string;
  description: string;
  sprite: string;
  baseStats: Stats;
  attackRange: number;
  roleText: string;
  skillName: string;
  attackStyle: 'melee' | 'projectile' | 'holy';
  accent: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  monsterId?: MonsterId;
  rarity: CardRarity;
  art: string;
  effectText: string;
  bonus: Partial<Stats>;
}

export interface CardSetDefinition {
  id: string;
  name: string;
  requiredCardIds: string[];
  effectText: string;
  bonus: Partial<Stats>;
}

export interface SoulDefinition {
  id: string;
  name: string;
  monsterId: MonsterId;
  effectText: string;
  bonus: Partial<Stats>;
  requiredKills: number;
}

export interface DailyQuestDefinition {
  id: string;
  title: string;
  description: string;
  goalType: DailyQuestGoalType;
  monsterId?: MonsterId;
  target: number;
  reward: { gold?: number; gems?: number; itemId?: string; itemCount?: number };
}

export interface ZoneDefinition {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  description: string;
  recommendedLevel: number;
  monsterIds: MonsterId[];
  entry: { x: number; y: number };
  unlockQuestId?: string;
  unlockLevel?: number;
  badge: string;
}

export interface SkillDefinition {
  id: string;
  classId: CharacterClassId;
  name: string;
  hotkey: string;
  unlockLevel: number;
  cooldownSec: number;
  mpCost: number;
  damageMultiplier: number;
  range: number;
  radius: number;
  kind: 'damage' | 'heal' | 'damageHeal';
  description: string;
}

export interface StoryQuestDefinition {
  id: string;
  chapter: number;
  title: string;
  subtitle: string;
  npc: string;
  dialogue: string;
  goalText: string;
  goalType: StoryQuestGoalType;
  monsterId?: MonsterId;
  target: number;
  unlockZoneId?: string;
  reward: { gold?: number; gems?: number; itemId?: string; itemCount?: number; exp?: number };
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'relic' | 'material';
  rarity: CardRarity;
  effectText: string;
  bonus: Partial<Stats>;
}

export interface DropEntry {
  type: 'gold' | 'gem' | 'item' | 'card';
  id?: string;
  amount?: number;
  chance: number;
}

export interface MonsterDefinition {
  id: MonsterId;
  name: string;
  level: number;
  sprite: string;
  stats: Stats;
  exp: number;
  gold: number;
  respawnMs: number;
  drops: DropEntry[];
}

export interface CardInstance {
  uid: string;
  cardId: string;
  level: number;
  copies: number;
  equipped: boolean;
}

export interface InventoryItem {
  uid: string;
  itemId: string;
  count: number;
}

export type EquipmentSlots = Partial<Record<EquipmentSlot, string>>;

export interface SoulInstance {
  soulId: string;
  unlocked: boolean;
  progress: number;
}

export interface DailyProgress {
  dateKey: string;
  kills: Record<MonsterId, number>;
  claimedQuestIds: string[];
}

export interface StoryProgress {
  activeQuestId: string;
  completedQuestIds: string[];
  claimedQuestIds: string[];
}

export interface PlayerSave {
  version: number;
  saveId: string;
  name: string;
  classId: CharacterClassId;
  gender: CharacterGender;
  level: number;
  exp: number;
  gold: number;
  gems: number;
  hp: number;
  mp: number;
  x: number;
  y: number;
  kills: Record<MonsterId, number>;
  cards: CardInstance[];
  inventory: InventoryItem[];
  equipment: EquipmentSlots;
  enhancements: Record<string, number>;
  souls: SoulInstance[];
  daily: DailyProgress;
  story: StoryProgress;
  autoHunt: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorldMob {
  uid: string;
  def: MonsterDefinition;
  x: number;
  y: number;
  spawnX: number;
  spawnY: number;
  hp: number;
  alive: boolean;
  respawnAt: number;
  deathVisibleUntil: number;
  attackCooldown: number;
  aggroUntil: number;
  wanderCooldown: number;
  state: MobAiState;
  stateTimer: number;
  alertDelay: number;
  stuckTimer: number;
  lastX: number;
  lastY: number;
}


export interface CombatResult {
  hit: boolean;
  crit: boolean;
  damage: number;
  killed: boolean;
}

export interface SkillSnapshot {
  id: string;
  name: string;
  hotkey: string;
  unlocked: boolean;
  cooldownSec: number;
  cooldownRemaining: number;
  mpCost: number;
}

export interface Snapshot {
  save: PlayerSave;
  stats: Stats;
  power: number;
  target?: WorldMob;
  targetHpPercent: number;
  log: string[];
  online: boolean;
  userLabel: string;
  skills: SkillSnapshot[];
  cardSetEffects: CardSetDefinition[];
}

export interface SaveRoster {
  version: number;
  activeSaveId: string | null;
  saves: PlayerSave[];
  updatedAt: number;
}
