export type CharacterClassId = 'warrior' | 'taoist' | 'cleric';
export type MonsterId = 'slime' | 'wolf' | 'goblin' | 'crystalBear' | 'dragon';
export type TileId = 'grass' | 'stone' | 'water' | 'portal';
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR';
export type SheetTab = 'cards' | 'inventory' | 'souls' | 'account';
export type DailyQuestGoalType = 'kill' | 'level';
export type EquipmentSlot = 'weapon' | 'armor' | 'relic';

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

export interface PlayerSave {
  version: number;
  saveId: string;
  name: string;
  classId: CharacterClassId;
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
  souls: SoulInstance[];
  daily: DailyProgress;
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
  attackCooldown: number;
}

export interface CombatResult {
  hit: boolean;
  crit: boolean;
  damage: number;
  killed: boolean;
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
}

export interface SaveRoster {
  version: number;
  activeSaveId: string | null;
  saves: PlayerSave[];
  updatedAt: number;
}
