import { createDeck, shuffleDeck } from '../deck';
import { getCard } from '../cards';
import type { CardMission, PlayerId } from '../types';
import { randomInteger } from '../random';

export interface MissionProgress {
  humanCardIds: string[];
  computerCardIds: string[];
  humanMultiplier: number;
  computerMultiplier: number;
}

export function createCardMission(seed: number): CardMission | null {
  const shuffled = shuffleDeck(createDeck(), seed ^ 0x5f3759df);
  const effects: Array<CardMission['effect'] | {kind:'unconditional';value:number} | null> = [
    null, {kind:'unconditional' as const,value:2}, {kind:'unconditional' as const,value:3}, {kind:'points',value:1}, {kind:'points',value:2}, {kind:'points',value:3},
    {kind:'points',value:-1}, {kind:'points',value:-2}, {kind:'points',value:-3},
    ...[2,3,4,5,6,7,8].map(value => ({kind:'multiplier' as const,value})),
    {kind:'steal',value:1}, {kind:'give',value:1}
  ];
  const choice = randomInteger(shuffled.seed ^ 0x7a8b91cd, effects.length);
  const effect = effects[choice.value];
  if (effect?.kind === 'unconditional') return {kind:'gakpae', cardIds:[], unconditional:true, effect:{kind:'multiplier',value:effect.value}, enabled:true};
  const requiredCount = 2 + randomInteger(choice.seed ^ 0x65d28a31, 2).value;
  if (!effect) return null;
  const themes = ['mixed','bright','animal','ribbon','junk','spring','summer','autumn','winter'] as const;
  const targetTheme = themes[randomInteger(choice.seed ^ 0x31c4e77d, themes.length).value];
  const seasons: Record<string, number[]> = {spring:[3,4,5],summer:[6,7,8],autumn:[9,10,11],winter:[12,1,2]};
  const candidates = shuffled.cards.filter(id => {
    const card = getCard(id);
    if (!card) return false;
    if (targetTheme === 'mixed') return true;
    if (targetTheme === 'junk') return card.type === 'junk' || card.type === 'doubleJunk';
    if (targetTheme in seasons) return seasons[targetTheme].includes(card.month);
    return card.type === targetTheme;
  });
  return {kind:'gakpae', targetTheme, cardIds:candidates.slice(0,requiredCount), requiredCount, effect, enabled:true};
}

/** Every displayed target is required, including on older unfinished saves. */
export function missionRequiredCount(mission: CardMission | null | undefined): number {
  if (!mission || mission.unconditional) return 0;
  return mission.cardIds.length;
}

/** A legacy three-card mission completes when all targets have been taken. */
export function isMissionComplete(mission: CardMission | null | undefined, humanCaptured: string[], computerCaptured: string[]): boolean {
  if (!mission || mission.unconditional) return false;
  if (mission.effect && !mission.requiredCount) return Boolean(mission.resolvedBy);
  if (mission.resolvedBy) return true;
  if (!mission.cardIds.length) return false;
  const captured = new Set([...humanCaptured, ...computerCaptured]);
  return mission.cardIds.every(id => captured.has(id));
}

export function evaluateCardMission(
  mission: CardMission | null | undefined,
  humanCaptured: string[],
  computerCaptured: string[]
): MissionProgress {
  if (!mission) return { humanCardIds: [], computerCardIds: [], humanMultiplier: 1, computerMultiplier: 1 };
  if (mission.unconditional) { const value = mission.enabled === false ? 1 : mission.effect?.value ?? 1; return {humanCardIds:[],computerCardIds:[],humanMultiplier:value,computerMultiplier:value}; }
  const humanSet = new Set(humanCaptured);
  const computerSet = new Set(computerCaptured);
  const humanCardIds = mission.cardIds.filter(cardId => humanSet.has(cardId));
  const computerCardIds = mission.cardIds.filter(cardId => computerSet.has(cardId));
  return {
    humanCardIds,
    computerCardIds,
    humanMultiplier: mission.enabled === false ? 1 : mission.effect ? (mission.effect.kind === 'multiplier' && mission.resolvedBy === 'human' ? mission.effect.value : 1) : (mission.cardIds.length > 0 && humanCardIds.length === mission.cardIds.length ? 2 ** mission.cardIds.length : 1),
    computerMultiplier: mission.enabled === false ? 1 : mission.effect ? (mission.effect.kind === 'multiplier' && mission.resolvedBy === 'computer' ? mission.effect.value : 1) : (mission.cardIds.length > 0 && computerCardIds.length === mission.cardIds.length ? 2 ** mission.cardIds.length : 1)
  };
}

export function missionMultiplierFor(
  mission: CardMission | null | undefined,
  humanCaptured: string[],
  computerCaptured: string[],
  player: PlayerId
): number {
  const progress = evaluateCardMission(mission, humanCaptured, computerCaptured);
  return player === 'human' ? progress.humanMultiplier : progress.computerMultiplier;
}

export function capturedMissionCards(mission: CardMission | null | undefined, capturedCardIds: string[]): string[] {
  if (!mission || mission.enabled === false || (mission.effect && mission.resolvedBy)) return [];
  const targets = new Set(mission.cardIds);
  return [...new Set(capturedCardIds.filter(cardId => targets.has(cardId)))];
}
