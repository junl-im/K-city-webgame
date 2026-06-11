import type { CardDefinition, CardSetDefinition, CharacterClass, DailyQuestDefinition, ItemDefinition, MonsterDefinition, SkillDefinition, SoulDefinition, StoryQuestDefinition, ZoneDefinition } from '../types';
import type { HealthLevel } from './technicalHealth';

export interface ContentGraphInput087 {
  classes: CharacterClass[];
  items: ItemDefinition[];
  cards: CardDefinition[];
  cardSets: CardSetDefinition[];
  souls: SoulDefinition[];
  skills: SkillDefinition[];
  monsters: MonsterDefinition[];
  zones: ZoneDefinition[];
  storyQuests: StoryQuestDefinition[];
  dailyQuests: DailyQuestDefinition[];
}

export interface ContentGraphReport087 {
  level: HealthLevel;
  message: string;
  problems: string[];
  totals: {
    classes: number;
    items: number;
    skills: number;
    cards: number;
    monsters: number;
    zones: number;
    quests: number;
  };
}

const CLASS_SKILL_TOKENS = new Set(['class-basic', 'class-second', 'class-third']);

export function inspectContentGraph087(input: ContentGraphInput087): ContentGraphReport087 {
  const problems: string[] = [];
  const classIds = new Set(input.classes.map((entry) => entry.id));
  const itemIds = new Set(input.items.map((entry) => entry.id));
  const cardIds = new Set(input.cards.map((entry) => entry.id));
  const skillIds = new Set(input.skills.map((entry) => entry.id));
  const monsterIds = new Set(input.monsters.map((entry) => entry.id));
  const zoneIds = new Set(input.zones.map((entry) => entry.id));
  const storyQuestIds = new Set(input.storyQuests.map((entry) => entry.id));

  collectDuplicateIds('직업', input.classes.map((entry) => entry.id), problems);
  collectDuplicateIds('아이템', input.items.map((entry) => entry.id), problems);
  collectDuplicateIds('스킬', input.skills.map((entry) => entry.id), problems);
  collectDuplicateIds('카드', input.cards.map((entry) => entry.id), problems);
  collectDuplicateIds('몬스터', input.monsters.map((entry) => entry.id), problems);
  collectDuplicateIds('사냥터', input.zones.map((entry) => entry.id), problems);
  collectDuplicateIds('스토리', input.storyQuests.map((entry) => entry.id), problems);
  collectDuplicateIds('일일의뢰', input.dailyQuests.map((entry) => entry.id), problems);

  for (const skill of input.skills) {
    if (!classIds.has(skill.classId)) problems.push(`스킬 ${skill.id} 직업 연결 끊김`);
  }
  for (const item of input.items) {
    if (item.skillId && !CLASS_SKILL_TOKENS.has(item.skillId) && !skillIds.has(item.skillId)) {
      problems.push(`아이템 ${item.id} 스킬 연결 끊김`);
    }
  }
  for (const card of input.cards) {
    if (card.monsterId && !monsterIds.has(card.monsterId)) problems.push(`카드 ${card.id} 몬스터 연결 끊김`);
    if (card.skillId && !CLASS_SKILL_TOKENS.has(card.skillId) && !skillIds.has(card.skillId)) problems.push(`카드 ${card.id} 스킬 연결 끊김`);
  }
  for (const set of input.cardSets) {
    const missing = set.requiredCardIds.filter((id) => !cardIds.has(id));
    if (missing.length) problems.push(`카드 세트 ${set.id} 필요 카드 누락 ${missing.length}개`);
  }
  for (const soul of input.souls) {
    if (!monsterIds.has(soul.monsterId)) problems.push(`영혼 ${soul.id} 몬스터 연결 끊김`);
  }
  for (const monster of input.monsters) {
    for (const drop of monster.drops) {
      if (drop.type === 'item' && drop.id && !itemIds.has(drop.id)) problems.push(`몬스터 ${monster.id} 드랍 아이템 누락 ${drop.id}`);
      if (drop.type === 'card' && drop.id && !cardIds.has(drop.id)) problems.push(`몬스터 ${monster.id} 드랍 카드 누락 ${drop.id}`);
    }
  }
  for (const zone of input.zones) {
    const missingMonsters = zone.monsterIds.filter((id) => !monsterIds.has(id));
    if (missingMonsters.length) problems.push(`사냥터 ${zone.id} 몬스터 연결 누락 ${missingMonsters.length}개`);
    if (zone.unlockQuestId && !storyQuestIds.has(zone.unlockQuestId)) problems.push(`사냥터 ${zone.id} 해금 퀘스트 누락`);
  }
  for (const quest of input.storyQuests) {
    if (quest.monsterId && !monsterIds.has(quest.monsterId)) problems.push(`스토리 ${quest.id} 몬스터 연결 끊김`);
    if (quest.unlockZoneId && !zoneIds.has(quest.unlockZoneId)) problems.push(`스토리 ${quest.id} 해금 사냥터 누락`);
    inspectReward087('스토리', quest.id, quest.reward, itemIds, skillIds, problems);
  }
  for (const quest of input.dailyQuests) {
    if (quest.monsterId && !monsterIds.has(quest.monsterId)) problems.push(`일일의뢰 ${quest.id} 몬스터 연결 끊김`);
    inspectReward087('일일의뢰', quest.id, quest.reward, itemIds, skillIds, problems);
  }

  const hardProblems = problems.filter((text) => /누락|끊김|중복/.test(text));
  const level: HealthLevel = hardProblems.length >= 3 ? 'danger' : hardProblems.length ? 'warn' : 'ok';
  const totals = {
    classes: input.classes.length,
    items: input.items.length,
    skills: input.skills.length,
    cards: input.cards.length,
    monsters: input.monsters.length,
    zones: input.zones.length,
    quests: input.storyQuests.length + input.dailyQuests.length
  };
  const message = problems.length
    ? `${problems.length}개 연결 점검 필요`
    : `콘텐츠 연결 정상 · ${totals.zones}개 사냥터/${totals.items}개 아이템`;
  return { level, message, problems: problems.slice(0, 12), totals };
}

function inspectReward087(label: string, questId: string, reward: { itemId?: string; skillId?: string }, itemIds: Set<string>, skillIds: Set<string>, problems: string[]) {
  if (reward.itemId && !itemIds.has(reward.itemId)) problems.push(`${label} ${questId} 보상 아이템 누락 ${reward.itemId}`);
  if (reward.skillId && !CLASS_SKILL_TOKENS.has(reward.skillId) && !skillIds.has(reward.skillId)) problems.push(`${label} ${questId} 보상 스킬 누락 ${reward.skillId}`);
}

function collectDuplicateIds(label: string, ids: string[], problems: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  if (duplicates.size) problems.push(`${label} ID 중복 ${Array.from(duplicates).slice(0, 3).join(', ')}`);
}
